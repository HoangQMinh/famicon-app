---
title: Screen Spec — Discovery (Tìm gia đình gần) — DRAFT
phase: Phase 3 (Sprint 11-12 implementation)
last_updated: 2026-05-16
status: DRAFT — chưa implement, chỉ dùng để giữ slot navigation
decision_refs: D-019 (discovery vào MVP Sprint 11-12), D-020 (opt-in, bán kính km, gửi lời chào → LINE), D-021 (sau Sprint 10), D-022 (giữ slot nav từ Phase 3), D-031 (5km default, user chọn 3/5/10km)
open_questions: OQ-007, OQ-014, OQ-016
---

# Screen Spec — Discovery (DRAFT)

> ⚠️ **DRAFT — Chưa implement đến Sprint 11.**
> Navigation slot đã được giữ từ Phase 3 (D-022). Tab Discovery ẩn / "Sắp ra mắt" trong Sprint 0-10.
> Spec này là bản sketch để đảm bảo navigation và data model không cần redesign khi Sprint 11 đến.

---

## Tổng quan

Discovery cho phép gia đình **opt-in** để các gia đình gần có thể tìm thấy mình. Mục tiêu: kết nối các gia đình Việt gần nhau chưa có vòng chung. Không phải mạng xã hội, không phải feed, không phải matching app.

**Scope tối thiểu (D-020):**
- Opt-in hiển thị trong Discovery
- Lọc theo bán kính km (D-031: 3km / 5km / 10km, default 5km)
- Xem profile đơn giản (tên, khu vực, tuổi con)
- Gửi lời chào → hand-off sang LINE (không in-app chat — D-012)

**Không build:**
- Feed browsing (scroll vô hạn)
- Matching algorithm phức tạp
- In-app messaging
- Rating / review gia đình

---

## Navigation slot (Sprint 0-10)

Trong Sprint 0-10, BottomNav có 4 tab:

```
[Vòng của tôi] [Nhờ giúp] [Tìm gia đình] [Hồ sơ]
                                ↑
                         "Sắp ra mắt" state
```

Tap vào tab Discovery trong Sprint 0-10 → hiển thị Coming Soon screen.

### Coming Soon screen

```
┌─────────────────────────────┐
│  Tìm gia đình               │  ← TopHeader (không có back)
│                             │
│          🔍                 │  ← center icon, 48px
│                             │
│  Sắp ra mắt                 │  ← heading-2, center
│                             │
│  Tính năng tìm gia đình     │  ← fg-secondary, 14px, center
│  gần bạn đang được phát    │
│  triển. Sẽ có mặt sớm thôi!│
│                             │
│  [  Về vòng của tôi  ]     │  ← secondary button
└─────────────────────────────┘
```

---

## Màn hình 1 — Discovery Home (Sprint 11+)

### Layout

```
┌─────────────────────────────┐
│  Tìm gia đình               │  ← TopHeader
│                        ⚙️  │  ← settings icon (Discovery settings)
│                             │
│  ┌─────────────────────────┐│
│  │ 👁  Gia đình có thể tìm  ││  ← opt-in card
│  │     thấy bạn: BẬT       ││  ← toggle state
│  └─────────────────────────┘│
│                             │
│  Bán kính tìm kiếm:         │  ← label
│  [3km] [5km✓] [10km]       │  ← pill selector (D-031)
│                             │
│  ─── 12 gia đình gần bạn ── │  ← count, fg-secondary
│                             │
│  ┌─────────────────────────┐│
│  │ 👨‍👩‍👧  Gia đình Nguyễn      ││  ← fc-card
│  │ Yokohama · ~2.3km       ││
│  │ Bé 4 tuổi, bé 7 tuổi   ││
│  │             [Gửi lời chào]│
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ 👩‍👧  Gia đình Trần         ││
│  │ Yokohama · ~3.8km       ││
│  │ Bé 2 tuổi               ││
│  │             [Gửi lời chào]│
│  └─────────────────────────┘│
│                             │
│  [Xem thêm]                 │  ← load more
└─────────────────────────────┘
```

### Behavior

| Action | Kết quả |
|---|---|
| Toggle opt-in | Bật/tắt hiển thị của bản thân trong Discovery. Confirm dialog khi tắt: "Tắt sẽ ẩn bạn khỏi kết quả tìm kiếm của người khác." |
| Chọn bán kính | Filter list ngay lập tức, không cần confirm |
| "Gửi lời chào" | Mở màn hình Compose Greeting (OQ-014 OPEN — chưa quyết format) |
| Card tap | Mở Family Detail screen |

---

