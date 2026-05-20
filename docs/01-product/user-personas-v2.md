---
title: User Personas v2 — Vòng Tròn Tương Trợ
ngày_tạo: 2026-05-16
phase: Phase 2 — Replication Test
---

# User Personas v2 — Vòng Tròn Tương Trợ

**Phiên bản:** v2 (refine từ v1 dựa trên data Phase 1)
**Tạo:** 2026-05-16
**Phase 1 kết thúc:** 3 tuần validation thành công
**Metrics Phase 1 đạt được:** 20 requests/tuần, Match Rate 75%, Bypass Rate 20%

> **Hướng đọc:** Tag `[VALIDATED]` = pain point hoặc behavior đã được xác nhận qua Phase 1 (observation hoặc phỏng vấn). Tag `[ASSUMED]` = vẫn là giả định, chưa có evidence đủ mạnh. Tag `[NEW]` = insight mới phát sinh từ Phase 1, không có trong v1.

Xem thêm: [user-personas-v1.md](./user-personas-v1.md) | [user-stories-v2.md](./user-stories-v2.md) | [constitution.md](../00-foundation/constitution.md)

---

## Thay đổi từ v1 sang v2

| Thay đổi | Chi tiết |
|---|---|
| Thêm tags VALIDATED / ASSUMED / NEW | Mọi pain point và behavior được đánh dấu theo evidence |
| Thêm Discovery Signal cho mỗi persona | Phân biệt ai có intent cao / thấp muốn tìm gia đình mới |
| Cập nhật behaviors | Bổ sung hành vi quan sát thực tế từ Phase 1 |
| Cập nhật Quote | Một số quote lấy từ phỏng vấn thực tế Phase 1 |
| Thêm mục "Validation Summary" mỗi persona | Tóm tắt giả định nào đã confirm/reject/chưa rõ |

---

## Persona 1 — Linh, "Bà mẹ chủ động"

### Thông tin cơ bản

- **Tên:** Nguyễn Thị Linh
- **Tuổi:** 34
- **Nghề nghiệp:** Kế toán tại công ty Nhật, làm part-time 4 ngày/tuần
- **Sống tại:** Edogawa, Tokyo — đã ở 6 năm
- **Gia đình:** Chồng người Việt, làm IT, hay đi công tác. Hai con: bé Nhi 4 tuổi (mầm non), bé Khoa 1.5 tuổi (nhà trẻ)

### Bối cảnh sống tại Nhật

Linh là người kết nối tự nhiên trong nhóm — quen biết rộng, hay đứng ra tổ chức. Trong Phase 1, Linh là người post request nhiều nhất và cũng là người reply giúp nhiều nhất. Linh đặc biệt thoải mái với format post request — không cần concierge nhắc nhiều.

Điều quan sát được trong Phase 1 mà v1 chưa dự đoán: Linh **không ngại nhờ nhiều lần trong tuần** khi có format rõ ràng. Barrier không phải là "ngại nhờ nhiều" mà là "không biết ai đang rảnh để nhờ đúng người".

### Goals (Mục tiêu)

- `[VALIDATED]` Nhờ giúp nhanh mà không cần nhắn từng người
- `[VALIDATED]` Giảm tải công việc relay — không muốn là đầu mối thông tin cho cả nhóm
- `[VALIDATED]` Biết ai trong nhóm có thể giúp việc gì — không phải đoán
- `[NEW]` Muốn có thêm gia đình Việt trong vòng để pool người giúp rộng hơn

### Pain Points (Vấn đề)

- `[VALIDATED]` Thông tin lẫn trong hàng trăm tin nhắn — bỏ lỡ request quan trọng
- `[VALIDATED]` Phải làm relay thủ công giữa người cần và người giúp
- `[VALIDATED]` Ngại post lên group chung vì sợ làm phiền, dù đã có vòng riêng thì ngại giảm rõ rệt
- `[NEW]` Khi vòng đã chạy ổn, Linh muốn giảm vai trò concierge nhưng không biết ai có thể thay
- `[ASSUMED]` Notification fatigue khi nhóm lớn hơn — chưa xảy ra trong Phase 1 vì nhóm vẫn nhỏ

### Behaviors (Hành vi)

