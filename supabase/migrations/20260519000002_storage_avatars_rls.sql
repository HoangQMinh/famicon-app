-- =============================================================================
-- Migration: 20260519000002_storage_avatars_rls.sql
-- Description: Sprint 8 — Supabase Storage RLS policies for the `avatars` bucket.
--
--              Sprint 8 adds avatar upload (uploadAvatar Server Action).
--              The `avatars` bucket must have RLS policies to:
--                1. Allow each user to INSERT/UPDATE only into their own folder
--                   (path prefix = auth.uid()::text)
--                2. Allow public SELECT (avatars are non-sensitive display images)
--                3. Allow each user to DELETE only their own objects
--
--              Path convention enforced by Server Action and by policy:
--                {user_id}/avatar.webp   (upsert — only 1 avatar per user)
--
--              Bucket creation is NOT done here — bucket `avatars` must already
--              exist (created via Supabase Dashboard or separately).
--              This migration only manages storage.objects RLS policies.
--
--              Idempotent: each policy uses DROP POLICY IF EXISTS before CREATE.
--
-- Author: Schema Agent
-- Date: 2026-05-19
-- Refs: Sprint 8 spec (@schema Task 3), D-029
--
-- ROLLBACK: see bottom of file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Ensure storage schema is accessible (Supabase managed)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from   information_schema.schemata
    where  schema_name = 'storage'
  ) then
    raise exception
      'MIGRATION GUARD: storage schema not found. '
      'This migration requires Supabase Storage to be enabled.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STEP 2: DROP existing policies on storage.objects for avatars bucket
--         (idempotent — safe to run multiple times)
-- ---------------------------------------------------------------------------

drop policy if exists "avatars_insert_own_folder"  on storage.objects;
drop policy if exists "avatars_update_own_folder"  on storage.objects;
drop policy if exists "avatars_select_public"      on storage.objects;
drop policy if exists "avatars_delete_own_folder"  on storage.objects;

-- ---------------------------------------------------------------------------
-- STEP 3: INSERT — user can only upload into their own folder
--
-- Path pattern: {user_id}/avatar.webp
-- (storage.foldername(name))[1] extracts the first path segment.
-- Casting auth.uid() to text for string comparison.
--
-- Security: Server Action always constructs path as `${user.id}/avatar.webp`
-- using the server-side auth.uid() — client cannot supply a different user_id.
-- This policy is a defense-in-depth layer on top of the Server Action guard.
-- ---------------------------------------------------------------------------

create policy "avatars_insert_own_folder" on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- STEP 4: UPDATE — user can only overwrite objects in their own folder
--
-- Same folder check as INSERT. Applies when upsert = true overwrites an
-- existing object.
-- ---------------------------------------------------------------------------

create policy "avatars_update_own_folder" on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- STEP 5: SELECT — public read access for all avatar objects
--
-- Avatars are non-sensitive display images served at public URLs.
-- Only visibility of the object URL is controlled (avatar_url is only
-- returned to circle members via profiles RLS — see profiles_select_circle_member).
-- The Storage URL itself is public once known.
--
-- Rationale: Supabase getPublicUrl() returns a non-signed URL; restricting
-- SELECT here would break <img src=...> rendering for all users. Public
-- buckets typically have public SELECT by default; this policy makes it
-- explicit and auditable.
-- ---------------------------------------------------------------------------

create policy "avatars_select_public" on storage.objects
  for select
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- STEP 6: DELETE — user can only delete their own objects
--
-- Defensive policy: uploadAvatar uses upsert (not delete+insert), but
-- allowing delete of own objects is consistent with data ownership.
-- ---------------------------------------------------------------------------

create policy "avatars_delete_own_folder" on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- ROLLBACK SQL
-- =============================================================================
-- drop policy if exists "avatars_delete_own_folder"  on storage.objects;
-- drop policy if exists "avatars_select_public"      on storage.objects;
-- drop policy if exists "avatars_update_own_folder"  on storage.objects;
-- drop policy if exists "avatars_insert_own_folder"  on storage.objects;
-- =============================================================================