## Màn hình 2 — Family Detail (Sprint 11+)

Xem profile đơn giản của gia đình, trước khi gửi lời chào.

```
┌─────────────────────────────┐
│  ←                          │  ← back về Discovery Home
│                             │
│  👨‍👩‍👧‍👦                           │  ← avatar emoji, lg, center
│  Gia đình Nguyễn            │  ← name, heading-2, center
│  Yokohama · ~2.3km          │  ← fg-secondary, center
│                             │
│  Con nhỏ                    │  ← section label
│  Bé 4 tuổi, bé 7 tuổi      │  ← value
│                             │
│  Có thể giúp                │  ← section label (nếu có)
│  [Đón con] [Trông con]      │  ← chips
│                             │
│  ─────────────────────────  │
│                             │
│  [  Gửi lời chào  ]        │  ← primary button, block
│                             │
│  🔒 Gửi lời chào sẽ kết nối  │  ← info note, fg-secondary, 13px
│  bạn qua LINE               │
└─────────────────────────────┘
```

**Thông tin hiển thị (Privacy-first):**
- Tên gia đình (không tên đầy đủ)
- Khu vực (quận/TP, không địa chỉ cụ thể)
- Khoảng cách (~X km, không tọa độ)
- Tuổi con (nhóm tuổi, không ngày sinh)
- Tags "Có thể giúp" (optional, từ profile)

---

## Màn hình 3 — Compose Greeting (OQ-014 OPEN)

> ⚠️ Chưa quyết format: message tùy chọn hay 1-click thuần (OQ-014, deadline Sprint 11).

**Placeholder design — 1-click:**

```
Gửi lời chào đến Gia đình Nguyễn?

Tin nhắn mẫu:
"Xin chào! Mình là [tên bạn], gia đình Việt
ở Yokohama. Muốn kết bạn với gia đình có
con nhỏ gần nhà. LINE: [user_line_id]"

[  Gửi qua LINE  ]
[  Hủy  ]
```

Hand-off: mở LINE app với pre-filled message, hoặc LINE deeplink nếu user đã share LINE ID.

---

## Discovery Settings (Sprint 11+)

Access qua ⚙️ icon trên TopHeader.

```
┌─────────────────────────────┐
│  ←   Cài đặt Discovery      │
│                             │
│  Hiển thị của bạn           │  ← section
│  ┌─────────────────────────┐│
│  │ Hiển thị trong Discovery│ Toggle BẬT/TẮT
│  └─────────────────────────┘│
│                             │
│  Bán kính tìm kiếm          │  ← section
│  [3km] [5km✓] [10km]       │  ← D-031
│                             │
│  Thông tin hiển thị         │  ← section (OQ-016 OPEN)
│  ┌─────────────────────────┐│
│  │ Tên gia đình           ✓││
│  │ Khu vực (quận/TP)      ✓││
│  │ Tuổi con               ✓││
│  │ Tags có thể giúp        ○│  ← optional
│  └─────────────────────────┘│
└─────────────────────────────┘
```

**OQ-016 OPEN:** Chưa quyết có cho user xem "bạn đang visible cho bao nhiêu người" hay không. Giữ placeholder, quyết Sprint 11.

---

## Data model cần thêm (Sprint 3 — D-023)

Table `user_discovery_settings` cần được tạo ngay từ Sprint 3 (cùng profile sprint) để tránh migration riêng:

```sql
user_discovery_settings (
  user_id        uuid references users(id),
  is_visible     boolean default false,  -- opt-in, default OFF
  radius_km      int default 5,          -- 3, 5, 10
  updated_at     timestamptz
)
```

RLS: user chỉ đọc/sửa row của chính mình.

---

## Open Questions ảnh hưởng spec này

| OQ | Question | Deadline |
|---|---|---|
| OQ-014 | "Gửi lời chào" kèm message tùy chọn hay 1-click thuần? | Sprint 11 |
| OQ-016 | User có thể thấy mình visible cho bao nhiêu người không? | Sprint 11 |
| OQ-015 | Moderation strategy (block/report) Phase 5 | Phase 5 |

---

## Design tokens áp dụng

| Element | Token |
|---|---|
| Background | `--color-surface-base` |
| Family card | `--color-surface-card` + `--shadow-card` |
| Distance text | `--color-text-secondary` |
| Radius pill selected | `--color-primary-500` bg, white text |
| Radius pill unselected | `--color-surface-subtle` bg, fg-primary text |
| "Gửi lời chào" button | `--color-primary-500` |
| Info note (LINE) | `--color-text-secondary`, italic |
| "Sắp ra mắt" text | `--color-text-tertiary` |
