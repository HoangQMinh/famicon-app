---
title: Microcopy Guide — Vòng Tròn Tương Trợ
phase: Phase 3
last_updated: 2026-05-16
---

# Microcopy Guide

> Hướng dẫn tone và copy mẫu cho toàn bộ app. Mọi text trong UI phải qua lens này.

---

## Nguyên tắc giọng văn

### 1. Ấm áp, như người thân trong nhà

Không phải corporate ("Yêu cầu của bạn đã được ghi nhận"), không phải chatbot ("Xin chào! Tôi có thể giúp gì cho bạn?"). Như người trong nhà nói chuyện với nhau.

❌ `Yêu cầu hỗ trợ đã được tạo thành công.`
✅ `Đã gửi! Vòng của bạn sẽ thấy ngay thôi.`

### 2. Ngắn gọn — không giải thích thừa

Người dùng đang bận, con đang khóc, đừng bắt họ đọc nhiều.

❌ `Vui lòng nhập địa chỉ email hợp lệ để chúng tôi có thể gửi mã xác nhận.`
✅ `Nhập email để nhận mã.`

### 3. Chủ động, không bị động

Câu chủ động ngắn hơn và dễ hiểu hơn.

❌ `Mã xác nhận đã được gửi bởi hệ thống đến email của bạn.`
✅ `Đã gửi mã đến email của bạn.`

### 4. Không phán xét, không áp lực

Không có "Bạn chưa làm gì cả!", "Đừng quên!", "Hãy tích cực hơn!".
Constitution: Nguyên tắc 4 — tôn trọng mặt.

❌ `Bạn chưa nhờ giúp lần nào. Hãy thử ngay!`
✅ `Khi cần ai đó, vòng của bạn luôn ở đây.`

### 5. Tiếng Việt tự nhiên, không dịch máy

Dùng cấu trúc câu tiếng Việt thật, không dịch word-for-word từ tiếng Anh.

❌ `Không có kết quả nào được tìm thấy.`
✅ `Chưa có gì ở đây.`

---

## Vocabulary chuẩn

Dùng đồng nhất toàn app:

| Khái niệm | Dùng | Không dùng |
|---|---|---|
| Nhóm bạn bè / cộng đồng | Vòng | Group, nhóm, cộng đồng, circle |
| Người trong vòng | Thành viên | Người dùng, member, user |
| Xin trợ giúp | Nhờ giúp | Đăng yêu cầu, request, post |
| Người trợ giúp | Giúp được | Helper, volunteer |
| Địa điểm | Nơi đón / Nơi đến | Location, địa điểm |
| Thời gian | Hôm nay lúc 16:30 | 2026-05-16 16:30:00 |
| Cấp bách | Gấp | Urgent, khẩn cấp |
| Gửi yêu cầu | Gửi nhờ giúp | Submit, đăng, post |

---

## Copy mẫu theo màn hình

### Auth — Nhập email

| Element | Copy |
|---|---|
| Heading | `Chào mừng đến Vòng của [tên vòng]` |
| Label | `Nhập email của bạn` |
| Button | `Gửi mã xác nhận` |
| Loading | `Đang gửi…` |
| Error — email không trong invite list | `Email này chưa được mời. Kiểm tra lại hoặc hỏi người mời bạn.` |
| Footer | `Bạn chưa có lời mời? Hỏi người thân trong vòng.` |

### Auth — Nhập OTP

| Element | Copy |
|---|---|
| Heading | `Kiểm tra email của bạn` |
| Sub | `Chúng tôi đã gửi mã 6 số đến [email].` |
| Button | `Xác nhận` |
| Loading | `Đang xác nhận…` |
| Resend (countdown) | `Gửi lại (00:45)` |
| Resend (active) | `Gửi lại` |
| Error — sai OTP | `Mã không đúng. Còn [N] lần thử.` |
| Error — hết lượt | `Vui lòng yêu cầu mã mới.` |

### Onboarding Profile

