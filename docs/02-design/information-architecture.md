---
title: Information Architecture — Vòng Tròn Tương Trợ
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Information Architecture — Vòng Tròn Tương Trợ

> Cây màn hình, navigation structure, và URL scheme cho toàn bộ app.
> App là PWA, tiếng Việt duy nhất (D-007, D-008).

Xem thêm: [use-cases.md](../01-product/use-cases.md) | [user-flows.md](../01-product/user-flows.md) | [decision-log.md](../00-foundation/decision-log.md) | [constitution.md](../00-foundation/constitution.md)

---

## Lưu ý thiết kế quan trọng

**D-022 — Discovery tab slot:** Navigation phải có slot cho Discovery tab ngay từ Phase 3. Sprint 0-10 tab này ẩn hoặc hiện "Sắp có". Sprint 11 bật lên. Mục đích: tránh redesign navigation sau khi Discovery được build.

**Nguyên tắc 9 — Vòng kín:** Không có màn hình public. Mọi content đều yêu cầu auth + là thành viên của vòng liên quan.

**Nguyên tắc 5 — Nhanh khi cần:** Đăng aid request phải đến được trong ≤2 tap từ bất kỳ màn hình nào. CTA chính luôn visible.

---

## Sitemap — Cây màn hình đầy đủ

```
App Root
│
├── Auth (chưa đăng nhập)
│   ├── /welcome                    — Màn hình chào + giải thích ngắn
│   ├── /auth/login                 — Đăng nhập (phone OTP hoặc email — xem OQ-003)
│   ├── /auth/verify                — Nhập OTP
│   └── /auth/new-user              — Redirect sau login lần đầu
│
├── Onboarding (đăng nhập lần đầu)
│   ├── /onboarding/profile         — Điền tên + thông tin cơ bản
│   ├── /onboarding/children        — Thêm thông tin con
│   └── /onboarding/done            — Hướng dẫn bước tiếp theo (join/create vòng)
│
├── App Shell (đã đăng nhập — có Bottom Nav)
│   │
│   ├── Home Tab
│   │   └── /home                   — Feed aid requests của vòng đang active
│   │
│   ├── Vòng của tôi Tab
│   │   ├── /circles                — Danh sách các vòng đang tham gia
│   │   ├── /circles/[id]           — Circle Home — feed + members
│   │   ├── /circles/[id]/members   — Danh sách thành viên
│   │   ├── /circles/[id]/invite    — Mời thành viên mới
│   │   ├── /circles/new            — Tạo vòng mới
│   │   └── /circles/join/[token]   — Accept invitation
│   │
│   ├── Đăng nhờ (CTA trung tâm — không phải tab thường)
│   │   └── /requests/new           — Form đăng aid request
│   │
│   ├── Thông báo Tab
│   │   ├── /notifications          — Danh sách notifications
│   │   └── /notifications/settings — Cài đặt thông báo
│   │
│   ├── Hồ sơ Tab
│   │   ├── /profile                — Xem/sửa hồ sơ cá nhân
│   │   ├── /profile/children       — Quản lý thông tin con
│   │   └── /settings               — Cài đặt tài khoản
│   │
│   └── Discovery Tab (ẩn Sprint 0-10, bật Sprint 11)
│       ├── /discovery              — Discovery home (opt-in gate)
│       ├── /discovery/settings     — Bật/tắt, chọn khu vực, tuổi con
│       ├── /discovery/browse       — Danh sách gia đình gần đây đang visible
│       ├── /discovery/connections  — Lời chào đã gửi / nhận
│       └── /discovery/sent         — Lời chào đã gửi, đang chờ
│
├── Aid Request (truy cập từ Home hoặc Circle)
│   ├── /requests/[id]              — Chi tiết 1 aid request
│   └── /requests/[id]/respond      — Phản hồi / giúp
│
└── Error / Utility
    ├── /404                        — Không tìm thấy
    ├── /offline                    — Offline fallback (PWA)
    └── /legal                      — Disclaimer pháp lý
```

---

## Bottom Navigation

Bottom nav có **5 vị trí**. Vị trí thứ 3 là CTA "Đăng nhờ" — nổi bật hơn 4 tab còn lại.

```
[ Home ]  [ Vòng của tôi ]  [ + Đăng nhờ ]  [ Thông báo ]  [ Hồ sơ ]
                                  ^
                          CTA button — lớn hơn, màu primary
```

**Discovery slot:** Vị trí thứ 6 ẩn (Sprint 0-10). Khi bật Sprint 11, "Hồ sơ" dịch sang vị trí 5, Discovery vào vị trí giữa (tái cấu trúc nhẹ theo D-022):

