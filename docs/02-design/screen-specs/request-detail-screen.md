---
title: Screen Spec — Request Detail Screen
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Screen Spec — Request Detail Screen

> Màn hình xem chi tiết một yêu cầu giúp đỡ. Điểm quyết định để người xem chọn giúp hay không.

Xem thêm: [home-screen.md](./home-screen.md) | [post-request-screen.md](./post-request-screen.md) | [use-cases.md](../../01-product/use-cases.md) | [user-flows.md](../../01-product/user-flows.md)

---

## Thông tin cơ bản

| | |
|---|---|
| **URL** | `/requests/[id]` |
| **Personas chính** | Hùng (người muốn giúp), Linh (người đăng xem lại), Tuấn (helper bận rộn cần quyết nhanh) |
| **Entry points** | Tap RequestCard trên Home (vùng title/desc) | Tap button "Tôi giúp được" trên RequestCard |
| **Exit points** | Tap "Tôi giúp được — Nhắn tin" → hand-off LINE | Tap back arrow → Home |
| **Constitution** | Nguyên tắc 3 (không show ai đã decline), Nguyên tắc 12 (hand-off LINE, không build chat) |

---

## Purpose

Cho phép người xem đọc đủ thông tin để quyết định có giúp được không — nhanh, không friction. Khi quyết định giúp, app hand-off ngay sang LINE để trao đổi chi tiết. App không build chat riêng.

---

## Layout

### Cấu trúc từ trên xuống

```
┌─────────────────────────────────────────┐
│ [iOS safe area — status bar]            │  ← SAFE_TOP 54px
├─────────────────────────────────────────┤
│ ← [back]   Chi tiết yêu cầu            │  ← TopHeader
│                                         │    title = "Chi tiết yêu cầu"
│                                         │    onBack = navigate back
│                                         │    (không có BottomNav)
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  Đón con            [Gấp]    │  ← Row: IconTile lg + category label
│  │  🚸  │  (category.label)            │    + UrgentPill nếu req.urgent
│  │ (lg) │                              │
│  └──────┘                              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Chi tiết                        │   │  ← fc-card (padding 16px)
│  │                                 │   │    label "Chi tiết" (fc-field__label)
│  │ Nhờ đón con trai về từ trường   │   │    + text đầy đủ (15px, lineHeight 1.55)
│  │ mầm non Sakura lúc 5pm. Em ấy  │   │
│  │ 4 tuổi, rất ngoan.              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⏰  Thời gian                   │   │  ← InfoBlock: icon + label + value
│  │     Hôm nay 5:00 PM             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📍  Địa điểm                    │   │  ← InfoBlock
│  │     Ga Edogawa                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤  Người nhờ                   │   │  ← InfoBlock
│  │     Lan Anh                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💬  Tôi giúp được — Nhắn tin   │   │  ← Button primary, block
│  └─────────────────────────────────┘   │    (IconMsgCircle + text)
│                                         │
│ [iOS safe area — home indicator]        │  ← SAFE_BOTTOM 28px
└─────────────────────────────────────────┘
```

**Lưu ý:** Screen này không có BottomNav — layout modal-style, chỉ navigate qua back button.

---

## Elements Chi Tiết

### Header

Component: `TopHeader({ title: "Chi tiết yêu cầu", onBack })`

- `title`: "Chi tiết yêu cầu" (fixed)
- `onBack`: navigate về màn hình trước (Home)
- Không có `sub`, không có `right`

### Row Category + UrgentPill

```
div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 4px 8px" }}
├── IconTile emoji={cat.emoji} size="lg"    ← fc-icon-tile fc-icon-tile--lg
└── div
    ├── div fontWeight 700, fontSize 20, fg-primary  → cat.label (tên loại)
    └── [nếu r.urgent] div marginTop 4px → UrgentPill
```

| Element | CSS / Component | Ghi chú |
|---|---|---|
| IconTile lg | `fc-icon-tile fc-icon-tile--lg` | Lớn hơn card version, ~64px |
| Category label | fontWeight 700, 20px, `var(--fg-primary)` | Ví dụ: "Đón con", "Mượn đồ" |
| UrgentPill | `fc-pill fc-pill--urgent` | Chỉ render khi `r.urgent === true` |

### Card Chi tiết

```
div className="fc-card" style={{ padding: 16 }}
├── div className="fc-field__label" marginBottom 6px → "Chi tiết"
└── div fontSize 15, lineHeight 1.55, color fg-primary → r.desc (đầy đủ, không truncate)
```

- **Không truncate** desc — khác với RequestCard trên Home (truncate 80 chars)
- Text đầy đủ để người xem có đủ thông tin quyết định

### InfoBlock — Thời gian

Component: `InfoBlock({ icon: <IconClock size={20} />, label: "Thời gian", value: r.when })`

Class: `fc-info-block`
- `fc-info-block__icon`: icon wrapper
- `fc-info-block__label`: "Thời gian" (nhỏ, secondary)
- `fc-info-block__value`: giá trị thực, ví dụ "Hôm nay 5:00 PM"

### InfoBlock — Địa điểm

Component: `InfoBlock({ icon: <IconMapPin size={20} />, label: "Địa điểm", value: r.place })`

- Value: ví dụ "Ga Edogawa", "Khu Nishikasai", "Edogawa → Shin-Okubo"

