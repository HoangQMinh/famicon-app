---
adr: ADR-001
title: Tech Stack — Next.js 14 + Supabase + Vercel
status: ACCEPTED
date: 2026-05-16
decision_ref: D-010
---

# ADR-001 — Tech Stack

## Context

FAMICON là lifestyle business, solo founder, AI-augmented workflow. Cần stack:
- Boring, stable, AI-codegen friendly
- Chi phí thấp đến ~50 active users
- Iteration nhanh không qua App Store
- Option mở cho Capacitor migration về sau (D-009)

## Decision

**Next.js 14 App Router + Supabase + Vercel**

| Layer | Choice | Alternative rejected |
|---|---|---|
| Framework | Next.js 14 App Router | Remix (less AI training data), SvelteKit (ecosystem nhỏ hơn) |
| Auth | Supabase Auth (Email OTP) | NextAuth (thêm config), Clerk (paid tier sớm) |
| Database | Supabase Postgres | PlanetScale (MySQL, ít RLS), Neon (ít tích hợp) |
| Storage | Supabase Storage | Cloudflare R2 (thêm dependency — D-029) |
| Realtime | Supabase Realtime | Pusher (paid), Ably (paid) |
| Hosting | Vercel | Render (cold start), Railway (giá cao hơn free tier) |
| Language | TypeScript strict | JavaScript (no type safety) |

## Consequences

**Tốt:**
- Một vendor (Supabase) cho DB + Auth + Storage + Realtime — ít integration overhead
- Next.js App Router = Server Components + Server Actions = ít client JS
- Vercel free tier đủ cho MVP
- Supabase free tier: 500MB DB, 1GB storage, 50MB file, 2GB bandwidth

**Rủi ro:**
- Supabase free tier có cold start sau inactive — chấp nhận được cho MVP
- Vercel cold start function ~200ms — chấp nhận
- Vendor lock-in Supabase — mitigate bằng cách không dùng Supabase-specific syntax trong business logic

## Migration path (D-009)

Khi cần native: Capacitor wrap trên same Next.js codebase. Không cần rewrite UI.
