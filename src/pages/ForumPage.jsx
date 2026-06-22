import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  listForumPosts,
  listForumComments,
  createForumPost,
  deleteForumPost,
  createForumComment,
  deleteForumComment,
} from '../lib/api'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/ToastProvider'
import { useConfirm } from '../components/ConfirmProvider'
import useDocumentTitle from '../hooks/useDocumentTitle'

const MAX_DEPTH = 4 // how deep replies can nest before flattening visually

function timeAgo(iso) {
  if (!iso) return ''
  const sec = (Date.now() - new Date(iso).getTime()) / 1000
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function buildTree(flat) {
  // Returns top-level comments, each with a `children` array. Sorted by created_at asc.
  const byId = new Map()
  const roots = []
  for (const c of flat) byId.set(c.id, { ...c, children: [] })
  for (const c of byId.values()) {
    if (c.parent_comment_id && byId.has(c.parent_comment_id)) {
      byId.get(c.parent_comment_id).children.push(c)
    } else {
      roots.push(c)
    }
  }
  const sortAsc = (a, b) => (a.created_at || '').localeCompare(b.created_at || '')
  roots.sort(sortAsc)
  for (const c of byId.values()) c.children.sort(sortAsc)
  return roots
}

function CommentNode({
  comment,
  depth,
  currentUserId,
  isAdmin,
  replyingTo,
  replyText,
  savingReply,
  onStartReply,
  onCancelReply,
  onChangeReplyText,
  onSubmitReply,
  onDelete,
}) {
  const isOwn = comment.user_id === currentUserId
  const isReplying = replyingTo === comment.id
  const indent = Math.min(depth, MAX_DEPTH)

  return (
    <li className="comment-node" style={{ marginLeft: indent * 18 }}>
      <div className="comment-bubble">
        <div className="comment-meta">
          <span className="comment-author">{comment.author?.full_name || 'Someone'}</span>
          {comment.author?.role === 'admin' && <span className="badge" style={{ marginLeft: 6 }}>admin</span>}
          <span style={{ marginLeft: 6 }}>· {timeAgo(comment.created_at)}</span>
        </div>
        <p style={{ margin: '4px 0 8px', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
        <div className="comment-actions">
          {currentUserId && (
            <button className="comment-action" onClick={() => onStartReply(comment.id)}>↩ Reply</button>
          )}
          {(isOwn || isAdmin) && (
            <button className="comment-action danger" onClick={() => onDelete(comment)}>🗑 Delete</button>
          )}
        </div>

        {isReplying && (
          <form
            onSubmit={(e) => { e.preventDefault(); onSubmitReply(comment.id) }}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}
          >
            <textarea
              className="form-textarea"
              rows={2}
              autoFocus
              placeholder={`Reply to ${comment.author?.full_name || 'this comment'}…`}
              value={replyText}
              onChange={(e) => onChangeReplyText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn small subtle" onClick={onCancelReply}>Cancel</button>
              <button type="submit" className="btn small primary" disabled={savingReply || !replyText.trim()}>
                {savingReply ? 'Sending…' : 'Reply'}
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.children.length > 0 && (
        <ul className="comment-children">
          {comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              replyingTo={replyingTo}
              replyText={replyText}
              savingReply={savingReply}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onChangeReplyText={onChangeReplyText}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function ForumPage() {
  useDocumentTitle('Forum')
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [posts, setPosts] = useState([])
  const [openPost, setOpenPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPost, setLoadingPost] = useState(false)
  const [error, setError] = useState(null)

  const [composing, setComposing] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [saving, setSaving] = useState(false)

  const [topLevelComment, setTopLevelComment] = useState('')
  const [savingTopLevel, setSavingTopLevel] = useState(false)

  const [replyingTo, setReplyingTo] = useState(null) // comment id being replied to
  const [replyText, setReplyText] = useState('')
  const [savingReply, setSavingReply] = useState(false)

  const tree = useMemo(() => buildTree(comments), [comments])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await listForumPosts()
    if (error) setError(error.message)
    setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function openPostDetails(post) {
    setOpenPost(post)
    setLoadingPost(true)
    const { data: c } = await listForumComments(post.id)
    setComments(c || [])
    setLoadingPost(false)
  }

  function closePost() {
    setOpenPost(null)
    setComments([])
    setTopLevelComment('')
    setReplyingTo(null)
    setReplyText('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!user) { nav('/login'); return }
    if (!newPostTitle.trim() || !newPostContent.trim()) return
    setSaving(true)
    setError(null)
    const { data, error } = await createForumPost(user.id, {
      title: newPostTitle.trim().slice(0, 200),
      content: newPostContent.trim(),
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    setPosts((prev) => [data, ...prev])
    setComposing(false)
    setNewPostTitle('')
    setNewPostContent('')
    toast.success('Post created.')
  }

  async function handleDeletePost(post) {
    const ok = await confirm({
      title: 'Delete post?',
      message: `"${post.title}" will be removed along with all comments.`,
      confirmLabel: 'Delete post',
      danger: true,
    })
    if (!ok) return
    const { error } = await deleteForumPost(post.id)
    if (error) { toast.error(error.message); return }
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    if (openPost?.id === post.id) closePost()
    toast.success('Post deleted.')
  }

  async function handleAddTopLevelComment(e) {
    e.preventDefault()
    if (!user) { nav('/login'); return }
    if (!topLevelComment.trim() || !openPost) return
    setSavingTopLevel(true)
    const { data, error } = await createForumComment(user.id, openPost.id, topLevelComment.trim(), null)
    setSavingTopLevel(false)
    if (error) { toast.error(error.message); return }
    setComments((prev) => [...prev, data])
    setTopLevelComment('')
  }

  async function handleSubmitReply(parentCommentId) {
    if (!user) { nav('/login'); return }
    if (!replyText.trim() || !openPost) return
    setSavingReply(true)
    const { data, error } = await createForumComment(user.id, openPost.id, replyText.trim(), parentCommentId)
    setSavingReply(false)
    if (error) { toast.error(error.message); return }
    setComments((prev) => [...prev, data])
    setReplyText('')
    setReplyingTo(null)
  }

  async function handleDeleteComment(comment) {
    const childCount = comments.filter((c) => c.parent_comment_id === comment.id).length
    const ok = await confirm({
      title: 'Delete comment?',
      message:
        childCount > 0
          ? `This will also delete ${childCount} repl${childCount === 1 ? 'y' : 'ies'} below it. Cannot be undone.`
          : 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    const { error } = await deleteForumComment(comment.id)
    if (error) { toast.error(error.message); return }
    // Reload to get the up-to-date tree (cascaded deletes)
    const { data: c } = await listForumComments(openPost.id)
    setComments(c || [])
  }

  function startReply(commentId) {
    setReplyingTo(commentId)
    setReplyText('')
  }
  function cancelReply() {
    setReplyingTo(null)
    setReplyText('')
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Community forum</h1>
          <div className="subtitle">Share what works. Ask what doesn't. Help each other stay focused.</div>
        </div>
        {user ? (
          <button className="btn primary" onClick={() => setComposing(true)}>+ New post</button>
        ) : (
          <button className="btn primary" onClick={() => nav('/login')}>Sign in to post</button>
        )}
      </div>

      {error && <div className="form-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="dashboard-grid">
        <main>
          {loading ? (
            <Spinner />
          ) : posts.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No posts yet"
              description={user ? 'Be the first to start a conversation.' : 'No conversations yet. Sign in to start one.'}
              action={
                user ? (
                  <button className="btn primary" onClick={() => setComposing(true)}>+ New post</button>
                ) : (
                  <button className="btn primary" onClick={() => nav('/login')}>Sign in to post</button>
                )
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {posts.map((p) => {
                const commentCount = p.comments?.[0]?.count ?? 0
                const isOwner = p.user_id === user?.id
                return (
                  <article key={p.id} className="card forum-post-card" onClick={() => openPostDetails(p)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0 }}>{p.title}</h3>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                          {p.author?.full_name || 'Someone'} · {timeAgo(p.created_at)} · {commentCount} comment{commentCount === 1 ? '' : 's'}
                          {p.author?.role === 'admin' && <span className="badge" style={{ marginLeft: 6 }}>admin</span>}
                        </div>
                      </div>
                      {(isOwner || isAdmin) && (
                        <button
                          className="btn-icon"
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(p) }}
                          title="Delete"
                        >🗑</button>
                      )}
                    </div>
                    <p style={{ color: 'var(--muted)', marginTop: 10, marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.content}
                    </p>
                  </article>
                )
              })}
            </div>
          )}
        </main>
        <Sidebar />
      </div>

      <Modal
        open={composing}
        onClose={() => setComposing(false)}
        title="Start a new conversation"
        footer={
          <>
            <button type="button" className="btn subtle" onClick={() => setComposing(false)}>Cancel</button>
            <button type="submit" form="new-post-form" className="btn primary" disabled={saving}>
              {saving ? 'Posting…' : 'Post'}
            </button>
          </>
        }
      >
        <form id="new-post-form" className="form-grid" onSubmit={handleCreate}>
          <div className="form-row">
            <label htmlFor="post-title">Title</label>
            <input
              id="post-title"
              className="form-input"
              required
              maxLength={200}
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="post-content">What's on your mind?</label>
            <textarea
              id="post-content"
              className="form-textarea"
              required
              rows={6}
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={!!openPost}
        onClose={closePost}
        title={openPost?.title || ''}
      >
        {openPost && (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              {openPost.author?.full_name || 'Someone'} · {timeAgo(openPost.created_at)}
              {openPost.author?.role === 'admin' && <span className="badge" style={{ marginLeft: 6 }}>admin</span>}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{openPost.content}</p>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

            <h4 style={{ marginBottom: 8 }}>Comments ({comments.length})</h4>

            {loadingPost ? (
              <Spinner />
            ) : tree.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No comments yet — be the first.</p>
            ) : (
              <ul className="comment-tree">
                {tree.map((c) => (
                  <CommentNode
                    key={c.id}
                    comment={c}
                    depth={0}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    savingReply={savingReply}
                    onStartReply={startReply}
                    onCancelReply={cancelReply}
                    onChangeReplyText={setReplyText}
                    onSubmitReply={handleSubmitReply}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </ul>
            )}

            {user ? (
              <form onSubmit={handleAddTopLevelComment} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Add a comment to the post…"
                  rows={2}
                  value={topLevelComment}
                  onChange={(e) => setTopLevelComment(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn primary" disabled={savingTopLevel || !topLevelComment.trim()}>
                    {savingTopLevel ? 'Sending…' : 'Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: 12 }}>
                <button className="btn ghost" onClick={() => nav('/login')}>Sign in to comment</button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}
