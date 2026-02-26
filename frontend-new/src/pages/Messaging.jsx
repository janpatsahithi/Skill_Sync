import { useState, useEffect } from 'react'
import { Search, Send, Paperclip, Smile, MoreVertical, Circle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { messagingAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const Messaging = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await messagingAPI.getConversations()
      const conversationsData = Array.isArray(response?.data) 
        ? response.data.map(conv => ({
            id: conv.id,
            name: conv.author_name || 'Unknown',
            avatar: conv.author_name ? conv.author_name.substring(0, 2).toUpperCase() : 'U',
            lastMessage: conv.content?.substring(0, 50) || 'No messages yet',
            timestamp: formatTimestamp(conv.created_at),
            unread: 0, // TODO: Implement unread count
            online: false, // TODO: Implement online status
          }))
        : []
      setConversations(conversationsData)
    } catch (err) {
      setError('Failed to load conversations')
      console.error('Error fetching conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    setIsLoadingMessages(true)
    setError(null)
    try {
      const response = await messagingAPI.getMessages(conversationId)
      const messagesData = Array.isArray(response?.data)
        ? response.data.map(msg => ({
            id: msg.id,
            sender: msg.email === user?.email ? 'me' : 'other',
            text: msg.content,
            timestamp: formatTimestamp(msg.created_at),
          }))
        : []
      setMessages(messagesData)
    } catch (err) {
      setError('Failed to load messages')
      console.error('Error fetching messages:', err)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const formatTimestamp = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    try {
      const response = await messagingAPI.sendMessage(selectedConversation.id, {
        content: newMessage,
      })
      const sentMessage = {
        id: response?.data?.id || Date.now().toString(),
        sender: 'me',
        text: response?.data?.content || newMessage,
        timestamp: formatTimestamp(response?.data?.created_at || new Date()),
      }
      setMessages([...messages, sentMessage])
      setNewMessage('')
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton variant="rectangular" height="600px" />
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg z-50">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {/* Conversations List */}
      <div className="w-80 flex flex-col border-r border-primary-100">
        <div className="p-4 border-b border-primary-100">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Conversations"
              description="Start a conversation with someone"
            />
          ) : (
            <div className="divide-y divide-primary-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-primary-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-text-primary truncate">{conv.name}</p>
                        <span className="text-xs text-text-secondary">{conv.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-primary-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {selectedConversation.avatar}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{selectedConversation.name}</p>
                  <p className="text-xs text-text-secondary">
                    {selectedConversation.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-primary-50 transition-colors">
                <MoreVertical className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <LoadingSkeleton variant="rectangular" height="200px" />
              ) : (
                messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender === 'me'
                        ? 'bg-primary text-white'
                        : 'bg-primary-50 text-text-primary'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-text-secondary'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-primary-100">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-primary-50 transition-colors">
                  <Paperclip className="w-5 h-5 text-text-secondary" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="p-2 rounded-lg hover:bg-primary-50 transition-colors">
                  <Smile className="w-5 h-5 text-text-secondary" />
                </button>
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Search}
              title="Select a Conversation"
              description="Choose a conversation from the list to start messaging"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Messaging


