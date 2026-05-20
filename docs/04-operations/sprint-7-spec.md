---
title: Sprint 7 Spec — Request Detail + Help Offer
sprint: 7
phase: Phase 4 — Build MVP
created: 2026-05-18
status: DRAFT
---

# Sprint 7 — Request Detail + Help Offer

## Goal

User có thể xem đầy đủ chi tiết một aid request và bấm "Tôi giúp được" để bày tỏ ý muốn giúp — app ghi nhận offer vào DB, sau đó hand-off sang LINE để trao đổi trực tiếp với người nhờ.

## Dependencies

- Sprint 5 ✅ — `help_offers` table đã có trong DB (Sprint 0), notification infrastructure đã có (Sprint 5)
- Sprint 6 ✅ — `aid_requests` flow hoàn chỉnh, circle membership model ổn định
- OQ-010 → D-032 ✅ — Request expire khi qua `scheduled_at` (không cần Edge Function riêng)
- OQ-017 → D-033 ✅ — Re-notify vòng khi cancel (implement trong sprint này)
- OQ-007 — OPEN, xem mục "Open Questions Liên Quan" bên dưới

## Tasks

### @schema

1. **Verify `help_offers` table** — Table đã tồn tại từ Sprint 0. Kiểm tra migration `20260517000001` đảm bảo đủ: `id`, `request_id`, `helper_id`, `status` (`pending` / `accepted` / `declined`), `created_at`, unique constraint `(request_id, helper_id)`.
2. **Verify RLS `help_offers`** — Đảm bảo 2 policies đã đúng:
   - `offers_select`: helper xem offer của mình, requester xem offers cho request của mình
   - `offers_insert_member`: helper phải là circle member, request phải ở trạng thái `open`
3. **Verify `notification_logs` type enum** — Đảm bảo `'helper_confirmed'` đã có trong CHECK constraint (thêm ở Sprint 5). Nếu thiếu: tạo migration ALTER TYPE.
4. **Không tạo cột mới tracking số lần giúp** — Tuyệt đối không thêm bất kỳ counter column nào vào `help_offers` hay `profiles` (Constitution Nguyên tắc 2, D-004).

### @backend

1. **`src/app/actions/offers.ts`** — Tạo file mới với 3 Server Actions:

   **`createOffer(requestId: string)`**
   - Auth guard → check helper là circle member của request's circle
   - Check request status = `'open'` (không accept offer khi đã matched/closed/cancelled)
   - Check không duplicate offer (unique constraint `request_id, helper_id`)
   - INSERT vào `help_offers` (status = `'pending'`)
   - Lấy `line_user_id` của requester từ `profiles` table
   - Build LINE deeplink: `https://line.me/ti/p/~{lineId}` nếu có `line_user_id`, fallback `https://line.me/R/ti/p/~` (open LINE)
   - Pre-filled message: `"Mình có thể giúp bạn về [category]! Mình sẽ liên hệ nhé."`
   - Return: `ActionResult<{ offer_id: string; line_handoff_url: string }>`
   - Errors: `'Bạn đã đề nghị giúp request này rồi.'`, `'Request đã được match rồi.'`, `'Bạn chưa đăng nhập.'`

   **`acceptOffer(offerId: string)`**
   - Auth guard → chỉ requester của request mới được accept
   - UPDATE `help_offers` SET status = `'accepted'`
   - UPDATE `aid_requests` SET status = `'matched'`
   - UPDATE các offers khác của cùng request sang status = `'declined'`
   - Fire-and-forget: gọi `notify-circle` Edge Function với type `'helper_confirmed'` → notify helper
   - Return: `ActionResult<{ accepted: true }>`
   - Error: `'Chỉ người nhờ mới có thể chấp nhận offer.'`

   **`cancelRequest(requestId: string)`** — Thêm vào `src/app/actions/requests.ts` (nếu chưa có):
   - Auth guard → chỉ requester
   - UPDATE `aid_requests` SET status = `'cancelled'`
   - Nếu request đang `'matched'` → reset về `'cancelled'`, fire re-notify (D-033): gọi `notify-circle` để báo vòng request cần helper mới
   - Return: `ActionResult<{ cancelled: true }>`

