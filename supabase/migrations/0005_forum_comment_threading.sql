-- =============================================================================
-- Migration: threaded replies in forum_comments
--
-- Adds a nullable self-reference. Top-level comments (replies to the post)
-- have parent_comment_id = NULL; replies to another comment carry that
-- comment's id. ON DELETE CASCADE means deleting a comment also removes
-- all of its descendant replies.
-- =============================================================================

alter table public.forum_comments
  add column if not exists parent_comment_id uuid
  references public.forum_comments(id) on delete cascade;

create index if not exists forum_comments_parent_idx
  on public.forum_comments(parent_comment_id);
