---
title: Screen Spec — Profile Screen
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Screen Spec — Profile Screen

> Màn hình hồ sơ cá nhân. Nơi user xem và chỉnh sửa thông tin về bản thân, truy cập danh sách thành viên vòng, và vào cài đặt.

Xem thêm: [members-screen.md](./members-screen.md) | [information-architecture.md](../information-architecture.md) | [user-personas-v2.md](../../01-product/user-personas-v2.md)

---

## Thông tin cơ bản

| | |
|---|---|
| **URL** | `/profile` |
| **Personas chính** | Tất cả 4 personas — mỗi người đều cần setup và chỉnh sửa hồ sơ |
| **Entry points** | Bottom Nav "Hồ sơ" từ bất kỳ màn hình nào |
| **Exit points** | Tap "Thành viên vòng tròn" → `/circles/[id]/members` | Tap "Cài đặt" → settings screen | Tap "Chỉnh sửa hồ sơ" → edit form |
| **Constitution** | Nguyên tắc 2 (không hiện contribution count), Nguyên tắc 9 (profile chỉ visible trong vòng) |

---

## Purpose

Profile là nơi user kiểm soát thông tin mình chia sẻ với vòng. Không phải "trang cá nhân" kiểu mạng xã hội — chỉ là thông tin thiết thực để các thành viên khác trong vòng biết "nhà này có thể giúp gì, ở đâu, có con như thế nào".

Profile **không hiện** số lần đã giúp hay được giúp — Nguyên tắc 2 bất biến.

---

## Layout

### Cấu trúc từ trên xuống

```
┌─────────────────────────────────────────┐
│ [iOS safe area — status bar]            │  ← SAFE_TOP 54px
├─────────────────────────────────────────┤
│  Hồ sơ                        [⚙️]      │  ← TopHeader
│                                         │    title = "Hồ sơ"
│                                         │    right = IconSettings
│                                         │    (không có back button)
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [👩 Avatar lg]  Nguyễn Lan Anh │   │  ← fc-card (padding 18px)
│  │                  📍 Ga Edogawa  │   │    Avatar lg + name + place
│  │                                 │   │
│  │ ─────────────────────────────── │   │  ← divider (border-top hairline)
│  │                                 │   │
│  │ 👶 Con cái                      │   │  ← Section "Con cái"
│  │ 🧒 Minh An — 4 tuổi            │   │    emoji + name + age
│  │                                 │   │
│  │ ─────────────────────────────── │   │  ← divider
│  │                                 │   │
│  │ 💙 Có thể giúp                  │   │  ← Section "Có thể giúp"
│  │ [Đón con khu Edogawa]           │   │    Chips wrap
│  │ [Mượn đồ trẻ em] [Đi chơi cuối │   │
│  │  tuần]                          │   │
│  │                                 │   │
│  │ [ Chỉnh sửa hồ sơ ]            │   │  ← Button secondary, block
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤  Thành viên vòng tròn    [>] │   │  ← fc-card button (tap → Members)
│  └─────────────────────────────────┘   │    IconUser + label + IconChevronRight
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⚙️  Cài đặt                  [>] │   │  ← fc-card button (tap → Settings)
│  └─────────────────────────────────┘   │    IconSettings + label + IconChevronRight
│                                         │
├─────────────────────────────────────────┤
│  🏠 Vòng của tôi │ ➕ Nhờ giúp │ 👤 Hồ sơ │  ← BottomNav (active="profile")
├─────────────────────────────────────────┤
│ [iOS safe area — home indicator]        │  ← SAFE_BOTTOM 28px
└─────────────────────────────────────────┘
```

---

## Elements Chi Tiết

### Header

Component: `TopHeader({ title: "Hồ sơ", right: <IconSettings size={22} /> })`

- Không có `onBack` (đây là root screen của tab)
- `right`: IconSettings — tap → navigate settings (hoặc expand settings section)
- Không có `sub`

### Card Thông tin chính

```
div className="fc-card" style={{ padding: 18 }}
├── Row: Avatar lg + name + place
│   ├── Avatar emoji={me.avatar} size="lg"   ← fc-avatar fc-avatar--lg
│   └── div
│       ├── div fontWeight 700, 17px, fg-primary → me.name
│       └── div inline-flex gap 4px, 13px, fg-secondary
│           → <IconMapPin size={14} /> {me.place}
│
├── Divider (borderTop: "1px solid var(--border-hairline)", margin: "14px 0")
│
├── Section "Con cái"
│   ├── Row: <IconBaby size={14} /> "Con cái" (13px, fg-secondary)
│   └── [me.kids.map] div marginTop 6, 14px, fg-primary
│       → <span fontSize 18 marginRight 6>{k.emoji}</span>{k.name} — {k.age} tuổi
│
├── Divider
│
├── Section "Có thể giúp"
│   ├── Row: <IconHeart size={14} /> "Có thể giúp" (13px, fg-secondary)
│   └── div flexWrap gap 6, marginTop 8
│       → [me.canHelp.map] <Chip>{t}</Chip>
│
└── div marginTop 14
    └── Button variant="secondary" block → "Chỉnh sửa hồ sơ"
```

| Element | CSS / Component | Ghi chú |
|---|---|---|
| Avatar lg | `fc-avatar fc-avatar--lg` | Emoji circle, size lớn hơn md |
| Name | fontWeight 700, 17px, `var(--fg-primary)` | Tên đầy đủ, ví dụ "Nguyễn Lan Anh" |
| Place | inline-flex, 13px, `var(--fg-secondary)` | IconMapPin 14px + tên ga/khu vực |
| Section headers | 13px, `var(--fg-secondary)` | Icon + label nhỏ, phân cách section |
| Kids rows | 14px, `var(--fg-primary)` | Emoji 18px + tên con + tuổi |
| Chips | `fc-pill` | canHelp tags, wrap, gap 6px |
| Edit button | `fc-btn fc-btn--secondary fc-btn--block` | "Chỉnh sửa hồ sơ" |

