---
title: Screen Spec — Invite Member (Mời thành viên)
phase: Phase 3
last_updated: 2026-05-16
decision_refs: D-024 (7-day expiry, remind day 5), D-025 (safety valve >2 members), D-026 (re-invite giữ data)
---

# Screen Spec — Invite Member

## Tổng quan

Founder và thành viên vòng có thể mời thành viên mới bằng link chia sẻ. Không có màn hình "quản lý thành viên" riêng — invite flow là action từ màn hình Members.

**Entry point:** Button "Mời thành viên mới" (InviteCTA) trên màn hình Members.

---

## Flow tổng quát

```
[Members Screen — InviteCTA dashed button]
        ↓
[Invite — Generate link]
        ↓
[Share sheet (native) / Copy link]
        ↓
[Người được mời nhận link]
        ↓
[Auth flow → Onboarding → Circle Home]
```

---

## Màn hình — Generate & Share Link

### Layout (bottom sheet hoặc full screen)

```
┌─────────────────────────────┐
│  ←   Mời thành viên mới     │  ← TopHeader, back về Members
│                             │
│  ┌─────────────────────────┐│
│  │  🔗  Link mời           ││  ← fc-card
│  │                         ││
│  │  famicon.app/join/      ││
│  │  abc123xyz              ││  ← monospace, truncate nếu dài
│  │                         ││
│  │  Hết hạn: 23/05/2026    ││  ← fg-secondary, 13px (D-024: +7 ngày)
│  └─────────────────────────┘│
│                             │
│  [  Chia sẻ link  ]        │  ← primary button, block
│  [  Sao chép link  ]       │  ← secondary button, block
│                             │
│  ─────────────────────────  │
│                             │
│  ℹ️  Link mời hết hạn sau   │  ← info note, fg-secondary, 13px
│  7 ngày. Bạn sẽ được nhắc  │
│  vào ngày thứ 5.            │
│                             │
│  [  Tạo link mới  ]        │  ← ghost button, nhỏ hơn
└─────────────────────────────┘
```

### Behavior

| Action | Kết quả |
|---|---|
| "Chia sẻ link" | Mở native share sheet (Web Share API), pre-fill message: "Bạn được mời vào vòng [tên vòng] trên FAMICON. Link: [url]" |
| "Sao chép link" | Copy URL vào clipboard, button đổi text thành "Đã sao chép ✓" trong 2s |
| "Tạo link mới" | Dialog confirm: "Tạo link mới sẽ huỷ link cũ. Tiếp tục?" → Yes → Generate link mới |
| Vào lại màn hình này khi đã có link chưa expire | Hiển thị link cũ + thời gian còn lại (không tạo link mới tự động) |

### Copy

- Heading: `Mời thành viên mới`
- Link label: `Link mời`
- Expiry: `Hết hạn: [ngày/tháng/năm]`
- Button 1: `Chia sẻ link`
- Button 2: `Sao chép link`
- Button 2 (copied): `Đã sao chép ✓`
- Info note: `Link mời hết hạn sau 7 ngày. Bạn sẽ được nhắc vào ngày thứ 5.`
- Button 3: `Tạo link mới`
- Dialog: `Tạo link mới sẽ huỷ link cũ. Tiếp tục?`

---

## Màn hình — Link đã expire

Khi user mở link sau 7 ngày (D-024):

```
┌─────────────────────────────┐
│                             │
│         ⏰                  │  ← icon large, center
│                             │
│  Link mời đã hết hạn        │  ← heading-2, center
│                             │
│  Link này không còn hiệu    │  ← fg-secondary, 14px, center
│  lực. Nhờ người mời bạn    │
│  gửi link mới nhé.          │
│                             │
│  [  Về trang chủ  ]        │  ← secondary button (nếu đã login)
└─────────────────────────────┘
```

---

## Notification nhắc ngày thứ 5 (D-024)

Push notification / email tự động vào ngày thứ 5 sau khi tạo link:

- **Title:** `Link mời sắp hết hạn`
- **Body:** `Link mời vào vòng [tên vòng] sẽ hết hạn trong 2 ngày. Nhắc người bạn mời dùng link sớm nhé.`

---

## Safety valve — thành viên lâu năm nhất (D-025)

Khi vòng có **≤2 thành viên**, cơ chế safety valve không kích hoạt. Không hiển thị UI liên quan. Logic ghi log backend.

Khi vòng có **>2 thành viên** và có đề xuất mời thành viên mới bị từ chối qua safety valve:
- UI hiển thị message: `Thành viên mới chưa được chấp nhận lần này. Bạn có thể mời lại bất kỳ lúc nào.`
- Không giải thích lý do (bảo vệ privacy người từ chối).

---

## Re-invite flow (D-026)

Khi mời lại thành viên cũ (email đã có trong hệ thống, đã rời vòng):

1. Link mời được tạo bình thường
2. Khi người đó xác nhận OTP → hệ thống phát hiện account cũ → reactivate, **giữ nguyên toàn bộ data cũ** (profile, history)
3. Onboarding bị bỏ qua — thẳng vào Circle Home
4. Thông báo cho user: `Chào mừng trở lại! Hồ sơ của bạn vẫn được giữ nguyên.`

---

## Design tokens áp dụng

| Element | Token |
|---|---|
| Background | `--color-surface-base` |
| Card | `--color-surface-card` + `--shadow-card` |
| Link URL text | monospace, `--color-text-primary` |
| Expiry text | `--color-text-secondary` |
| Info note | `--color-text-secondary`, italic |
| Primary button | `--color-primary-500` |
| Ghost button | `--color-text-link` (#D45A42) |

---

## Accessibility

- "Sao chép link" thay đổi aria-label thành "Đã sao chép" khi thành công, reset sau 2s
- Dialog confirm dùng `role="alertdialog"`, focus trap trong dialog
- Link URL: `aria-label="Link mời: [url]"`, dễ đọc cho screen reader
