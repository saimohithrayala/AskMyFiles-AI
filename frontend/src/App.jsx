import React, { useState, useRef, useEffect } from 'react';
import { Upload, Terminal, Send, Cpu, AlertTriangle, FileText, Trash2 } from 'lucide-react';

function App() {
  // Messages now starts empty so we can cleanly control the splash screen behavior
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (selectedFile.type !== "application/pdf") {
      setMessages(prev => [...prev, { role: 'ai', text: 'ERROR: Target stream requires an extension file type of [.pdf] only.' }]);
      return;
    }
    
    setFile(selectedFile);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `DATABASE SUCCESS: ${data.message || 'Vector store context map created.'}` 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: `CRITICAL ERROR: ${data.detail}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'NETWORK CORRUPTION: Connection to server refused.' }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
    setMessages(prev => [...prev, { 
      role: 'ai', 
      text: 'SYSTEM RESET: Active document unmounted. Upload a new data sequence.' 
    }]);
    document.getElementById('pdf-uploader').value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input;
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQuery }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: `SYSTEM HALT: ${data.detail}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: 'CRITICAL TIMEOUT: Matrix stream disconnected.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <div>
          <h1 className="sidebar-title" style={{ color: '#22c55e' }}>AskMyFiles.AI</h1>
          <p className="sidebar-subtitle">gemini-2.5-flash-lite</p>
          
          <div className="upload-zone" style={{ position: 'relative' }}>
            <input 
              id="pdf-uploader"
              type="file" 
              accept=".pdf" 
              onChange={handleFileUpload} 
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              disabled={isUploading}
            />
            {isUploading ? (
              <div style={{ color: '#eab308', fontSize: '12px' }}>
                <p>[ INDEXING CHUNKS... ]</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Upload size={28} color="#166534" style={{ marginBottom: '8px' }} />
                <span className="upload-title">SOURCE PDF</span>
                <span className="upload-subtitle">Click to stream file</span>
              </div>
            )}
          </div>

          {file && (
            <div className="active-file-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
                <FileText size={14} color="#4ade80" style={{ flexShrink: 0 }} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{file.name}</span>
              </div>
              <button 
                onClick={handleDeleteFile}
                title="Delete/Unmount File"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={15} color="#ef4444" />
              </button>
            </div>
          )}
        </div>

        <div className="status-footer">
          <div>NODE: LOCAL_HOST</div>
          <div>PORT: 8000</div>
        </div>
      </div>

      {/* CHAT DISPLAY PANEL */}
      <div className="terminal-panel">
        
        {/* Topbar (Clean layout with just custom window dots) */}
        <div className="terminal-header" style={{ justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27272a' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27272a' }}></div>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#166534' }}></div>
          </div>
        </div>

        {/* Dynamic Log Feed / Center Greeting */}
        <div className="terminal-messages" style={{ position: 'relative' }}>
          
          {/* Large Center Splash Screen - Visible only when there are no query messages */}
          {messages.length === 0 && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px',
              color: '#4ade80'
            }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 12px 0', letterSpacing: '1px' }}>
                HELLO !
              </h2>
              <p style={{ fontSize: '1.2rem', color: '#16a34a', margin: 0, maxWidth: '500px', lineHeight: '1.4' }}>
                Need information from a file? Just ask me.
              </p>
            </div>
          )}

          {/* Render Active Conversation Logs */}
          {messages.map((msg, index) => (
            <div key={index} className={`message-wrapper ${msg.role}`}>
              <div className="message-box">
                {/* ↳ OPERATOR_QUERY stays for the user; the matrix header tag is gone */}
                {msg.role === 'user' && <div className="message-label">↳ OPERATOR_QUERY</div>}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="message-wrapper ai">
              <div className="thinking-box">
                <span className="thinking-label">RETRIEVING FROM VECTORSPACE...</span>
                <span>Running MMR semantic pipeline...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Interface */}
        <form onSubmit={handleSendMessage} className="input-form">
          <span className="input-arrow">&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Initialize context query command..."
            className="terminal-input"
            disabled={isThinking}
          />
          <button type="submit" className="execute-button">
            EXECUTE
          </button>
        </form>
      </div>

    </div>
  );
}

export default App;