```
[ Home ]  [ Vòng của tôi ]  [ + Đăng nhờ ]  [ Discovery ]  [ Hồ sơ ]
```

**Thông báo** khi Discovery bật: badge vẫn show ở icon "Hồ sơ" cho notification settings. Notification tab có thể merge vào Hồ sơ khi Discovery vào.

> Lưu ý: Thứ tự tab cuối cùng sẽ được xác nhận sau khi wireframe test Phase 3 (exit criteria: ≥4/5 user hoàn thành tasks <30s).

---

## Nhóm Màn Hình Theo Chức Năng

### Nhóm Auth

| Màn hình | URL | Mô tả |
|---|---|---|
| Welcome | `/welcome` | Giới thiệu app 1 trang, CTA "Bắt đầu" |
| Đăng nhập | `/auth/login` | Form phone/email (xem OQ-003, OQ-004) |
| Xác thực OTP | `/auth/verify` | Nhập mã OTP 6 số |
| New user redirect | `/auth/new-user` | Logic: có vòng → Home, chưa có → Onboarding |

### Nhóm Onboarding

| Màn hình | URL | Mô tả |
|---|---|---|
| Profile setup | `/onboarding/profile` | Tên hiển thị, avatar (xem OQ-008), khu vực |
| Thêm con | `/onboarding/children` | Tên + năm sinh từng bé (optional) |
| Done | `/onboarding/done` | Hướng dẫn tiếp theo: join hoặc tạo vòng |

### Nhóm Home

| Màn hình | URL | Mô tả |
|---|---|---|
| Home | `/home` | Feed aid requests của tất cả vòng đang active, sorted theo urgency + time |

### Nhóm Aid Request

| Màn hình | URL | Mô tả |
|---|---|---|
| Đăng nhờ | `/requests/new` | Form <30s — core UX (Nguyên tắc 5) |
| Chi tiết request | `/requests/[id]` | Xem đầy đủ request + responses |
| Phản hồi | `/requests/[id]/respond` | Helper confirm giúp + thêm điều kiện |

### Nhóm Vòng (Circle)

| Màn hình | URL | Mô tả |
|---|---|---|
| Danh sách vòng | `/circles` | Các vòng đang tham gia, có indicator activity |
| Circle Home | `/circles/[id]` | Feed + CTA + member count |
| Thành viên | `/circles/[id]/members` | Danh sách thành viên (không show "giúp bao nhiêu lần") |
| Mời thành viên | `/circles/[id]/invite` | Tạo invite link + safety valve (xem OQ-001, OQ-006) |
| Tạo vòng mới | `/circles/new` | Form tạo vòng, đặt tiêu chí |
| Accept invitation | `/circles/join/[token]` | Landing page khi click invite link |

### Nhóm Thông Báo

| Màn hình | URL | Mô tả |
|---|---|---|
| Danh sách thông báo | `/notifications` | Tất cả notification, có badge count |
| Cài đặt thông báo | `/notifications/settings` | Quiet hours, loại notification (Nguyên tắc 4) |

### Nhóm Hồ Sơ

| Màn hình | URL | Mô tả |
|---|---|---|
| Hồ sơ cá nhân | `/profile` | Xem + sửa thông tin cá nhân |
| Quản lý con | `/profile/children` | Thêm/sửa thông tin con |
| Cài đặt | `/settings` | Tài khoản, logout, delete account (xem OQ-009) |

### Nhóm Discovery (ẩn Sprint 0-10)

| Màn hình | URL | Mô tả |
|---|---|---|
| Discovery home | `/discovery` | Nếu chưa opt-in: giải thích + CTA bật. Nếu đã opt-in: redirect Browse |
| Discovery settings | `/discovery/settings` | Bật/tắt visibility, chọn khu vực (xem OQ-013), tuổi con mong muốn |
| Browse gia đình | `/discovery/browse` | Danh sách gia đình đang visible, filter theo khu vực + tuổi |
| Lời chào đã gửi | `/discovery/sent` | Danh sách lời chào đã gửi + trạng thái |
| Lời chào nhận được | `/discovery/connections` | Lời chào nhận, có thể accept/decline (silent decline — Nguyên tắc 3) |

---

## States Cho Mỗi Màn Hình

Mỗi màn hình phải handle đủ 4 states:

| State | Mô tả | Ví dụ ứng xử |
|---|---|---|
| **Loading** | Đang fetch data | Skeleton loader, không spinner đơn độc |
| **Empty** | Không có data | Empty state thân thiện, có CTA gợi ý hành động |
| **Populated** | Có data bình thường | Main content |
| **Error** | Fetch thất bại / network error | Friendly error + retry button |

