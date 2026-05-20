# Vision — Vòng Tròn Tương Trợ

> Tại sao sản phẩm này tồn tại, và nó phục vụ ai.

---

## Tầm nhìn

Tạo một lớp hạ tầng nhẹ giúp các gia đình Việt tại Nhật **tìm thấy nhau và tương trợ nhau dễ dàng hơn** trong cuộc sống hàng ngày — đón con, mượn đồ, trông con ngắn hạn, hỗ trợ khi gặp khó khăn.

Nếu thành công, sản phẩm sẽ trở thành:

> Lớp hạ tầng nhẹ giúp các vòng tròn gia đình Việt tại Nhật tương trợ nhau dễ dàng và đỡ ngại hơn — không thay thế tình cảm con người, chỉ làm cho việc nhờ vả và giúp đỡ ít friction hơn.

---

## 5 Insight cốt lõi

### Insight 1 — Mutual aid đã đang xảy ra

Trong cộng đồng Việt tại Nhật, các gia đình có con nhỏ đã tự tổ chức thành các vòng tròn nhỏ (5-15 gia đình), trong đó việc tương trợ diễn ra đều đặn:

- Đón con đi học / đưa con về giúp nhau
- Chở đi bệnh viện khi cần
- Chia sẻ đồ dùng cho con (quần áo, đồ chơi, sách)
- Đi chơi cùng cuối tuần
- Hỗ trợ khi mới sinh, khi ốm

**Sản phẩm không cần tạo hành vi này — hành vi đã có.** App chỉ cần giảm friction để hành vi đó xảy ra nhanh hơn, ít bỏ lỡ hơn.

_Ghi chú: Insight này đúng với nhóm đã tìm thấy nhau. Tuy nhiên có survivor bias — những gia đình chưa tìm được vòng tròn phù hợp không có trong sample ban đầu. Đây là lý do thêm lớp discovery nhẹ vào sản phẩm._

### Insight 2 — Có một người trung tâm trong mỗi nhóm

Trong các vòng tròn đang vận hành qua Messenger / LINE, thường có một người là đầu mối điều phối tự phát: kết nối, chuyển tin, sắp xếp. Người này gánh overhead coordination mà không được công nhận.

Sản phẩm không tái tạo vai trò này. Mục tiêu là **giảm tải cho người trung tâm** bằng cách để aid request tự routing đến cả vòng, không phải qua một người. Người sáng lập vòng chỉ đóng vai trò một lần khi tạo vòng, sau đó trở thành thành viên bình thường.

### Insight 3 — Coordination friction là pain point thật

Khi cần nhờ, người dùng hiện đang:

- Nhắn từng người trên Messenger — tốn thời gian
- Không biết ai đang rảnh, ai ở gần khu vực cần
- Ngại post lên group chung vì sợ làm phiền cả nhóm
- Không match được route dù cùng đi một hướng

Kết quả: ước tính khoảng 10 lần "muốn nhờ nhưng không nhờ được" trong 6 tháng, trong nhóm 10 gia đình pilot. Phần lớn dẫn đến tự xoay sở, đôi khi lỡ việc.

### Insight 4 — Văn hoá ân tình, không phải ledger

Người Việt không vận hành tương trợ theo logic transactional. Họ vận hành theo nguyên tắc tích luỹ ân tình: giúp nhau vì quan hệ, không vì điểm số.

App tuyệt đối không được có hệ thống điểm, credit, hay ledger hiển thị. Đây là sự khác biệt văn hoá quyết định toàn bộ thiết kế — vi phạm sẽ giết sản phẩm.

### Insight 5 — Con cái là chất xúc tác, không phải mục tiêu

Hành vi tương trợ xảy ra vì có con: đón con, chăm con, chia sẻ đồ trẻ em, đi chơi với con. Con cái không phải là social bridge để cha mẹ làm quen — mà là nguyên cớ thực tế cần phối hợp.

---

## Vấn đề cần giải

