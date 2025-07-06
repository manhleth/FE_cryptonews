'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { Button } from "@/components/ui/button"
import { Loader2, Bot, User, RefreshCw, Minimize2, Maximize2 } from 'lucide-react'

interface DialogflowMessengerProps {
  intent?: string
  chatTitle?: string
  agentId: string
  languageCode?: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isGemini?: boolean
}

export default function DialogflowMessenger({
  intent = 'WELCOME',
  chatTitle = 'CryptoChatBot',
  agentId,
  languageCode = 'vi'
}: DialogflowMessengerProps) {
  const messengerRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGeminiMode, setIsGeminiMode] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Dialogflow Messenger
  useEffect(() => {
    if (scriptLoaded && messengerRef.current && !isGeminiMode) {
      const dfMessenger = document.createElement('df-messenger')
      dfMessenger.setAttribute('intent', intent)
      dfMessenger.setAttribute('chat-title', chatTitle)
      dfMessenger.setAttribute('agent-id', agentId)
      dfMessenger.setAttribute('language-code', languageCode)
      
      // Style the messenger
      dfMessenger.style.position = 'fixed'
      dfMessenger.style.bottom = '20px'
      dfMessenger.style.right = '20px'
      dfMessenger.style.zIndex = '1000'
      
      messengerRef.current.appendChild(dfMessenger)
      
      return () => {
        if (messengerRef.current?.contains(dfMessenger)) {
          messengerRef.current.removeChild(dfMessenger)
        }
      }
    }
  }, [scriptLoaded, intent, chatTitle, agentId, languageCode, isGeminiMode])

  // Call Gemini API
  const callGeminiAPI = async (message: string) => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10) // Keep last 10 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.response
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Gemini API Error:', error)
      throw error
    }
  }

  // Handle message send
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setConversationHistory(prev => [...prev, inputMessage.trim()])
    setInputMessage('')
    setIsLoading(true)

    try {
      const aiResponse = await callGeminiAPI(userMessage.text)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        isGemini: true
      }

      setMessages(prev => [...prev, botMessage])
      setConversationHistory(prev => [...prev, aiResponse])
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc chuyển sang chế độ Dialogflow.',
        isUser: false,
        timestamp: new Date(),
        isGemini: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
    setConversationHistory([])
  }

  // Toggle collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      <Script 
        src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      
      {/* Mode Toggle */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-gray-600 font-medium">Chat Mode:</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!isGeminiMode ? "default" : "outline"}
                onClick={() => setIsGeminiMode(false)}
                className="text-xs"
              >
                Dialogflow
              </Button>
              <Button
                size="sm"
                variant={isGeminiMode ? "default" : "outline"}
                onClick={() => setIsGeminiMode(true)}
                className="text-xs"
              >
                Gemini
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Gemini Chat Interface */}
      {isGeminiMode && (
        <div className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? 'w-80 h-16' 
            : 'w-96 h-[500px]'
        }`}>
          {/* Header - Always visible */}
          <div className="flex items-center justify-between p-4 border-b bg-emerald-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">CryptoChatBot</span>
              {messages.length > 0 && isCollapsed && (
                <span className="bg-emerald-600 text-xs px-2 py-1 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearConversation}
                  className="text-white hover:bg-emerald-600"
                >
                  <RefreshCw size={16} />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleCollapse}
                className="text-white hover:bg-emerald-600"
              >
                {isCollapsed ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </Button>
            </div>
          </div>

          {/* Chat Content - Hidden when collapsed */}
          {!isCollapsed && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Bot size={48} className="mx-auto mb-4 text-emerald-500" />
                    <p className="text-sm">Chào bạn! Tôi là CryptoChatBot.</p>
                    <p className="text-sm">Hỏi tôi bất kỳ câu hỏi nào về crypto nhé! 🚀</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      {message.isGemini && (
                        <div className="text-xs text-gray-500 mt-1">
                          ✨ Powered by Gemini AI
                        </div>
                      )}
                    </div>
                    
                    {message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 size={16} className="animate-spin text-emerald-500" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi về crypto..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Gửi'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Original Dialogflow Messenger */}
      <div ref={messengerRef} style={{ display: isGeminiMode ? 'none' : 'block' }} />
    </>
  )
}