| Element | Copy |
|---|---|
| Heading | `Tạo hồ sơ của bạn` |
| Sub | `Vòng sẽ thấy thông tin này.` |
| Field: Họ tên | `Họ và tên` |
| Placeholder: Họ tên | `Nguyễn Thị Linh` |
| Field: Con nhỏ | `Con nhỏ (tùy chọn)` |
| Placeholder: Con nhỏ | `Bé 3 tuổi, bé 6 tuổi` |
| Field: Khu vực | `Khu vực (quận / thành phố)` |
| Placeholder: Khu vực | `Yokohama` |
| Button | `Vào vòng của tôi` |

### Circle Home

| Element | Copy |
|---|---|
| Header title | `[Tên vòng]` |
| Header sub | `[N] gia đình` |
| Empty state | `Vòng của bạn chưa có yêu cầu nào. Khi ai đó cần giúp, bạn sẽ thấy ở đây.` |
| FAB aria-label | `Nhờ giúp` |

### Request Card

| Element | Copy |
|---|---|
| Button giúp | `Tôi giúp được` |
| Button từ chối | `Không lần này` |
| Pill cấp bách | `Gấp` |

### Request Detail

| Element | Copy |
|---|---|
| Button giúp | `Tôi giúp được — Nhắn tin` |
| Info note | `Nhấn để kết nối qua LINE và thống nhất chi tiết.` |
| Label: thời gian | `Thời gian` |
| Label: địa điểm | `Nơi đón / nơi đến` |
| Label: người nhờ | `Người nhờ` |

### New Request Form

| Element | Copy |
|---|---|
| Heading | `Nhờ giúp` |
| Field 1 label | `Loại giúp đỡ` |
| Field 2 label | `Chi tiết` |
| Placeholder field 2 | `Bé học lớp 1, trường Minato Sho. Cần đón lúc 15:30.` |
| Field 3 label | `Thời gian` |
| Placeholder field 3 | `Hôm nay lúc 15:30` |
| Field 4 label | `Nơi đón / nơi đến` |
| Placeholder field 4 | `Trường Minato Sho, Yokohama` |
| Field 5 label | `Có gấp không?` |
| Button gấp | `Có, gấp` |
| Button không gấp | `Không, từ từ được` |
| Submit button | `Gửi nhờ giúp` |
| Submitting | `Đang gửi…` |
| Success toast | `Đã gửi! Vòng của bạn sẽ thấy ngay thôi.` |

### Profile

| Element | Copy |
|---|---|
| Header title | `Hồ sơ` |
| Section: kids | `Con nhỏ` |
| Section: skills | `Tôi có thể giúp` |
| Edit button | `Chỉnh sửa` |
| Member link | `Thành viên vòng` |
| Settings link | `Cài đặt` |

### Members

| Element | Copy |
|---|---|
| Header title | `Thành viên` |
| InviteCTA | `Mời thành viên mới` |
| Empty state | `Vòng của bạn chỉ có một mình bạn. Mời thêm gia đình nào!` |

### Invite Member

| Element | Copy |
|---|---|
| Header | `Mời thành viên mới` |
| Link label | `Link mời` |
| Expiry | `Hết hạn: [ngày/tháng/năm]` |
| Button 1 | `Chia sẻ link` |
| Button 2 | `Sao chép link` |
| Button 2 (copied) | `Đã sao chép ✓` |
| Button 3 | `Tạo link mới` |
| Info note | `Link mời hết hạn sau 7 ngày. Bạn sẽ được nhắc vào ngày thứ 5.` |
| Dialog confirm | `Tạo link mới sẽ huỷ link cũ. Tiếp tục?` |
| Link expired heading | `Link mời đã hết hạn` |
| Link expired body | `Link này không còn hiệu lực. Nhờ người mời bạn gửi link mới nhé.` |

### Notification

| Element | Copy |
|---|---|
| Header | `Thông báo` |
| Mark all read | `Đọc tất cả` |
| Empty heading | `Chưa có thông báo nào` |
| Empty body | `Khi có yêu cầu mới trong vòng bạn sẽ thấy ở đây.` |