### InfoBlock — Người nhờ

Component: `InfoBlock({ icon: <IconUser size={20} />, label: "Người nhờ", value: r.asker })`

- Value: tên rút gọn, ví dụ "Lan Anh", "Minh Tuấn"
- **Không hiện** số lần người này đã được giúp — Nguyên tắc 2

### Button "Tôi giúp được — Nhắn tin"

```
div style={{ marginTop: 8 }}
└── Button variant="primary" block
    → <IconMsgCircle size={18} /> Tôi giúp được — Nhắn tin
```

- Text: "Tôi giúp được — Nhắn tin" (icon + text)
- Variant: `primary`, `block` (full-width)
- Tap → hand-off sang LINE (mở LINE chat với asker hoặc LINE nhóm vòng)
- **Không build chat trong app** — Nguyên tắc 3 (forbidden pattern)

---

## States

### State 1 — Loading

**Khi nào:** Đang fetch request data từ Supabase.

- Skeleton: IconTile placeholder + text lines xám
- Không hiển thị stale content
- Spinner nhỏ hoặc shimmer animation

### State 2 — Loaded (bình thường)

Layout chuẩn như mô tả trên. Button "Tôi giúp được — Nhắn tin" enabled.

### State 3 — Urgent

- UrgentPill render bên dưới category label
- Không có thay đổi UI đặc biệt khác ngoài UrgentPill
- Button vẫn bình thường — không thêm "ưu tiên" gì

### State 4 — Đã có người nhận (matched)

**Khi nào:** Request đã được match với helper.

- Button "Tôi giúp được — Nhắn tin" → disabled hoặc đổi text thành "Đã có người giúp"
- Không show "ai đã nhận" — Nguyên tắc 3 (không tiết lộ thông tin helper với người khác chưa involved)
- Có thể thêm text nhỏ: "Yêu cầu này đã được nhận"

### State 5 — Expired

**Khi nào:** Request quá hạn (xem OQ-010).

- Button disabled
- Text nhỏ bên trên button: "Yêu cầu đã hết hạn"
- Nội dung request vẫn hiển thị đầy đủ (không ẩn)

### State 6 — Error (không load được)

- Text: "Không tải được yêu cầu này. Kiểm tra mạng và thử lại."
- Button "Thử lại" (secondary)
- Back button vẫn hoạt động để thoát

---

## Behaviors

### Tap "Tôi giúp được — Nhắn tin"

1. Xác định LINE contact của asker (từ user profile)
2. Mở LINE deeplink: `line://ti/p/{lineId}` hoặc LINE group của vòng
3. Nếu LINE không installed: fallback → copy số điện thoại hoặc mở form liên hệ
4. **Không build in-app chat** — forbidden pattern theo Constitution

**Hand-off flow:**
- App ghi nhận intent "có thể giúp" để asker biết (cách thức: TBD khi build, xem OQ-007)
- Sau đó LINE tiếp quản toàn bộ coordination chi tiết

### Tap Back Arrow

- Navigate về màn hình trước (Home hoặc notification entry point)
- Không có confirmation dialog

### Scroll

- Body scroll nếu content dài (InfoBlocks + Button)
- Header pinned ở trên

---

## Constitution References

| Nguyên tắc | Áp dụng vào Request Detail Screen |
|---|---|
| **Nguyên tắc 3 — Thể diện** | Không hiển thị "N người đã xem và không giúp". Không hiện danh sách ai đã decline. State "matched" không tiết lộ tên helper cho người xem. |
| **Nguyên tắc 2 — Không ledger** | InfoBlock "Người nhờ" chỉ hiện tên — không hiện "đã nhờ N lần trước". Không có reputation score. |
| **Nguyên tắc 6 — Vô hình hoá** | User không thấy matching logic. Chỉ thấy: chi tiết → quyết định → nhắn tin. |
| **Nguyên tắc 12 — Hand-off LINE** | Button duy nhất là "Nhắn tin" → mở LINE. Không build chat trong app dù đơn giản đến đâu. |

*(Nguyên tắc 12 = forbidden pattern "Build chat 1-1 trong app" trong Constitution section Forbidden về UX)*

---

## Accessibility

- IconTile lg đủ lớn, emoji centered, không dựa vào màu để phân biệt loại
- UrgentPill: đủ contrast (bg `#FFF1F2`, text `#BE123C`) + text "Gấp" rõ ràng
- InfoBlock: label + value hai dòng, không merge thành một dòng nhỏ
- Button "Tôi giúp được": tap target full-width, 44px height tối thiểu
- Back button: tap target ≥44x44px, có `aria-label="Quay lại"`
- Desc text: 15px, lineHeight 1.55 — dễ đọc

---

## Open Questions Liên Quan

- **OQ-007** — Khi user tap "Tôi giúp được", app ghi nhận gì trước khi mở LINE?
- **OQ-010** — Request expire sau bao lâu → ảnh hưởng State 5 (expired)
- **OQ-014** — LINE deeplink strategy: chat riêng với asker hay group vòng?

---

*Nguồn: mvp-roadmap-v1.md Mục 10.2 | use-cases.md UC-001 đến UC-006 | user-flows.md Journey 1 | constitution.md | ui_kits/famicon-app/screens.jsx RequestDetailScreen*
*Tạo: 2026-05-16 | Phase 3*
