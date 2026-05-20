---
title: Screen Spec — Members Screen
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Screen Spec — Members Screen

> Màn hình danh sách thành viên vòng. Giúp user biết ai trong vòng, họ ở đâu, và có thể giúp gì — để kết nối đúng người khi cần.

Xem thêm: [profile-screen.md](./profile-screen.md) | [information-architecture.md](../information-architecture.md) | [use-cases.md](../../01-product/use-cases.md)

---

## Thông tin cơ bản

| | |
|---|---|
| **URL** | `/circles/[id]/members` |
| **Personas chính** | Hùng (muốn biết ai có thể giúp gì, ở đâu), Linh (muốn mời người mới vào vòng) |
| **Entry points** | Tap "Thành viên vòng tròn" từ Profile screen |
| **Exit points** | Tap back → Profile screen | Tap chat icon trên MemberRow → hand-off LINE | Tap InviteCTA → invite flow |
| **Constitution** | Nguyên tắc 7 (peer-to-peer, không có admin row), Nguyên tắc 2 (MemberRow không hiện contribution count), Nguyên tắc 3 (không show ai đã decline invite) |

---

## Purpose

Cho phép thành viên biết ai đang trong vòng, họ sống ở đâu, có con như thế nào, và có thể giúp gì. Đây là thông tin thiết thực để tự kết nối — không phải social feed hay profile xã hội.

Màn hình này cũng là điểm vào duy nhất để mời thành viên mới vào vòng.

---

## Layout

### Cấu trúc từ trên xuống

```
┌─────────────────────────────────────────┐
│ [iOS safe area — status bar]            │  ← SAFE_TOP 54px
├─────────────────────────────────────────┤
│ ← [back]  Thành viên                   │  ← TopHeader
│            5 gia đình                  │    title = "Thành viên"
│                                         │    sub = "N gia đình"
│                                         │    onBack = navigate Profile
│                                         │    (không có BottomNav)
├─────────────────────────────────────────┤
│                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │  👤+  Mời thành viên mới         │  │  ← InviteCTA (fc-invite)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │    dashed border, đầu list
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [👩]  Nguyễn Lan Anh            │ 💬│  ← MemberRow
│  │       📍 Ga Edogawa             │   │    Avatar + name + place + kids
│  │       👶 4                      │   │    + chips + chat icon
│  │       [Đón con] [Mượn đồ]      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [👨]  Trần Minh Tuấn           │ 💬│  ← MemberRow 2
│  │       📍 Ga Kasai               │   │
│  │       🧒 2  👶 5                │   │
│  │       [Chở đi] [Đi chơi]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [👩]  Lê Thu Hà                │ 💬│
│  │       📍 Nishikasai             │   │
│  │       👶 3                      │   │
│  │       [Trông con] [Mượn đồ]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ... (more members, scroll) ...         │
│                                         │
│ [iOS safe area — home indicator]        │  ← SAFE_BOTTOM 28px
└─────────────────────────────────────────┘
```

**Lưu ý:** Screen này không có BottomNav — navigate từ Profile, exit bằng back button.

---

## Elements Chi Tiết

### Header

Component: `TopHeader({ title: "Thành viên", sub: "{data.members.length} gia đình", onBack })`

- `title`: "Thành viên" (fixed)
- `sub`: số thành viên thực tế — ví dụ "5 gia đình", "12 gia đình"
- `onBack`: navigate về Profile screen
- Không có `right`

### InviteCTA

Component: `InviteCTA({ onClick })`
Class: `fc-invite`

```
button className="fc-invite" type="button" onClick={onClick}
→ <IconUserPlus size={18} /> Mời thành viên mới
```

- Style: dashed border, background trong suốt hoặc surface
- Đứng **đầu list** — trước tất cả MemberRows
- Tap → trigger invite flow (xem phần Invite Flow bên dưới)

### MemberRow

Component: `MemberRow({ m })`
Container: `fc-card`, padding 14px, flex row, gap 12px

```
div className="fc-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}
├── Avatar emoji={m.avatar}   ← fc-avatar (size md, mặc định)
├── div flex 1
│   ├── div fontWeight 700, 15px, fg-primary → m.name
│   ├── div inline-flex gap 4, 13px, fg-secondary, marginTop 2
│   │   → <IconMapPin size={12} /> {m.place}
│   ├── div 13px, fg-secondary, marginTop 6 → m.kids
│   │   (format: "👶 4" hoặc "🧒 2  👶 5" — emoji + số tuổi)
│   └── div flex flexWrap gap 6, marginTop 8
│       → m.tags.map → <Chip>{t}</Chip>
└── IconMsgCircle size={20} color fg-tertiary  ← chat icon, right edge
```

| Element | CSS / Component | Ghi chú |
|---|---|---|
| Avatar | `fc-avatar` (md) | Emoji circle, bên trái |
| Name | fontWeight 700, 15px, `var(--fg-primary)` | Tên đầy đủ |
| Place | inline-flex, 13px, `var(--fg-secondary)` | IconMapPin 12px + tên ga/khu vực |
| Kids | 13px, `var(--fg-secondary)` | Emoji + số tuổi, ví dụ "👶 4" hoặc "🧒 2  👶 5" |
| Chips (tags) | `fc-pill` | Danh sách khả năng giúp, wrap |
| Chat icon | `IconMsgCircle`, `var(--fg-tertiary)` | Bên phải, tap → hand-off LINE |

