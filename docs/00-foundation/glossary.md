# Glossary — Vòng Tròn Tương Trợ

> Danh sách thuật ngữ chuẩn của dự án. Mọi agent, mọi tài liệu phải dùng đúng thuật ngữ này.
> Khi cần thêm thuật ngữ mới — báo Master Agent, Docs Steward update.

---

## Thuật ngữ cốt lõi

### Vòng (Circle)

Nhóm 5-20 gia đình Việt tại Nhật đã quen nhau ngoài đời, có tiêu chí chung công khai, và tương trợ nhau qua app. Đây là đơn vị cơ bản của sản phẩm — mọi tính năng coordination đều xoay quanh vòng.

*Ví dụ: "Vòng gia đình Edogawa — con mầm non" là một vòng gồm 12 gia đình sống cùng khu, có con 3-6 tuổi.*

### Tiêu chí (Circle Criteria)

Bộ rules định nghĩa "bản sắc" của một vòng, đặt khi tạo vòng và hiển thị công khai cho mọi thành viên. Bao gồm các tiêu chí cứng đo được: khu vực (ga / phường / thành phố), độ tuổi con, ngôn ngữ chung. Có thể có tiêu chí mềm tuỳ chọn. Không bao gồm tiêu chí cảm tính khó đo.

*Ví dụ: Khu vực Edogawa, con 3-6 tuổi, tiếng Việt.*

### Founder (Người sáng lập vòng)

Người bấm nút tạo vòng đầu tiên. Sau khi tạo xong và mời đủ thành viên đầu tiên, Founder trở thành thành viên bình thường — không có quyền đặc biệt thường trực. Vai trò Founder chỉ được kích hoạt lại trong trường hợp ngoại lệ (ví dụ: safety valve cần xem xét).

### Member (Thành viên)

Người đã join vòng, bình đẳng với mọi thành viên khác kể cả Founder. Có quyền post aid request, response giúp, và mời người mới vào vòng.

### Asker (Người nhờ giúp)

Thành viên đang post một aid request — tức là đang có nhu cầu cần được hỗ trợ. Đây là role theo ngữ cảnh, không phải vai trò cố định.

### Helper (Người giúp)

Thành viên đã bấm "Tôi giúp được" cho một aid request. Cũng là role theo ngữ cảnh.

### Aid Request (Yêu cầu giúp đỡ)

Yêu cầu hỗ trợ được post lên vòng, gồm 5 loại cố định: **đón con / mượn đồ / trông con ngắn / chở đi đâu / khác**. Kèm thông tin: thời gian, địa điểm, mức độ gấp. Form phải post được trong dưới 30 giây.

### Aid Response (Phản hồi giúp đỡ)

Phản hồi của Helper cho một aid request: "Tôi giúp được" hoặc "Không lần này". Khi có response "Tôi giúp được", hệ thống tạo match và hand-off chi tiết sang LINE.

### Match

Trạng thái khi một Helper đã confirm "Tôi giúp được" cho một aid request. Sau match, hai bên trao đổi chi tiết ngoài app (LINE / gặp trực tiếp).

---

## Thuật ngữ về vòng đời vòng tròn

### Active Circle (Vòng đang hoạt động)

Vòng có ít nhất 2 thành viên và có activity gần đây. Định nghĩa chính xác của "gần đây" cần quyết (xem OQ-005).

### Setting-up Circle (Vòng đang setup)

Vòng mới tạo, chưa có thành viên thứ 2, trong vòng 7 ngày đầu. Không hiện trong duplicate detection. Tự động archive sau 7 ngày nếu vẫn chỉ có 1 thành viên.

### Archived Circle (Vòng đã archive)

Vòng không còn active — do tự động archive (setting-up quá 7 ngày) hoặc founder chủ động archive. Có thể reactivate trong 30 ngày bằng cách mời được ít nhất 1 thành viên mới.

---

## Thuật ngữ về Invite Flow

### Invite Flow (Quy trình mời)

Quy trình một thành viên mời người mới vào vòng: (1) Bất kỳ thành viên nào đều có thể mời. (2) App nhắc xác nhận tiêu chí. (3) Lời mời được gửi. (4) Cả vòng nhận thông báo nhẹ. (5) Người được mời tự accept. (6) Safety valve trong 48h đầu.

### Safety Valve

