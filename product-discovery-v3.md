# Product Discovery v3
## Coordination Layer + Discovery Nhẹ cho Vòng Tròn Tương Trợ của Gia Đình Việt tại Nhật

---

## 0. Lý do có các bản update

### Từ v1 → v2

Bản v1 định vị sản phẩm như một "digital neighborhood layer" — giúp các gia đình Việt **khám phá** hàng xóm Việt gần mình.

Sau khi đào sâu vào hành vi thực tế của 10 gia đình đã có sẵn, hai phát hiện quan trọng làm thay đổi định vị:

1. **Khám phá không phải vấn đề với nhóm đã quen nhau.** Các gia đình đã tìm thấy nhau qua các sự kiện văn hoá (Trung thu, lễ Tết) và Facebook. Một khi đã quen nhau, họ tự nhiên hình thành nhóm.

2. **Vấn đề thật là điều phối tương trợ.** Sau khi đã thành nhóm, việc nhờ vả và giúp đỡ nhau đã xảy ra thường xuyên — đón con đi học/về, chở đi bệnh viện, chia sẻ đồ dùng, đi chơi cùng — nhưng bị nghẽn ở khâu **liên lạc và điều phối**. Câu nói chính của user: *"Có lúc không nhờ được vì không liên lạc được."*

Bản v2 pivot từ "khám phá hàng xóm" sang "điều phối tương trợ trong vòng tròn đã có".

### Từ v2 → v3

Insight 1 của v2 ("khám phá không phải vấn đề") có **survivor bias** — sample 10 gia đình là những người đã tìm thấy nhau. Nhóm chưa tìm được nhau (chưa biết kênh nào, mới chuyển đến khu vực, ít tham gia sự kiện cộng đồng) không có trong sample.

Signal từ cộng đồng rộng hơn cho thấy: **nhiều gia đình muốn kết nối với gia đình Việt gần nhà có con cùng độ tuổi, nhưng không biết cách nào**.

Bản v3 bổ sung **lớp discovery nhẹ** (opt-in) vào MVP — giúp gia đình chưa quen tìm thấy nhau, kết nối qua LINE, rồi tự nhiên hình thành vòng tròn mới. Discovery là cầu nối vào coordination, không phải tính năng độc lập.

---

## 1. Tầm nhìn sản phẩm

Tạo một lớp hạ tầng nhẹ giúp các gia đình Việt tại Nhật **tìm thấy nhau và tương trợ nhau dễ dàng hơn** trong cuộc sống hàng ngày — đón con, mượn đồ, trông con ngắn hạn, hỗ trợ khi gặp khó khăn.

**Hai lớp giá trị:**
1. **Core — Coordination:** Điều phối tương trợ cho các vòng tròn gia đình đã quen nhau ngoài đời
2. **Extension — Discovery nhẹ:** Giúp gia đình chưa quen tìm thấy nhau theo khu vực, kết nối qua LINE, rồi hình thành vòng mới

Sản phẩm **không phải**:
- App discovery đầy đủ (feed, browsing, matching algorithm, in-app chat)
- Marketplace dịch vụ trông trẻ
- Mạng xã hội cha mẹ
- Forum nuôi dạy con

Sản phẩm **là**:
> "Công cụ điều phối tương trợ cho các vòng tròn gia đình Việt tại Nhật, kèm lớp discovery nhẹ giúp gia đình chưa quen tìm thấy nhau."

Discovery là **cầu nối vào coordination**, không phải tính năng độc lập. Hành trình: tìm nhau → kết bạn qua LINE → quen rồi → hình thành vòng → tương trợ nhau qua app.

---

## 2. Insight cốt lõi

### Insight 1 — Mutual aid đã đang xảy ra
Trong cộng đồng Việt tại Nhật, các gia đình có con nhỏ đã tự tổ chức thành các **vòng tròn nhỏ** (5–15 gia đình), trong đó việc tương trợ diễn ra đều đặn:
- Đón con đi học / đưa con về giúp nhau
- Chở đi bệnh viện khi cần
- Chia sẻ đồ dùng cho con (quần áo, đồ chơi, sách)
- Đi chơi cùng cuối tuần
- Hỗ trợ khi mới sinh, khi ốm

**Sản phẩm không cần tạo hành vi này — hành vi đã có.**

*Lưu ý: Insight này đúng với nhóm đã tìm thấy nhau. Tuy nhiên có survivor bias — những gia đình chưa tìm được vòng tròn phù hợp (mới chuyển đến, ít tham gia sự kiện, không biết kênh nào) không có trong sample 10 gia đình pilot. Đây là lý do thêm lớp discovery nhẹ vào v3.*

### Insight 2 — Có một người trung tâm trong mỗi nhóm hiện tại
Trong các vòng tròn đang vận hành qua Messenger/LINE, thường có một người là **đầu mối điều phối tự phát**: kết nối, chuyển tin, sắp xếp. Người này gánh overhead coordination mà không lương.

**Tuy nhiên, sản phẩm không tái tạo vai trò này.** Mục tiêu của app là **giảm tải cho người trung tâm hiện tại** bằng cách để aid request tự routing đến cả vòng — không phải qua một người. Người sáng lập vòng chỉ đóng vai trò một lần khi tạo vòng, sau đó trở thành thành viên bình thường.

Người trung tâm hiện tại vẫn là **đối tượng acquisition chiến lược** — vì họ có pain point lớn nhất và willingness to try cao nhất. Nhưng vai trò "coordinator thường trực" sẽ được app thay thế tối đa.

