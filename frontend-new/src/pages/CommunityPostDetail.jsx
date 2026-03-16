import { useEffect, useState } from 'react'
import { ArrowLeft, MessageSquare, ThumbsUp } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { communityAPI } from '../services/api'

const CommunityPostDetail = () => {
  const navigate = useNavigate()
  const { postId } = useParams()

  const [post, setPost] = useState(null)
  const [commentTree, setCommentTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [openReplyFor, setOpenReplyFor] = useState('')
  const [submittingReplyFor, setSubmittingReplyFor] = useState('')

  const loadPost = async () => {
    if (!postId) return
    try {
      setLoading(true)
      const res = await communityAPI.getPost(postId)
      const payload = res?.data || {}
      const detailPost = payload?.post || payload
      const nested = Array.isArray(payload?.comments) ? payload.comments : []
      setPost(detailPost || null)
      setCommentTree(nested)
    } catch (error) {
      console.error('Failed to fetch post detail:', error)
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPost()
  }, [postId])

  const submitComment = async () => {
    if (!commentText.trim() || !postId) return
    try {
      setSubmitting(true)
      await communityAPI.createComment(postId, { content: commentText.trim() })
      setCommentText('')
      await loadPost()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading post...</p>
  }

  if (!post) {
    return (
      <Card className="rounded-2xl border-primary/20 bg-white/90">
        <p className="text-sm text-text-secondary">Post not found.</p>
      </Card>
    )
  }

  const fallbackComments = Array.isArray(post.comments) ? post.comments : []
  const totalComments = Number(post.comment_count ?? 0)
  const comments = commentTree.length > 0
    ? commentTree
    : fallbackComments.map((c) => ({
        id: c.id,
        content: c.content,
        author: c.author || c.author_name || c.user_id,
        created_at: c.created_at,
        replies: [],
      }))

  const submitReply = async (parentCommentId) => {
    const text = String(replyDrafts[parentCommentId] || '').trim()
    if (!text || !postId) return
    try {
      setSubmittingReplyFor(parentCommentId)
      await communityAPI.createReply(postId, { content: text, parent_comment_id: parentCommentId })
      setReplyDrafts((prev) => ({ ...prev, [parentCommentId]: '' }))
      setOpenReplyFor('')
      await loadPost()
    } catch (error) {
      console.error('Failed to add reply:', error)
    } finally {
      setSubmittingReplyFor('')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Button variant="outline" onClick={() => navigate('/app/community')}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Community
      </Button>

      <Card className="rounded-2xl border-primary/20 bg-white/95">
        <h1 className="text-2xl font-semibold text-text-primary">{post.title}</h1>
        <p className="mt-2 text-xs text-text-secondary">By {post.author}</p>
        <p className="mt-4 whitespace-pre-line text-sm text-text-secondary">{post.content}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(post.skill_tags || []).map((tag) => (
            <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {post.upvotes || 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {totalComments || comments.reduce((acc, item) => acc + 1 + (item.replies?.length || 0), 0)} comments
          </span>
        </div>
      </Card>

      <Card className="rounded-2xl border-primary/20 bg-white/95">
        <h2 className="text-lg font-semibold text-text-primary">Add Comment</h2>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment..."
          className="mt-3 min-h-[110px] w-full rounded-lg border border-primary/20 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={submitComment} disabled={submitting || !commentText.trim()}>
            {submitting ? 'Posting...' : 'Submit'}
          </Button>
        </div>
      </Card>

      <Card className="rounded-2xl border-primary/20 bg-white/95">
        <h2 className="text-lg font-semibold text-text-primary">Comments</h2>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-text-secondary">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id || `${c.author}-${c.created_at}`} className="rounded-lg border border-primary/15 bg-white p-3">
                <p className="text-xs text-text-secondary">By {c.author}</p>
                <p className="mt-1 text-sm text-text-primary">{c.content}</p>
                <button
                  onClick={() => setOpenReplyFor((prev) => (prev === c.id ? '' : c.id))}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Reply
                </button>

                {openReplyFor === c.id && (
                  <div className="mt-3 rounded-lg border border-primary/15 bg-primary/5 p-3">
                    <textarea
                      value={replyDrafts[c.id] || ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="Write a reply..."
                      className="min-h-[80px] w-full rounded-lg border border-primary/20 bg-white px-3 py-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={() => submitReply(c.id)}
                        disabled={submittingReplyFor === c.id || !String(replyDrafts[c.id] || '').trim()}
                      >
                        {submittingReplyFor === c.id ? 'Posting...' : 'Submit Reply'}
                      </Button>
                    </div>
                  </div>
                )}

                {Array.isArray(c.replies) && c.replies.length > 0 && (
                  <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/15">
                    {c.replies.map((r) => (
                      <div key={r.id || `${r.author}-${r.created_at}`} className="rounded-lg border border-primary/10 bg-white p-2.5">
                        <p className="text-xs text-text-secondary">By {r.author}</p>
                        <p className="mt-1 text-sm text-text-primary">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default CommunityPostDetail
