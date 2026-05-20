# Deployment Runbook — Vòng Tròn Tương Trợ

**Stack:** Next.js 14 App Router + Supabase + Vercel
**Last updated:** 2026-05-17

---

## 1. Pre-deploy Checklist

Chạy từ root repo trước mỗi lần merge vào `main`:

```bash
# 1. Build pass không lỗi TypeScript
npm run build

# 2. Tests pass toàn bộ
npm run test

# 3. Lint clean
npm run lint
```

Kiểm tra thêm bằng tay:
- [ ] Migrations mới (nếu có) đã được test trên Supabase local hoặc staging
- [ ] Không có `console.log` trực tiếp trong code (dùng `src/lib/logger.ts`)
- [ ] Env vars mới (nếu có) đã được thêm vào Vercel trước khi merge
- [ ] Edge Functions mới (nếu có) đã được deploy riêng trước khi merge

---

## 2. Environment Variables

### Vars bắt buộc trên Vercel

| Variable | Mô tả | Ví dụ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL của Supabase project | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public, dùng trong browser) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret, server only) | `eyJhbGciOi...` |

### Cách kiểm tra đã set chưa

Trên Vercel Dashboard:
1. Vào project → **Settings** → **Environment Variables**
2. Confirm cả 3 vars đều có mặt cho environment **Production** (và **Preview** nếu cần)

Verify bằng build log:
- Nếu thiếu `NEXT_PUBLIC_SUPABASE_URL` hoặc `NEXT_PUBLIC_SUPABASE_ANON_KEY` → build sẽ warn hoặc Supabase client throw runtime error
- Nếu thiếu `SUPABASE_SERVICE_ROLE_KEY` → Server Actions dùng admin client sẽ fail

### Thêm var mới

1. Vercel Dashboard → **Settings** → **Environment Variables** → **Add**
2. Chọn scope (Production / Preview / Development)
3. Redeploy nếu var thuộc Production

---

## 3. Deploy Flow Chuẩn

### Thứ tự bắt buộc khi có migration mới

```
1. Deploy migration lên Supabase TRƯỚC
2. Chờ migration confirm applied
3. Sau đó mới merge code vào main → Vercel auto-deploy
```

Lý do: Code mới có thể depend on schema mới. Nếu deploy code trước khi migrate → runtime error.

### Khi không có migration mới

```
Merge vào main → Vercel auto-deploy → Done
```

### Vercel auto-deploy

- Mọi push lên `main` đều trigger Vercel deploy tự động
- Build logs xem tại: Vercel Dashboard → project → **Deployments**
- Thời gian build thường: 1-3 phút

### Khi cần manual trigger

Tình huống cần trigger thủ công:
- Env var vừa được thêm/sửa (không trigger deploy tự động)
- Muốn redeploy không có code change

Cách trigger:
1. Vercel Dashboard → **Deployments** → chọn deployment gần nhất → **Redeploy**
2. Hoặc: `git commit --allow-empty -m "chore: trigger deploy" && git push`

---

## 4. Supabase Migration Procedure

### Cấu trúc migrations

```
supabase/migrations/
  20260517000001_init_tables.sql        — Schema gốc 8 bảng
  20260517000002_rls_policies.sql       — RLS policies
  20260517000003_seed_dev.sql           — Seed data dev
  20260517000004_sprint2_invites_verify.sql — Assertion-only
  20260517000005_make_invites_email_nullable.sql — email nullable
```

### Apply migration lên production

```bash
# Từ root repo
supabase db push --linked
```

Nếu chưa link project:
```bash
supabase link --project-ref <PROJECT_REF>
# PROJECT_REF lấy từ Supabase Dashboard → Settings → General
```

### Verify migration đã applied

Cách 1 — Supabase Dashboard:
1. Vào **Database** → **Migrations**
2. Confirm migration mới có mặt trong list với status applied

Cách 2 — SQL Editor:
```sql
SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 5;
```

### Rollback nếu migration fail

Hiện tại (Sprint 0-2) chưa có down migration. Quy trình thủ công:

1. Xác định migration nào đã apply (xem bảng `schema_migrations` ở trên)
2. Viết SQL reverse thủ công trong SQL Editor của Supabase Dashboard
3. Sau khi reverse: xóa record trong `schema_migrations` nếu cần
4. Fix migration file, push lại

Về lâu dài: mỗi migration mới nên có comment `-- Rollback:` ghi rõ SQL reverse.

---

## 5. Edge Functions Deploy

### Hiện có

```
supabase/functions/
  expire-invites/index.ts   — Daily cron expire invites
```

### Deploy Edge Function

```bash
# Từ root repo
supabase functions deploy expire-invites --project-ref <PROJECT_REF>
```

### Khi nào cần redeploy

- Có thay đổi code trong `supabase/functions/<name>/`
- Thay đổi env var mà function dùng (set qua Supabase Dashboard → **Edge Functions** → **Secrets**)

### Verify Edge Function hoạt động

Supabase Dashboard → **Edge Functions** → **expire-invites** → xem **Logs**

---

## 6. Smoke Test Sau Deploy

Chạy 5 checks tối thiểu sau mỗi production deploy. Thực hiện bằng tay trên browser:

### Check 1 — Auth flow

1. Mở app tại production URL
2. Nhập email hợp lệ (đã có trong `circle_invites`)
3. Nhận OTP, nhập đúng
4. Confirm: redirect thành công vào `/onboarding` hoặc `/` (nếu đã có profile)

Nếu fail: kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trên Vercel.

### Check 2 — DB connection