Hiện tại, các vòng tròn gia đình Việt tại Nhật đang vận hành tương trợ trên Messenger / LINE / điện thoại — những công cụ không được thiết kế cho mục đích này.

**Sáu vấn đề cụ thể:**

1. **Nhắn riêng tốn thời gian** — Cần đón con gấp → phải nhắn 3-4 người 1-1 → đợi từng người trả lời → có khi quá trễ.

2. **Group chung không phù hợp** — Post xin giúp trong group chung bị xem là làm phiền cả nhóm. Mọi người ngại post.

3. **Không thấy ai available** — Không biết hôm nay ai rảnh, ai bận, ai đang ở khu vực nào.

4. **Không match được route** — A đi đón con ở ga X lúc 5pm, B cũng cần đón con ở ga X cùng giờ — nhưng không biết nhau.

5. **Đầu mối điều phối bị quá tải** — Một người trung tâm gánh hết coordination, dẫn đến mệt và đôi khi miss request.

6. **Tin nhắn quan trọng bị chìm** — Notification từ aid request lẫn với hàng nghìn tin nhắn khác trên Messenger.

---

## Định vị sản phẩm

### Sản phẩm LÀ

- Công cụ điều phối tương trợ cho nhóm đã có (core)
- Lớp discovery nhẹ opt-in giúp gia đình chưa quen tìm thấy nhau theo khu vực (extension)
- Hạ tầng liên lạc theo nhu cầu (request-based)
- Cầu nối giảm friction khi nhờ vả và giúp đỡ
- Entry point tạo vòng tròn mới thông qua discovery

### Sản phẩm KHÔNG phải

- App discovery đầy đủ (feed lướt profile, matching algorithm, in-app messaging)
- App matching cha mẹ kiểu dating app
- App đặt trông trẻ
- Mạng xã hội cộng đồng
- Forum chia sẻ kinh nghiệm

### Tagline

> "Để việc nhờ vả người Việt mình ở Nhật đỡ ngại và đỡ trễ."

---

## Người dùng mục tiêu

### Đối tượng chính

**Các vòng tròn gia đình Việt đã có sẵn:**

- 5-15 gia đình
- Đã quen nhau ngoài đời
- Sống cùng khu vực (cùng thành phố hoặc cùng tuyến tàu)
- Có con nhỏ (0-10 tuổi)
- Đã có hành vi tương trợ qua Messenger / LINE
- Có ít nhất 1 người đầu mối tự phát

### Hai tình huống trong vòng tròn

**Người sáng lập vòng (Circle Founder)**

- Người bấm nút tạo vòng đầu tiên, đặt tiêu chí và mời thành viên đầu tiên
- Sau khi tạo xong: trở thành thành viên bình thường, không gánh coordination thường trực
- Đây là đối tượng acquisition đầu tiên khi mở rộng — mỗi cộng đồng Việt mới sẽ có 1-2 người chủ động tạo vòng

**Thành viên vòng tròn**

- Onboard qua lời mời từ thành viên hiện tại
- Có quyền và khả năng giống mọi thành viên khác, kể cả quyền mời người mới
- Tham gia tương trợ theo nhu cầu

### Khu vực khởi đầu

Không launch toàn quốc. Bắt đầu từ 1-2 vòng tròn pilot ở khu vực có cộng đồng Việt mật độ cao — ví dụ: Edogawa, Yokohama, Saitama, Osaka khu Tsuruhashi.

---

## Cảm giác khi user mở app

> "Nhóm mình ở đây. Khi cần gì có thể nhờ ngay, không phải ngồi nhắn từng người."

App phải tạo cảm giác:

- Như mở một cuốn sổ nhỏ chung của nhóm
- Yên tĩnh, không ồn ào, không spam
- Tôn trọng — không show ai giúp ai bao nhiêu lần
- An toàn — chỉ người trong vòng tròn mới thấy

---

_Nguồn: `product-discovery-v3.md` Mục 1, 2, 3, 4, 5_
_Tạo: 2026-05-16_