**Thứ tự members:** Theo thứ tự join vòng hoặc alphabetical — quyết khi build. Không sort theo contribution.

**Không có row đặc biệt cho admin hay founder** — Nguyên tắc 7 (peer-to-peer, mọi người bình đẳng trong list).

**Chips = khả năng giúp, không phải track record** — Nguyên tắc 2 (không ledger). Không có số lần đã giúp.

### Tap Chat Icon (IconMsgCircle)

- Tap icon 💬 trên MemberRow → hand-off LINE
- Mở LINE chat riêng với member đó (LINE deeplink)
- **Không build in-app chat** — forbidden pattern theo Constitution

---

## States

### State 1 — Loading

- Skeleton: 3-4 MemberRow placeholder (avatar + text lines xám)
- InviteCTA vẫn render (không cần fetch data)

### State 2 — Few members (< 5 gia đình)

Layout bình thường. Không có thay đổi UI đặc biệt.

Tuy nhiên, InviteCTA có thể có thêm text nhỏ bên dưới (optional, quyết khi build):
> "Vòng sẽ hoạt động tốt hơn khi có thêm thành viên."

### State 3 — Đầy đủ thành viên (≥5 gia đình)

Layout chuẩn. Scroll nếu danh sách dài.

### State 4 — Empty (chỉ mình bạn trong vòng)

**Khi nào:** Vòng vừa tạo, chưa mời ai.

- InviteCTA vẫn ở đầu
- Bên dưới: text invitation-style:
  > "Vòng của bạn chưa có thành viên nào khác. Mời bạn bè và gia đình Việt xung quanh nhé!"
- Không hiện danh sách rỗng — chỉ invitation text

### State 5 — Error fetch members

- Text: "Không tải được danh sách. Kiểm tra mạng và thử lại."
- InviteCTA vẫn render
- Button "Thử lại" (secondary)

---

## Invite Flow

### Entry point

Tap InviteCTA → bắt đầu invite flow.

### Flow

1. App generate invite link (một-lần-dùng, expire theo D-024)
2. Hiển thị bottom sheet hoặc modal với:
   - Invite link (có thể copy)
   - Button "Chia sẻ qua LINE" — mở LINE share sheet
   - Text nhỏ: "Link hết hạn sau 7 ngày. Nhớ nhắc người được mời vào trước ngày đó."
3. User chia sẻ link qua LINE (hoặc copy và paste sang nơi khác)
4. Modal đóng, user quay về danh sách thành viên

### Invite link specs (theo D-024)

- Expire: 7 ngày kể từ khi generate
- Nhắc ngày thứ 5: notification nhỏ "Link mời của bạn còn 2 ngày, người được mời chưa join"
- Một user có thể generate nhiều link — mỗi link cho một lần mời
- **Không show** ai đã nhận link mà không join — Nguyên tắc 3

### Thông báo cho vòng khi có thành viên mới

- Khi thành viên mới join: notification đến tất cả thành viên: "[Tên] vừa vào vòng."
- Minh bạch thông tin = Nguyên tắc 8, nhưng không phải vote hay xét duyệt

---

## Constitution References

| Nguyên tắc | Áp dụng vào Members Screen |
|---|---|
| **Nguyên tắc 7 — Peer-to-peer** | Danh sách thành viên không có row đặc biệt cho admin hay founder. Mọi người hiển thị bình đẳng — cùng MemberRow component, cùng thứ tự logic. |
| **Nguyên tắc 2 — Không ledger** | Chips trên MemberRow = khả năng giúp, không phải track record. Không hiện "đã giúp N lần" hay bất kỳ counter contribution nào. |
| **Nguyên tắc 3 — Thể diện** | Không hiện ai đã nhận invite link mà không join. Không log "đã decline invite". |
| **Nguyên tắc 8 — Minh bạch không xét duyệt** | Khi thành viên mới join: notify cả vòng để minh bạch — nhưng không phải để vote có cho join không. |
| **Nguyên tắc 9 — Vòng kín** | Danh sách thành viên này chỉ visible cho thành viên cùng vòng. Không public. |

---

## Accessibility

- MemberRow: cả row có đủ padding (14px), min-height ~80px kể cả content
- Chat icon `IconMsgCircle`: tap target nhỏ (20px) — bọc thêm padding hoặc invisible tap area 44x44px khi build
- Chips: `fc-pill` đủ padding, readable tại 12-13px
- InviteCTA: dashed border button đủ tap target, tối thiểu 44px height
- Avatar emoji: đủ size, không cần label text thêm (name bên cạnh là label)
- Back button: `aria-label="Quay lại"`, tap target ≥44x44px

---

## Open Questions Liên Quan

- **OQ-007** — Chat icon tap: mở LINE chat riêng hay LINE group? Cần LINE ID từ đâu? (ảnh hưởng deeplink logic)
- **OQ-014** — Khi member tap chat icon trong Members screen — có thêm "gửi lời chào" message tuỳ chọn không, hay 1-click thuần? (Phase 4 Sprint 11)

---

*Nguồn: mvp-roadmap-v1.md Mục 10.2 | use-cases.md | user-flows.md | constitution.md | ui_kits/famicon-app/screens.jsx MembersScreen | decision-log.md D-024*
*Tạo: 2026-05-16 | Phase 3*