### Insight 3 — Coordination friction là pain point thật
Khi cần nhờ, user hiện đang:
- Nhắn từng người trên Messenger → tốn thời gian
- Không biết ai đang rảnh, ai ở gần khu vực cần
- Ngại post lên group chung vì sợ làm phiền cả nhóm
- Không biết ai đã giúp nhiều rồi, ai chưa từng được nhờ

Kết quả: khoảng **10 lần "muốn nhờ nhưng không nhờ được" trong 6 tháng** (trong nhóm 10 gia đình). Phần lớn dẫn đến tự xoay sở, đôi khi lỡ việc.

### Insight 4 — Văn hoá ân tình, không phải ledger
Người Việt **không vận hành tương trợ theo logic transactional**. Họ vận hành theo nguyên tắc tích luỹ ân tình, có quà đáp lễ tượng trưng cho việc lớn, quan hệ quan trọng hơn sòng phẳng.

→ App **tuyệt đối không được** có hệ thống điểm/credit/ledger hiển thị. Đây là sự khác biệt văn hoá quyết định toàn bộ thiết kế.

### Insight 5 — Con cái là chất xúc tác, không phải mục tiêu
Hành vi tương trợ xảy ra **vì có con**: đón con, chăm con, chia sẻ đồ trẻ em, đi chơi với con. Con cái không phải là social bridge để cha mẹ làm quen — mà là **nguyên cớ thực tế cần phối hợp**.

---

## 3. Vấn đề cần giải

Hiện tại, các vòng tròn gia đình Việt tại Nhật đang vận hành tương trợ trên **Messenger / LINE / điện thoại** — những công cụ không được thiết kế cho mục đích này.

Vấn đề cụ thể:

**1. Nhắn riêng tốn thời gian.** Cần đón con gấp → phải nhắn 3–4 người 1-1 → đợi từng người trả lời → có khi quá trễ.

**2. Group chung không phù hợp.** Post xin giúp trong group chung bị xem là làm phiền cả nhóm. Mọi người ngại post.

**3. Không thấy ai available.** Không biết hôm nay ai rảnh, ai bận, ai đang ở khu vực nào.

**4. Không match được route.** A đi đón con ở ga X lúc 5pm, B cũng cần đón con ở ga X cùng giờ — nhưng không biết nhau.

**5. Đầu mối điều phối bị quá tải.** Một người trung tâm gánh hết coordination, dẫn đến mệt và đôi khi miss request.

**6. Tin nhắn quan trọng bị chìm.** Notification từ aid request lẫn với hàng nghìn tin nhắn khác trên Messenger.

---

## 4. Định vị sản phẩm

### KHÔNG phải
- App discovery đầy đủ (feed lướt profile, matching algorithm, in-app messaging)
- App matching cha mẹ kiểu dating app
- App đặt trông trẻ
- Mạng xã hội cộng đồng
- Forum chia sẻ kinh nghiệm

### LÀ
- Công cụ điều phối tương trợ cho nhóm đã có (core)
- Lớp discovery nhẹ opt-in giúp gia đình chưa quen tìm thấy nhau theo khu vực (extension)
- Hạ tầng liên lạc theo nhu cầu (request-based)
- Cầu nối giảm friction khi nhờ vả
- Entry point tạo vòng tròn mới thông qua discovery

### Tagline tiềm năng
> "Để việc nhờ vả người Việt mình ở Nhật đỡ ngại và đỡ trễ."

---

## 5. Người dùng mục tiêu

### Đối tượng chính

**Các vòng tròn gia đình Việt đã có sẵn:**
- 5–15 gia đình
- Đã quen nhau ngoài đời
- Sống cùng khu vực (cùng thành phố hoặc cùng tuyến tàu)
- Có con nhỏ (0–10 tuổi)
- Đã có hành vi tương trợ qua Messenger/LINE
- Có ít nhất 1 người đầu mối

### Hai loại tình huống trong vòng tròn

Trong mô hình peer-to-peer, **không có vai trò admin/coordinator đặc biệt**. Mọi thành viên bình đẳng. Tuy nhiên, có 2 tình huống user khác nhau cần được hỗ trợ:

**Tình huống 1: Người sáng lập vòng (Circle Founder)**
- Người bấm nút tạo vòng đầu tiên
- Đặt tiêu chí chung và mời các thành viên đầu tiên
- Sau khi tạo xong, trở thành thành viên bình thường
- **Không gánh coordination thường trực** — app làm việc đó
- Đây là **đối tượng acquisition đầu tiên** khi mở rộng (mỗi cộng đồng Việt mới sẽ có 1–2 người chủ động tạo vòng)

**Tình huống 2: Thành viên vòng tròn**
- Onboard qua lời mời từ thành viên hiện tại
- Có quyền và khả năng giống mọi thành viên khác (kể cả mời người mới)
- Tham gia tương trợ theo nhu cầu

### Khu vực khởi đầu
Không launch toàn quốc. Bắt đầu từ:
- 1–2 vòng tròn pilot ở khu vực có cộng đồng Việt mật độ cao
- Ví dụ: Edogawa, Yokohama, Saitama, Osaka khu Tsuruhashi

---

## 6. Trải nghiệm cốt lõi

### Cảm giác khi user mở app
> "Nhóm mình ở đây. Khi cần gì có thể nhờ ngay, không phải ngồi nhắn từng người."

