---
title: Design System — Vòng Tròn Tương Trợ
ngày_tạo: 2026-05-16
phase: Phase 3 — Design & Prototype
---

# Design System — Vòng Tròn Tương Trợ

> Nền tảng visual và component cho toàn bộ app.
> App là PWA tiếng Việt, hướng đến cộng đồng gia đình Việt tại Nhật — cảm giác ấm áp, đáng tin, không corporate.

Xem thêm: [information-architecture.md](./information-architecture.md) | [constitution.md](../00-foundation/constitution.md)

---

## Triết lý thiết kế

**Cảm giác mục tiêu:**
- Như một cuốn sổ nhỏ chung của nhóm — quen thuộc, gần gũi, không lạnh lùng
- Yên tĩnh, không ồn ào — không auto-animate mọi thứ
- Tôn trọng — không hiện metric khiến người dùng so sánh nhau
- An toàn — không có public content, cảm giác private circle

**Không được:**
- Corporate / startup-bro aesthetics (quá tối, quá neon, quá flat-minimal cứng đờ)
- Social media feed aesthetics (như Facebook, Instagram)
- Gamification aesthetics (streak flames, badge nổi bật, leaderboard)

---

## Color Tokens

### Primary — Warm Coral

Brand color của FAMICON. Ấm áp, gần gũi, không quá formal.

```css
--color-primary-50:  #FFF4EF;  /* background tint rất nhạt */
--color-primary-100: #FEE7DC;  /* background tint nhạt */
--color-primary-200: #FFD3BF;  /* hover state nhẹ */
--color-primary-300: #FFB89A;  /* border accent */
--color-primary-400: #FF9C76;  /* icon accent */
--color-primary-500: #FF8966;  /* ★ primary color chính */
--color-primary-600: #F37359;  /* hover / pressed */
--color-primary-700: #D45A42;  /* dark variant */
--color-primary-800: #A8412F;  /* very dark */
--color-primary-900: #6B2A1E;  /* darkest */
```

**Sử dụng:**
- `primary-500`: Button primary, selected state, CTA, active nav item, FAB
- `primary-100`: Background chip, avatar, tint nhẹ
- `primary-600`: Hover state của button primary
- `primary-700`: Link text (`--color-text-link`)

### Surface — Warm Beige

Không trắng tinh — có hơi ấm tự nhiên, tạo cảm giác "sổ giấy".

```css
--color-surface-base:    #FAF8F5;              /* background toàn trang */
--color-surface-card:    #FFFFFF;              /* card, modal background */
--color-surface-subtle:  #F4F1EC;              /* divider, section background nhạt */
--color-surface-overlay: rgba(0, 0, 0, 0.4);  /* modal overlay */
```

### Text

```css
--color-text-primary:   #1A1A1A;  /* body text, heading */
--color-text-secondary: #5A5A5A;  /* subtext, metadata, placeholder label */
--color-text-tertiary:  #9A9A9A;  /* disabled text, hint */
--color-text-inverse:   #FFFFFF;  /* text trên primary button */
--color-text-link:      #D45A42;  /* link text — primary-700 */
```

### Status

```css
/* Error */
--color-error-50:    #FEF2F2;
--color-error-100:   #FEE2E2;
--color-error-500:   #DC2626;

/* Success */
--color-success-50:  #F0FDF4;
--color-success-100: #DCFCE7;
--color-success-500: #16A34A;

/* Warning */
--color-warning-50:  #FFFBEB;
--color-warning-100: #FEF3C7;
--color-warning-500: #D97706;

/* Urgent — dùng riêng cho "Gấp!" */
--color-urgent-bg:    #FFF1F2;
--color-urgent-text:  #BE123C;
--color-urgent-badge: #E11D48;
```

### Neutral

```css
--color-neutral-50:  #FAFAFA;
--color-neutral-100: #F5F5F5;
--color-neutral-200: #E5E5E5;
--color-neutral-300: #D4D4D4;
--color-neutral-400: #A3A3A3;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;
```