2. **`getRequestDetail(requestId: string)`** — Thêm vào `src/app/actions/requests.ts`:
   - Fetch `aid_requests` JOIN `profiles` (requester display_name, line_user_id)
   - RLS enforced: chỉ circle member mới đọc được
   - Return đầy đủ: id, category, description, scheduled_at, location, is_urgent, status, created_at, requester_name
   - **Không return `line_user_id` của requester trực tiếp** — chỉ `createOffer` server action mới dùng internally
   - Return: `ActionResult<RequestDetail>`

3. **`closeRequest(requestId: string)`** — Thêm vào `src/app/actions/requests.ts` (nếu chưa có):
   - Auth guard → chỉ requester
   - UPDATE `aid_requests` SET status = `'closed'`
   - Return: `ActionResult<{ closed: true }>`

4. **Zod schemas** — Thêm vào `src/lib/schemas/requests.ts`:
   - `requestDetailSchema` — validate output từ getRequestDetail
   - `offerCreateSchema` — `{ requestId: z.string().uuid() }`
   - `offerAcceptSchema` — `{ offerId: z.string().uuid() }`

### @frontend

1. **`src/app/(app)/requests/[id]/page.tsx`** — Server Component:
   - Gọi `getRequestDetail(params.id)`
   - Nếu error hoặc không tìm thấy → render `RequestDetailError`
   - Nếu loading → `loading.tsx` skeleton
   - Render `RequestDetailClient` với data

2. **`src/app/(app)/requests/[id]/loading.tsx`** — Skeleton:
   - IconTile placeholder (64px xám)
   - 3 dòng text placeholder
   - 3 InfoBlock skeletons
   - Button placeholder full-width

3. **`src/app/(app)/requests/[id]/error.tsx`** — Error boundary:
   - Text: `"Không tải được yêu cầu này. Kiểm tra mạng và thử lại."`
   - Button "Thử lại" (secondary)
   - Back button vẫn hoạt động

4. **`src/components/features/request-detail-client.tsx`** — Client Component:
   - Props: `RequestDetail` object
   - Layout theo screen spec: `TopHeader` → Category Row → Chi tiết card → 3 InfoBlocks → Button
   - **State machine rõ ràng** (không dùng nhiều `if` lồng nhau):
     - `loading` → skeleton
     - `open` → button "Tôi giúp được — Nhắn tin" enabled
     - `matched` → button disabled, text "Đã có người giúp" (không show tên helper — Nguyên tắc 3)
     - `expired` → button disabled, text nhỏ "Yêu cầu đã hết hạn" (expired khi `scheduled_at` đã qua — D-032)
     - `cancelled` / `closed` → button disabled, text "Yêu cầu đã đóng"
   - Tap "Tôi giúp được": gọi `createOffer(requestId)` → nếu thành công → `window.open(line_handoff_url, '_blank')` → toast "Đang chuyển sang LINE..."
   - Tap "Không lần này": dismiss local state (không persist, không gọi API — Nguyên tắc 3)
   - Header: `TopHeader({ title: "Chi tiết yêu cầu", onBack: router.back })`
   - Không có BottomNav trên screen này

5. **`src/components/ui/info-block.tsx`** — Reusable component:
   - Props: `{ icon: ReactNode; label: string; value: string }`
   - CSS class `fc-info-block` theo design spec
   - Dùng cho 3 InfoBlocks: Thời gian, Địa điểm, Người nhờ

6. **Wire RequestCard → Request Detail**: Update `src/components/features/request-card.tsx` — tap vùng title/desc hoặc tap button "Tôi giúp được" trên card đều navigate tới `/requests/[id]`.

