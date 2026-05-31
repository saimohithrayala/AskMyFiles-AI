import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma 
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_docs"
CHROMA_DIR = "chroma_db"
os.makedirs(TEMP_DIR, exist_ok=True)

prompt_template = ChatPromptTemplate.from_messages([
    ("system", 'You are a helpful AI assistant.\n\nUse ONLY the provided context to answer the question.\n\nIf the answer is not present in the context,\nsay: "I could not find the answer in the document."'),
    ("human", "Context:\n{context}\n\nQuestion:\n{question}")
])

class ChatRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    embedding_model = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:

        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = splitter.split_documents(docs)
        
        Chroma.from_documents(
            documents=chunks,
            embedding=embedding_model,
            persist_directory=CHROMA_DIR
        )
        
        return {"message": f"Successfully processed and indexed {file.filename}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:

        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/chat")
async def chat(payload: ChatRequest):

    embedding_model = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=1.0)
    # Check if DB exists
    if not os.path.exists(CHROMA_DIR):
        raise HTTPException(status_code=400, detail="Please upload a document first to initialize the database.")
        
    vectorstore = Chroma(persist_directory=CHROMA_DIR, embedding_function=embedding_model)
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 5, "fetch_k": 10, "lambda_mult": 0.5}
    )
    
    try:
        docs = retriever.invoke(payload.question)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        final_prompt = prompt_template.invoke({
            "context": context,
            "question": payload.question
        })
        
        result = llm.invoke(final_prompt)
        return {"response": result.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)