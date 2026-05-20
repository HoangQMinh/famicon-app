---
title: Security & Privacy — Vòng Tròn Tương Trợ
phase: Phase 3
last_updated: 2026-05-16
decision_refs: D-027 (email OTP), D-029 (Supabase Storage), D-030 (soft delete), ADR-003, ADR-007, ADR-011
---

# Security & Privacy

---

## Threat Model

### Assets cần bảo vệ

| Asset | Sensitivity | Notes |
|---|---|---|
| Profile info (tên, khu vực, kids_desc) | Medium | Chia sẻ trong vòng — không public |
| Aid requests content | Medium | Chỉ members cùng vòng thấy |
| Email addresses | High | Dùng cho auth |
| LINE user IDs | High | Notification, không public |
| Location data (Discovery Sprint 11) | High | Centroid only, không GPS |
| Push subscription keys | High | Không leak ra ngoài |

### Threat actors

| Actor | Threat |
|---|---|
| Unauthenticated user | Đọc data vòng, spam OTP |
| Authenticated user (không cùng vòng) | Đọc data vòng khác |
| Authenticated user (cùng vòng) | Xoá request của người khác, impersonation |
| Attacker ngoài | XSS, CSRF, injection |
| Insider (founder) | Access user data không cần thiết |

---

## Authentication Security

### Email OTP (ADR-003)

- OTP 6 số, expire 60 giây (Supabase default)
- Rate limit: max 3 OTP requests / email / 10 phút (Server Action layer)
- Supabase Auth built-in rate limiting thêm lớp thứ 2
- Max 3 OTP attempts sai → expire, yêu cầu OTP mới
- Session trong HTTP-only cookie (không phải localStorage) → không bị XSS steal

### Session

```typescript
// middleware.ts — protect tất cả routes trừ /auth và /join/[token]
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isPublicRoute(request.pathname)) {
    return NextResponse.redirect('/auth');
  }
}
```

---

## Authorization — RLS

Mọi data access đi qua Supabase RLS (Row Level Security). Chi tiết đầy đủ trong `data-model.md`.

### Tóm tắt nguyên tắc RLS

1. **Default deny:** Không có policy = không có access
2. **Circle isolation:** Members chỉ thấy data của vòng mình
3. **Owner-only mutations:** Chỉ owner update/delete data của mình
4. **Service role cho server-side:** Edge Functions dùng service role (không qua RLS) — cần audit kỹ

### Kiểm tra thường xuyên

Sau mỗi sprint có schema changes: chạy RLS test suite (ADR-010) để verify boundary.

---

## OWASP Top 10 — Mitigation

| Risk | Mitigation |
|---|---|
| A01 Broken Access Control | RLS trên tất cả tables; middleware auth check |
| A02 Cryptographic Failures | HTTPS only (Vercel); Supabase encrypt at rest; HTTP-only cookie |
| A03 Injection | Supabase query builder (parameterized); Zod schema validation input |
| A04 Insecure Design | RLS by default; No public data; Circle isolation |
| A05 Security Misconfiguration | Supabase anon key chỉ cho client; service key chỉ server-side |
| A06 Vulnerable Components | Dependabot alerts trên GitHub; regular `npm audit` |
| A07 Auth Failures | Rate limiting OTP; session HTTP-only cookie; short OTP TTL |
| A08 Data Integrity | Zod validation tại Server Action; DB constraints (check clauses) |
| A09 Logging | Supabase audit logs; Vercel request logs |
| A10 SSRF | Không có user-provided URL fetch trong MVP |

---

## Input Validation

Mọi mutation đi qua Zod schema (ADR-009):

```typescript
// Không tin tưởng input từ client
export async function createRequest(data: unknown) {
  const parsed = newRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Dữ liệu không hợp lệ' };
  }
  // proceed with parsed.data
}
```

Không dùng `as` typecast để bypass validation.

---

## File Upload Security (ADR-007)

```typescript
// Server-side validation khi upload avatar
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

if (!ALLOWED_TYPES.includes(file.type)) {
  return { success: false, error: 'Định dạng không hợp lệ.' };
}
if (file.size > MAX_SIZE) {
  return { success: false, error: 'File quá lớn. Tối đa 2MB.' };
}
```

Supabase Storage bucket config cũng enforce MIME types và size limit.

---

## Privacy — APPI Compliance (Nhật Bản)

FAMICON lưu trữ thông tin cá nhân của người dùng tại Nhật → cần tuân thủ **Act on the Protection of Personal Information (APPI)**.

### Thông tin cá nhân thu thập

| Field | Mục đích | Retention |
|---|---|---|
| Email | Auth | Cho đến khi deactivate account |
| display_name | Hiển thị trong vòng | Cho đến khi deactivate |
| kids_desc | Matching context | Cho đến khi deactivate |
| location | Khu vực (không GPS) | Cho đến khi deactivate |
| line_user_id | Notification fallback | Cho đến khi user xoá |
| push_subscriptions | Web Push | Cho đến khi user revoke permission |

### User rights (APPI)

| Right | Implementation |
|---|---|
| Access own data | Profile screen shows all data |
| Correct data | Edit Profile action |
| Stop use (deactivate) | Deactivate account → is_active = false (D-030) |
| Delete (hard) | D-030: không có MVP. Thêm Phase 5. Manual process qua founder. |

### Privacy Policy

Cần có Privacy Policy tiếng Nhật + tiếng Việt trước khi launch. Checklist:
- [ ] Data controller: [Tên founder / business entity]
- [ ] Data collected và mục đích
- [ ] Retention period
- [ ] Third parties: Supabase (US), Vercel (US), LINE (Nhật) — cần cross-border transfer notice
- [ ] User rights và cách exercise
- [ ] Contact: email của founder

OQ-011 (OPEN): Có cần luật sư Nhật review không? Deadline Phase 4 cuối.

---

## Secrets Management

```
.env.local (không commit):
  SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY  -- client-safe
  SUPABASE_SERVICE_ROLE_KEY      -- server-only, không trong NEXT_PUBLIC_
  SUPABASE_JWT_SECRET
  VAPID_PUBLIC_KEY
  VAPID_PRIVATE_KEY              -- server-only
  LINE_CHANNEL_SECRET
  LINE_CHANNEL_ACCESS_TOKEN
```

Vercel Environment Variables cho production (không hardcode trong code).

`.gitignore` đã có `.env*` — không bao giờ commit secrets.

---

## Incident Response

Nếu phát hiện data leak:

1. Rotate tất cả API keys ngay lập tức (Supabase, LINE, VAPID)
2. Revoke tất cả sessions (Supabase Auth Admin API)
3. Notify users bị ảnh hưởng trong 72 giờ (APPI requirement)
4. Ghi log incident

---

## Security Headers (Next.js)

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",   // Next.js cần unsafe-eval dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self' https://fonts.gstatic.com",
    ].join('; ')
  },
];
```