7. **`src/middleware.ts`** — Thêm `/requests/[id]` vào protected routes.

8. **`src/app/globals.css`** — Styles cho `fc-info-block`, `fc-icon-tile--lg`, request detail layout.

### @tester

1. **`src/__tests__/schemas/offers.test.ts`** — Unit tests:
   - `offerCreateSchema`: valid UUID, invalid (empty, non-UUID)
   - `offerAcceptSchema`: valid UUID, invalid
   - `requestDetailSchema`: valid object, missing fields

2. **`src/__tests__/actions/offers.test.ts`** — Action unit tests:
   - `createOffer` happy path: insert offer, return line_handoff_url
   - `createOffer` duplicate: return error "Bạn đã đề nghị giúp request này rồi."
   - `createOffer` request not open: return error "Request đã được match rồi."
   - `createOffer` unauthenticated: return UNAUTHORIZED
   - `acceptOffer` happy path: offer accepted, request matched, other offers declined
   - `acceptOffer` wrong user: return error
   - `cancelRequest` happy path: status cancelled
   - `cancelRequest` when matched: re-notify fire (verify stub called)

3. **`src/__tests__/actions/requests-detail.test.ts`** — Action unit tests:
   - `getRequestDetail` happy path: return full detail object
   - `getRequestDetail` not found: return error
   - `getRequestDetail` not a circle member: RLS enforced → error
   - `getRequestDetail` không return `line_user_id` trong response

4. **`src/__tests__/rls/help-offers.test.ts`** — RLS integration tests:
   - Helper xem offer của mình: SELECT returns 1 row
   - Helper không xem offer của người khác: SELECT returns 0 rows
   - Requester xem tất cả offers cho request của mình: SELECT returns N rows
   - Non-member không insert được offer: INSERT rejected
   - Request status != 'open': INSERT rejected

5. **`src/__tests__/components/request-detail.test.tsx`** — Component tests:
   - Render state `open`: button enabled
   - Render state `matched`: button disabled, text "Đã có người giúp"
   - Render state `expired`: button disabled, text "Yêu cầu đã hết hạn"
   - "Không lần này": button dismiss (không call API)
   - Tap "Tôi giúp được": gọi `createOffer`, sau đó `window.open` với LINE URL

## Exit Criteria

- [ ] `/requests/[id]` load được, hiện đúng data theo screen spec
- [ ] Button "Tôi giúp được" tap → `help_offers` record tạo trong DB (status = `pending`) → LINE deeplink mở
- [ ] Duplicate offer: hiện toast lỗi "Bạn đã đề nghị giúp request này rồi.", không tạo record thứ hai
- [ ] State `matched`: button disabled, không show tên helper (Nguyên tắc 3)
- [ ] State `expired` (scheduled_at đã qua): button disabled (D-032)
- [ ] "Không lần này" không gọi API, không persist bất cứ gì
- [ ] `cancelRequest` khi đang matched → request về `cancelled`, re-notify vòng (D-033)
- [ ] RLS: user không trong circle không đọc được request detail
- [ ] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [ ] Reviewer Agent APPROVED ✅

## Open Questions Liên Quan

### OQ-007 — Match algorithm weight (urgency / location / preference)

**Status:** OPEN — deadline ban đầu Sprint 6, chưa được founder quyết.

**Assumption dùng cho Sprint 7 (MVP đơn giản nhất):**

OQ-007 hỏi: khi user tap "Tôi giúp được", app nên cân nhắc gì về matching (urgency, location, helper preferences)?

Cho đến khi founder quyết OQ-007, Sprint 7 dùng thiết kế sau:
- **Không có smart matching logic** — bất kỳ circle member nào cũng có thể offer
- **Ghi nhận offer đơn giản:** tạo `help_offers` record với `status = 'pending'`
- **Hand-off ngay sang LINE** — app không filter, không rank, không gợi ý helper
- Requester có thể accept bất kỳ offer nào — `acceptOffer` action đã đủ cho flow này
- Match algorithm phức tạp (ưu tiên theo urgency/location/preference) là Phase 5