App phải tạo cảm giác:
- Như mở một cuốn sổ nhỏ chung của nhóm
- Yên tĩnh, không ồn ào, không spam
- Tôn trọng — không show ai giúp ai bao nhiêu lần
- An toàn — chỉ người trong vòng tròn mới thấy

---

## 7. Hành trình người dùng cốt lõi

### Hành trình 1 — Người cần giúp đỡ (Asker)

1. Mở app → thấy vòng tròn của mình
2. Bấm "Nhờ giúp" → form rất ngắn:
   - Cần gì? *(đón con / mượn đồ / trông 1h / chở đi đâu / khác)*
   - Khi nào? *(hôm nay 5pm / mai sáng / trong tuần)*
   - Ở đâu? *(ga, khu vực)*
   - Có gấp không? *(có / không)*
3. Đăng → người trong vòng được notify (theo mức độ gấp + match với location)
4. Ai đó nhận → match được lập → chuyển qua chat 1-1 (hoặc LINE)
5. Sau khi xong → đánh dấu hoàn thành

### Hành trình 2 — Người có thể giúp (Helper)

1. Nhận notification chỉ khi:
   - Request gấp, hoặc
   - Match với route/khu vực của mình, hoặc
   - User chủ động mở app xem
2. Bấm "Tôi giúp được" → match
3. Trao đổi chi tiết qua chat / LINE

### Hành trình 3 — Người sáng lập vòng (Circle Founder)

1. Tạo vòng → đặt **tiêu chí chung** (khu vực, tuổi con, ngôn ngữ)
2. Mời các thành viên đầu tiên (qua LINE / SMS / link)
3. Sau đó: trở thành thành viên bình thường, không có quyền đặc biệt thường trực
4. Vai trò "lâu năm nhất" chỉ kích hoạt trong trường hợp ngoại lệ (ví dụ: cần xem xét khi có ≥2 flag concern về một lời mời)

Lưu ý: trong mô hình peer-to-peer, **không có vai trò coordinator thường trực**. Người sáng lập đóng vai trò một lần khi tạo vòng, sau đó app vận hành tự động qua aid request và response.

### Hành trình 4 — Người tìm kết nối (Discoverer)

*Dành cho gia đình chưa có vòng tròn, muốn tìm gia đình Việt gần nhà.*

1. Vào Settings → bật opt-in Discovery (default tắt)
2. Chọn: khu vực hiển thị (quận/thành phố), độ tuổi con hiển thị, giới thiệu ngắn (≤100 ký tự)
3. Vào tab Discovery → thấy các gia đình đang visible gần khu vực mình
4. Bấm "Gửi lời chào"
5. Bên kia accept → LINE ID hoặc deeplink hiện ra → nói chuyện ngoài app
6. Sau khi quen ngoài đời → được mời vào vòng có sẵn hoặc cùng tạo vòng mới
7. Từ đây: trở thành Founder hoặc Member, dùng coordination features

**Điểm quan trọng:** App chỉ là nơi "thấy nhau và gửi lời chào". Toàn bộ việc xây dựng quan hệ diễn ra ngoài app (LINE, gặp trực tiếp). Đây là ranh giới rõ ràng giữa discovery nhẹ và mạng xã hội.

---

## 8. Nguyên tắc thiết kế

### 1. Coordination trước, discovery sau
Core value là điều phối tương trợ trong vòng đã có. Discovery là lớp mở rộng — phải opt-in, tối giản, và không được làm loãng trải nghiệm coordination.

**Với coordination:** App chỉ vận hành trong các vòng tròn đã có quan hệ offline. Mọi tính năng coordination tôn trọng nguyên tắc này.

**Với discovery:** Ngoại lệ có kiểm soát — opt-in rõ ràng, thông tin tối thiểu (khu vực quận/TP + tuổi con), hand-off ra ngoài app (LINE). App không build quan hệ — app chỉ giúp người ta thấy nhau.

Nếu discovery phức tạp hoá UX coordination → cắt discovery.

### 2. Không có ledger, không đo đếm
Không hiển thị "bạn đã giúp X lần", "bạn được giúp Y lần". Không điểm, không huy hiệu, không leaderboard. Đây là sự khác biệt văn hoá quan trọng nhất — vi phạm sẽ giết sản phẩm.

### 3. Tôn trọng thể diện (面子)
- Nhờ giúp phải dễ dàng và **không gây cảm giác mắc nợ**
- Từ chối phải nhẹ nhàng và **không cần giải thích**
- Không show "ai đã từ chối"

### 4. Yên tĩnh khi không cần
App **không** spam notification. Chỉ ping khi:
- Request gấp
- Match cao với khả năng của user
- User chủ động bật "tôi có thể giúp hôm nay"

### 5. Nhanh khi cần
Request phải post được trong **dưới 30 giây**. Mọi friction phải bị cắt.

### 6. Vô hình hoá điều phối
Người dùng không cần biết app đang làm gì phía sau. Họ chỉ cần thấy: nhờ → được giúp.

### 7. Peer-to-peer với tiêu chí rõ ràng
Không có vai trò admin/coordinator thường trực. Mọi thành viên bình đẳng. Chất lượng vòng được đảm bảo bằng **tiêu chí chung công khai** (khu vực, tuổi con, v.v.) — không phải bằng quyền lực của một cá nhân.

### 8. Minh bạch không xét duyệt
Khi có thành viên mới được mời, cả vòng được **thông báo** (biết thông tin) — nhưng không phải **vote** (cho phép). Sự khác biệt này là then chốt với văn hoá Việt: minh bạch giữ niềm tin, vote công khai tạo bias và áp lực thể diện.

