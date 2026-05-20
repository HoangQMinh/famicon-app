---
adr: ADR-003
title: Authentication — Email OTP via Supabase Auth
status: ACCEPTED
date: 2026-05-16
decision_ref: D-027
---

# ADR-003 — Authentication

## Context

OQ-003 và OQ-004 đã được resolve (D-027): Email OTP duy nhất, không Phone OTP, không LINE Login.

Yêu cầu:
- Không cần nhớ password (người dùng ít kỹ thuật)
- Không thêm dependency vào LINE SDK cho core auth
- Đơn giản nhất cho MVP

## Decision

**Supabase Auth — Email OTP (Magic Link / 6-digit OTP)**

Dùng Supabase Auth built-in OTP flow:
- User nhập email → `supabase.auth.signInWithOtp({ email })`
- Supabase gửi email với 6-digit OTP
- User nhập OTP → `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- Session tự refresh qua Supabase client

**Email provider:** Supabase default SMTP (development) → SendGrid / Resend (production).

## Session management

- `@supabase/ssr` package cho Next.js App Router
- Session stored in HTTP-only cookies (not localStorage)
- Middleware check session trên mọi protected route
- Auto-refresh token: Supabase client handle tự động

## Invite gating

User chỉ có thể đăng nhập nếu email đã có trong bảng `circle_invites` (status=pending) hoặc đã là member. Check phía server trong sign-in flow.

```typescript
// Server Action — sign in
async function signIn(email: string) {
  const invite = await db.query(
    `SELECT id FROM circle_invites WHERE email = $1 AND status = 'pending' AND expires_at > now()`,
    [email]
  );
  if (!invite && !existingMember) {
    return { error: 'Email này chưa được mời.' };
  }
  await supabase.auth.signInWithOtp({ email });
}
```

## Consequences

**Tốt:**
- Không cần user nhớ password
- Supabase handle email sending, rate limiting, token expiry
- HTTP-only cookie bảo vệ khỏi XSS
- Không có LINE SDK dependency trong auth path

**Rủi ro:**
- Email OTP có thể vào spam — onboarding phải hướng dẫn check spam
- Supabase free tier: 3 emails/giờ cho custom SMTP, cần upgrade hoặc dùng Resend sớm
- OTP expire sau 60 giây (configurable trong Supabase dashboard)

## Rate limiting

- Server Action check: max 3 OTP requests / email / 10 phút
- Supabase Auth built-in rate limiting cũng có

## Future

LINE Login có thể thêm như "thêm phương thức đăng nhập" trong Phase 5 — không phải core auth.
