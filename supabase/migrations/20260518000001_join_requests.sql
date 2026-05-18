-- =============================================================================
-- Migration: 20260518000001_join_requests.sql
-- Description: Sprint (open-registration) — circle_join_requests table.
--
--              Supports the discovery onboarding flow where a new user can
--              request to join a nearby circle without an email invite.
--
--              1. Create circle_join_requests table with status lifecycle
--                 (pending → accepted | declined).
--              2. Index on (circle_id, status) for member review queries.
--              3. Enable RLS with four policies:
--                 - requester_insert: requester inserts their own request
--                 - members_select:   circle members see pending requests
--                 - requester_select: requester sees their own requests
--                 - members_update:   circle members can accept/decline
--
-- Author: Backend Agent
-- Date: 2026-05-18
-- Refs: Constitution, open-registration spec
-- =============================================================================
-- ROLLBACK: see bottom of file
-- =============================================================================

CREATE TABLE IF NOT EXISTS circle_join_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id     uuid        NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  requester_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (circle_id, requester_id)
);

CREATE INDEX idx_join_requests_circle_status
  ON circle_join_requests(circle_id, status);

ALTER TABLE circle_join_requests ENABLE ROW LEVEL SECURITY;

-- Requester can insert their own request
CREATE POLICY "requester_insert" ON circle_join_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Active circle members can view pending requests for their circles
CREATE POLICY "members_select" ON circle_join_requests
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Requester can view their own requests (to check status)
CREATE POLICY "requester_select" ON circle_join_requests
  FOR SELECT USING (requester_id = auth.uid());

-- Active circle members can update status (accept / decline)
-- WITH CHECK mirrors USING so the row cannot be mutated to an unexpected
-- circle_id that bypasses the pre-update USING check.
CREATE POLICY "members_update" ON circle_join_requests
  FOR UPDATE USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================================================
-- ROLLBACK SQL
-- =============================================================================
-- DROP POLICY IF EXISTS "members_update"   ON circle_join_requests;
-- DROP POLICY IF EXISTS "requester_select" ON circle_join_requests;
-- DROP POLICY IF EXISTS "members_select"   ON circle_join_requests;
-- DROP POLICY IF EXISTS "requester_insert" ON circle_join_requests;
-- DROP INDEX  IF EXISTS idx_join_requests_circle_status;
-- DROP TABLE  IF EXISTS circle_join_requests;
-- =============================================================================