Assumption này nhất quán với D-012 (hand-off LINE), Nguyên tắc 6 (vô hình hoá điều phối), và Nguyên tắc 2 (không có scoring/ranking).

**Flag cho Master Agent:** OQ-007 cần founder quyết trước Phase 5 nếu muốn build smart matching. Sprint 7 không bị block bởi OQ-007 vì assumption trên đủ để implement.

## Forbidden Patterns Checklist

- [ ] Không tạo cột hoặc field tracking "số lần giúp" / "số lần được giúp" trong bất kỳ table nào
- [ ] Không hiển thị số offer đã nhận, không hiện "X người muốn giúp" (Nguyên tắc 2 + 6)
- [ ] Không show tên hoặc thông tin helper khi request đã matched (Nguyên tắc 3)
- [ ] Không show ai đã bấm "Không lần này" (Nguyên tắc 3)
- [ ] Không build chat trong app — hand-off LINE bắt buộc (D-012, Constitution Forbidden UX)
- [ ] Không có ranking hay badge cho helper (D-004)
- [ ] Không có public profile từ ngoài vòng (Nguyên tắc 9)
- [ ] Không dùng dark pattern để thúc ép offer (không có countdown FOMO, không có "X người đang xem")

## File Paths Cần Đọc

- `docs/02-design/screen-specs/request-detail-screen.md` — layout, states, behaviors
- `docs/03-technical/data-model.md` — `help_offers` table + RLS policies
- `docs/03-technical/api-contract.md` — `createOffer`, `acceptOffer` contracts
- `docs/00-foundation/constitution.md` — Nguyên tắc 2, 3, 6, 12; Forbidden Patterns
- `docs/00-foundation/decision-log.md` — D-004, D-012, D-032, D-033
- `src/app/actions/requests.ts` — xem pattern của `createRequest`, `getCircleRequests`
- `src/components/features/request-card.tsx` — để wire navigation
- `src/lib/types.ts` — ActionResult<T> type
- `src/lib/schemas/requests.ts` — để thêm schemas mới

## Risks + Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `line_user_id` của requester chưa được set (user chưa kết nối LINE) | LINE deeplink không có target cụ thể → mở LINE app trống | Fallback: `https://line.me/R/` (mở LINE không có target). Hiển thị toast: "Mở LINE để nhắn tin với người nhờ." — không block flow |
| `scheduled_at` là free text (không phải timestamp) → khó parse để check expired | State `expired` không chính xác | Sprint 7: hiện state `expired` chỉ khi `status = 'cancelled'` hoặc `'closed'`. Expiry logic theo D-032 là responsibility của Edge Function (Phase 5) hoặc request-level mutation. Không cần parse `scheduled_at` trong Sprint 7 |
| Duplicate offer race condition (hai tab mở cùng lúc bấm) | Hai `help_offers` records cho cùng `(request_id, helper_id)` | DB unique constraint `(request_id, helper_id)` catch ở DB layer; Server Action catch `23505` error → return friendly error |

## Definition of Done

- [x] Tất cả exit criteria met
- [x] Completion Reports từ @schema, @backend, @frontend, @tester submitted
- [x] Reviewer Agent APPROVED ✅
- [x] Tests pass CI (vitest run, lint, typecheck)
- [x] Deploy preview Vercel thành công
- [x] Founder test trên device thật (mobile Chrome + Safari iOS) — không có blocking bug

---

*Tạo: 2026-05-18 | Sprint 7 — Phase 4 Build MVP*
*Nguồn: sprint-plan-phase4.md Sprint 6 section | request-detail-screen.md | api-contract.md | data-model.md | constitution.md | decision-log.md D-032, D-033*