Cơ chế bảo vệ chất lượng vòng: nếu trong 48 giờ đầu sau khi ai đó join, có từ 2 thành viên trở lên flag concern một cách ẩn danh → lời mời tạm dừng và người sáng lập (hoặc 2 thành viên lâu năm nhất) nhận thông báo để xem xét. Concern ẩn danh để bảo vệ thể diện người flag.

### Bypass

Hành vi thành viên nhắn riêng từng người để tìm người giúp, thay vì post aid request lên vòng. Bypass rate là chỉ số cần giảm trong Phase 1 — mục tiêu dưới 30%.

---

## Thuật ngữ về Discovery

### Discovery Profile (Hồ sơ discovery)

Hồ sơ opt-in tối thiểu của một user đã bật visibility trong lớp discovery nhẹ. Chỉ gồm: khu vực (cấp quận / thành phố), độ tuổi con, giới thiệu ngắn tuỳ chọn (tối đa 100 ký tự). Không hiển thị: tên thật, ảnh, ga cụ thể, địa chỉ, vòng đang tham gia.

### Connection Request (Lời chào)

"Gửi lời chào" từ một user đến một user khác qua lớp discovery. Bên nhận có thể Accept hoặc Decline. Accept → LINE ID hoặc deeplink hiện ra → hai bên nói chuyện ngoài app. Decline không thông báo cho người gửi.

### Discovery opt-in

Hành động một user chủ động bật visibility trong lớp discovery nhẹ. Default là TẮT. Khi bật, user chọn: khu vực hiển thị, tuổi con hiển thị, giới thiệu ngắn. Tự động expire sau 30 ngày, có nhắc gia hạn.

---

## Thuật ngữ kỹ thuật

### Trust Model (Mô hình niềm tin)

Ba lớp trust trong sản phẩm: Lớp 0 (pre-trust qua discovery, chưa quen), Lớp 1 (trust nền tảng khi vào coordination — đã quen offline), Lớp 2 (trust củng cố qua sử dụng), Lớp 3 (trust mở rộng liên vòng).

### Peer-to-peer

Mô hình trong đó mọi thành viên vòng bình đẳng — không có ai có quyền đặc biệt thường trực. Coordination xảy ra ngang hàng, không qua trung gian. Khác với mô hình hub-and-spoke.

### RLS (Row Level Security)

Tính năng của Postgres / Supabase: định nghĩa policy để mỗi user chỉ thấy dữ liệu họ được phép thấy. Coordination: user chỉ thấy data của vòng mình là thành viên. Discovery: chỉ return profile của user đang opt-in và chưa hết hạn.

### Aid Request Lifecycle

Vòng đời của một aid request: Draft → Posted → Matched → Completed (hoặc Expired). Auto-expire nếu không có match sau thời gian nhất định (OQ-010 chưa quyết).

### Hand-off

Hành động chuyển giao chi tiết liên lạc sang kênh ngoài app (LINE, Messenger) sau khi match xảy ra hoặc connection request được accept. App không build chat — hand-off là thiết kế có chủ ý.

### Circle Criteria (xem Tiêu chí)

### Server Action

Hàm chạy trên server, gọi từ frontend như function thường. Dùng cho mọi mutation trong app (post aid request, tạo vòng, v.v.). Ưu tiên hơn REST endpoint trong kiến trúc Next.js App Router.

### Edge Function

Function chạy ở Supabase Edge (Deno runtime). Dùng cho: webhook bên thứ ba (LINE), cron jobs (archive vòng), triggered events. Không dùng cho mutation thông thường từ frontend.

---

## Thuật ngữ về metrics

### Match Rate (Tỷ lệ match)

Phần trăm aid request có ít nhất 1 helper response "Tôi giúp được". Mục tiêu Phase 1: ≥70%.

### Time to Match (Thời gian đến match)

Thời gian từ khi post aid request đến khi có match đầu tiên. Mục tiêu cho request gấp: dưới 30 phút.

### Active Member (Thành viên active)

Thành viên có activity trong tháng (post hoặc nhận giúp). Định nghĩa chính xác cần quyết (OQ-005).

---

*Nguồn: `mvp-roadmap-v1.md` Mục 2 (Glossary table) + `product-discovery-v3.md` Mục 3, 5, 7, 9, 10*
*Tạo: 2026-05-16 | Cập nhật qua Docs Steward + Master Agent approve*
