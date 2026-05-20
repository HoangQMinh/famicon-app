-- =============================================================================
-- Migration: 20260520000001_is_email_registered_rpc.sql
-- Description: Add is_email_registered() RPC to support auth gating for
--              open-registration users who have no circle_invites entry.
--
--              signInWithEmail() uses isEmailAllowed() which checks circle_invites
--              (pending/accepted). Open-registration users (signed up via /register
--              without an invite) have no circle_invites row and were incorrectly
--              blocked from logging back in.
--
--              This function allows isEmailAllowed() to check auth.users as a
--              third gate: if the email already has a Supabase auth account, the
--              user registered legitimately via the open flow and may sign in.
--
--              SECURITY DEFINER: required to access auth.users from public schema.
--              Returns BOOLEAN only — no PII is returned to the caller.
--
-- Author: Master Agent (bug fix)
-- Date: 2026-05-20
-- Refs: Sprint 6 (open registration), signInWithEmail auth gate
-- =============================================================================
-- ROLLBACK: DROP FUNCTION IF EXISTS public.is_email_registered(TEXT);
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(p_email))
  );
$$;

-- Grant execute to service_role only — never to anon or authenticated
-- (this function is called exclusively from the server-side admin client).
REVOKE EXECUTE ON FUNCTION public.is_email_registered(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_email_registered(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_email_registered(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_registered(TEXT) TO service_role;
