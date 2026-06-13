-- D5: indexes for messages/unread and dealer-analytics aggregation
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(conversation_id)
  WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_updated
  ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user_status
  ON public.listings(user_id, status);