---

## 9. Phạm vi MVP

### Phải có

**Vòng tròn (Circle)**
- Tạo bởi bất kỳ thành viên nào (peer-to-peer, không có vai trò admin đặc biệt)
- Tối đa 20 gia đình mỗi vòng (giữ tính thân thiết)
- Mỗi vòng có **tiêu chí chung** rõ ràng (xem mục Tiêu chí vòng tròn bên dưới)

**Tiêu chí vòng tròn (Circle Criteria)**
- Đặt khi tạo vòng, hiển thị công khai cho mọi thành viên
- Là "bản sắc" của vòng — ai vào cũng biết vòng dành cho ai
- Bao gồm các tiêu chí cứng, đo được:
  - **Khu vực** (ga gần nhất / phường / thành phố)
  - **Độ tuổi con** (ví dụ: 0–3 tuổi, 3–6 tuổi, mầm non, tiểu học)
  - **Ngôn ngữ chung** (tiếng Việt)
  - **Các tiêu chí mềm tuỳ chọn** (ví dụ: "gia đình mới sang Nhật", "có con trai/gái cùng tuổi")
- KHÔNG bao gồm tiêu chí cảm tính khó đo ("hoà đồng", "không drama") — những thứ này để quy trình tự nhiên xử lý

**Hồ sơ gia đình (rất ngắn)**
- Họ tên, ảnh đại diện (tuỳ chọn)
- Khu vực sống (ga gần nhất)
- Tuổi của con
- Khả năng có thể giúp *(tuỳ chọn: đón con khu X, mượn đồ Y...)*

**Cơ chế mời thành viên (Invite Flow)**

Triết lý: peer-to-peer, không vote công khai, không xét duyệt. Minh bạch nhưng không cản trở.

Quy trình:

1. **Bất kỳ thành viên nào** đều có thể mời người mới
2. Khi bấm "Mời", app hiển thị nhắc nhở:
   > *"Vòng này dành cho [tiêu chí]. Bạn xác nhận người được mời phù hợp?"*
3. Người mời tự xác nhận → lời mời được gửi
4. **Cả vòng nhận thông báo nhẹ** (thông tin, không phải vote):
   > *"[Tên A] đã mời gia đình [tóm tắt B] vào vòng."*
5. **Mặc định: người được mời vào ngay** sau khi accept lời mời
6. **Safety valve**: trong 48 giờ đầu, nếu ≥2 thành viên flag concern **ẩn danh** → lời mời tạm dừng, người tạo vòng (hoặc 2 thành viên lâu năm nhất) nhận thông báo để xem xét
7. Bất kỳ thành viên nào có concern đều có thể nhắn riêng cho người mời — đây là kênh cá nhân, không qua app

Nguyên tắc:
- **Default = open**. Không phải xin phép.
- **Minh bạch = thông tin**, không phải vote.
- **Concern được tôn trọng**, nhưng kín đáo.
- **Tốc độ** ưu tiên (lời mời không kẹt quy trình).

**Yêu cầu giúp đỡ (Aid Request)**
- Form 30 giây
- 5 loại cố định: đón con / mượn đồ / trông con ngắn / chở đi đâu / khác
- Thời gian, địa điểm, mức độ gấp

**Phản hồi giúp đỡ**
- "Tôi giúp được" / "Tôi không giúp được lần này"
- Chuyển sang chat 1-1 hoặc LINE để chốt chi tiết

**Thông báo thông minh**
- Match theo location + thời gian + khả năng
- Mức độ ping khác nhau theo urgency
- Cho phép tắt theo ngày/giờ

**Bảng vòng tròn**
- Xem request đang mở
- Xem hoạt động tuần này (gọn nhẹ, không đo đếm)

**Vòng đời thành viên (Member Lifecycle)**

- **Rời vòng**: manual (thành viên tự bấm), không tự động kick người inactive
- **Khi rời**: không thông báo cho vòng (tránh awkwardness, giữ thể diện)
- **Lịch sử mềm**: hệ thống nhớ người đã từng là thành viên → người sáng lập có thể "mời lại" nhanh (1 click), nhưng vẫn qua flow mời chuẩn (nhắc tiêu chí + thông báo nhẹ)
- Lý do: trong cộng đồng Việt, người đi rồi quay lại là chuyện bình thường — không nên penalize

**Quản lý số vòng (Multi-circle Management)**

- **Không giới hạn cứng** số vòng một người có thể tạo hoặc tham gia
- **Giới hạn mềm 5 vòng active**: khi một người vượt 5 vòng → app nhắc nhở về capacity (không chặn)
- **Soft friction** để chống tạo bừa:
  - Tạo vòng thứ 3 trở lên → hiển thị nhắc nhở về capacity
  - Vòng không có activity sau 30 ngày → app hỏi người sáng lập có muốn giữ không

**Yêu cầu tối thiểu để vòng tồn tại**

- Vòng cần có **ít nhất 2 thành viên trong vòng 7 ngày** kể từ khi tạo
- Trong 7 ngày này, vòng ở trạng thái **"đang setup"**:
  - Không hiện ra trong duplicate detection của người khác
  - Người sáng lập có thể mời thành viên đầu tiên
- Sau 7 ngày, nếu vẫn chỉ có 1 thành viên (người sáng lập) → vòng tự động **archive**
- Archive ≠ xoá vĩnh viễn: người sáng lập có thể reactivate trong 30 ngày bằng cách mời được ít nhất 1 thành viên