- `[VALIDATED]` Mở LINE 8-10 lần/ngày, đặc biệt buổi chiều 4-6pm (giờ đón con)
- `[VALIDATED]` Là người đầu tiên reply "Tôi giúp được" trong phần lớn cases
- `[NEW]` Khi giúp được, Linh hay thêm chi tiết thực tế: "Tôi giúp được — tôi sẽ qua lúc 5:20, đứng ở cổng chính nhé"
- `[NEW]` Hay hỏi thăm thành viên mới để họ thoải mái hơn — tự nhiên làm vai trò welcome buddy
- `[VALIDATED]` Khi cần nhờ gấp: vẫn nhắn riêng 1-2 người biết chắc có thể giúp, TRƯỚC khi post nhóm (bypass có chủ ý)
- `[NEW]` Bypass rate của Linh cao hơn dự kiến (~25%) — nhưng bypass theo kiểu "ping người quen trước, nếu không được mới post nhóm"

### Discovery Signal

**Mức độ:** CAO — Linh là persona có intent discovery cao nhất

**Evidence từ Phase 1:**
- Trả lời "Có" cho cả Q1 và Q3 trong discovery interview
- Đã tự nói: *"Nếu có thêm 2-3 nhà Việt gần đây nữa vào vòng thì tốt hơn nhiều"*
- Quan tâm đến thông tin khu vực và tuổi con — nói "cùng tuyến tàu, con gần tuổi nhau thì hợp hơn"

**Barrier:** Lo ngại về privacy không cao (đã quen với việc quen người qua cộng đồng Việt). Barrier chính là thời gian — Linh bận nhưng muốn nếu có cách nhanh.

### Validation Summary — Persona 1

| Giả định v1 | Kết quả Phase 1 |
|---|---|
| Linh chủ động giúp nhưng ngại nhờ | Confirm một phần — ngại giảm rõ khi có format |
| Linh quá tải vì làm relay | Confirm |
| Linh là người kết nối tự nhiên | Confirm — còn hơn dự đoán |
| Linh muốn giảm role trung tâm | Confirm |
| Bypass rate thấp vì Linh chủ động dùng nhóm | Reject — bypass vẫn có nhưng theo pattern khác |

### Quote đặc trưng

> "Từ khi có nhóm này, mình ít phải nhắn từng người hơn rồi. Nhưng mình vẫn hay ping người gần nhà trước — tiện hơn. Nếu nhóm to hơn, có thêm nhà gần khu mình, thì tốt hơn nữa."
> *(Phỏng vấn sâu, Phase 1 Week 3)*

---

## Persona 2 — Tuấn, "Bố bận rộn"

### Thông tin cơ bản

- **Tên:** Trần Văn Tuấn
- **Tuổi:** 38
- **Nghề nghiệp:** Kỹ sư phần mềm tại công ty Nhật, làm 8am-7pm
- **Sống tại:** Yokohama — đã ở 4 năm
- **Gia đình:** Vợ người Việt, đang ở nhà chăm con. Con gái Bảo Châu 5 tuổi (mầm non)

### Bối cảnh sống tại Nhật

Tuấn tham gia vòng vì vợ muốn — ban đầu anh hoài nghi. Sau tuần đầu, khi anh reply được 1 request đón con (đúng lúc anh đi ngang trường), anh thay đổi thái độ. Tuấn hiện là người có tỷ lệ giúp cao nhất trong các loại request "chở đi đâu" và "đón con" — vì anh có xe và thường đi làm qua các khu vực liên quan.

### Goals (Mục tiêu)

- `[VALIDATED]` Chỉ nhận thông báo khi có request anh thực sự có thể giúp
- `[VALIDATED]` Không bị làm phiền bởi request không liên quan
- `[VALIDATED]` Khi vợ cần giúp gấp, có chỗ nhờ mà không phải anh tự gọi từng người
- `[NEW]` Muốn có thể filter "chỉ show request đón con và chở đi" — feature này chưa có nhưng anh mention

### Pain Points (Vấn đề)

- `[VALIDATED]` Notification nhiều → tắt → lỡ tin quan trọng (pattern lặp lại y như v1 predict)
- `[VALIDATED]` Không biết ai cần gì cho đến khi quá muộn
- `[NEW]` Sau Phase 1: Tuấn mention anh hay thấy request vào lúc tối (sau 8pm) — anh đọc được nhưng thường đã muộn để giúp ngay
- `[ASSUMED]` Filter request theo loại — muốn nhưng chưa có data xác nhận anh sẽ dùng feature này nếu có
- `[ASSUMED]` Quiet hours implementation — chưa có test case rõ ràng trong Phase 1

