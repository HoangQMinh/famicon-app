---
title: Screen Spec — Home Screen
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Screen Spec — Home Screen

> Màn hình đầu tiên sau khi đăng nhập. Trung tâm điều phối hàng ngày của người dùng.

Xem thêm: [information-architecture.md](../information-architecture.md) | [use-cases.md](../../01-product/use-cases.md) | [user-personas-v2.md](../../01-product/user-personas-v2.md)

---

## Thông tin cơ bản

| | |
|---|---|
| **URL** | `/home` |
| **Personas chính** | Linh (bà mẹ chủ động), Tuấn (bố bận rộn), Mai (gia đình mới đến) |
| **Entry points** | Bottom Nav "Vòng của tôi" | Sau login | Sau submit request | Tap notification → back |
| **Exit points** | `/requests/new` (tap FAB hoặc Bottom Nav "Nhờ giúp") | `/requests/[id]` (tap request card hoặc "Tôi giúp được") | `/notifications` (tap bell) |
| **Constitution** | Nguyên tắc 4 (yên tĩnh), Nguyên tắc 5 (nhanh), Nguyên tắc 9 (vòng kín), Nguyên tắc 2 (không ledger) |

---

## Purpose

Home là "cuốn sổ chung của nhóm" — nơi người dùng thấy ngay có ai đang cần giúp không, và có thể đăng nhờ ngay lập tức.

Home **không phải** feed social, không hiện who helped whom bao nhiêu lần, không có engagement metrics.

---

## Layout

### Cấu trúc từ trên xuống

```
┌─────────────────────────────────────────┐
│ [iOS safe area — status bar]            │  ← SAFE_TOP 54px
├─────────────────────────────────────────┤
│  Vòng Edogawa - Kasai         [🔔]      │  ← TopHeader
│  👥 12 gia đình                         │    title = tên vòng
│                                         │    sub = icon + "N gia đình"
├─────────────────────────────────────────┤    right = Bell icon
│                                         │
│  Yêu cầu đang mở (3)                   │  ← Heading section (fc-h3)
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [Gấp]                           │    │  ← UrgentPill (nếu urgent)
│  │ [🚸] Đón con                    │    │  ← IconTile + title (fontWeight 600)
│  │       Nhờ đón con trai về...    │    │    desc truncated 80 chars
│  │                                 │    │
│  │ ⏰ Hôm nay 5:00 PM              │    │  ← Meta row 1: clock + when
│  │ 📍 Ga Edogawa                   │    │    pin + place
│  │ 👤 Lan Anh                      │    │  ← Meta row 2: user + asker
│  │                                 │    │
│  │ [ Tôi giúp được ] [Không lần này] │  ← 2 buttons (1fr auto grid)
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [📦] Mượn đồ                    │    │  ← Card 2 (không urgent)
│  │       Mượn xe đẩy em bé dùng…   │    │
│  │ ⏰ Thứ 7 sáng  📍 Khu Nishikasai│    │
│  │ 👤 Minh Tuấn                    │    │
│  │ [ Tôi giúp được ] [Không lần này] │  │
│  └─────────────────────────────────┘    │
│                                         │
│  ... (more cards, scroll) ...           │
│                                         │
│                             [  +  ]     │  ← FAB coral, bottom-right
│                                         │    position: absolute
│                                         │    right: 16px
│                                         │    bottom: tabbar + SAFE_BOTTOM + 16px
├─────────────────────────────────────────┤
│  🏠 Vòng của tôi │ ➕ Nhờ giúp │ 👤 Hồ sơ │  ← BottomNav (3 tabs)
├─────────────────────────────────────────┤
│ [iOS safe area — home indicator]        │  ← SAFE_BOTTOM 28px
└─────────────────────────────────────────┘
```

### Giải thích elements

**TopHeader (`fc-header`):**
- `title`: tên vòng đang active — ví dụ "Vòng Edogawa - Kasai" (không phải "Vòng Tròn Tương Trợ")
- `sub`: `<IconUsers size={14} /> N gia đình` — hiển thị số thành viên
- `right`: `<IconBell size={22} />` — bell icon không có badge (badge thêm khi có notification logic)
- Component: `TopHeader({ title, sub, right })`

**Heading section:**
- Text "Yêu cầu đang mở (N)" — N = số requests trong `data.requests`
- Class: `fc-h3` với style `color: var(--fg-secondary), fontWeight: 500, fontSize: 14`
- Margin: `4px 0 12px`