Lý do: tránh vòng "ma" (1 người, không hoạt động) làm loãng hệ thống, nhưng vẫn cho người sáng lập thời gian setup mà không bị áp lực.

**Phát hiện trùng lặp (Duplicate Detection)**

Khi user tạo vòng mới, nếu app phát hiện đã có vòng cùng khu vực + tiêu chí:

> *"Có một vòng tương tự đã tồn tại: '[Tên vòng]' ([X] thành viên). Bạn muốn:*
> *- Tìm cách tham gia vòng đó (qua người sáng lập)*
> *- Vẫn tạo vòng mới (có lý do riêng)"*

- App hiển thị: tiêu chí + số thành viên + tên người sáng lập (để user biết có quen không)
- App KHÔNG hiển thị: danh sách thành viên (privacy)
- Nếu user muốn join vòng đã tồn tại → phải liên hệ người sáng lập **ngoài app** (filter tự nhiên: không có quan hệ offline thì không thuộc về vòng đó)
- Cho phép vòng song song tồn tại nếu user vẫn muốn tạo mới — không ép merge

### Không có trong MVP

- Discovery đầy đủ (feed lướt profile, browsing, matching algorithm)
- In-app messaging / chat (kể cả trong discovery flow)
- Feed / bài đăng / nội dung
- Ledger / điểm / credit
- Thanh toán
- Đánh giá / rating
- Matching algorithm phức tạp
- Profile public (ngoài discovery opt-in tối thiểu)
- Booking dịch vụ chuyên nghiệp
- **Vai trò admin / coordinator đặc biệt** (mô hình peer-to-peer thuần)
- **Vote công khai** cho việc mời thành viên
- **Auto-kick** thành viên inactive
- **Nút "yêu cầu tham gia"** vòng đã tồn tại (để giữ filter tự nhiên qua quan hệ offline)
- **Browse danh sách vòng công khai** (chỉ thấy khi đang tạo vòng trùng tiêu chí)
- **Moderation / report / block** trong discovery (Phase 5)

---

**Phần discovery nhẹ (có trong MVP — Sprint 11-12):**

Triết lý: opt-in hoàn toàn, thông tin tối thiểu, hand-off sang LINE, không build quan hệ trong app.

**Bật/tắt visibility (default tắt)**
- User chủ động bật "Tôi muốn kết nối thêm"
- Giải thích rõ khi bật: *"Gia đình Việt gần bạn sẽ thấy khu vực và tuổi con của bạn"*
- Tắt bất cứ lúc nào, xoá hoàn toàn được
- Auto-expire sau 30 ngày, nhắc gia hạn

**Thông tin hiển thị khi visible**
- Khu vực: cấp quận / thành phố (không chính xác đến ga)
- Độ tuổi con (không tên con)
- Giới thiệu ngắn tuỳ chọn (≤100 ký tự)
- **Không hiển thị:** tên thật, ảnh, ga cụ thể, địa chỉ, vòng đang tham gia

**Discovery list**
- Thấy các gia đình đang visible gần khu vực mình
- Filter theo độ tuổi con
- Không có feed, không scrollable vô hạn

**Gửi lời chào**
- 1 nút duy nhất: "Gửi lời chào"
- Rate limit: tối đa 5 lời chào/tuần (chống spam)
- Bên nhận: notification → xem khu vực + tuổi con → Accept / Decline
- Decline không thông báo cho người gửi (giữ thể diện)
- Accept → LINE ID hoặc deeplink hiện ra → nói chuyện ngoài app

**Điều app không làm trong discovery**
- Không gợi ý match
- Không hiển thị "X người đã gửi lời chào cho bạn" (trừ số thông báo)
- Không build profile đầy đủ
- Không có in-app chat

---

## 10. Mô hình niềm tin (Trust Model)

### Lớp 0 — Pre-trust (discovery, chưa quen)
- Thấy nhau qua discovery (khu vực + tuổi con)
- Gửi lời chào → accept → nói chuyện trên LINE
- Gặp ngoài đời, tự đánh giá có hợp không
- **App không can thiệp vào giai đoạn này** — chỉ là nơi "thấy nhau lần đầu"

### Lớp 1 — Trust nền tảng (đã có khi vào coordination)

Trust trong coordination **không cần được tạo ra từ zero** — vì user vào vòng tròn khi đã có trust offline (hoặc đã qua Lớp 0 discovery → LINE → gặp ngoài đời).

- Đã quen nhau ngoài đời (hoặc đã nói chuyện qua LINE sau discovery)
- Được thành viên hiện tại bảo lãnh khi mời vào vòng
- Là người Việt cùng cộng đồng

### Lớp 2 — Trust được củng cố qua sử dụng
- Lần tương trợ đầu tiên thành công
- Tích luỹ những lần giúp đỡ nhỏ
- Hiểu nhau qua context cụ thể (con ai, học ở đâu, lịch thế nào)

### Lớp 3 — Trust mở rộng (về sau)
- Thành viên ở 2 vòng tròn cùng lúc → cầu nối
- Vòng tròn này gặp vòng tròn kia qua sự kiện chung
- Trust lan theo network của hub

---

## 11. Mô hình tăng trưởng

### Đơn vị tăng trưởng là VÒNG TRÒN, không phải người dùng

Khác với app discovery (mỗi user là 1 đơn vị), ở đây:
- 1 người sáng lập → 1 vòng → 10–15 gia đình
- Acquisition không phải "download lẻ" mà là **convert một group chat hiện có sang app**

### Acquisition Strategy