### Behaviors (Hành vi)

- `[VALIDATED]` Check điện thoại chủ yếu 7:30-8:30am (tàu đi làm) và 7-8pm (về nhà)
- `[VALIDATED]` Tắt notification nhóm, chỉ check khi nhớ mở app
- `[NEW]` Khi reply giúp, Tuấn hay ghi rõ điều kiện: "Tôi giúp được nếu đón lúc 5:30, không phải 5pm được không?"
- `[NEW]` Vợ Tuấn đã dùng nhóm độc lập (không qua anh) — vợ post request khi Tuấn đi làm, điều này không có trong v1
- `[VALIDATED]` Cuối tuần active hơn, chủ động offer đưa đón khi đi qua khu vực

### Discovery Signal

**Mức độ:** THẤP — Tuấn không có nhu cầu quen thêm gia đình mới

**Evidence từ Phase 1:**
- Trả lời "Không" cho Q1 — *"Biết thêm người thì vui nhưng mình không có nhiều thời gian đi chơi"*
- Q3: *"Nếu đơn giản thì bật thử cũng được, nhưng không phải ưu tiên"*

**Barrier:** Không phải privacy — là thời gian. Tuấn không thấy giá trị rõ ràng vì vòng hiện tại đã đủ dùng.

### Validation Summary — Persona 2

| Giả định v1 | Kết quả Phase 1 |
|---|---|
| Tuấn hoài nghi ban đầu nhưng convert khi thấy giá trị | Confirm |
| Notification là pain point lớn nhất | Confirm |
| Tỷ lệ bố là người nhờ giúp thấp hơn mẹ | Confirm — vợ Tuấn là người chủ yếu dùng, anh là helper |
| Tuấn có discovery interest thấp | Confirm |
| Bypass rate thấp vì Tuấn không hay nhờ | Confirm |

### Quote đặc trưng

> "Mình thấy ok vì mình hay giúp được kiểu đón con hoặc chở đi đâu đó. Còn nhờ giúp thì vợ mình hay dùng hơn mình."
> *(Phỏng vấn sâu, Phase 1 Week 2)*

---

## Persona 3 — Mai, "Gia đình mới đến"

### Thông tin cơ bản

- **Tên:** Lê Thị Mai
- **Tuổi:** 29
- **Nghề nghiệp:** Đang tìm việc, hiện ở nhà chăm con và học tiếng Nhật
- **Sống tại:** Saitama — mới chuyển đến 5 tháng trước
- **Gia đình:** Chồng người Việt, làm kỹ sư ở khu công nghiệp Saitama. Con trai Minh Khang 3 tuổi

### Bối cảnh sống tại Nhật

Mai được giới thiệu vào vòng qua Linh (gặp nhau ở buổi sinh nhật con bạn). Đây là lần đầu Mai tham gia bất kỳ nhóm tương trợ nào. Ban đầu Mai rất im lặng — đọc nhưng không post. Concierge nhắn riêng hỏi thăm và mời post thử một request nhỏ (mượn đồ). Sau lần đó Mai cởi mở hơn rõ rệt.

Phase 1 xác nhận: gia đình mới đến cần "bước đầu tiên có người dẫn" — không thể tự nhiên join và ngay lập tức hoạt động.

### Goals (Mục tiêu)

- `[VALIDATED]` Có 2-3 gia đình Việt gần nhà có thể nhờ khi khẩn cấp
- `[VALIDATED]` Cảm thấy an toàn khi nhờ — không lo mắc nợ, không lo bị xét xử
- `[NEW]` Muốn biết "văn hoá vòng" — ai hay giúp loại gì, ai ở gần mình, giờ nào thường có người online
- `[ASSUMED]` Muốn dùng Discovery để tìm thêm gia đình gần nhà — chưa xác nhận đủ mạnh

### Pain Points (Vấn đề)

- `[VALIDATED]` Không biết ai trong nhóm sống gần mình — vòng không có thông tin địa lý
- `[VALIDATED]` Ngại nhờ người chưa quen đủ — barrier giảm sau khi có 1-2 interaction thành công
- `[VALIDATED]` Khi gấp mà không ai phản hồi — cảm giác cô đơn tăng lên rõ rệt (trường hợp xảy ra 1 lần trong Phase 1)
- `[NEW]` Không biết mình có thể giúp gì ngược lại — "Mình không có xe, không biết đường nhiều, mình giúp được gì?"
- `[ASSUMED]` Privacy concern về discovery — Mai nói *"bật lên thì lo ai thấy"* nhưng chưa có test case thực tế