**Request cards feed:**
- Render bằng `RequestCard` component, mỗi card trong `fc-card` wrapper
- Spacing giữa cards: `gap: 12px` (flexbox column)
- Sort: urgent trước, sau đó theo thứ tự đăng (mới nhất lên đầu)
- **Không hiện số lần ai đó đã giúp** (Nguyên tắc 2 — không ledger)
- Tap card hoặc tap "Tôi giúp được" → `/requests/[id]`

**FAB (`fc-fab`):**
- Coral `#FF8966`, hình tròn, shadow `primary-lift`
- Icon: `<IconPlus size={26} />`
- Position: absolute, `right: 16px`, `bottom: tabbar_height + SAFE_BOTTOM + 16px`
- `aria-label="Nhờ giúp"`
- Tap → navigate `/requests/new` (giống Bottom Nav "Nhờ giúp")

**BottomNav (`fc-tabbar`):**
- 3 tabs: "Vòng của tôi" (IconHome) | "Nhờ giúp" (IconPlusCircle) | "Hồ sơ" (IconUser)
- Active tab ở Home: `active="home"`
- Component: `BottomNav({ active, onNav })`

---

## Elements

### RequestCard — Chi tiết layout

Component: `RequestCard({ req, category, onOpen, onHelp, onDecline })`

```
fc-card (padding: 16px)
├── [nếu req.urgent] UrgentPill → marginBottom: 8px
├── Row: IconTile + title/desc (onClick → onOpen)
│   ├── IconTile emoji={category.emoji} size="md"
│   └── div flex-1
│       ├── title: req.title (fontWeight 600, color fg-secondary, 13px)
│       └── desc: req.desc truncated 80 chars (color fg-primary, 15px)
├── Meta row 1+2 (flexWrap, gap: 6px 0, margin: 12px 0)
│   ├── Meta icon=<IconClock size={14} />  {req.when}
│   └── Meta icon=<IconMapPin size={14} /> {req.place}
├── Meta row asker (marginBottom: 12px)
│   └── Meta icon=<IconUser size={14} />  {req.asker}
└── Button row (grid: 1fr auto, gap: 10px)
    ├── Button variant="primary"   → "Tôi giúp được"  onClick=onHelp
    └── Button variant="secondary" → "Không lần này"  onClick=onDecline
```

| Element | CSS / Component | Ghi chú |
|---|---|---|
| Card wrapper | `fc-card`, padding 16px | background `#FFFFFF`, radius `lg` (12px), shadow `sm` |
| UrgentPill | `fc-pill fc-pill--urgent` | bg `#FFF1F2`, text `#BE123C` |
| IconTile | `fc-icon-tile` | 48x48px, emoji centered |
| Title | fontWeight 600, 13px, `var(--fg-secondary)` | Tên loại request |
| Desc | 15px, `var(--fg-primary)` | Truncate sau 80 ký tự + "…" |
| Meta clock/pin | `fc-meta` | Icon 14px + text nhỏ |
| Meta asker | `fc-meta` | IconUser 14px + tên người nhờ |
| Button primary | `fc-btn fc-btn--primary` | "Tôi giúp được" |
| Button secondary | `fc-btn fc-btn--secondary` | "Không lần này" |

**Lưu ý về "Không lần này":** Khi user tap button này, không có gì được thông báo cho người đăng (Nguyên tắc 3). Card không biến mất ngay lập tức — xử lý UX cụ thể khi build.

---

## States

### State 1 — Empty (chưa có request nào)

**Khi nào xuất hiện:** Vòng mới setup, hoặc tất cả requests đã resolved.

**Layout:**
- Header bình thường (tên vòng + bell)
- Heading "Yêu cầu đang mở (0)"
- Bên dưới: illustration nhỏ + text invitation-style:
  > "Vòng của bạn đang yên tĩnh. Có cần nhờ gì không? Bấm + để đăng, mọi người sẽ thấy ngay."
- FAB vẫn hiện (luôn visible)

**Lưu ý:** Empty state không được để trắng trơn. Phải invitation-style, không phán xét.

### State 2 — Loading

**Khi nào xuất hiện:** Khi mở app, khi pull-to-refresh.

**Layout:**
- Skeleton loader: 2-3 card placeholder (màu xám nhạt, animated shimmer)
- Header vẫn render (load từ cache nếu có)
- Không dùng spinner đơn độc ở giữa màn hình