**Empty states phải invitation-style** (theo microcopy guideline Phase 3) — không được để trống trắng.

Ví dụ:
- Home empty: *"Vòng của bạn đang yên tĩnh. Cần nhờ gì không? Bấm + để đăng."*
- Notifications empty: *"Chưa có thông báo mới. Khi ai đó cần giúp hoặc có người reply, bạn sẽ thấy ở đây."*
- Discovery browse empty: *"Chưa có gia đình nào đang visible trong khu vực này. Thử mở rộng khu vực tìm kiếm?"*

---

## URL Structure — Next.js App Router

```
app/
├── (public)/
│   ├── welcome/
│   │   └── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── verify/page.tsx
│   │   └── new-user/page.tsx
│   └── circles/
│       └── join/
│           └── [token]/page.tsx    ← Invite link landing (public, không cần auth)
│
├── (onboarding)/
│   └── onboarding/
│       ├── profile/page.tsx
│       ├── children/page.tsx
│       └── done/page.tsx
│
├── (app)/                          ← Protected — redirect về /welcome nếu chưa auth
│   ├── layout.tsx                  ← App shell với Bottom Nav
│   ├── home/page.tsx
│   ├── circles/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── members/page.tsx
│   │       └── invite/page.tsx
│   ├── requests/
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── respond/page.tsx
│   ├── notifications/
│   │   ├── page.tsx
│   │   └── settings/page.tsx
│   ├── profile/
│   │   ├── page.tsx
│   │   └── children/page.tsx
│   ├── settings/page.tsx
│   └── discovery/                  ← Feature flag: hidden Sprint 0-10
│       ├── page.tsx
│       ├── settings/page.tsx
│       ├── browse/page.tsx
│       ├── sent/page.tsx
│       └── connections/page.tsx
│
├── legal/page.tsx
├── 404.tsx
└── offline/page.tsx               ← PWA offline fallback
```

**Feature flag discovery:** Trong Sprint 0-10, `/discovery/*` routes đều redirect về `/home` với một banner "Sắp có". Flag được control bởi env variable `NEXT_PUBLIC_DISCOVERY_ENABLED=false`.

---

## Navigation Flows Chính

### Flow 1 — Post Aid Request (Nguyên tắc 5: <30 giây)

```
Home / bất kỳ màn hình nào
  → tap "+" CTA ở Bottom Nav
  → /requests/new (form tap-to-select)
  → submit
  → Success toast "Đã đăng nhờ. Mình sẽ thông báo cho vòng."
  → redirect về Home
```

Số taps: 2 taps từ Home để đến form, thêm 3-5 taps để fill form.

### Flow 2 — Helper respond to request

```
Nhận notification
  → tap notification
  → /requests/[id] (chi tiết)
  → tap "Tôi giúp được"
  → /requests/[id]/respond (thêm điều kiện nếu cần)
  → submit
  → Success toast "Bạn đã nhận giúp. Asker sẽ nhận thông báo."
```

### Flow 3 — Join vòng qua invite link

```
Nhận invite link (qua LINE / Messenger)
  → click link → /circles/join/[token]
  → Nếu chưa auth: redirect /auth/login → verify → trở lại /circles/join/[token]
  → Màn hình accept: hiện thông tin vòng + tiêu chí
  → tap "Tham gia"
  → Onboarding profile (nếu lần đầu)
  → Redirect vào /circles/[id] (vòng vừa join)
```

---

## Cross-references

- Xem [use-cases.md](../01-product/use-cases.md) cho UC-001 đến UC-012 — context của từng màn hình
- Xem [user-flows.md](../01-product/user-flows.md) — 3 journeys chính với friction points
- Screen specs chi tiết từng màn hình: xem `docs/02-design/screen-specs/`
- D-022 (Navigation discovery slot): [decision-log.md](../00-foundation/decision-log.md)
- OQ-001, OQ-002, OQ-006 (Invite flow): [open-questions.md](../00-foundation/open-questions.md)
- OQ-003, OQ-004 (Auth): [open-questions.md](../00-foundation/open-questions.md)
- OQ-013 (Discovery granularity): [open-questions.md](../00-foundation/open-questions.md)

---

*Nguồn: mvp-roadmap-v1.md Mục 10 | decision-log.md D-007, D-008, D-022 | constitution.md Nguyên tắc 4, 5, 9*
*Tạo: 2026-05-16 | Phase 3*