### Row "Thành viên vòng tròn"

```
button className="fc-card" type="button" onClick={onOpenMembers}
style={{ padding: 16, display: "flex", alignItems: "center", gap: 12,
         border: 0, width: "100%", textAlign: "left", cursor: "pointer" }}
├── IconUser size={20} color fg-primary
├── div flex 1 fontWeight 600 → "Thành viên vòng tròn"
└── IconChevronRight size={20} color fg-tertiary
```

- Tap → navigate `/circles/[id]/members`
- Cả row là button (tap target đủ lớn)

### Row "Cài đặt"

```
button className="fc-card" type="button"
style (tương tự Thành viên row)
├── IconSettings size={20} color fg-primary
├── div flex 1 fontWeight 600 → "Cài đặt"
└── IconChevronRight size={20} color fg-tertiary
```

- Tap → navigate settings screen (chưa spec trong Phase 3, xử lý khi đến sprint đó)

### BottomNav

Component: `BottomNav({ active: "profile", onNav })`

---

## States

### State 1 — Loading

**Khi nào:** Đang fetch profile data từ Supabase.

- Skeleton: Avatar placeholder + text lines xám trong card
- Rows "Thành viên" và "Cài đặt" vẫn render (static, không cần fetch)

### State 2 — Loaded (đầy đủ thông tin)

Layout chuẩn như mô tả. Tất cả sections hiển thị đầy đủ.

### State 3 — Profile chưa đầy đủ (incomplete)

**Khi nào:** User mới join vòng, chưa điền đủ thông tin.

- Sau Avatar + name + place: hiển thị prompt nhỏ:
  > "Hồ sơ của bạn chưa đầy đủ. Thêm thông tin để các thành viên khác biết bạn có thể giúp gì."
- Button "Chỉnh sửa hồ sơ" đổi variant thành `primary` (thay vì secondary) để thu hút chú ý
- Section "Con cái" và "Có thể giúp": hiển thị placeholder text nếu rỗng:
  - Con cái rỗng: "Chưa thêm thông tin con cái"
  - Có thể giúp rỗng: "Chưa thêm khả năng có thể giúp"

### State 4 — Error fetch profile

- Text: "Không tải được hồ sơ. Kiểm tra mạng và thử lại."
- Button "Thử lại" (secondary)
- BottomNav vẫn hoạt động

---

## Behaviors

### Tap "Chỉnh sửa hồ sơ"

- Navigate sang edit form (screen chưa spec, build trong sprint profile)
- Form cho phép edit: avatar (chọn emoji), tên, ga/khu vực, danh sách con, danh sách khả năng giúp
- Sau save: navigate back về Profile screen với data mới

### Tap "Thành viên vòng tròn"

- Navigate đến `/circles/[id]/members` (MembersScreen)
- `[id]` = vòng hiện tại của user

### Tap "Cài đặt" (row) hoặc IconSettings (header)

- Navigate sang settings screen
- Settings scope (dự kiến): notification preferences, ngôn ngữ, đăng xuất
- **Chưa spec** — xử lý khi đến sprint đó

### Tap BottomNav item khác

- Navigate sang Home hoặc New Request screen
- BottomNav active state chuyển tương ứng

---

## Constitution References

| Nguyên tắc | Áp dụng vào Profile Screen |
|---|---|
| **Nguyên tắc 2 — Không ledger** | Profile không hiện "Đã giúp N lần", "Được giúp N lần", điểm uy tín, hay bất kỳ counter nào về hoạt động tương trợ. Chips "Có thể giúp" là khả năng, không phải track record. |
| **Nguyên tắc 9 — Vòng kín** | Profile này chỉ visible cho thành viên cùng vòng. Không có public profile URL. Không thể xem profile của người chưa cùng vòng. |
| **Nguyên tắc 7 — Peer-to-peer** | Không có badge "admin" hay "founder" trên profile. Người sáng lập vòng = thành viên bình thường sau khi vòng được tạo. |
| **Nguyên tắc 10 — Không monetize data** | Thông tin profile không dùng cho targeting quảng cáo. Chips "Có thể giúp" và thông tin con cái không được aggregate hay expose ra ngoài vòng. |

---

## Accessibility

- Avatar lg: emoji đủ lớn, không cần thêm text label (emoji là visual indicator, name bên cạnh là text label)
- Dividers: đủ contrast với background card
- Chips "Có thể giúp": `fc-pill` có đủ padding, tối thiểu 44px height tổng kể cả context
- Rows "Thành viên" và "Cài đặt": cả row là button, min-height 52px (padding 16px + content)
- Section headers: 13px có thể nhỏ — đảm bảo `var(--fg-secondary)` đủ contrast ≥4.5:1 với background card trắng

---

## Open Questions Liên Quan

- **OQ-009** — Avatar: emoji only hay cho phép upload ảnh? (ảnh hưởng đến Avatar component)
- **OQ-015** — "Có thể giúp" là free-text hay chọn từ danh sách cố định? (ảnh hưởng đến edit form và chips)
- **OQ-016** — Profile visibility: visible cho tất cả thành viên vòng hay chỉ khi user opt-in?

---

*Nguồn: mvp-roadmap-v1.md Mục 10.2 | use-cases.md | user-flows.md | constitution.md | ui_kits/famicon-app/screens.jsx ProfileScreen*
*Tạo: 2026-05-16 | Phase 3*