**Giai đoạn 1 — Vòng pilot (founder)**
- Bạn (founder của sản phẩm) chính là người sáng lập vòng đầu tiên
- 10 gia đình của bạn là vòng pilot
- Vận hành tay 1–2 tháng để hoàn thiện UX

**Giai đoạn 2 — Vòng thứ hai, thứ ba**
- Tìm 2–3 người ở khu khác sẵn lòng đứng ra tạo vòng (Yokohama, Osaka, Nagoya...)
- Họ phải có sẵn nhóm ≥8 gia đình đang dùng Messenger để coordinate
- Onboard người sáng lập trước, họ mời thành viên bằng cơ chế peer-to-peer trong app

**Giai đoạn 3 — Tự lan**
- Trong mô hình peer-to-peer, **mọi thành viên đều có thể mời người mới**
- Một thành viên có thể ở 2 vòng (ví dụ: vòng đồng nghiệp + vòng hàng xóm)
- Một thành viên cũng có thể **tạo vòng mới** ở khu vực khác (ví dụ: chuyển nhà, có nhóm bạn mới)
- Đây là viral mechanism tự nhiên hơn mô hình hub

**Giai đoạn 4 — Mở rộng theo địa lý**
- Chỉ mở rộng khi tỷ lệ aid request được match trong vòng pilot ≥70%
- Mở rộng theo cluster cộng đồng Việt, không theo phủ địa lý

### Vì sao mô hình này khả thi
- Mỗi cộng đồng Việt ở Nhật **đã có** vài người sẵn lòng đứng ra tổ chức
- Người sáng lập có incentive cá nhân (giảm tải coordination hiện tại của họ)
- Peer-to-peer cho phép vòng tự nhân lên không phụ thuộc một cá nhân duy nhất
- Tiêu chí chung rõ ràng giúp các vòng tự phân hoá tự nhiên (vòng theo khu, vòng theo tuổi con) — không cần can thiệp từ trên xuống

---

## 12. Chỉ số thành công sớm

### KHÔNG đo
- Số download
- DAU
- Time spent in app
- Số lượng user đăng ký

### ĐO

**Chỉ số tương trợ (cốt lõi)**
- Số aid request được post / tuần / vòng
- Tỷ lệ request được match (mục tiêu ≥70%)
- Thời gian trung bình từ post → match (mục tiêu <30 phút cho request gấp)
- Tỷ lệ request được đánh dấu hoàn thành

**Chỉ số sức khoẻ vòng tròn**
- % thành viên active trong tháng (post hoặc nhận giúp)
- Tỷ lệ helper khác nhau (tránh 1 người gánh hết)
- Số "missed request" (post nhưng không ai pick) — phải thấp

**Chỉ số tăng trưởng**
- Số vòng tròn active
- Số hub tự duy trì vòng (không cần founder hỗ trợ)
- Số vòng được tạo bởi người không phải founder

---

## 13. Rủi ro lớn

### Rủi ro 1 — Vẫn dùng Messenger
User vẫn nhắn riêng dù có app, vì quen thói quen.
**Đối phó:** UX phải thực sự nhanh hơn Messenger. Hub phải dẫn dắt: *"Lần sau post ở đây nhé."*

### Rủi ro 2 — Vòng tròn loãng dần
Trong mô hình peer-to-peer, ai cũng có thể mời người mới → nguy cơ vòng tròn loãng, mất chất lượng, mất cảm giác thân thiết.
**Đối phó:**
- **Tiêu chí chung rõ ràng** khi tạo vòng (lọc tự nhiên)
- **Nhắc nhở** khi mời (force người mời cân nhắc tiêu chí)
- **Thông báo minh bạch** cho cả vòng khi có lời mời
- **Safety valve** ≥2 flag concern → tạm dừng để xem xét
- **Giới hạn kích thước** 20 gia đình/vòng

### Rủi ro 3 — Vòng quá nhỏ → ít request → app vô dụng
Vòng 5 nhà có thể không tạo đủ traffic để app cảm thấy hữu ích.
**Đối phó:** Khuyến khích vòng 10–15 nhà. Cho phép một người ở nhiều vòng.

### Rủi ro 4 — Văn hoá ngại nhờ vả
Dù đã quen nhau, một số mẹ vẫn ngại nhờ.
**Đối phó:** Post công khai trong vòng tròn *cảm thấy nhẹ hơn* nhắn riêng — vì không "ép" ai cụ thể. Đây là feature, không phải bug.

### Rủi ro 5 — Trách nhiệm pháp lý
Nếu A trông con cho B và xảy ra chuyện → vấn đề pháp lý + cộng đồng.
**Đối phó:**
- Coordination: App **không** match stranger, **không** facilitate childcare-as-service, chỉ là **kênh liên lạc** giữa người đã quen
- Discovery: App chỉ giúp gia đình thấy nhau và gửi lời chào — không có aid request giữa người lạ
- Có disclaimer rõ: "Mọi thoả thuận giúp đỡ là tự nguyện giữa các thành viên đã quen nhau"

### Rủi ro 6 — Cộng đồng đồn thổi
Cộng đồng Việt ở Nhật có gossip culture. Nếu một sự việc không hay xảy ra trong vòng → có thể lan ra cộng đồng → giết product.
**Đối phó:** Vòng kín, không public, không có chức năng share ra ngoài.

### Rủi ro 7 — TAM nhỏ
Vietnamese families with young kids in Japan là thị trường nhỏ. Có thể không scale to VC-size.
**Đối phó:** Quyết định sớm — đây là lifestyle business hay startup gọi vốn? Hai con đường có chiến lược khác nhau.

