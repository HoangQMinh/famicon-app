---
title: Screen Spec — Notification (Thông báo)
phase: Phase 3
last_updated: 2026-05-16
decision_refs: D-011 (Web Push + LINE fallback), D-012 (hand-off chat sang LINE)
---

# Screen Spec — Notification Screen

## Tổng quan

Màn hình danh sách thông báo in-app. Notification là passive — không có badge count, không push khi mở app (Constitution: Nguyên tắc 3 — yên tĩnh).

**Entry point:** Bell icon trên TopHeader của Circle Home.

**Notification stack:** Web Push API (primary) → LINE Messaging API (fallback nếu Web Push fail — D-011).

---

## Loại thông báo

| Type | Trigger | Priority |
|---|---|---|
| `new_request` | Thành viên đăng request mới trong vòng | Normal |
| `urgent_request` | Request có mark "Gấp" | High |
| `helper_confirmed` | Người khác confirm giúp request của bạn | Normal |
| `invite_reminder` | Link mời sắp expire ngày thứ 5 (D-024) | Low |
| `new_member` | Thành viên mới join vòng | Low |

**Không notify:**
- Mỗi lần tin nhắn LINE (hand-off sang LINE — D-012)
- Hoạt động của vòng khi không liên quan đến user
- "Vòng chưa có activity 7 ngày" — OQ-012 OPEN, chưa quyết

---

## Layout

```
┌─────────────────────────────┐
│  ←   Thông báo             │  ← TopHeader, back về Home
│                             │
│  [Đọc tất cả]               │  ← text button, top-right, fg-tertiary
│                             │
│  ─── Hôm nay ──────────── │  ← section header, fg-tertiary, 12px
│                             │
│  ┌─────────────────────────┐│
│  │ 🆘  Yêu cầu mới gấp    ││  ← fc-card, unread = bg-primary-50
│  │ Chị Mai nhờ đón bé chiều││
│  │ nay 16:30 tại trường    ││
│  │              14 phút trước│
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ ✅  Bạn được giúp rồi!  ││  ← fc-card, read = bg-surface-card
│  │ Anh Tuấn sẽ đón bé cho  ││
│  │ bạn hôm nay             ││
│  │              1 giờ trước │
│  └─────────────────────────┘│
│                             │
│  ─── Hôm qua ─────────── │  ← section header
│                             │
│  ┌─────────────────────────┐│
│  │ 👤  Thành viên mới      ││
│  │ Chị Hoa vừa vào vòng   ││
│  │              Hôm qua    │
│  └─────────────────────────┘│
│                             │
│  ─── 7 ngày trước ───────  │
│  ...                        │
└─────────────────────────────┘
```

---

## Notification Card

### Layout chi tiết

```
┌─────────────────────────────────┐
│ [icon]  [title — bold]          │
│         [body text — 2 lines]   │
│                   [timestamp]   │
└─────────────────────────────────┘
```

### Unread vs Read

| State | Style |
|---|---|
| Unread | Background `--color-primary-50` (#FFF4EF), left border 3px coral |
| Read | Background `--color-surface-card` (#FFFFFF), no border |

### Icons theo type

| Type | Icon |
|---|---|
| `urgent_request` | 🆘 hoặc `IconAlertTriangle` coral |
| `new_request` | 📋 hoặc `IconClipboard` |
| `helper_confirmed` | ✅ hoặc `IconCheck` green |
| `invite_reminder` | ⏰ hoặc `IconClock` |
| `new_member` | 👤 hoặc `IconUser` |

### Tap behavior

| Type | Tap action |
|---|---|
| `new_request` | Mở Request Detail screen |
| `urgent_request` | Mở Request Detail screen |
| `helper_confirmed` | Mở Request Detail screen của request đó |
| `invite_reminder` | Mở Invite Member screen |
| `new_member` | Mở Members screen |

---

## Empty state

```
┌─────────────────────────────┐
│                             │
│         🔔                  │  ← center, 48px
│                             │
│  Chưa có thông báo nào      │  ← heading-3, center
│                             │
│  Khi có yêu cầu mới trong   │  ← fg-secondary, 14px, center
│  vòng bạn sẽ thấy ở đây.   │
│                             │
└─────────────────────────────┘
```

---

## Grouping & timestamp

- Group theo ngày: Hôm nay / Hôm qua / [Tên ngày trong tuần] / [ngày/tháng]
- Timestamp: `X phút trước` / `X giờ trước` / `Hôm qua` / `ngày/tháng`
- Giữ tối đa 30 ngày notifications, tự clean up sau đó

---

## "Đọc tất cả" action

- Tap → mark tất cả notifications trong list là read
- Không có animation rầm rộ — cards đổi background từ primary-50 → white quietly
- Badge trên bell icon (nếu có) reset về 0

---

## Badge trên Bell icon

- Hiện dot nhỏ (không có số) khi có ≥1 unread notification
- Không hiện số đếm (Constitution: tránh gamification / số liệu gây so sánh)
- Dot màu coral (`--color-primary-500`), kích thước 8px

---

## Push notification (Web Push API — D-011)

Template push notification:

| Type | Title | Body |
|---|---|---|
| `urgent_request` | `Yêu cầu gấp trong vòng` | `[Tên người] nhờ [loại aid] — [thời gian]` |
| `new_request` | `Yêu cầu mới trong vòng` | `[Tên người] cần [loại aid]` |
| `helper_confirmed` | `Có người giúp bạn rồi!` | `[Tên người] sẽ [loại aid] cho bạn` |
| `invite_reminder` | `Link mời sắp hết hạn` | `Link mời vào vòng [tên] sẽ hết hạn trong 2 ngày` |
| `new_member` | `Thành viên mới` | `[Tên người] vừa vào vòng của bạn` |

**LINE fallback (D-011):** Khi Web Push fail (thường iOS PWA), gửi LINE message cùng nội dung qua LINE Messaging API.

---

## Design tokens áp dụng

| Element | Token |
|---|---|
| Background | `--color-surface-base` |
| Unread card | `--color-primary-50` + left border `--color-primary-500` |
| Read card | `--color-surface-card` |
| Section header | `--color-text-tertiary`, 12px, uppercase |
| Timestamp | `--color-text-tertiary`, 12px |
| "Đọc tất cả" | `--color-text-link` |
| Urgent icon | `--color-primary-500` |

---

## Accessibility

- Unread cards: `aria-label="[title], chưa đọc, [timestamp]"`
- "Đọc tất cả" button: `aria-label="Đánh dấu tất cả thông báo là đã đọc"`
- Bell icon với unread: `aria-label="Thông báo, có tin mới"` khi có dot
- List: `role="list"`, mỗi card: `role="listitem"`