### Semantic Aliases (dùng trong code thay vì primitive)

```css
--bg-app:        var(--color-surface-base);
--bg-card:       var(--color-surface-card);
--bg-card-soft:  var(--color-surface-subtle);
--bg-chip:       var(--color-primary-50);
--bg-avatar:     var(--color-primary-100);
--bg-selected:   var(--color-primary-50);
--bg-disabled:   var(--color-neutral-100);

--fg-primary:    var(--color-text-primary);
--fg-secondary:  var(--color-text-secondary);
--fg-tertiary:   var(--color-text-tertiary);
--fg-on-brand:   var(--color-text-inverse);
--fg-brand:      var(--color-primary-700);
--fg-link:       var(--color-text-link);
--fg-urgent:     var(--color-urgent-text);

--border-hairline: var(--color-neutral-200);
--border-soft:     var(--color-neutral-300);
--border-selected: var(--color-primary-500);

--brand-fill:        var(--color-primary-500);
--brand-fill-hover:  var(--color-primary-600);
--brand-fill-active: var(--color-primary-700);
```

---

## Typography

### Font

**Primary font:** Noto Sans JP — hỗ trợ đầy đủ tiếng Việt (Latin Extended) và tiếng Nhật (CJK).

```css
--font-family-base: 'Noto Sans JP', -apple-system, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
```

Import: `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap');`

**Lý do chọn Noto Sans JP:**
- Hỗ trợ Latin + Vietnamese diacritics đầy đủ
- Hỗ trợ CJK nếu cần thêm tiếng Nhật sau
- Free, Google Fonts, load ổn định
- Legible ở kích thước nhỏ trên mobile

### Scale

```css
--font-size-xs:   12px;   /* caption, badge label */
--font-size-sm:   14px;   /* secondary text, metadata */
--font-size-base: 16px;   /* body text — minimum */
--font-size-md:   18px;   /* subheading, card title */
--font-size-lg:   20px;   /* section heading */
--font-size-xl:   24px;   /* page title */
--font-size-2xl:  28px;   /* large heading (ít dùng) */
```

### Line Height

```css
--line-height-tight:  1.25;   /* heading */
--line-height-normal: 1.5;    /* body text */
--line-height-loose:  1.75;   /* long-form text */
```

### Font Weight

```css
--font-weight-normal:   400;
--font-weight-medium:   500;  /* label, button text */
--font-weight-semibold: 600;  /* subheading */
--font-weight-bold:     700;  /* heading, emphasis */
```

### Semantic Typography Classes

```css
.vt-display  /* 28px bold — large heading */
.vt-h1       /* 24px bold — page title */
.vt-h2       /* 20px semibold — section heading */
.vt-h3       /* 18px semibold — card title */
.vt-body     /* 16px regular — body text */
.vt-secondary /* 14px regular — metadata, subtext */
.vt-label    /* 14px medium — form label */
.vt-tiny     /* 12px — caption, badge */
```

---

## Spacing Scale

Base unit: **4px**

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

**Dùng phổ biến nhất:**
- `space-3` (12px): gap giữa cards trong list
- `space-4` (16px): padding trong card, screen horizontal padding
- `space-6` (24px): padding bottom sau list
- `space-8` (32px): khoảng cách giữa sections lớn

**Aliases:** `--s-1` → `--s-8` tương ứng.

---

## Border Radius

```css
--radius-sm:   4px;     /* tag, badge nhỏ */
--radius-md:   8px;     /* input, button */
--radius-lg:   12px;    /* card */
--radius-xl:   16px;    /* modal, bottom sheet */
--radius-full: 9999px;  /* pill, avatar, chip */
```

---

## Shadow

Dùng shadow nhẹ — app cần cảm giác nhẹ nhàng, không heavy.

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06);

/* Brand-tinted — chỉ dùng cho primary CTA và FAB */
--shadow-primary-lift: 0 4px 14px rgba(255, 137, 102, 0.22), 0 2px 6px rgba(31, 31, 31, 0.06);
--shadow-fab:          0 6px 16px rgba(255, 137, 102, 0.35), 0 2px 4px rgba(31, 31, 31, 0.08);

