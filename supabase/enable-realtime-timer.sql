-- Run this migration to enable synchronized real-time timer functionality.
-- Prerequisites: sessions.sql must already be applied.

CREATE TABLE IF NOT EXISTS speaker_timer_states (
  speaker_id BIGINT PRIMARY KEY REFERENCES speakers(id) ON DELETE CASCADE,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  is_running BOOLEAN NOT NULL DEFAULT FALSE,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  paused_elapsed_ms INTEGER NOT NULL DEFAULT 0,
  started_by_user_id UUID,
  started_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE speaker_timer_states ENABLE ROW LEVEL SECURITY;

-- Session members can read timer states
CREATE POLICY "Session members can view timer states"
  ON speaker_timer_states FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = speaker_timer_states.session_id
        AND (creator_id = auth.uid() OR user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = speaker_timer_states.session_id
        AND user_id = auth.uid()
        AND accepted = TRUE
    )
  );

-- Session creators and evaluators can insert timer states
CREATE POLICY "Session creators and evaluators can insert timer states"
  ON speaker_timer_states FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = speaker_timer_states.session_id
        AND (creator_id = auth.uid() OR user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = speaker_timer_states.session_id
        AND user_id = auth.uid()
        AND accepted = TRUE
        AND role = 'Evaluator'
    )
  );

-- Session creators and evaluators can update timer states
CREATE POLICY "Session creators and evaluators can update timer states"
  ON speaker_timer_states FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = speaker_timer_states.session_id
        AND (creator_id = auth.uid() OR user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = speaker_timer_states.session_id
        AND user_id = auth.uid()
        AND accepted = TRUE
        AND role = 'Evaluator'
    )
  );

-- Enable real-time change feed for this table
ALTER PUBLICATION supabase_realtime ADD TABLE speaker_timer_states;
