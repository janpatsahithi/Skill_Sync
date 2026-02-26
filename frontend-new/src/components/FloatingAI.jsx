import { useState } from 'react'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from './ui/Button'

const FloatingAI = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const navigate = useNavigate()

  const handleOpenFull = () => {
    navigate('/app/ai-advisor')
    setIsOpen(false)
  }

  if (!isOpen && !isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center animate-pulse"
          style={{ animationDuration: '2.4s' }}
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Ask AI Coach
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-background-card rounded-xl shadow-2xl border border-primary-100 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">AI Assistant</div>
            <div className="text-xs text-text-secondary">Always here to help</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-primary-50 transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-text-secondary" />
            ) : (
              <Minimize2 className="w-4 h-4 text-text-secondary" />
            )}
          </button>
          <button
            onClick={() => {
              setIsOpen(false)
              setIsMinimized(false)
            }}
            className="p-1 rounded hover:bg-primary-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex flex-col h-[calc(100%-60px)]">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="bg-primary-50 rounded-lg p-3">
                    <p className="text-sm text-text-primary">
                      Hi! I'm your AI assistant. I can help you with:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                      <li>• Explaining skill gaps</li>
                      <li>• Recommending next actions</li>
                      <li>• Planning learning goals</li>
                      <li>• Answering questions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-primary-100">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleOpenFull}
              >
                Open Full Chat
              </Button>
              <div className="text-xs text-text-secondary text-center">
                Click to open the full AI advisor experience
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatingAI


