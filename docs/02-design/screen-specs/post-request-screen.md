---
title: Screen Spec — Post Aid Request Screen (Nhờ giúp)
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Screen Spec — Post Aid Request Screen

> Màn hình đăng nhờ. Đây là màn hình quan trọng nhất về UX — phải hoàn thành trong dưới 30 giây.

Xem thêm: [home-screen.md](./home-screen.md) | [information-architecture.md](../information-architecture.md) | [use-cases.md](../../01-product/use-cases.md)

---

## Thông tin cơ bản

| | |
|---|---|
| **URL** | `/requests/new` |
| **Personas chính** | Linh (đăng request nhanh), Mai (mới dùng, cần guidance) |
| **Entry points** | Tap FAB trên Home | Tap Bottom Nav "Nhờ giúp" từ bất kỳ màn hình nào |
| **Exit points** | Submit thành công → Home (với success toast) | Tap back → Home hoặc màn hình trước |
| **Constitution** | Nguyên tắc 5 (nhanh — <30 giây), Nguyên tắc 3 (không hỏi thừa, không áp lực), Nguyên tắc 4 (urgent mặc định OFF) |
| **Thời gian target** | Dưới 30 giây từ lúc mở màn hình đến submit |

---

## Purpose

Cho phép user đăng một aid request nhanh nhất có thể. Mọi friction không cần thiết phải được loại bỏ.

Form này không hỏi những gì không cần thiết cho việc tìm người giúp. Chi tiết sẽ được chia sẻ qua LINE sau khi match.

---

## Layout

### Cấu trúc màn hình

```
┌─────────────────────────────────────────┐
│ [iOS safe area — status bar]            │  ← SAFE_TOP 54px
├─────────────────────────────────────────┤
│ ← [back]  Nhờ giúp                      │  ← TopHeader
│                                         │    title = "Nhờ giúp"
│                                         │    onBack = navigate back
│                                         │    (không có right button)
├─────────────────────────────────────────┤
│                                         │
│  1. Bạn cần giúp gì?                   │  ← Field label
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │  🚸  │ │  📦  │ │  👶  │           │  ← CategoryTile 3x2 grid
│  │ Đón  │ │Mượn  │ │Trông │           │    selected = coral border
│  │ con  │ │ đồ   │ │ con  │           │
│  └──────┘ └──────┘ └──────┘           │
│  ┌──────┐ ┌──────┐                    │
│  │  🚗  │ │  💬  │                    │
│  │ Chở  │ │Khác  │                    │
│  │ đi   │ │      │                    │
│  └──────┘ └──────┘                    │
│                                         │
│  2. Chi tiết cụ thể                    │  ← Field label
│  ┌─────────────────────────────────┐   │
│  │ Ví dụ: Đón con từ trường mầm    │   │  ← fc-textarea
│  │ non Sakura                      │   │    maxLength=200
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                   0/200│  ← fc-tiny counter (right-align)
│                                         │
│  3. Khi nào?                           │  ← Field label
│  ┌─────────────────────────────────┐   │
│  │ 📅  Ví dụ: Hôm nay 5pm, Mai sáng│  │  ← fc-input paddingLeft 42px
│  └─────────────────────────────────┘   │    IconCalendar left icon
│                                         │
│  4. Ở đâu?                             │  ← Field label
│  ┌─────────────────────────────────┐   │
│  │ 📍  Ga, khu vực                 │   │  ← fc-input paddingLeft 42px
│  └─────────────────────────────────┘   │    IconMapPin left icon
│                                         │
│  5. Có gấp không?                      │  ← Field label
│  ┌──────────────┐ ┌──────────────┐    │
│  │     Có       │ │    Không     │    │  ← 2 buttons flex 1
│  └──────────────┘ └──────────────┘    │    active = fc-btn--primary
│                                         │    inactive = fc-btn--secondary
│  ┌─────────────────────────────────┐   │
│  │        Gửi nhờ giúp             │   │  ← Submit button
│  └─────────────────────────────────┘   │    disabled nếu thiếu cat/detail/when/place
│                                         │
├─────────────────────────────────────────┤
│  🏠 Vòng của tôi │ ➕ Nhờ giúp │ 👤 Hồ sơ │  ← BottomNav (active="new")
├─────────────────────────────────────────┤
│ [iOS safe area — home indicator]        │  ← SAFE_BOTTOM 28px
└─────────────────────────────────────────┘
```

---