### Behaviors (Hành vi)

- `[VALIDATED]` Lurker trong 10 ngày đầu — đọc nhưng không post
- `[VALIDATED]` Cần 1 trigger bên ngoài (concierge hỏi thăm) để post lần đầu
- `[NEW]` Sau khi post lần đầu thành công, Mai trở nên active: post thêm 2 requests trong 2 tuần tiếp theo
- `[NEW]` Mai hay react emoji (tim, good) cho các request của người khác dù không giúp được — đây là cách cô tham gia nhẹ nhàng
- `[NEW]` Mai bắt đầu nhắn riêng Linh để hỏi thăm — đang tự xây dựng kết nối 1-1 bên cạnh nhóm

### Discovery Signal

**Mức độ:** THẤP-TRUNG — Có interest nhưng có barrier privacy rõ ràng

**Evidence từ Phase 1:**
- Q1: "Có, nhưng mình không biết cách nào"
- Q3: "Có thể thử nếu không cần ghi tên thật và địa chỉ cụ thể"
- Barrier rõ ràng: Mai lo ngại về việc người lạ biết mình ở khu vực cụ thể

**Quan sát thêm:** Với Mai, discovery qua "được giới thiệu bởi người quen" (Linh giới thiệu) cảm thấy an toàn hơn nhiều so với discovery qua app — ngay cả khi thông tin tối thiểu.

### Validation Summary — Persona 3

| Giả định v1 | Kết quả Phase 1 |
|---|---|
| Gia đình mới đến cần dẫn dắt ban đầu | Confirm — mạnh hơn dự kiến |
| Barrier chính là không biết ai gần nhà | Confirm một phần — barrier là "chưa quen đủ để nhờ" |
| Privacy concern cao với Discovery | Confirm |
| Sẽ dùng Discovery nếu tối giản | Unclear — cần test thêm |
| Sẽ active sau khi vào vòng | Confirm sau trigger ban đầu |

### Quote đặc trưng

> "Lần đầu mình post mà có người reply ngay, mình mừng lắm. Mình cứ tưởng người ta bận, không để ý. Hoá ra chỉ cần mình dám post thôi."
> *(Phỏng vấn sâu, Phase 1 Week 3)*

---

## Persona 4 — Hùng, "Người kết nối"

### Thông tin cơ bản

- **Tên:** Phạm Văn Hùng
- **Tuổi:** 41
- **Nghề nghiệp:** Trưởng nhóm tại công ty thương mại Nhật-Việt, hay đi lại Tokyo-Osaka
- **Sống tại:** Yokohama — 9 năm
- **Gia đình:** Vợ người Việt, làm bán thời gian. Hai con: trai 8 tuổi (tiểu học), gái 6 tuổi (mầm non)

### Bối cảnh sống tại Nhật

Hùng là người đề xuất pilot, giới thiệu cả nhóm gia đình ban đầu. Trong Phase 1, Hùng đóng vai trò founder quan sát — không làm concierge trực tiếp nhưng check in với concierge mỗi tuần.

Quan sát Phase 1 về Hùng: anh vẫn nhận được nhiều tin nhắn riêng từ các thành viên khác muốn anh "dàn xếp" — dù vòng đã có format riêng. Cho thấy vai trò trung tâm của anh khó từ bỏ ngay.

### Goals (Mục tiêu)

- `[VALIDATED]` Phân phối coordination ra toàn vòng, không phụ thuộc vào một người
- `[VALIDATED]` Biết được tình trạng vòng mà không cần theo dõi từng tin nhắn
- `[NEW]` Muốn nhân rộng mô hình sang vòng khác — đây là signal quan trọng cho Phase 2
- `[VALIDATED]` Giúp gia đình mới vào nhóm nhanh chóng hòa nhập

### Pain Points (Vấn đề)

- `[VALIDATED]` Quản lý nhiều kênh chat khác nhau — dễ miss, khó track
- `[VALIDATED]` Khi đi công tác, nhóm "mất cột sống" — vẫn xảy ra trong Phase 1 dù có format
- `[NEW]` Khi vòng chạy tốt, Hùng vẫn nhận được bypass messages riêng từ thành viên — anh là hub dù không muốn
- `[ASSUMED]` Gánh nặng khi mở rộng sang vòng thứ hai — Hùng chưa thử, chưa có data

