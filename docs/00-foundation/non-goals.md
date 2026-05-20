# Non-Goals — Vòng Tròn Tương Trợ

> Danh sách những điều sản phẩm KHÔNG làm — có chủ ý, không phải vì quên.
> Mỗi mục có lý do ngắn gọn. Khi có áp lực scope creep, đây là tài liệu để refer.

---

## Tính năng không có trong MVP

### 1. In-app chat hay messaging

**Không làm.** App không build chat 1-1 hay group chat. Sau khi match xảy ra hoặc connection request được accept, hai bên hand-off sang LINE hoặc Messenger. Build chat riêng không phải core value và tăng complexity không tương xứng.

### 2. Discovery đầy đủ (feed, browsing, matching algorithm)

**Không làm.** Discovery nhẹ trong MVP giới hạn ở: opt-in, hiển thị khu vực + tuổi con, gửi lời chào → hand-off LINE. Không có feed lướt, không có matching algorithm phức tạp, không có browsing profile. Discovery đầy đủ là social network — không phải cái sản phẩm này muốn là.

### 3. Ledger, điểm số, credit, huy hiệu

**Không làm.** Người Việt vận hành tương trợ theo văn hoá ân tình, không phải logic transactional. Bất kỳ hệ thống đo đếm nào về hành vi giúp đỡ sẽ phá vỡ dynamic tự nhiên và giết sản phẩm.

### 4. Đánh giá hay rating thành viên

**Không làm.** Rating tạo áp lực xã hội và phá vỡ cảm giác an toàn trong vòng. Chất lượng vòng được đảm bảo bằng tiêu chí chung và safety valve, không phải điểm rating.

### 5. Vote công khai cho việc mời thành viên mới

**Không làm.** Vote công khai tạo bias xã hội và áp lực thể diện trong cộng đồng Việt. Cơ chế đã chọn là minh bạch thông tin + safety valve ẩn danh — đủ để lọc chất lượng mà không gây awkwardness.

### 6. Auto-kick thành viên inactive

**Không làm.** Trong cộng đồng Việt, người đi rồi quay lại là chuyện bình thường. Auto-kick penalize điều đó và gây cảm giác bị loại trừ. Thành viên tự rời khi muốn (manual leave).

### 7. Nút "yêu cầu tham gia" vòng có sẵn

**Không làm.** Giữ filter tự nhiên: muốn vào vòng phải được thành viên hiện tại mời. Stranger không thể tự apply vào vòng — đây là ranh giới trust quan trọng.

### 8. Browse danh sách vòng công khai

**Không làm.** Vòng kín — chỉ thấy khi đang tạo vòng trùng tiêu chí (để tránh tạo trùng). Không có directory vòng để lướt, không có public listing.

### 9. Public profile ngoài vòng

**Không làm.** Profile người dùng chỉ visible trong vòng họ là thành viên. Ngoại lệ duy nhất: discovery profile tối thiểu khi đã opt-in (chỉ khu vực + tuổi con + giới thiệu ngắn).

### 10. Moderation / report / block trong discovery

**Không làm trong MVP.** Sẽ xem xét trong Phase 5. Sprint 11-12 có rate limit và auto-expire để giảm rủi ro. Moderation đầy đủ cần thêm thời gian thiết kế để tránh ảnh hưởng xấu đến cộng đồng nhỏ.

### 11. Thanh toán hay dịch vụ có phí

**Không làm.** App không có bất kỳ transaction tiền bạc nào. Mọi tương trợ là tự nguyện, không phải dịch vụ thuê.

### 12. Booking dịch vụ trông trẻ chuyên nghiệp

**Không làm.** Đây là marketplace dịch vụ — hoàn toàn khác với peer-to-peer mutual aid giữa người đã quen. Tạo liability pháp lý và phá vỡ định vị sản phẩm.

### 13. Feed hay nội dung bài đăng chung

**Không làm.** App là công cụ điều phối theo nhu cầu, không phải mạng xã hội. Không có news feed, không có post chia sẻ nội dung, không có comment thread.

### 14. Vai trò admin với quyền đặc biệt thường trực

**Không làm.** Mô hình peer-to-peer thuần. Mọi thành viên bình đẳng. Không có ai có super permission thường trực.

### 15. Matching algorithm phức tạp

**Không làm trong MVP.** Matching v1 chỉ dùng urgency + khu vực + "khả năng có thể giúp" user đã khai báo. Matching phức tạp hơn để Phase 5 sau khi có đủ data.

---

## Không monetize theo các hướng sau

### 16. Quảng cáo

**Không làm vĩnh viễn.** Quảng cáo vi phạm cảm giác "vòng tròn riêng tư" — nền tảng của toàn bộ trust model. Đây là nguyên tắc bất biến trong constitution, không phải quyết định tạm thời.

### 17. Bán hoặc khai thác data người dùng

**Không làm vĩnh viễn.** Data của vòng tròn là của họ. Khai thác data phá vỡ trust và vi phạm tinh thần của sản phẩm.

---

## Tính năng không build vì nằm ngoài scope

### 18. Lịch chung hay lịch đưa đón tự động

Có thể là lớp 2 sau MVP (xem vision.md). Không build trong MVP — cần coordination core ổn trước.

### 19. Sự kiện vòng tròn (playdate, lễ Tết, picnic)

Có thể là lớp 3 sau MVP. Không build trong MVP.

### 20. Kết nối liên vòng

Có thể là lớp 4 sau MVP. Phức tạp về trust model khi kết nối hai vòng chưa biết nhau.

### 21. Multi-language (tiếng Nhật, tiếng Anh)

App tiếng Việt duy nhất (D-007). Target user là người Việt tại Nhật — không cần tiếng Nhật hay tiếng Anh cho MVP.

---

*Nguồn: `mvp-roadmap-v1.md` Mục 2 + `product-discovery-v3.md` Mục 4, 9*
*Tạo: 2026-05-16*