/* Hairline bottom — dùng cho header, bottom nav */
--shadow-hairline-bottom: inset 0 -1px 0 var(--color-neutral-200);
```

**Aliases:** `--shadow-card` = `shadow-sm`, `--shadow-lifted` = `shadow-primary-lift`.

---

## Motion

```css
--ease-soft:      cubic-bezier(0.32, 0.72, 0.32, 1);
--duration-fast:  120ms;   /* micro-interactions: toggle, tap feedback */
--duration-base:  200ms;   /* transitions thông thường */
--duration-slow:  320ms;   /* slide-up modal, screen transition */
```

---

## Core Components

### Button

**Variants:**

| Variant | Visual | Dùng khi |
|---|---|---|
| `primary` | Filled coral `#FF8966`, text trắng | CTA chính: Gửi nhờ giúp, Tôi giúp được |
| `secondary` | Outlined `border primary-500`, text `primary-700` | Action thứ 2: Không lần này, Chỉnh sửa |
| `disabled` | Opacity thấp, `bg-disabled`, không click được | Form chưa đủ điều kiện submit |

**Modifier:** `.fc-btn--block` = full-width.

**Sizes:** height tối thiểu 44px (tap target), full-width CTA dùng `fc-btn--block`.

**States:** Normal → Hover (primary-600) → Pressed (primary-700) → Disabled → Loading (spinner).

---

### FAB (Floating Action Button)

- Coral `#FF8966`, hình tròn, shadow-fab
- Position: `absolute`, bottom-right, trên BottomNav
- Icon: dấu `+` (Plus), size 26px
- Label mặc định: "Nhờ giúp" (aria-label)
- Chỉ xuất hiện trên Home screen

---

### Bottom Navigation

3 tabs cố định ở đáy màn hình:

| Tab | Icon | Label |
|---|---|---|
| `home` | Home icon | Vòng của tôi |
| `new` | PlusCircle icon | Nhờ giúp |
| `profile` | User icon | Hồ sơ |

**Active state:** Icon + label đổi màu `primary-500`.
**Inactive state:** Icon + label màu `neutral-400`.
Background trắng, `shadow-hairline-bottom` phía trên.
Safe area padding bottom cho iOS home indicator.

---

### Top Header

- Background trắng, `shadow-hairline-bottom`
- Cấu trúc: [back button] + title + [sub title] + [right icon]
- Title: `font-size-md` (18px), `font-weight-bold`
- Sub: `font-size-xs` (12px), `color-text-secondary`
- Back button: ArrowLeft icon 24px
- Right icon: 22px (Bell, Settings...)

---

### Request Card

Card trong Home feed:

```
[UrgentPill nếu urgent]
[IconTile emoji] [title bold 13px secondary] 
                 [desc 15px, truncate 80 chars]
[Meta: clock icon] [when]  [Meta: pin icon] [place]
[Meta: user icon] [asker name]
[Button primary "Tôi giúp được"] [Button secondary "Không lần này"]
```

- Padding: 16px
- Border radius: `radius-lg` (12px)
- Background: white
- Shadow: `shadow-sm`
- Buttons: grid `1fr auto`

---

### Category Tile

Dùng trong form New Request — 3x2 grid (5 loại + 1 ô):

- Mặc định: background `surface-subtle`, border `neutral-200`
- Selected: background `primary-50`, border `primary-500`
- Nội dung: emoji lớn + label nhỏ bên dưới
- Border radius: `radius-md` (8px)

---

### Info Block

Dùng trong Request Detail:

```
[Icon 20px] [Label nhỏ secondary]
            [Value primary bold]
```

---

### Avatar

- Hình tròn, `border-radius: full`
- Sizes: md = 40px, lg = 56px
- Background: `primary-100` (coral nhạt)
- Content: emoji

---

### Chip / Pill

