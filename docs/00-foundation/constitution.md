# Constitution — Vòng Tròn Tương Trợ

> Kim chỉ nam bất biến của dự án. Mọi agent, mọi quyết định, mọi dòng code phải tuân theo.
> Nếu vi phạm bất kỳ điểm nào — đó là red flag cần dừng lại ngay.
>
> **Chỉ founder mới có quyền thay đổi tài liệu này. Mọi agent đều bị cấm tự ý update.**

---

## Sản phẩm là gì

> Công cụ điều phối tương trợ cho các vòng tròn gia đình Việt đã quen nhau ngoài đời tại Nhật, kèm lớp discovery nhẹ giúp gia đình Việt tìm nhau để kết bạn.

**Hai lớp giá trị:**

1. **Core — Coordination:** Điều phối tương trợ trong vòng đã có (Sprint 0-10)
   - Các gia đình đã quen nhau ngoài đời tổ chức thành vòng tròn nhỏ
   - App giúp họ nhờ vả và giúp đỡ nhau nhanh hơn, ít friction hơn, không bỏ lỡ
   - Hành vi tương trợ đã có sẵn — app không cần tạo ra hành vi này

2. **Extension — Discovery nhẹ:** Giúp gia đình Việt tìm nhau theo khu vực, kết nối qua LINE, rồi hình thành vòng mới (Sprint 11-12)
   - Opt-in hoàn toàn, thông tin tối thiểu, hand-off sang LINE
   - Discovery là cầu nối vào coordination, không phải tính năng độc lập

**Hành trình discovery:** tìm nhau → gửi lời chào → kết bạn qua LINE → quen rồi → hình thành vòng mới → tương trợ nhau qua app.

---

## Sản phẩm KHÔNG phải

- **Không phải** mạng xã hội hay app lướt profile
- **Không phải** marketplace dịch vụ trông trẻ
- **Không phải** forum nuôi dạy con hay chia sẻ kinh nghiệm
- **Không phải** app đặt booking dịch vụ chuyên nghiệp
- **Không phải** app discovery đầy đủ (feed, browsing, matching algorithm, in-app chat)
- **Không phải** app để lướt, để khám phá người lạ kiểu mạng xã hội

---

## 10 Nguyên tắc bất biến

### Nguyên tắc 1 — Coordination trước, discovery sau

Core value là điều phối tương trợ trong vòng đã có. Discovery là lớp mở rộng — phải opt-in, tối giản, và không được làm loãng trải nghiệm coordination.

**Nếu discovery phức tạp hoá UX coordination → cắt discovery.**

### Nguyên tắc 2 — Không có ledger, không đo đếm

Không hiển thị số lần giúp / số lần được giúp. Không điểm, không huy hiệu, không leaderboard. Người Việt vận hành tương trợ theo logic tích luỹ ân tình, không phải logic transactional.

**Vi phạm nguyên tắc này = giết sản phẩm.** Không có ngoại lệ.

### Nguyên tắc 3 — Tôn trọng thể diện

Nhờ giúp không gây cảm giác mắc nợ. Từ chối không cần giải thích. App không show "ai đã từ chối". Decline không thông báo cho người gửi lời chào trong discovery.

### Nguyên tắc 4 — Yên tĩnh khi không cần

Notification chỉ khi: request gấp, match cao với khả năng user, hoặc user tự bật thông báo. Không spam. Quiet hours 22:00-7:00 trừ trường hợp gấp. App không push khi không cần thiết.

### Nguyên tắc 5 — Nhanh khi cần

Post aid request trong dưới 30 giây. Cắt mọi friction không cần thiết. Form ngắn, thao tác đơn giản, không hỏi thừa.

### Nguyên tắc 6 — Vô hình hoá điều phối

User không cần biết app làm gì phía sau. Họ chỉ thấy: nhờ → được giúp. Sự phức tạp của matching và routing phải hoàn toàn ẩn đi.

### Nguyên tắc 7 — Peer-to-peer thuần

