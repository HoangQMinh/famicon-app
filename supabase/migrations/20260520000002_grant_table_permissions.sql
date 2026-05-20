-- =============================================================================
-- Migration: 20260520000002_grant_table_permissions.sql
-- Description: Grant table-level permissions for authenticated role on all tables
-- Author: Backend Agent
-- Date: 2026-05-20
-- Refs: B-003 — missing GRANT causing 42501 on circle_members queries
-- Fix: Add GRANT SELECT (+ write ops) so PostgREST can evaluate RLS policies.
--       RLS policies are the actual access control; grants are a prerequisite.
--       Without these GRANTs, PostgREST returns 42501 "permission denied" even
--       when the RLS policy USING clause would allow access — because PostgREST
--       checks table-level privileges before evaluating row-level policies.
-- =============================================================================

-- profiles
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- circles
GRANT SELECT, INSERT ON public.circles TO authenticated;

-- circle_members (THE CRITICAL ONE — root cause of B-003)
-- RLS policies on circle_members restrict SELECT to members of the same circle.
-- Without this GRANT, PostgREST returns 42501 before even evaluating RLS.
GRANT SELECT ON public.circle_members TO authenticated;

-- circle_invites
GRANT SELECT, INSERT ON public.circle_invites TO authenticated;

-- aid_requests
GRANT SELECT, INSERT, UPDATE ON public.aid_requests TO authenticated;

-- help_offers
GRANT SELECT, INSERT, UPDATE ON public.help_offers TO authenticated;

-- push_subscriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- user_discovery_settings
GRANT SELECT, INSERT, UPDATE ON public.user_discovery_settings TO authenticated;

-- notification_logs
GRANT SELECT ON public.notification_logs TO authenticated;

-- circle_join_requests (Sprint 6 migration — open-registration flow)
GRANT SELECT, INSERT, UPDATE ON public.circle_join_requests TO authenticated;

-- =============================================================================
-- ROLLBACK SQL
-- =============================================================================
-- REVOKE SELECT, UPDATE                            ON public.profiles                FROM authenticated;
-- REVOKE SELECT, INSERT                            ON public.circles                 FROM authenticated;
-- REVOKE SELECT                                    ON public.circle_members           FROM authenticated;
-- REVOKE SELECT, INSERT                            ON public.circle_invites           FROM authenticated;
-- REVOKE SELECT, INSERT, UPDATE                    ON public.aid_requests             FROM authenticated;
-- REVOKE SELECT, INSERT, UPDATE                    ON public.help_offers              FROM authenticated;
-- REVOKE SELECT, INSERT, UPDATE, DELETE            ON public.push_subscriptions       FROM authenticated;
-- REVOKE SELECT, INSERT, UPDATE                    ON public.user_discovery_settings  FROM authenticated;
-- REVOKE SELECT                                    ON public.notification_logs        FROM authenticated;
-- REVOKE SELECT, INSERT, UPDATE                    ON public.circle_join_requests     FROM authenticated;
-- =============================================================================