- `radius-full` (pill shape)
- Variant mặc định: background `primary-50`, text `primary-700`
- Variant neutral: background `neutral-100`, text `neutral-600`
- UrgentPill: background `urgent-badge` (#E11D48), text trắng, label "Gấp"

---

### Member Row

```
[Avatar] [Name bold 15px]
         [Pin icon] [place 13px secondary]
         [kids info 13px secondary]
         [Chip tags...]        [MsgCircle icon tertiary]
```

- Card padding: 14px
- Chat icon: hand-off sang LINE (không build chat trong app — Constitution)

---

### Invite CTA

- Dashed border `neutral-300`
- Background transparent
- Icon UserPlus + text "Mời thành viên mới"
- Border radius: `radius-lg`

---

### Field (Form Wrapper)

```
[Label 14px medium]
[Children: input / tiles / buttons]
```

Gap giữa các Field: 22px.

---

### Input / Textarea

```css
/* Default */
border: 1px solid neutral-300, background white, radius-md

/* Focus */
border-color: primary-500, shadow-sm

/* Error */
border-color: error-500, background error-50
```

Textarea có `maxLength={200}` + live counter `{n}/200`.

---

### Toast

- Xuất hiện trên cùng màn hình (dưới status bar)
- Duration: 3s (success/info), 5s (error), đóng khi tap
- Animation: slide-in từ trên, fade-out
- Border radius: `radius-md`

| Type | Background | |
|---|---|---|
| Success | `success-500` | ✓ |
| Error | `error-500` | ! |
| Info | `neutral-700` | i |

---

### Modal / Bottom Sheet

- Backdrop: `surface-overlay` (rgba 40% black)
- Tap backdrop để đóng
- Border radius top: `radius-xl` (16px)
- Drag handle bar ở trên cùng
- Animation: slide-up từ dưới, `duration-slow` (320ms), `ease-soft`

---

## Tone & Voice Guide

### Nguyên tắc giọng văn

- **Thân thiện, không formal:** Dùng "bạn". Không dùng "quý khách", "người dùng", "thành viên".
- **Ngắn gọn:** Câu ngắn. Không vòng vo.
- **Không phán xét:** Error message phải solution-focused.
- **Invitation-style cho empty state:** Mời thay vì thông báo trống.
- **Emoji sparingly:** Chỉ khi thật sự thêm warmth. Không dùng trong error messages.

### Ví dụ

| Tình huống | Không dùng | Dùng |
|---|---|---|
| Empty feed | "Không có aid request nào." | "Vòng của bạn đang yên tĩnh. Cần nhờ gì không?" |
| Success post | "Đăng thành công." | "Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay." |
| Error network | "Lỗi kết nối. Vui lòng thử lại." | "Không tải được. Kiểm tra mạng và thử lại." |
| Profile prompt | "Vui lòng hoàn thành hồ sơ." | "Điền thêm một chút để mọi người biết gọi bạn là gì." |
| Decline (silent) | N/A | (Không thông báo gì — Constitution Nguyên tắc 3) |

### Không bao giờ dùng

- "Quý khách" / "Kính chào"
- "Lỗi: [error code]"
- VIẾT HOA TOÀN BỘ để nhấn mạnh
- "Bạn chưa có..." (negative framing) → dùng "Thêm X để bắt đầu"

---

## Responsive & PWA

**Target:** Mobile-first, 375px–428px (iPhone SE → iPhone Pro Max).

**Không cần responsive tablet/desktop cho MVP.**

**Safe areas:**
- Top: `env(safe-area-inset-top)` — notch / dynamic island (SAFE_TOP = 54px)
- Bottom: `env(safe-area-inset-bottom)` — home indicator (SAFE_BOTTOM = 28px)

**Touch targets:** Tất cả interactive elements tối thiểu **44×44px**.

---

*Nguồn: colors_and_type.css (Phase 3 Design) | constitution.md Nguyên tắc 2, 3, 4 | decision-log.md D-007, D-008*
*Tạo: 2026-05-16 | Cập nhật: 2026-05-16 | Phase 3*
