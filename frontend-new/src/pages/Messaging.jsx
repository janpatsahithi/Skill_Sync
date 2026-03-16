import { useEffect, useState } from 'react'
import { Send, Search } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { messagingAPI } from '../services/api'

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const Messaging = ({ embedded = false }) => {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [query, setQuery] = useState('')

  const loadConversations = async () => {
    try {
      setLoading(true)
      const res = await messagingAPI.getConversations()
      const list = Array.isArray(res?.data?.conversations) ? res.data.conversations : []
      setConversations(list)
      if (!selected && list.length > 0) setSelected(list[0])
    } catch (error) {
      console.error('Failed to load private conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (otherUserId) => {
    if (!otherUserId) return
    try {
      setLoadingMessages(true)
      const res = await messagingAPI.getMessages(otherUserId)
      const list = Array.isArray(res?.data?.messages) ? res.data.messages : []
      setMessages(list)
    } catch (error) {
      console.error('Failed to load private messages:', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (selected?.user_id) loadMessages(selected.user_id)
  }, [selected?.user_id])

  const sendMessage = async () => {
    if (!selected?.user_id || !newMessage.trim()) return
    try {
      const payload = { content: newMessage.trim() }
      const res = await messagingAPI.sendMessage(selected.user_id, payload)
      const msg = res?.data
      if (msg) {
        setMessages((prev) => [...prev, msg])
      }
      setNewMessage('')
      loadConversations()
    } catch (error) {
      console.error('Failed to send private message:', error)
    }
  }

  const filtered = conversations.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className={`${embedded ? 'h-[70vh]' : 'h-[calc(100vh-8rem)]'} flex gap-4`}>
      <div className="w-80 rounded-xl border border-primary/15 bg-white/80">
        <div className="border-b border-primary/15 p-4">
          <h2 className="text-lg font-semibold text-text-primary">Private Messages</h2>
          <p className="text-xs text-text-secondary">Only collaboration participants can message.</p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-primary/20 bg-white py-2 pl-9 pr-3 text-sm"
              placeholder="Search teammates..."
            />
          </div>
        </div>
        <div className="max-h-[calc(100%-96px)] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-text-secondary">Loading conversations...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} title="No Allowed Conversations" description="Join a project or request to collaborate to unlock messaging." />
          ) : (
            filtered.map((c) => (
              <button
                key={c.user_id}
                onClick={() => setSelected(c)}
                className={`w-full border-b border-primary/10 px-4 py-3 text-left hover:bg-primary/5 ${
                  selected?.user_id === c.user_id ? 'bg-primary/10' : ''
                }`}
              >
                <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                <p className="truncate text-xs text-text-secondary">{c.last_message || 'No messages yet'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-primary/15 bg-white/80">
        {selected ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-primary/15 p-4">
              <p className="text-sm font-semibold text-text-primary">{selected.name}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages ? (
                <p className="text-sm text-text-secondary">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-text-secondary">No messages yet.</p>
              ) : (
                messages.map((msg) => {
                  const isMine = String(msg.sender_id) !== String(selected.user_id)
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg px-3 py-2 ${isMine ? 'bg-primary text-white' : 'bg-primary/10 text-text-primary'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`mt-1 text-[11px] ${isMine ? 'text-white/75' : 'text-text-secondary'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="border-t border-primary/15 p-3">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm"
                  placeholder="Type a message..."
                />
                <Button onClick={sendMessage}>
                  <Send className="mr-1 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-secondary">Select a conversation to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messaging