1. Đăng nhập xong, truy cập trang cần load data (home hoặc profile)
2. Confirm: data hiển thị, không có lỗi "Failed to fetch" hay timeout

Nếu fail: kiểm tra Supabase project còn active (free tier pause sau 1 tuần inactive).

### Check 3 — Realtime connection

1. Mở 2 tab cùng đăng nhập cùng vòng
2. Thực hiện action (tạo request hoặc update) trên tab 1
3. Confirm: tab 2 cập nhật trong vài giây mà không cần refresh

Nếu fail: kiểm tra Supabase Realtime enabled trong Dashboard → **Database** → **Replication**.

### Check 4 — Storage

1. Vào trang profile
2. Upload avatar
3. Confirm: avatar hiển thị đúng sau upload

Nếu fail: kiểm tra bucket `avatars` tồn tại trong Supabase Dashboard → **Storage**.

### Check 5 — Invite flow

1. Copy invite link từ `/invite`
2. Mở link trong tab ẩn danh
3. Confirm: trang `/join/[token]` render đúng state (valid / expired / invalid)

Nếu fail: kiểm tra `SUPABASE_SERVICE_ROLE_KEY` trên Vercel (dùng trong Server Action check invite).

---

## 7. Rollback Procedure

### Vercel — Instant rollback

1. Vercel Dashboard → **Deployments**
2. Tìm deployment cũ còn hoạt động tốt
3. Click **...** → **Promote to Production**
4. Vercel chuyển traffic về deployment cũ ngay lập tức (không cần rebuild)

Thời gian rollback: < 1 phút.

### Khi nào dùng Vercel rollback

- Bug nghiêm trọng phát hiện sau deploy
- Build mới có runtime error ảnh hưởng tất cả users

### Supabase migration rollback

Xem Mục 4 — phần "Rollback nếu migration fail". Không có automated rollback, phải làm thủ công.

Lưu ý: nếu đã Vercel rollback code nhưng migration đã chạy rồi, code cũ có thể không tương thích với schema mới. Cần assess từng trường hợp cụ thể.

---

## 8. Monitoring

### Vercel

| Nơi xem | Thông tin |
|---|---|
| Dashboard → **Deployments** | Build logs, deploy status, thời gian |
| Dashboard → **Functions** | Runtime logs của Server Actions và API Routes |
| Dashboard → **Analytics** | Traffic, Web Vitals (nếu đã enable) |

Xem runtime error:
- Vercel Dashboard → **Functions** → chọn function → **Logs**
- Filter theo thời gian để tìm lỗi sau deploy

### Supabase

| Nơi xem | Thông tin |
|---|---|
| Dashboard → **Logs** → **API** | Mọi API calls vào Supabase |
| Dashboard → **Logs** → **Database** | Query logs, slow queries |
| Dashboard → **Logs** → **Auth** | Auth events, OTP requests |
| Dashboard → **Logs** → **Edge Functions** | Logs của `expire-invites` |
| Dashboard → **Database** → **Health** | DB connections, CPU, memory |

### Khi có incident

1. Kiểm tra Vercel deployment log trước — build có pass không?
2. Kiểm tra Supabase Logs → API — có lỗi 4xx/5xx bất thường không?
3. Kiểm tra Supabase project còn active không (free tier)
4. Nếu cần: Vercel instant rollback (Mục 7) để giảm downtime trong khi điều tra

---

---

## 9. E2E Test Setup (Playwright Authenticated Suite)

### Yêu cầu để chạy authenticated suite local

Trước khi chạy `npm run test:e2e`, cần có đủ 3 env vars sau trong `.env.local`:

```
E2E_TEST_EMAIL=<email của test user trong Supabase Auth>
E2E_TEST_CIRCLE_ID=<UUID của circle mà test user thuộc về>
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### Cách lấy E2E_TEST_EMAIL

Dùng email của user có sẵn trong Supabase Auth. Xem danh sách tại:
Supabase Dashboard → **Authentication** → **Users**

### Cách lấy E2E_TEST_CIRCLE_ID

Chạy trong Supabase SQL Editor:
```sql
SELECT circle_id FROM circle_members
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
) LIMIT 1;
```

### Chạy suite

```bash
# No-auth suite (không cần E2E vars — chỉ cần dev server running)
npm run test:e2e:no-auth

# Authenticated suite (cần 3 E2E vars đã set)
npm run test:e2e

# Chỉ authenticated project (không chạy no-auth)
npx playwright test --project=setup --project=authenticated
```

### global.setup.ts — Auth bypass mechanism

`e2e/global.setup.ts` sử dụng SERVICE_ROLE_KEY để:
1. Tìm/tạo test user với email `E2E_TEST_EMAIL` (email_confirm: true)
2. Set password tạm thời (chỉ dùng cho E2E)
3. Upsert profile + circle membership
4. Sign in via `signInWithPassword` → inject cookie dùng `@supabase/ssr` format
5. Navigate `/home` để verify session → save `playwright/.auth/user.json`

Authenticated tests tái dùng session này — không cần OTP mỗi lần.

### CI pipeline

`.github/workflows/ci.yml` chỉ chạy **no-auth suite** trong CI.
Authenticated suite yêu cầu live Supabase data → chạy local only.
GitHub Secrets cần add trước khi CI chạy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

*Tạo: 2026-05-17 | Maintain bởi Docs Steward Agent*
*Last updated: 2026-05-20 — Sprint 10: thêm Section 9 E2E Test Setup*
*Liên quan: `docs/03-technical/adr/ADR-001-stack.md`, `docs/04-operations/incident-playbook.md`*
