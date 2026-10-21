// ChatWindow.jsx — Multi-turn AI chatbot with history
import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../api'
import ReactMarkdown from 'react-markdown'

// Generate a simple UUID-like ID
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const SUGGESTED_QUESTIONS = [
  'What products do you offer?',
  'I need a nozzle for spray drying',
  'My liquid viscosity is 800 cP',
  'What is the finest droplet size available?',
  'नमस्ते, आपके उत्पाद बताइए',
  'मला फ्यूएल सेल कोटिंगसाठी नोझल हवी आहे',
]

export default function ChatWindow({ onRequestQuote }) {
  const [sessionId] = useState(() => uuid())
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'Hello! I am the **WaveNxD Technologies AI Sales Representative**. 🌊\n\n' +
        'We specialise in **ultrasonic spray nozzle systems** for laboratory and industrial applications.\n\n' +
        'How can I help you today? I can:\n' +
        '- Explain our products and their specifications\n' +
        '- Help you find the right nozzle for your application\n' +
        '- Guide you through the quotation process\n\n' +
        'Feel free to ask in **English, Hindi, or Marathi**! 🇮🇳',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Build history (exclude the first welcome message which is fake)
      const history = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await chatApi.send(sessionId, text, history)
      setAiAvailable(res.data.ai_available)
      setMessages(prev => [...prev, { role: 'model', content: res.data.reply }])
    } catch (err) {
      const errMsg = err.response?.status === 0 || !err.response
        ? '⚠️ Cannot reach the backend server. Please ensure the backend is running on port 8000.'
        : `⚠️ Error: ${err.response?.data?.detail || 'Something went wrong. Please try again.'}`
      setMessages(prev => [...prev, { role: 'model', content: errMsg }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>🤖</div>
        <div>
          <div style={styles.agentName}>WaveNxD AI Sales Rep</div>
          <div style={styles.statusLine}>
            <span style={{
              ...styles.statusDot,
              background: aiAvailable ? '#10b981' : '#f59e0b',
            }} />
            {aiAvailable ? 'Live AI' : 'Demo Mode'}
          </div>
        </div>
        {!aiAvailable && (
          <div className="badge badge-demo" style={{ marginLeft: 'auto' }}>
            ⚠️ API Key Missing
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div style={styles.typingWrap} className="fade-in">
            <div style={styles.typingBubble}>
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
              <span style={styles.typingDot} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions — only shown at start */}
      {messages.length <= 1 && (
        <div style={styles.suggestions}>
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Quote button if recent message mentions product */}
      <div style={styles.quickActions}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem' }}
          onClick={() => onRequestQuote && onRequestQuote()}
        >
          📋 Request Quotation
        </button>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem' }}
          onClick={() => {
            setMessages([messages[0]])
            setAiAvailable(true)
          }}
        >
          🔄 New Chat
        </button>
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <textarea
          ref={inputRef}
          className="form-input"
          style={{ flex: 1, minHeight: 42, maxHeight: 120, resize: 'none', lineHeight: '1.4' }}
          placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
        />
        <button
          className="btn btn-primary"
          style={{ height: 42, padding: '0 18px' }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '➤'}
        </button>
      </div>

      {!aiAvailable && (
        <div className="alert alert-warning" style={{ fontSize: '0.78rem', padding: '8px 12px' }}>
          <span>⚠️</span>
          <span>
            Demo mode active. Configure <code>GEMINI_API_KEY</code> in{' '}
            <code>backend/.env</code> and restart the server for live AI.
          </span>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div
      style={{
        ...styles.bubbleRow,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
      className="fade-in"
    >
      {!isUser && <div style={styles.botIcon}>🤖</div>}
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.botBubble),
        }}
      >
        <div style={styles.markdownWrap}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
      {isUser && <div style={styles.userIcon}>👤</div>}
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  avatar: { fontSize: '1.8rem' },
  agentName: { fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' },
  statusLine: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8' },
  statusDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 0,
  },
  bubbleRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: 14,
    fontSize: '0.875rem',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  },
  botBubble: {
    background: 'rgba(0, 201, 200, 0.08)',
    border: '1px solid rgba(0, 201, 200, 0.15)',
    color: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    background: 'linear-gradient(135deg, #00c9c8, #009b9a)',
    color: '#000',
    borderBottomRightRadius: 4,
  },
  botIcon: { fontSize: '1.2rem', flexShrink: 0, marginBottom: 2 },
  userIcon: { fontSize: '1.1rem', flexShrink: 0, marginBottom: 2 },
  markdownWrap: {
    '& p': { margin: '0 0 8px 0' },
    '& strong': { fontWeight: 700 },
    '& ul, & ol': { paddingLeft: 16, marginBottom: 8 },
    '& code': {
      background: 'rgba(0,0,0,0.3)',
      padding: '1px 5px',
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: '0.85em',
    },
  },
  typingWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    display: 'flex',
    gap: 4,
    padding: '10px 14px',
    background: 'rgba(0, 201, 200, 0.08)',
    border: '1px solid rgba(0, 201, 200, 0.15)',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#00c9c8',
    animation: 'pulse 1.2s ease-in-out infinite',
    display: 'inline-block',
    ':nth-child(2)': { animationDelay: '0.2s' },
    ':nth-child(3)': { animationDelay: '0.4s' },
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 14px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  quickActions: {
    display: 'flex',
    gap: 8,
    padding: '8px 14px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
}