---

## Notification copy (Web Push)

| Type | Title | Body |
|---|---|---|
| `urgent_request` | `Yêu cầu gấp trong vòng` | `[Tên] nhờ [loại aid] — [thời gian]` |
| `new_request` | `Yêu cầu mới trong vòng` | `[Tên] cần [loại aid]` |
| `helper_confirmed` | `Có người giúp bạn rồi!` | `[Tên] sẽ [loại aid] cho bạn` |
| `invite_reminder` | `Link mời sắp hết hạn` | `Link mời vào vòng [tên] sẽ hết hạn trong 2 ngày` |
| `new_member` | `Thành viên mới` | `[Tên] vừa vào vòng của bạn` |

---

## Error messages

### Nguyên tắc viết error

1. Nói **chuyện gì xảy ra**, không nói "Có lỗi xảy ra"
2. Nếu user có thể fix: nói **cần làm gì**
3. Không blame user ("Bạn đã nhập sai")
4. Ngắn — max 2 câu

| Situation | ❌ Tránh | ✅ Dùng |
|---|---|---|
| Network error | `Có lỗi xảy ra. Vui lòng thử lại.` | `Không kết nối được. Kiểm tra mạng và thử lại nhé.` |
| OTP sai | `Mã xác nhận không hợp lệ.` | `Mã không đúng. Còn [N] lần thử.` |
| Form thiếu field | `Trường này là bắt buộc.` | `Cần điền [tên field] để gửi.` |
| Server error | `Internal server error 500.` | `Có chuyện bên trong rồi. Thử lại sau vài giây nhé.` |
| Session expire | `Your session has expired.` | `Phiên đăng nhập hết hạn. Đăng nhập lại nhé.` |

---

## Thời gian hiển thị

Luôn dùng định dạng tự nhiên, không timestamp ISO:

| Thời điểm | Hiển thị |
|---|---|
| <1 phút trước | `Vừa xong` |
| 1-59 phút trước | `[N] phút trước` |
| 1-23 giờ trước | `[N] giờ trước` |
| Hôm nay | `Hôm nay lúc [HH:MM]` |
| Hôm qua | `Hôm qua lúc [HH:MM]` |
| Trong tuần này | `[Thứ N] lúc [HH:MM]` (ví dụ: "Thứ Ba lúc 15:30") |
| >1 tuần | `[ngày/tháng] lúc [HH:MM]` |

---

## Empty states

Mỗi empty state cần: icon / emoji + heading + body ngắn (không CTA nếu không cần thiết).

| Screen | Icon | Heading | Body |
|---|---|---|---|
| Circle Home (không có request) | 🏠 | `Yên tĩnh hôm nay` | `Khi ai đó trong vòng cần giúp, bạn sẽ thấy ở đây.` |
| Notification (rỗng) | 🔔 | `Chưa có thông báo nào` | `Khi có yêu cầu mới trong vòng bạn sẽ thấy ở đây.` |
| Members (chỉ có mình) | 👤 | `Chỉ có một mình bạn` | `Mời thêm gia đình để bắt đầu vòng của bạn.` |
| Discovery (sprint 0-10) | 🔍 | `Sắp ra mắt` | `Tính năng tìm gia đình gần bạn đang được phát triển. Sẽ có mặt sớm thôi!` |

---

## Loading states

Không dùng spinner đơn độc — kèm text ngắn:

| Action | Loading text |
|---|---|
| Gửi OTP | `Đang gửi…` |
| Xác nhận OTP | `Đang xác nhận…` |
| Gửi request | `Đang gửi…` |
| Tải trang | `Đang tải…` |
| Lưu profile | `Đang lưu…` |

---

*Nguồn: Tone của product-discovery-v3.md + Constitution Nguyên tắc 4 (tôn trọng mặt) + Nguyên tắc 3 (yên tĩnh)*
*Khởi tạo: 2026-05-16 | Dùng cho toàn bộ Phase 4 implementation*