## Elements Chi Tiết

### Header

Component: `TopHeader({ title: "Nhờ giúp", onBack })`

- `onBack`: navigate trở về màn hình trước (Home hoặc màn hình đã navigate từ)
- **Không có** right button "✓ Đăng" — submit duy nhất qua button "Gửi nhờ giúp" cuối form

### Field 1 — Chọn loại (Bắt buộc)

Component: `Field({ label: "1. Bạn cần giúp gì?" })`
Bên trong: `CategoryTile` grid 3x2

**5 loại aid request theo seed data:**

| Emoji | ID | Tên hiển thị |
|---|---|---|
| 🚸 | `pickup` | Đón con |
| 📦 | `borrow` | Mượn đồ |
| 👶 | `watch` | Trông con |
| 🚗 | `ride` | Chở đi |
| 💬 | `other` | Khác |

**Layout grid:** `gridTemplateColumns: repeat(3, 1fr)`, `gap: 10px`, 5 tiles (hàng đầu 3 tiles, hàng hai 2 tiles)

**UX:**
- Mặc định state trong code: `useState("pickup")` — pickup pre-selected
- Tap chọn tile khác: class `fc-cat-tile--selected` (coral border)
- Chỉ chọn được 1 loại
- Required cho submit

Component: `CategoryTile({ cat, selected, onClick })`
Class selected: `fc-cat-tile fc-cat-tile--selected`
Class unselected: `fc-cat-tile`

### Field 2 — Chi tiết cụ thể (Bắt buộc)

Component: `Field({ label: "2. Chi tiết cụ thể" })`
Bên trong: `<textarea className="fc-textarea" maxLength={200} />`

- Placeholder: "Ví dụ: Đón con từ trường mầm non Sakura"
- Counter: `<div className="fc-tiny" style={{ textAlign: "right" }}>{detail.length}/200</div>`
- Validation: `detail.trim().length > 0` để enable submit
- **Bắt buộc** — `canSubmit` check cả field này

### Field 3 — Khi nào? (Bắt buộc)

Component: `Field({ label: "3. Khi nào?" })`
Bên trong: `<input className="fc-input" style={{ paddingLeft: 42 }} />`

- Icon: `IconCalendar size={18}`, absolute left 14px, vertically centered
- Placeholder: "Ví dụ: Hôm nay 5pm, Mai sáng, Thứ 7"
- Free-text input — user gõ tự do, không dùng date picker
- Validation: `when.length > 0` (không rỗng)

### Field 4 — Ở đâu? (Bắt buộc)

Component: `Field({ label: "4. Ở đâu?" })`
Bên trong: `<input className="fc-input" style={{ paddingLeft: 42 }} />`

- Icon: `IconMapPin size={18}`, absolute left 14px, vertically centered
- Placeholder: "Ga, khu vực"
- Free-text input
- Validation: `place.length > 0` (không rỗng)

### Field 5 — Có gấp không? (Không bắt buộc)

Component: `Field({ label: "5. Có gấp không?" })`
Bên trong: 2 buttons dạng flex row

```
div style={{ display: "flex", gap: 10 }}
├── button type="button" flex={1}
│   className = urgent ? "fc-btn fc-btn--primary" : "fc-btn fc-btn--secondary"
│   onClick={() => setUrgent(true)}
│   → "Có"
└── button type="button" flex={1}
    className = !urgent ? "fc-btn fc-btn--primary" : "fc-btn fc-btn--secondary"
    onClick={() => setUrgent(false)}
    → "Không"
```

- Mặc định: `useState(false)` — "Không" được highlight (primary)
- Khi urgent = true: "Có" highlight, "Không" secondary
- **Không bắt buộc** cho submit — `canSubmit` không check urgent

**Lưu ý thiết kế:** Không dùng dark pattern để discourage urgent. Không confirm dialog. Tôn trọng user tự quyết.

### Submit Button

```
Button variant={canSubmit ? "primary" : "disabled"} block disabled={!canSubmit}
→ "Gửi nhờ giúp"
```

- Text: "Gửi nhờ giúp" (không phải "Đăng nhờ ngay")
- Full-width: `block` prop → `fc-btn--block`
- Disabled khi: `!cat || detail.trim().length === 0 || !when || !place`
- Enabled khi đủ 4 fields: cat + detail + when + place

### BottomNav

Component: `BottomNav({ active: "new", onNav })`
Screen này có BottomNav — không phải màn hình modal.

---