### Behaviors (Hành vi)

- `[VALIDATED]` Check tất cả nhóm ít nhất 3 lần/ngày, kể cả khi đi công tác
- `[VALIDATED]` Vẫn hay forward tin từ nhóm này sang nhóm khác dù có vòng riêng
- `[NEW]` Hùng bắt đầu nhắc những thành viên khác cũng có thể làm concierge — đang cố tình trao quyền
- `[NEW]` Hùng hỏi founder về khả năng tạo vòng thứ hai cho gia đình Việt ở khu vực lân cận
- `[VALIDATED]` Dùng saved messages để track việc chưa xong — chưa có công cụ tốt hơn

### Discovery Signal

**Mức độ:** CAO — nhưng theo chiều hướng mở rộng vòng, không phải kết bạn cá nhân

**Evidence từ Phase 1:**
- Q1: "Có" — nhưng Hùng hiểu "quen thêm" theo nghĩa "thêm gia đình vào vòng" hơn là kết bạn cá nhân
- Q3: "Có, nếu giúp được tìm người phù hợp để mời vào vòng"
- Hùng muốn Discovery như một công cụ mở rộng pool thành viên — đây là use case khác với Mai (tìm bạn cá nhân)

### Validation Summary — Persona 4

| Giả định v1 | Kết quả Phase 1 |
|---|---|
| Hùng muốn trao quyền nhưng vẫn là hub | Confirm — tension này vẫn còn |
| Hùng quản lý nhiều kênh, dễ miss | Confirm |
| Khi Hùng vắng, nhóm vận hành tốt hơn dự kiến | Confirm — nhưng vẫn có bypass về Hùng |
| Hùng là người đầu tiên muốn mở rộng | Confirm — signal cho Phase 2 |

### Quote đặc trưng

> "Giờ nhóm tự chạy được rồi, mình không phải làm trung gian nữa. Nhưng mọi người vẫn hay nhắn riêng mình. Hình như họ vẫn quen nhờ mình hơn. Phải từ từ thôi."
> *(Check-in với founder, Phase 1 Week 3)*

---

## Tóm tắt so sánh — v2

| | Linh | Tuấn | Mai | Hùng |
|---|---|---|---|---|
| **Discovery Signal** | CAO | THẤP | THẤP-TRUNG | CAO (kiểu mở rộng vòng) |
| **Bypass Pattern** | Ping người quen trước, rồi post | Hiếm khi nhờ, vợ nhờ nhiều hơn | Không bypass nhưng lurker lâu | Vẫn nhận bypass messages từ người khác |
| **Barrier với Discovery** | Thấp — quen cộng đồng | Thời gian | Privacy (tên, địa chỉ) | Không rõ — focus khác |
| **Trigger tham gia** | Post request nhanh, notification rõ | Giúp được đúng loại (chở, đón) | Được dẫn dắt lần đầu | Phân phối coordination |
| **Behavior mới phát hiện** | Bypass có chủ ý trước khi post | Vợ là user chính | React nhẹ (emoji) trước khi interact | Tự cố trao quyền cho người khác |

---

## Giả định mới cần validate trong Phase 2

Phase 2 là Replication Test — chạy vòng mới ở 2-3 nhóm khác. Cần kiểm chứng thêm:

1. **Persona Linh** có xuất hiện ở vòng mới không? Hay mỗi vòng đều có 1 "Linh" tự nhiên nổi lên?
2. **Persona Mai** ở vòng mới — barrier ban đầu có giảm nếu đã có playbook và concierge tốt hơn không?
3. **Bypass pattern** — ở vòng mới (mọi người chưa quen nhau nhiều), bypass rate có thấp hơn không vì chưa có "người trung tâm" như Linh/Hùng?
4. **Discovery signal** — khi hỏi ở vòng mới (group chưa saturated), có cùng ~50% nói Có không?

---

*Nguồn: `user-personas-v1.md` | Phase 1 pilot observations | `product-discovery-v3.md` Mục 2, 5 | `mvp-roadmap-v1.md` Phase 2*
*Tạo: 2026-05-16 | Cập nhật: v3 sau Phase 2 validation*