### Rủi ro 8 — Discovery incident
Cộng đồng Việt ở Nhật nhỏ và gossip lan nhanh. Nếu xảy ra harassment, stalking, hoặc trải nghiệm tiêu cực qua discovery feature → có thể giết toàn bộ product, không chỉ feature đó.
**Đối phó:**
- Opt-in rõ ràng với giải thích đầy đủ
- Thông tin hiển thị tối thiểu (quận/TP + tuổi con, không ga, không tên, không ảnh)
- Rate limit 5 lời chào/tuần
- Decline không notify người gửi
- Auto-expire 30 ngày
- Moderation plan (block/report) cho Phase 5
- Monitor chặt trong Sprint 11-12 pilot

---

## 14. Giả định cần kiểm chứng

### Giả định cốt lõi

**A1 — Coordination friction là pain đủ lớn**
User sẽ bỏ Messenger để dùng công cụ chuyên biệt nếu nó nhanh hơn.

**A2 — Người sáng lập vòng có động lực tạo vòng**
Có những người trong mỗi cộng đồng sẵn lòng đứng ra tạo vòng đầu tiên, mời thành viên ban đầu.

**A3 — Mô hình peer-to-peer giữ được chất lượng vòng**
Tiêu chí chung + cơ chế mời minh bạch đủ để vòng không bị loãng theo thời gian.

**A4 — Mở vòng tròn ở khu khác có thể lặp lại**
Pattern "có người sẵn lòng đứng ra tạo vòng" có ở nhiều khu vực, không chỉ vòng pilot.

**A5 — Văn hoá ân tình tương thích với app**
Có thể thiết kế app vừa hữu ích vừa không phá vỡ dynamic "không đo đếm".

### Giả định phụ

**A6** — Format aid request 5 loại đủ bao quát nhu cầu thực tế
**A7** — Notification thông minh không gây phiền
**A8** — Tích hợp với LINE/Messenger cho chat 1-1 đủ tốt, không cần build chat riêng
**A9** — Vòng 10–15 gia đình là kích thước tối ưu
**A10** — Cơ chế mời "thông báo minh bạch + không vote" giải quyết được nhu cầu lọc chất lượng mà không tạo bias
**A11** — Tiêu chí cứng (khu vực, tuổi con) đủ để lọc phần lớn trường hợp; trường hợp ngoại lệ được xử lý bằng safety valve
**A12** — Soft friction (nhắc nhở, hỏi lại) đủ để chống tạo vòng bừa bãi, không cần hard limit
**A13** — Giới hạn mềm 5 vòng active là mức bão hoà tự nhiên cho một người (cần verify với usage thật)
**A14** — 7 ngày là đủ thời gian để người sáng lập mời được ít nhất 1 thành viên

**A15** — Gia đình Việt sẵn sàng hiển thị khu vực quận/TP + tuổi con cho người lạ trong app nếu opt-in rõ ràng và giải thích đầy đủ

**A16** — Discovery feature không làm loãng trải nghiệm coordination (hai lớp coexist tốt trong 1 app, user không bị confused)

**A17** — "Gửi lời chào → hand-off LINE" đủ để bắt đầu quan hệ, không cần in-app messaging

---

## 15. Lộ trình kiểm chứng MVP

### Bước 1 — Pre-product validation (2 tuần)
**Không cần code.**

Tạo một channel chuyên biệt (LINE Open Chat hoặc Discord hoặc Notion shared) cho 10 gia đình hiện tại.

Quy ước: mọi aid request từ giờ post ở đây, không nhắn riêng.

Format post cố định:
- Cần gì
- Khi nào
- Ở đâu
- Gấp không

**Đo:**
- Bao nhiêu request được post/tuần
- Bao nhiêu được match
- Thời gian post → match
- Có ai vẫn bypass và nhắn riêng không? Vì sao?
- Có cảm thấy dễ nhờ hơn không?

**Thêm câu hỏi phỏng vấn về discovery:**
- "Bạn có muốn quen thêm gia đình Việt gần đây không?"
- "Nếu có, bạn đang tìm bằng cách nào?"
- "Nếu app có tính năng tìm gia đình gần theo khu vực + tuổi con, bạn có bật lên không?"

### Bước 2 — Mở rộng concierge (4 tuần)
Mời 2 hub khác (ở khu vực khác) làm thử cùng pattern.

**Đo:**
- Pattern có lặp lại không?
- Hub khác có gặp pain giống bạn không?
- Có willingness to adopt nếu có app không?

### Bước 3 — MVP app (8–12 tuần coordination + 2 tuần discovery)
Chỉ code khi bước 1 và 2 cho signal tích cực.

Build coordination core theo phạm vi mục 9 (Sprint 0-10). Sau đó build discovery nhẹ (Sprint 11-12) nếu signal từ Bước 1-2 confirm nhu cầu.

Pilot với 2–3 vòng tròn đã quen với pattern.

### Bước 4 — Lặp lại và mở rộng
- Hoàn thiện UX dựa trên usage thật
- Tìm thêm hub ở khu khác
- Chỉ mở rộng khi metric vòng hiện tại healthy

---

## 16. Tiến hoá dài hạn (có thể)

### Lớp 1 — Coordination thuần + Discovery nhẹ
*(MVP — Sprint 0-10 + Sprint 11-12)*

Coordination cho vòng đã có. Discovery nhẹ opt-in giúp gia đình chưa quen tìm nhau → kết bạn LINE → hình thành vòng mới.

