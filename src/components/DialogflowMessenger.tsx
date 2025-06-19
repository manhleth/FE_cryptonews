'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface DialogflowMessengerProps {
  intent?: string
  chatTitle?: string
  agentId: string
  languageCode?: string
}

export default function DialogflowMessenger({
  intent = 'WELCOME',
  chatTitle = 'CryptoChatBot',
  agentId,
  languageCode = 'vi'
}: DialogflowMessengerProps) {
  const messengerRef = useRef<HTMLDivElement>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (scriptLoaded && messengerRef.current) {
      const dfMessenger = document.createElement('df-messenger')
      dfMessenger.setAttribute('intent', intent)
      dfMessenger.setAttribute('chat-title', chatTitle)
      dfMessenger.setAttribute('agent-id', agentId)
      dfMessenger.setAttribute('language-code', languageCode)
      
      messengerRef.current.appendChild(dfMessenger)
      
      return () => {
        if (messengerRef.current?.contains(dfMessenger)) {
          messengerRef.current.removeChild(dfMessenger)
        }
      }
    }
  }, [scriptLoaded, intent, chatTitle, agentId, languageCode])

  return (
    <>
      <Script 
        src="https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={messengerRef} />
    </>
  )
}