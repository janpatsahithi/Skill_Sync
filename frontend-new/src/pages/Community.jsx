import { useEffect, useMemo, useState } from 'react'
import { ArrowBigDown, ArrowBigUp, MessageSquare, Plus, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Messaging from './Messaging'
import { communityAPI } from '../services/api'

const tabs = [
  { key: 'public', label: 'Public Discussions', icon: Users },
  { key: 'private', label: 'Private Messages', icon: MessageSquare },
]

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'latest', label: 'Latest' },
  { value: 'most_commented', label: 'Most Commented' },
]

const Community = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('public')
  const [posts, setPosts] = useState([])
  const [skillTags, setSkillTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [sortBy, setSortBy] = useState('trending')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', skill_tags: [] })
  const [tagInput, setTagInput] = useState('')

  const loadSkillTags = async () => {
    try {
      const res = await communityAPI.getSkillTags({ limit: 300 })
      setSkillTags(Array.isArray(res?.data?.skill_tags) ? res.data.skill_tags : [])
    } catch (error) {
      console.error('Failed to load skill tags:', error)
      setSkillTags([])
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const params = {
        sort_by: sortBy,
        limit: 50,
      }
      if (search.trim()) params.search = search.trim()
      if (skillFilter) params.skill_tag = skillFilter

      const res = await communityAPI.getPosts(params)
      setPosts(Array.isArray(res?.data) ? res.data : [])
    } catch (error) {
      console.error('Failed to load posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSkillTags()
  }, [])

  useEffect(() => {
    if (activeTab === 'public') {
      loadPosts()
    }
  }, [activeTab, sortBy, skillFilter])

  const addTagFromInput = () => {
    const tag = tagInput.trim().toLowerCase()
    if (!tag) return
    if (!form.skill_tags.includes(tag)) {
      setForm((prev) => ({ ...prev, skill_tags: [...prev.skill_tags, tag] }))
    }
    setTagInput('')
  }

  const createPost = async () => {
    if (!form.title.trim() || !form.content.trim() || form.skill_tags.length === 0) return
    try {
      await communityAPI.createPost({
        title: form.title.trim(),
        content: form.content.trim(),
        type: 'career_question',
        skill_tags: form.skill_tags,
      })
      setForm({ title: '', content: '', skill_tags: [] })
      setShowCreate(false)
      loadPosts()
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const vote = async (postId, voteType) => {
    try {
      await communityAPI.votePost(postId, voteType)
      loadPosts()
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const filteredTagSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    if (!q) return skillTags.slice(0, 12)
    return skillTags.filter((tag) => tag.includes(q)).slice(0, 12)
  }, [skillTags, tagInput])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Community</h1>
        <p className="text-text-secondary">Skill-focused discussions and collaboration-only private messaging.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-primary/20 bg-white text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'public' ? (
        <>
          <Card className="rounded-2xl border-primary/20 bg-white/90">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full rounded-lg border border-primary/20 bg-white py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm"
              >
                <option value="">All Skills</option>
                {skillTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button onClick={() => setShowCreate((v) => !v)}>
                <Plus className="mr-1 h-4 w-4" />
                Create Post
              </Button>
              <Button variant="outline" onClick={loadPosts}>
                Apply
              </Button>
            </div>
          </Card>

          {showCreate && (
            <Card className="rounded-2xl border-primary/20 bg-white/95">
              <h2 className="text-lg font-semibold text-text-primary">Create Skill-Based Discussion</h2>
              <div className="mt-3 space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Post title"
                  className="w-full rounded-lg border border-primary/20 px-3 py-2 text-sm"
                />
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Write your discussion..."
                  className="min-h-[110px] w-full rounded-lg border border-primary/20 px-3 py-2 text-sm"
                />
                <div className="rounded-lg border border-primary/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Skill tags (required)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.skill_tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setForm((p) => ({ ...p, skill_tags: p.skill_tags.filter((t) => t !== tag) }))}
                        className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary"
                      >
                        {tag} ×
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTagFromInput())}
                      placeholder="Add canonical skill tag"
                      className="flex-1 rounded-lg border border-primary/20 px-3 py-2 text-sm"
                    />
                    <Button variant="outline" onClick={addTagFromInput}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {filteredTagSuggestions.map((tag) => (
                      <button
                        key={`suggestion-${tag}`}
                        onClick={() => {
                          if (!form.skill_tags.includes(tag)) {
                            setForm((p) => ({ ...p, skill_tags: [...p.skill_tags, tag] }))
                          }
                        }}
                        className="rounded-full border border-primary/15 bg-white px-2 py-1 text-xs text-text-secondary hover:bg-primary/5"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createPost}>Post</Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-text-secondary">Loading discussions...</p>
            ) : posts.length === 0 ? (
              <Card className="rounded-2xl border-primary/20 bg-white/85">
                <p className="text-sm text-text-secondary">No discussions found. Create a skill-tagged post to start.</p>
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="rounded-2xl border-primary/15 bg-white/90 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => navigate(`/app/community/posts/${post.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/app/community/posts/${post.id}`)
                      }}
                      className="text-left"
                    >
                      <h3 className="text-lg font-semibold text-text-primary hover:text-primary">{post.title}</h3>
                      <p className="mt-1 text-xs text-text-secondary">By {post.author}</p>
                    </button>
                    <div className="text-right text-xs text-text-secondary">
                      <p>{new Date(post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-secondary">{post.content || ''}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(post.skill_tags || []).map((tag) => (
                      <span key={`${post.id}-${tag}`} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        vote(post.id, 'upvote')
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 hover:bg-primary/5"
                    >
                      <ArrowBigUp className="h-4 w-4" />
                      {post.upvotes || 0}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        vote(post.id, 'downvote')
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 hover:bg-primary/5"
                    >
                      <ArrowBigDown className="h-4 w-4" />
                      Downvote
                    </button>
                    <span className="inline-flex items-center gap-1 text-text-secondary">
                      <MessageSquare className="h-4 w-4" />
                      {(post.comment_count ?? post.comments?.length ?? 0)} comments
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <Messaging embedded />
      )}
    </div>
  )
}

export default Community