### Lớp 2 — Lịch chung
Lịch đưa đón con tự động, lịch chia sẻ giữa các nhà cùng học một trường

### Lớp 3 — Sự kiện vòng tròn
Tổ chức playdate, lễ Tết, picnic dễ dàng trong vòng

### Lớp 4 — Kết nối liên vòng
Khi nhiều vòng cùng khu — sự kiện liên vòng, hỗ trợ liên vòng cho việc lớn

### Lớp 5 — Hạ tầng cộng đồng
Khi đã có nhiều vòng tròn — trở thành lớp hạ tầng cho cộng đồng Việt tại Nhật (thông tin trường học, dịch vụ y tế, kinh nghiệm xin trợ cấp...)

**Mỗi lớp chỉ build khi lớp trước đã chứng minh giá trị.**

---

## 17. Mô hình kinh doanh (dài hạn)

Không monetize sớm. Khi đã có scale:

### Tuỳ chọn 1 — Membership cho hub
Hub trả phí thấp để có công cụ quản lý vòng nâng cao

### Tuỳ chọn 2 — Hợp tác địa phương
Phòng khám Việt, dịch vụ pháp lý Việt, đồ ăn Việt — trả phí để xuất hiện trong relevant context (không phải quảng cáo)

### Tuỳ chọn 3 — Premium cho gia đình
Tính năng nâng cao như lịch chia sẻ, lưu trữ chia sẻ đồ dùng đã cho nhận

### Tuỳ chọn 4 — Bảo hiểm tương trợ
Hợp tác bảo hiểm cho việc trông con không chính thức trong vòng

**Nguyên tắc chung:** không monetize bằng quảng cáo, không monetize bằng data. Vi phạm cảm giác "vòng tròn riêng tư".

---

## 18. Lợi thế cạnh tranh

Không cạnh tranh bằng công nghệ. Lợi thế nằm ở:

- **Hiểu sâu cộng đồng Việt tại Nhật** — văn hoá ân tình, ngại nhờ, cộng đồng nhỏ
- **Hub-based growth** — khó copy nếu không có quan hệ thật trong cộng đồng
- **Trust transferred from offline** — không phải build từ zero
- **Vùng cấm tự nhiên với big tech** — quá nhỏ, quá đặc thù để Meta/LINE quan tâm

---

## 19. Luận điểm sản phẩm cuối cùng

Nếu thành công, sản phẩm sẽ trở thành:

> "Lớp hạ tầng nhẹ giúp các vòng tròn gia đình Việt tại Nhật tương trợ nhau dễ dàng và đỡ ngại hơn — không thay thế tình cảm con người, chỉ làm cho việc nhờ vả và giúp đỡ ít friction hơn."

Không phải:
- App để lướt
- App để khám phá người lạ theo kiểu mạng xã hội
- App để thuê dịch vụ
- App để chia sẻ nội dung

Mà là:
> **App giúp gia đình Việt ở Nhật tìm thấy nhau, và khi đã quen — đón con giúp nhau, mượn đồ cho con, hỗ trợ khi khó khăn — diễn ra nhanh hơn, ít ngại hơn, ít bỏ lỡ hơn.**

---

## Phụ lục — Khác biệt giữa v1, v2 và v3

| Khía cạnh | v1 | v2 | v3 |
|---|---|---|---|
| Định vị | Digital neighborhood layer | Coordination layer for aid circles | Coordination layer + Discovery nhẹ opt-in |
| Pain point chính | Cô đơn, thiếu khám phá | Coordination friction trong nhóm đã có | Coordination friction + Gia đình chưa tìm được nhau |
| Entry point | Khám phá hàng xóm Việt gần nhà | Được mời vào vòng đã có offline | Được mời vào vòng (chính), hoặc tìm thấy qua discovery (phụ) |
| Trust model | Build trust từ zero qua app | Trust đã có offline, app chỉ vận hành | Lớp 0 (pre-trust qua discovery) → Lớp 1 (trust offline) → Lớp 2-3 |
| Discovery | Core feature (v1 focus) | Không có | Lớp nhẹ opt-in: khu vực + tuổi con + lời chào → LINE |
| Childcare aid | Không build, vùng cấm | Core utility (lightweight, peer, free) | Giữ nguyên v2 |
| Acquisition unit | Cá nhân | Vòng tròn (qua người sáng lập) | Vòng tròn (chính) + Cá nhân qua discovery (phụ) |
| Growth model | Density-based | Peer-to-peer, vòng tự nhân lên | Peer-to-peer + Discovery tạo vòng mới |
| Vai trò trong vòng | (Không rõ) | Peer-to-peer, không có admin/coordinator | Giữ nguyên v2 |
| Cultural design | General | Ân tình, không ledger, minh bạch không xét duyệt | Giữ nguyên v2, thêm privacy-first cho discovery |
| MVP wedge | Discovery + connect | Aid request coordination | Coordination (Sprint 0-10) + Discovery nhẹ (Sprint 11-12) |
| Đối thủ chính | (Không rõ) | Messenger / LINE / điện thoại | Messenger/LINE (coordination) + Facebook Groups (discovery) |

---

*Bản v3 bổ sung lớp discovery nhẹ (opt-in) vào MVP dựa trên signal từ cộng đồng rộng hơn ngoài sample 10 gia đình pilot ban đầu. Core coordination giữ nguyên theo v2. Discovery là Sprint 11-12, có thể cancel nếu signal không đủ mạnh sau Phase 1-2 validation.*
