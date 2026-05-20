---
title: Screen Spec — Auth (Đăng nhập / OTP)
phase: Phase 3
last_updated: 2026-05-16
decision_refs: D-027 (Email OTP only)
---

# Screen Spec — Auth

## Tổng quan

FAMICON không có màn hình đăng ký riêng — mọi user đều bắt đầu bằng link mời từ founder vòng. Auth flow gồm 2 bước: nhập email → nhập OTP.

**Decision:** D-027 — Email OTP duy nhất, không Phone OTP, không LINE Login.

---

## Flow tổng quát

```
[Link mời nhận từ founder]
        ↓
[Auth — Nhập email]
        ↓
[Auth — Nhập OTP (6 số)]
        ↓
[Onboarding — Tạo profile lần đầu]  ← chỉ lần đầu
        ↓
[Circle Home]
```

Lần đăng nhập lại (thiết bị khác / hết session): bỏ qua Onboarding, thẳng vào Circle Home.

---

## Màn hình 1 — Nhập email

### Layout (full-screen, không có BottomNav)

```
┌─────────────────────────────┐
│  [Logo / wordmark FAMICON]  │  ← center top, padding-top 80px
│                             │
│  Chào mừng đến Vòng của     │  ← heading-2, fg-primary
│  [Tên vòng]                 │  ← in đậm, coral primary-500
│                             │
│  ────────────────────────   │
│                             │
│  Nhập email của bạn         │  ← label, fg-secondary, 14px
│  ┌───────────────────────┐  │
│  │ email@example.com     │  │  ← input, type=email, autofocus
│  └───────────────────────┘  │
│                             │
│  [  Gửi mã xác nhận  ]     │  ← fc-btn fc-btn--primary fc-btn--block
│                             │
│  ─────────── hoặc ──────── │
│                             │
│  Bạn chưa có lời mời?       │  ← fg-tertiary, 13px, center
│  Hỏi người thân trong vòng  │
└─────────────────────────────┘
```

### Behavior

| State | Mô tả |
|---|---|
| Empty | Button "Gửi mã" disabled |
| Typing | Button enabled khi email có dạng hợp lệ (basic regex) |
| Submitting | Button → loading spinner, input disabled |
| Error (email không trong invite list) | Inline error: "Email này chưa được mời. Kiểm tra lại hoặc hỏi người mời bạn." |
| Success | Chuyển sang màn hình OTP |

### Copy

- Heading: `Chào mừng đến Vòng của [circle_name]`
- Button: `Gửi mã xác nhận`
- Error: `Email này chưa được mời. Kiểm tra lại hoặc hỏi người mời bạn.`
- Footer note: `Bạn chưa có lời mời? Hỏi người thân trong vòng.`

---

## Màn hình 2 — Nhập OTP

### Layout

```
┌─────────────────────────────┐
│  ←  (back về nhập email)    │  ← top-left, icon button
│                             │
│  Kiểm tra email của bạn     │  ← heading-2
│                             │
│  Chúng tôi đã gửi mã 6 số  │  ← fg-secondary, 15px
│  đến email@example.com      │  ← email in đậm
│                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  ← 6 ô nhập riêng biệt
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │
│                             │
│  [  Xác nhận  ]            │  ← disabled khi chưa đủ 6 số
│                             │
│  Không nhận được mã?        │  ← fg-secondary, 13px
│  Gửi lại  (00:45)          │  ← link coral, countdown 60s
└─────────────────────────────┘
```

### Behavior

| State | Mô tả |
|---|---|
| Default | 6 ô trống, auto-focus ô đầu tiên |
| Typing | Focus tự nhảy sang ô tiếp theo |
| Paste | Nhận 6 số paste vào, điền hết các ô |
| Countdown | Sau khi gửi OTP, "Gửi lại" disabled với countdown 60s |
| Resend | Sau 60s, "Gửi lại" clickable, gửi OTP mới, reset countdown |
| Wrong OTP | Inline error: "Mã không đúng. Còn [N] lần thử." |
| 3 lần sai | Redirect về nhập email, thông báo: "Vui lòng yêu cầu mã mới." |
| Success | Nếu lần đầu → Onboarding. Nếu lại → Circle Home. |

