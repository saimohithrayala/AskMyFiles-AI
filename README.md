                                                                           ###----------AskMyFiles-AI----------###

An advanced, full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload documents and have intelligent, context-aware conversations about their contents using AI.

# Key Features

*   **Smart Document Processing:** Automatically parses and extracts content from uploaded documents.
*   **Vector Database Storage:** Uses **ChromaDB** to convert document text into high-dimensional mathematical embeddings for fast, semantic search retrieval.
*   **Contextual Chat Interface:** Combines retrieved document segments with user questions to generate highly accurate, hallucination-free answers via the **Google Gemini API**.
*   **Modern UI:** A clean, responsive frontend interface built with **React** and **Vite** for seamless user interaction.

## Tech Stack & Architecture

This project is built using a modern decoupled architecture to handle heavy AI computations efficiently:

## Frontend
*   **Framework:** React (Vite)
*   **Styling:** Modern CSS / Tailwind CSS
*   **Hosting:** Vercel (Optimized for static edge delivery)

## Backend & AI
*   **Framework:** Python (FastAPI / Uvicorn)
*   **Orchestration:** LangChain / Core RAG pipeline
*   **Vector Database:** ChromaDB (for local vector management)
*   **LLM Provider:** Google Generative AI (Gemini API)
*   **Hosting:** vercel and render 