### State 3 — Có requests bình thường

**Layout chuẩn** như mô tả ở phần Layout. Feed scroll nếu nhiều card.

**Pull-to-refresh:** Kéo xuống để refresh feed. Haptic feedback nhẹ khi trigger.

### State 4 — Có urgent request

**Layout:**
- Card urgent render đầu tiên trong feed (sort urgent trước)
- UrgentPill hiển thị nổi bật trên card
- Không có separate banner — urgent được thể hiện qua UrgentPill và sort order

### State 5 — Error (không load được)

**Khi nào xuất hiện:** Network error, timeout, auth expired.

**Layout:**
- Header vẫn hiển thị
- Icon cảnh báo nhỏ + text: "Không tải được. Kiểm tra mạng và thử lại."
- Button "Thử lại" (secondary)
- Nếu có cached data: hiển thị data cũ + banner "Đang hiển thị dữ liệu cũ"

---

## Behaviors

### Tap Request Card (vùng title/desc)

- Tap vào row IconTile + title/desc → navigate đến `/requests/[id]`
- Handler: `onClick={onOpen}` trên div chứa IconTile + text

### Tap "Tôi giúp được"

- Handler: `onClick={onHelp}` → navigate đến `/requests/[id]`
- Trong RequestDetailScreen user sẽ thấy nút "Tôi giúp được — Nhắn tin" để hand-off LINE

### Tap "Không lần này"

- Handler: `onClick={onDecline}` — không thông báo cho asker (Nguyên tắc 3)
- Card behavior sau decline: không tự động ẩn trong phase này (quyết khi build)

### Tap FAB

- Navigate đến `/requests/new`
- Giống tap Bottom Nav "Nhờ giúp"

### Tap Bottom Nav "Nhờ giúp"

- Navigate đến `/requests/new`

### Tap Bell Icon

- Navigate đến `/notifications`
- Badge xóa sau khi user mở notifications

### Scroll Feed

- Vertical scroll trong body area (header và tabbar pinned)
- Feed giới hạn: chỉ hiện request chưa resolved hoặc resolved trong 24h gần nhất
- Infinite scroll hoặc load-more: quyết khi build

### Pull-to-Refresh

- Kéo xuống → refresh data từ Supabase
- Realtime: Supabase Realtime subscriptions cập nhật feed khi có request mới

---

## Constitution References

| Nguyên tắc | Áp dụng vào Home Screen |
|---|---|
| **Nguyên tắc 2 — Không ledger** | RequestCard không hiện ai đã giúp bao nhiêu lần. Không có counter hay badge contribution trên card. |
| **Nguyên tắc 3 — Thể diện** | "Không lần này" không notify asker. App không show danh sách ai đã decline. |
| **Nguyên tắc 4 — Yên tĩnh** | Không auto-play, không animation ồn ào. App yên tĩnh khi không có gì cần chú ý. |
| **Nguyên tắc 5 — Nhanh** | FAB luôn visible. Tap 1 lần đến form. BottomNav "Nhờ giúp" cũng là shortcut. |
| **Nguyên tắc 9 — Vòng kín** | Feed chỉ hiện requests của vòng user đang tham gia. Không có "explore" hay content từ vòng khác. |

---

## Accessibility

- Font size tối thiểu 14px cho secondary text, 15px cho body text trên card
- Contrast ratio ≥4.5:1 cho text trên background
- Tap target tối thiểu 44x44px — FAB đủ lớn, buttons trên card đủ padding
- RequestCard: đủ padding (16px) để tap không nhầm card kề bên
- UrgentPill: contrast đủ rõ ngay cả trong ánh sáng yếu
- Bell icon: `aria-label` rõ ràng nếu có badge notification
- BottomNav items: label text dưới icon đủ rõ

---

## Open Questions Liên Quan

- **OQ-005** — Định nghĩa "active request" cho feed (hiện request expired bao lâu?)
- **OQ-010** — Aid request tự expire sau bao lâu nếu không có match?
- **OQ-012** — Có push "vòng chưa có activity 7 ngày" hay không? (ảnh hưởng đến empty state)

---

*Nguồn: mvp-roadmap-v1.md Mục 10.2 | use-cases.md UC-001 đến UC-006 | user-flows.md Journey 1 | constitution.md | ui_kits/famicon-app/screens.jsx CircleHomeScreen*
*Cập nhật: 2026-05-16 | Phase 3 — sync với UI kit thật*