Không có vai trò admin hay coordinator thường trực. Mọi thành viên bình đẳng. Người sáng lập vòng chỉ có vai trò đặc biệt một lần khi tạo vòng, sau đó trở thành thành viên bình thường. Chất lượng vòng được đảm bảo bằng tiêu chí chung công khai, không phải bằng quyền lực của một cá nhân.

### Nguyên tắc 8 — Minh bạch không xét duyệt

Lời mời thành viên mới được thông báo cho cả vòng — nhưng không phải để vote. Minh bạch = thông tin, không phải kiểm soát. Vote công khai tạo bias xã hội và áp lực thể diện trong cộng đồng Việt.

### Nguyên tắc 9 — Vòng kín

Không public, không có feed công cộng, không share nội dung ra ngoài vòng. Chỉ thành viên trong vòng mới thấy activity của vòng đó. Cảm giác an toàn như một cuốn sổ chung của nhóm.

### Nguyên tắc 10 — Không monetize bằng quảng cáo hay data

Quảng cáo và khai thác data người dùng vi phạm cảm giác "vòng tròn riêng tư" — nền tảng của toàn bộ sản phẩm. Khi có monetize: chỉ theo hướng membership hoặc hợp tác địa phương phù hợp văn hoá.

---

## Forbidden Patterns (cho mọi agent)

Danh sách dưới đây là những điều **tuyệt đối không được làm** trong bất kỳ hoàn cảnh nào. Reviewer Agent có quyền veto bất kỳ code hay thiết kế nào vi phạm.

### Vi phạm Nguyên tắc 2 — Ledger & Counter

- Tạo column hoặc field tracking "số lần giúp" hay "số lần được giúp"
- Tạo bất kỳ aggregate counter nào về hành vi tương trợ (ví dụ: `helps_given_count`, `helps_received_count`, `reputation_score`)
- Tạo UI hiển thị ranking, leaderboard, hoặc badge liên quan đến tương trợ
- Tạo column `connection_count` trong bảng discovery settings

### Vi phạm Nguyên tắc 7 — Peer-to-peer

- Hardcode vai trò admin với super permissions thường trực
- Tạo feature vote công khai cho việc accept hay reject thành viên
- Tạo cơ chế auto-kick thành viên inactive
- Build vai trò coordinator đặc biệt có quyền thường trực

### Vi phạm Nguyên tắc 9 — Vòng kín

- Tạo public profile cho user có thể xem từ ngoài vòng (trừ discovery opt-in tối thiểu đã định)
- Tạo feed công cộng hay bất kỳ nội dung nào có thể browse từ ngoài

### Forbidden về UX

- Sử dụng dark pattern để tăng engagement (streak, FOMO, artificial urgency)
- Build chat 1-1 trong app — mọi chat phải hand-off sang LINE hoặc Messenger

### Forbidden về Privacy (đặc biệt cho Discovery)

- Hiển thị trong discovery: tên thật, ảnh, ga cụ thể, địa chỉ, vòng đang tham gia
- Notify người gửi lời chào khi bên kia decline
- Return rows discovery của user không opt-in hoặc đã hết hạn

---

## Glossary tham chiếu

Xem danh sách đầy đủ thuật ngữ tại: [glossary.md](./glossary.md)

Các thuật ngữ cốt lõi cần nắm:

- **Vòng (Circle)** — Nhóm 5-20 gia đình, là đơn vị cơ bản của sản phẩm
- **Aid Request** — Yêu cầu giúp đỡ, có 5 loại cố định
- **Safety Valve** — Cơ chế bảo vệ chất lượng vòng khi mời thành viên mới
- **Discovery Profile** — Hồ sơ opt-in tối thiểu cho lớp discovery nhẹ

---

*Nguồn: `mvp-roadmap-v1.md` Mục 2, `product-discovery-v3.md` Mục 1, 4, 8*
*Tạo: 2026-05-16 | Chỉ founder mới được update*