### Copy

- Heading: `Kiểm tra email của bạn`
- Sub: `Chúng tôi đã gửi mã 6 số đến [email].`
- Button: `Xác nhận`
- Resend (active): `Gửi lại`
- Resend (countdown): `Gửi lại (00:45)`
- Error wrong: `Mã không đúng. Còn [N] lần thử.`
- Error max: `Vui lòng yêu cầu mã mới.`

---

## Màn hình 3 — Onboarding profile (lần đầu)

Chỉ xuất hiện một lần sau OTP thành công, nếu user chưa có profile.

### Layout

```
┌─────────────────────────────┐
│  Tạo hồ sơ của bạn          │  ← heading-2
│  Vòng sẽ thấy thông tin này │  ← fg-secondary, 14px
│                             │
│  [Avatar emoji picker]      │  ← grid 3×4 emoji gương mặt/gia đình
│                             │
│  Họ và tên                  │
│  ┌───────────────────────┐  │
│  │ Nguyễn Thị Linh       │  │
│  └───────────────────────┘  │
│                             │
│  Con nhỏ (tùy chọn)         │
│  ┌───────────────────────┐  │
│  │ Bé 3 tuổi, bé 6 tuổi  │  │  ← free text, placeholder
│  └───────────────────────┘  │
│                             │
│  Khu vực (quận / thành phố) │
│  ┌───────────────────────┐  │
│  │ Yokohama              │  │
│  └───────────────────────┘  │
│                             │
│  [  Vào vòng của tôi  ]    │  ← primary button, disabled khi thiếu tên
└─────────────────────────────┘
```

### Fields

| Field | Required | Ghi chú |
|---|---|---|
| Avatar emoji | Optional | Default = 👨‍👩‍👧 nếu không chọn |
| Họ và tên | Required | Min 2 ký tự |
| Con nhỏ | Optional | Free text, placeholder: "Bé 3 tuổi, bé 6 tuổi" |
| Khu vực | Optional | Placeholder: "Quận / thành phố tại Nhật" |

### Copy

- Heading: `Tạo hồ sơ của bạn`
- Sub: `Vòng sẽ thấy thông tin này.`
- Button: `Vào vòng của tôi`

---

## Design tokens áp dụng

| Element | Token |
|---|---|
| Background | `--color-surface-base` (#FAF8F5) |
| Input border | `--color-border-default` |
| Input focus | `--color-primary-500` (#FF8966) |
| Button primary | `--color-primary-500` |
| Button hover | `--color-primary-600` |
| Error text | `--color-status-error` |
| Countdown text | `--color-text-secondary` |
| Resend link | `--color-text-link` (#D45A42) |

---

## Accessibility

- Email input: `type="email"`, `autocomplete="email"`, `inputmode="email"`
- OTP inputs: `type="text"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="1"` mỗi ô
- "Gửi lại" khi disabled: `aria-disabled="true"`, không dùng `disabled` attribute để screen reader đọc được countdown
- Button loading: `aria-busy="true"`, `aria-label="Đang gửi mã..."` khi spinner

---

## Edge cases

| Case | Behavior |
|---|---|
| Email hợp lệ nhưng không trong invite list | Error inline, không redirect |
| Invite link đã expire (>7 ngày — D-024) | Màn hình thông báo: "Link mời đã hết hạn. Nhờ người mời gửi lại link mới." |
| User đã có account, đăng nhập lại | OTP thành công → thẳng Circle Home (bỏ Onboarding) |
| Session còn hạn, mở app lại | Bỏ qua Auth, vào thẳng Circle Home |