## Validation Rules

| Field | Required | Logic | Error message |
|---|---|---|---|
| Loại (cat) | Có | `cat` phải có giá trị | Không thể submit — button disabled |
| Chi tiết | Có | `detail.trim().length > 0` | Không thể submit — button disabled |
| Khi nào | Có | `when.length > 0` | Không thể submit — button disabled |
| Ở đâu | Có | `place.length > 0` | Không thể submit — button disabled |
| Gấp | Không | Không check | Không ảnh hưởng submit |
| Chi tiết max | Không hard error | `maxLength={200}` trên textarea | Counter `N/200` đổi màu khi gần limit |

**Validation UX:**
- Submit button disabled hoàn toàn khi chưa đủ fields — không có error message pop-up
- Không validate real-time gây interruption khi đang gõ
- Textarea counter hiển thị live (không phải error)

---

## Submit Flow

### Happy Path

1. User tap "Gửi nhờ giúp" (enabled)
2. Client-side final check pass
3. Button đổi loading state (spinner + text "Đang gửi...")
4. Call Supabase: insert `aid_request`
5. Success → navigate về Home
6. Toast trên Home: "Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay."
7. Request mới xuất hiện đầu feed Home

### Error Path

1. Network error hoặc Supabase error
2. Toast error: "Gửi không được. Kiểm tra mạng và thử lại."
3. Form giữ nguyên dữ liệu đã điền — không reset
4. Submit button trở lại enabled

### Duplicate Prevention

- Button disabled ngay khi đang submitting
- Nếu double tap: chỉ 1 request được tạo

---

## States

### State 1 — Form trống khi mở

- Loại: `pickup` pre-selected (theo `useState("pickup")`)
- Chi tiết: rỗng
- Khi nào: rỗng
- Ở đâu: rỗng
- Gấp: "Không" active (mặc định false)
- Submit button: disabled (vì detail và when và place rỗng)

### State 2 — Đã điền đủ, sẵn sàng submit

- Loại đã chọn (CategoryTile có class `fc-cat-tile--selected`)
- Chi tiết không rỗng
- Khi nào không rỗng
- Ở đâu không rỗng
- Submit button: enabled, class `fc-btn--primary`

### State 3 — Đang submit

- Submit button: loading state
- Form không nên cho phép edit (hoặc để nguyên, handle idempotency ở server)

### State 4 — Lỗi network/server

- Toast error xuất hiện
- Form giữ nguyên data
- User có thể thử lại

---

## Constitution References

| Nguyên tắc | Áp dụng vào Post Request Screen |
|---|---|
| **Nguyên tắc 5 — Nhanh** | Mục tiêu <30 giây. Tap-to-select thay gõ tên loại. Form 5 fields ngắn gọn. Không hỏi thừa. |
| **Nguyên tắc 3 — Tôn trọng thể diện** | Không confirm dialog "Bạn có chắc?". Không cảnh báo "Bạn dùng urgent quá nhiều". Tôn trọng user tự quyết. |
| **Nguyên tắc 4 — Yên tĩnh** | Urgent mặc định "Không". Không tự động bật notification nếu user không chọn "Có". |
| **Nguyên tắc 6 — Vô hình hoá** | User không thấy "app đang routing đến ai". Chỉ thấy: gửi → done. Matching logic ẩn hoàn toàn. |

---

## Accessibility

- Mỗi tap target ≥44x44px — CategoryTile và buttons đủ size
- CategoryTile: phân biệt selected/unselected bằng cả border coral VÀ background, không chỉ màu
- Field labels rõ ràng (không placeholder-only)
- Textarea có `<label>` wrapper qua Field component
- Counter `N/200` đủ contrast để đọc
- Urgent buttons: phân biệt bằng border/fill, không chỉ màu sắc

---

## Open Questions Liên Quan

- **OQ-007** — Match algorithm: weight của urgency và location như thế nào?
- **OQ-010** — Aid request expire sau bao lâu nếu không match?
- **OQ-017** — Backup helper flow khi match bị cancel: asker phải post lại hay app tự re-notify?

---

*Nguồn: mvp-roadmap-v1.md Mục 10.2 | use-cases.md UC-001 đến UC-004 | user-flows.md Journey 1 | constitution.md Nguyên tắc 3, 5, 6 | ui_kits/famicon-app/screens.jsx NewRequestScreen*
*Cập nhật: 2026-05-16 | Phase 3 — sync với UI kit thật*
