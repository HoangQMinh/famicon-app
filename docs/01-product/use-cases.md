---
title: Use Cases — Vòng Tròn Tương Trợ
ngày_tạo: 2026-05-16
phase: Phase 2 — Replication Test
---

# Use Cases — Vòng Tròn Tương Trợ

> 12 scenarios cụ thể mô tả cách hệ thống vận hành trong các tình huống thực tế.
> Dựa trên Phase 1 observations và pilot playbook.

Xem thêm: [user-flows.md](./user-flows.md) | [user-personas-v2.md](./user-personas-v2.md) | [glossary.md](../00-foundation/glossary.md) | [constitution.md](../00-foundation/constitution.md)

---

## UC-001 — Post urgent childcare pickup

**Tên ngắn:** Đón con gấp khi bị kẹt

**Persona liên quan:** Linh (Asker), Tuấn (Helper)

**Trigger:** Linh nhận được tin từ công ty lúc 4pm — phải ở lại làm việc đột xuất. Con gái cần được đón từ trường mầm non lúc 5:30pm.

**Pre-conditions:**
- Linh là thành viên của vòng trên LINE Open Chat
- Vòng có ít nhất 5-6 thành viên khác đang active
- Trường mầm non nằm trong khu vực mà ít nhất 1-2 thành viên đi qua hoặc sống gần

**Main Flow:**
1. Linh mở LINE Open Chat lúc 4:05pm
2. Copy hoặc nhớ format template, điền nhanh:
   ```
   [Loại]: đón con
   [Khi]: Hôm nay, 5:30pm
   [Ở đâu]: Trường Mầm non Sakura, ga Nishi-Funabashi
   [Gấp?]: Có
   [Chi tiết]: Con gái Nhi, 4 tuổi. Mẹ bị kẹt ở công ty đột xuất. Cần ai đón và giữ con đến khoảng 7pm.
   ```
3. Post vào chat
4. Tuấn thấy notification lúc 4:15pm (đang trên tàu về nhà), reply: "Tôi giúp được — tôi đến khoảng 5:25, đứng ở cổng chính nhé"
5. Linh xác nhận: "Cảm ơn anh Tuấn nhiều! Mình nhắn LINE của anh để chốt chi tiết"
6. Linh nhắn LINE riêng Tuấn, share ảnh con và số điện thoại giáo viên
7. 5:30pm: Tuấn đến đón Nhi thành công
8. 7:05pm: Linh reply trong nhóm: "Cảm ơn gia đình anh Tuấn, Nhi đã về nhà rồi!"

**Alternative Flows:**
- *Alt 1:* Tuấn không giúp được — Linh tiếp tục đợi, concierge nhắc nhóm sau 30 phút
- *Alt 2:* Có 2 người cùng reply — Linh chọn người gần trường hơn, reply cảm ơn người kia

**Post-conditions:**
- Request được mark là resolved (bằng reply cảm ơn)
- Tuấn được cảm ơn trong chat nhóm
- Không có ai biết chính xác "Tuấn đã giúp bao nhiêu lần" — không có ledger

**Notes / Friction hiện tại:**
- Linh phải tự nhớ hoặc cuộn lên tìm format → F1 từ user-flows.md
- Không có cách tự động notify Tuấn biết đây là khu vực anh đi qua → F2
- Hand-off sang LINE phải thủ công → F4

---

## UC-002 — Borrow baby item

**Tên ngắn:** Mượn đồ trẻ em

**Persona liên quan:** Mai (Asker), Linh (Lender)

**Trigger:** Con Mai (3 tuổi) cần ghế ngồi ăn khi ông bà từ Việt Nam sang thăm cuối tuần này. Mua mới thì lãng phí vì chỉ dùng 1 tuần.

**Pre-conditions:**
- Mai đã active trong vòng ít nhất 1 tuần (không còn lurker)
- Vòng có đủ thành viên — khả năng cao có nhà nào đó có ghế ăn

**Main Flow:**
1. Mai post request thứ Tư:
   ```
   [Loại]: mượn đồ
   [Khi]: cần từ thứ Sáu đến Chủ Nhật tuần này
   [Gấp?]: Không
   [Chi tiết]: Mượn ghế ngồi ăn cho trẻ (booster seat hoặc high chair). Ông bà sang chơi, cần thêm 1 ghế. Sẽ trả đúng hẹn.
   ```
2. Linh reply sau 2 tiếng: "Nhà mình có high chair, bé Khoa đã lớn rồi không dùng. Chị gần khu nào? Mình cho mượn thoải mái"
3. Mai reply cảm ơn và nhắn LINE Linh để hỏi địa chỉ
4. Thứ Sáu: Mai qua lấy ghế, hai người gặp nhau lần đầu
5. Chủ Nhật: Mai trả ghế, hai người đã quen nhau thêm một chút

**Alternative Flows:**
- *Alt 1:* Không ai có ghế → Mai reply cảm ơn nhóm đã xem, tự tìm mua hoặc thuê
- *Alt 2:* Linh muốn tặng luôn vì không dùng nữa → thỏa thuận riêng qua LINE

**Post-conditions:**
- Đồ được mượn và trả thành công
- Mai và Linh bắt đầu quen nhau qua gặp mặt thực tế
- Không có giao dịch tiền bạc — thuần tương trợ

**Notes / Friction hiện tại:**
- Không có cách biết thành viên nào đang có đồ gì để cho mượn trước khi post
- Hand-off địa chỉ cần thực hiện qua LINE riêng — không nên trong group chat (privacy)

---

## UC-003 — Short childcare cover

**Tên ngắn:** Trông con ngắn khi có việc gấp

**Persona liên quan:** Mai (Asker), Linh (Helper)

**Trigger:** Mai cần đến phòng khám bác sĩ lúc 2pm thứ Năm — khám lại kết quả xét nghiệm. Chồng đi làm, không đưa con đi cùng được vì phòng khám không cho trẻ nhỏ vào.

**Pre-conditions:**
- Mai đã có ít nhất 1-2 lần nhờ thành công trước đó (không còn barrier ban đầu)
- Thành viên trong vòng biết Mai đã quen với format

**Main Flow:**
1. Thứ Tư tối, Mai post:
   ```
   [Loại]: trông con ngắn
   [Khi]: Thứ Năm 14/5, từ 1:30pm đến khoảng 3:30pm
   [Ở đâu]: Nhà mình hoặc nhà bạn đều được
   [Gấp?]: Không (nhưng cần biết trước để sắp xếp)
   [Chi tiết]: Bé Minh Khang 3 tuổi, ngoan, đang học tiếng Nhật ở nhà trẻ. Bé biết tự chơi. Mình đi khám bệnh viện, khoảng 2 tiếng.
   ```
2. Linh reply sáng hôm sau: "Mình trông được, nhà mình có bé Khoa cũng 1.5 tuổi. Hai bé chơi cùng nhau. Chị mang bé qua nhà mình nhé"
3. Mai xác nhận, nhắn LINE Linh lấy địa chỉ
4. Thứ Năm 1:30pm: Mai mang Minh Khang sang nhà Linh
5. 3:15pm: Mai về đón con, mọi việc ổn

**Alternative Flows:**
- *Alt 1:* Không ai giúp được → Concierge nhắc nhóm sau 12h, hỏi thêm 1-2 người biết ở gần Mai
- *Alt 2:* Helper cancel sáng hôm đó (xem UC-006)

**Post-conditions:**
- Minh Khang được trông an toàn
- Mai hoàn thành việc bệnh viện không bị gián đoạn
- Mai và Linh có thêm kết nối qua gặp mặt trực tiếp

**Notes / Friction hiện tại:**
- Không có cách biết ai ở gần Mai để target đúng người — post rộng và đợi
- Thông tin về bé (dị ứng, thói quen) được share qua LINE riêng — phù hợp (privacy)

---

## UC-004 — Carpool request

**Tên ngắn:** Nhờ đi nhờ xe đến nơi khó đến bằng tàu

**Persona liên quan:** Mai (Asker), Tuấn (Driver)

**Trigger:** Mai cần đến IKEA mua đồ cho gia đình — chồng bận, không có xe, và đi tàu với nhiều hộp đồ lớn là bất khả thi.

**Pre-conditions:**
- IKEA ở khu vực mà ít nhất 1 thành viên có xe hay đi qua cuối tuần
- Request được post đủ sớm (≥2 ngày trước) để Helper có thể sắp xếp lịch

**Main Flow:**
1. Thứ Năm, Mai post:
   ```
   [Loại]: chở đi đâu
   [Khi]: Thứ Bảy 16/5, 10am
   [Từ]: Ga Omiya, Saitama
   [Đến]: IKEA Saitama
   [Gấp?]: Không
   [Chi tiết]: Mua đồ gia đình, sẽ có vài hộp to. Về khoảng 1-2pm. Xăng mình chịu.
   ```
2. Tuấn thấy thứ Sáu sáng: "Thứ Bảy mình cũng định đi khu đó. Mình đón chị ở ga Omiya được, cùng đi luôn"
3. Mai cảm ơn, nhắn LINE Tuấn để chốt giờ và điểm hẹn cụ thể
4. Thứ Bảy: Tuấn đón Mai đúng giờ, cùng đi IKEA
5. Xong việc: Tuấn chở Mai về tới nhà

**Alternative Flows:**
- *Alt 1:* Không ai có xe đi hướng đó → Mai tự tìm dịch vụ vận chuyển
- *Alt 2:* Tuấn giúp nhưng chỉ có thể lúc 11am → Mai confirm hoặc tìm người khác

**Post-conditions:**
- Mai hoàn thành việc mua sắm không bị loay hoay với tàu và hàng nặng
- Tuấn không nhận tiền xăng (Mai offer nhưng Tuấn từ chối) — culture ân tình

**Notes / Friction hiện tại:**
- Không có cách biết ai đang đi hướng nào vào ngày nào — route matching hoàn toàn manual
- Nếu muốn match route tự động → cần feature app (priority cao sau Phase 2)

---

## UC-005 — No response after 2h urgent

**Tên ngắn:** Request gấp không có ai reply sau 2 tiếng

**Persona liên quan:** Linh (Asker), Concierge

**Trigger:** Linh post request gấp lúc 3pm — cần đón con lúc 5pm. Đến 5pm vẫn không có ai reply.

**Pre-conditions:**
- Request đã được post đúng format với tag "Gấp"
- Đã qua 2 tiếng (5pm) mà không có ai reply

**Main Flow:**
1. Concierge kiểm tra chat lúc 5pm thấy request chưa được match
2. Concierge reply trong nhóm: "Nhà Linh cần gấp đây mọi người ơi! Ai giúp được không?"
3. Đồng thời concierge nhắn riêng 2-3 thành viên biết có xe hoặc ở gần trường
4. Thành viên A reply: "Mình vừa thấy, mình chạy qua được nhưng muộn hơn 5-10 phút"
5. Linh nhận được thông báo, xác nhận với thành viên A qua LINE
6. Việc được giải quyết muộn hơn dự kiến nhưng vẫn OK

**Alternative Flows:**
- *Alt 1:* Vẫn không ai giúp được sau khi concierge nhắc → Concierge báo Linh để Linh tự tìm phương án khác (gọi dịch vụ, liên hệ trường)
- *Alt 2:* Có người giúp nhưng cần cancel do tình huống khác (xem UC-006)

**Post-conditions:**
- Concierge ghi vào tracking: request gấp / match muộn / lý do
- Nếu pattern này lặp lại → cần review size của vòng hoặc thời điểm active của thành viên

**Notes / Friction hiện tại:**
- Concierge phải nhớ check định kỳ — không có alert tự động khi request gấp chưa được match
- Khi app được build: cần auto-escalation sau 30 phút không có reply cho request gấp

---

## UC-006 — Helper cannot make it last minute

**Tên ngắn:** Helper hủy giúp vào phút chót

**Persona liên quan:** Linh (Asker), thành viên B (Helper đã hủy), Hùng (Helper backup)

**Trigger:** Thành viên B đã confirm giúp Linh đón con 5:30pm, nhưng lúc 4:30pm nhắn: "Xin lỗi, con mình ốm đột ngột, mình không đi được"

**Pre-conditions:**
- Đã có match (thành viên B đã confirm)
- Hủy xảy ra gần giờ thực hiện (< 2 tiếng)
- Linh vẫn chưa tự xử được

**Main Flow:**
1. Linh nhận tin hủy lúc 4:30pm — còn 1 tiếng trước giờ đón con
2. Linh post lại trong nhóm ngay: "Cấp cứu! Nhà B vừa có việc, mình vẫn cần người đón bé Nhi lúc 5:30 ở trường Sakura, ai được không?"
3. Concierge thấy, ngay lập tức nhắn riêng Hùng: "Anh Hùng ơi, Linh cần gấp đón con lúc 5:30 ở ga X, anh giúp được không?"
4. Hùng reply: "Được, mình đang ở khu đó, mình đi luôn"
5. Hùng nhắn LINE Linh để lấy thông tin bé
6. 5:30pm: Hùng đón Nhi thành công

**Alternative Flows:**
- *Alt 1:* Hùng cũng không giúp được → Concierge báo Linh ngay để Linh liên hệ trường xin giữ bé thêm, gọi dịch vụ taxi
- *Alt 2:* Có 2 người cùng reply giúp → Linh chọn người nhanh hơn, cảm ơn người kia

**Post-conditions:**
- Không ai cảm thấy tệ về thành viên B — hủy vì lý do bất khả kháng, được nhóm thông cảm
- Hùng không nhận gì, không ai nhắc đến chuyện "ơn nợ"
- Concierge ghi trường hợp này để track pattern cancel rate

**Notes / Friction hiện tại:**
- Không có cơ chế "backup helper" tự động — phải repost thủ công
- Trong app tương lai: có thể có "find backup" flow tự động sau khi match bị cancel

---

## UC-007 — New member joins circle

**Tên ngắn:** Thành viên mới join vòng

**Persona liên quan:** Mai (thành viên mới), Linh (người mời), Concierge

**Trigger:** Linh gặp Mai ở sân chơi, họ nói chuyện, Linh giới thiệu vòng và mời Mai join.

**Pre-conditions:**
- Linh là thành viên hiện tại, có quyền mời người mới
- Mai đáp ứng tiêu chí vòng (khu vực, tuổi con)
- LINE Open Chat ở chế độ invite-only

**Main Flow:**
1. Linh nhắn Mai qua LINE: "Mình có nhóm nhỏ gia đình Việt hay giúp nhau ấy, bạn có muốn join không? Nhóm chỉ mời riêng, không public"
2. Mai đồng ý, Linh share link invite
3. Mai join LINE Open Chat
4. Concierge thấy Mai join, nhắn riêng trong vòng 24h: "Chào Mai! Mình là [tên], đang giúp nhóm mình vận hành. Bạn ở khu nào? Con mấy tuổi? Để mình giới thiệu thêm"
5. Mai reply, concierge giới thiệu vài thành viên gần khu Mai sống
6. Concierge nhắn: "Bạn cứ thoải mái post khi cần. Format có trong tin nhắn ghim. Có gì không hiểu thì hỏi mình nhé"
7. Sau 3 ngày, Mai vẫn chưa post → concierge nhắn thêm: "Mai ơi, tuần này có cần gì không? Nhà mình hay cần mượn đồ trẻ em lắm, bạn cứ hỏi nhé"
8. Mai post request mượn ghế ăn (UC-002) — onboard thành công

**Alternative Flows:**
- *Alt 1:* Mai join nhưng không reply concierge → concierge nhắn thêm 1 lần sau 7 ngày, nếu vẫn không → báo founder
- *Alt 2:* Mai đáp ứng tiêu chí nhưng ở khu hơi xa → concierge note lại, vẫn welcome

**Post-conditions:**
- Mai đã có ít nhất 1 action (post hoặc reply) trong tuần đầu tiên
- Các thành viên khác đã biết có người mới qua chào đón trong chat
- Thông tin tiêu chí đã được Mai đọc và hiểu

**Notes / Friction hiện tại:**
- Không có onboarding flow tự động → concierge phải nhớ theo dõi từng người mới
- Không có profile thành viên để biết ai ở gần ai → concierge phải hỏi thủ công

---

## UC-008 — Member invited, hesitant to join

**Tên ngắn:** Được mời nhưng do dự không chắc có join không

**Persona liên quan:** Mai (được mời), Linh (người mời)

**Trigger:** Linh mời Mai vào vòng. Mai quan tâm nhưng do dự — *"Mình chưa biết mọi người, ngại lắm"* và *"Nhỡ mình không giúp lại được gì thì kỳ"*.

**Pre-conditions:**
- Linh và Mai đã gặp nhau ít nhất 1-2 lần ngoài đời
- Mai chưa có experience với bất kỳ nhóm tương trợ nào trước đây

**Main Flow:**
1. Linh giải thích: "Vòng này không phải ai cũng phải giúp nhiều. Bạn có thể chỉ nhờ khi cần, không cần giúp ngược lại ngay. Không ai đếm đâu"
2. Mai hỏi thêm: "Ai trong nhóm? Họ có biết mình không?"
3. Linh: "Có 10 gia đình, bạn quen mình rồi, mình giới thiệu dần. Nhóm chỉ gia đình Việt thôi, đóng, không public"
4. Mai vẫn do dự: "Để mình nghĩ thêm"
5. Linh: "OK, không ép. Khi nào bạn muốn thì nhắn mình"
6. 1 tuần sau, con Mai ốm và chồng đi công tác — Mai nhắn Linh: "Cho mình vào nhóm với"
7. Linh mời, concierge onboard (xem UC-007)

**Alternative Flows:**
- *Alt 1:* Mai quyết định không join → Linh không nhắc lại, tôn trọng quyết định

**Post-conditions:**
- Nếu Mai join: onboard bình thường
- Nếu Mai không join: Linh không cảm thấy awkward, quan hệ không bị ảnh hưởng

**Notes / Friction hiện tại:**
- Không có cách "trial" — join là join, không có preview mode
- Với người do dự: context khi cần thật (con ốm, chồng vắng) thường là trigger convert mạnh nhất

---

## UC-009 — Discovery — express interest in meeting new families

**Tên ngắn:** Thành viên express interest muốn quen thêm gia đình

**Persona liên quan:** Linh (discovery intent cao), Concierge

**Trigger:** Concierge hỏi câu discovery theo script trong pilot-playbook.md, tuần thứ 3 của Phase 1.

**Pre-conditions:**
- Linh đã active trong vòng ≥2 tuần
- Concierge đã chọn Linh vì biết Linh thích kết nối cộng đồng

**Main Flow:**
1. Concierge nhắn riêng Linh thứ Tư: "Linh ơi, mình hỏi thăm một chút nhé. Bạn thấy vòng này có ích không?"
2. Linh: "Có, ích hơn mình nghĩ. Giờ post request dễ hơn nhiều"
3. Concierge: "Vậy bạn có muốn quen thêm gia đình Việt khác gần đây không, ngoài vòng này?"
4. Linh: "Có chứ! Nhà mình ở khu này mà ít người Việt quá. Hay có thêm nhà gần tuyến tàu này thì tốt"
5. Concierge: "Nếu có app giúp tìm gia đình theo khu vực + tuổi con, không cần hiện tên thật, bạn có bật lên không?"
6. Linh: "Bật chứ. Miễn không cần điền nhiều thứ"
7. Concierge: "Bạn muốn tìm khu nào? Tuổi con khoảng bao nhiêu?"
8. Linh: "Edogawa hoặc khu gần ga Nishi-Funabashi. Con 3-6 tuổi thì hợp nhất"
9. Concierge ghi vào Sheet 4: Intent = Personal discovery, Khu vực = Edogawa/Nishi-Funabashi, Tuổi con = 3-6 tuổi

**Alternative Flows:**
- *Alt 1:* Linh nói "Không chắc" → ghi "Uncertain", không push thêm

**Post-conditions:**
- Data discovery signal được ghi vào tracking sheet
- Không có action tiếp theo với Linh (chưa có feature)
- Founder tổng hợp signal cuối Phase 1/Phase 2 để quyết định build Discovery

**Notes / Friction hiện tại:**
- Toàn bộ là manual interview — không scale được khi nhóm lớn hơn
- Data phân tán trong nhiều chat riêng → cần ghi tập trung vào Sheet 4

---

## UC-010 — Discovery — no interest, privacy concern

**Tên ngắn:** Thành viên không muốn Discovery vì lo ngại privacy

**Persona liên quan:** Mai (discovery intent thấp, privacy concern cao), Concierge

**Trigger:** Concierge hỏi câu discovery với Mai tuần thứ 3.

**Pre-conditions:**
- Mai đã active ≥2 tuần, đã có 2-3 request thành công
- Mai vẫn còn tâm lý thận trọng với người chưa quen

**Main Flow:**
1. Concierge nhắn riêng, hỏi thăm trước
2. Hỏi Q1: "Bạn có muốn quen thêm gia đình Việt gần đây không?"
3. Mai: "Muốn lắm nhưng ngại. Nhỡ người ta kỳ hay không hợp thì sao"
4. Hỏi Q3: "Nếu app tìm gia đình theo khu vực + tuổi con, không cần hiện tên thật, bạn có bật lên không?"
5. Mai: "Hmm, không hiện tên thật... nhưng người ta biết mình ở khu nào thì cũng lo. Nhỡ người lạ biết nhà mình ở Saitama rồi tìm đến thì sao?"
6. Concierge ghi nhận concern, không push: "Hiểu rồi. Mình note lại nhé. Bạn lo điều đó là đúng, cần phải thật cẩn thận"
7. Concierge ghi vào Sheet 4: Q1 = Muốn nhưng do dự, Q3 = Không / Lo privacy khu vực cụ thể

**Alternative Flows:**
- Không có — không push thêm nếu user không thoải mái

**Post-conditions:**
- Barrier privacy được ghi rõ: lo ngại về khu vực quận/TP là đủ cụ thể để người lạ tìm đến
- Founder note: cần thiết kế granularity khu vực rất cẩn thận (quận hay thành phố? ga hay khu vực rộng?)

**Notes:**
- Mai case cho thấy ngay cả "quận" cũng có thể quá cụ thể với một số người
- Cần xem xét lại granularity trong Discovery design — có thể cần "thành phố" thay vì "quận"
- Xem OQ-014 trong open-questions.md về privacy granularity

---

## UC-011 — Circle founder onboards second circle

**Tên ngắn:** Founder nhân rộng sang vòng thứ hai

**Persona liên quan:** Hùng (founder chính), Concierge vòng mới (một thành viên tình nguyện)

**Trigger:** Hùng muốn áp dụng mô hình vòng 1 sang nhóm gia đình Việt ở khu vực lân cận mà anh quen.

**Pre-conditions:**
- Vòng 1 đã vận hành ổn định ≥3 tuần (metrics đạt)
- Hùng đã quen biết ≥8 gia đình Việt ở khu mới
- pilot-playbook.md đã được viết và review

**Main Flow:**
1. Hùng đọc pilot-playbook.md
2. Hùng xác nhận đủ điều kiện: ≥8 gia đình, tìm được 1 concierge tình nguyện (chị Lan, đã active trong cộng đồng)
3. Hùng tạo LINE Open Chat mới theo format chuẩn
4. Pin 2 tin nhắn theo template
5. Hùng mời từng thành viên qua LINE cá nhân
6. Chị Lan (concierge mới) bắt đầu onboard từng thành viên join
7. Tuần 1: có request đầu tiên, được match thành công
8. Hùng báo cáo founder chính về tình trạng vòng mới (điền pilot-observations.md template mới)

**Alternative Flows:**
- *Alt 1:* Không tìm được concierge → Hùng hoãn, không tự làm concierge thêm (risk overload)
- *Alt 2:* Thành viên mới không follow format → Chị Lan nhắn riêng hướng dẫn, không nhắc công khai

**Post-conditions:**
- Vòng 2 vận hành độc lập với Concierge riêng
- Hùng không cần làm trung gian thường trực cho vòng 2
- Metrics vòng 2 được track riêng

**Notes / Friction hiện tại:**
- Chưa có cách các vòng "nhìn thấy" nhau hay liên thông → hoàn toàn độc lập
- Playbook giúp scale nhưng vẫn cần người có mạng lưới quan hệ như Hùng để bootstrap

---

## UC-012 — Concierge handles bypass (someone messaged privately)

**Tên ngắn:** Concierge xử lý khi phát hiện bypass

**Persona liên quan:** Linh (Asker đã bypass), Concierge, Tuấn (Helper qua bypass)

**Trigger:** Tuấn vô tình mention với concierge: "Linh nhắn mình trực tiếp nhờ đón con hôm qua, mình đã giúp được". Concierge nhận ra đây là bypass.

**Pre-conditions:**
- Linh đã nhắn riêng Tuấn thay vì post vào vòng
- Tuấn không có ý kiến gì, nhưng Concierge cần note lại

**Main Flow:**
1. Tuấn mention với concierge qua cuộc trò chuyện tự nhiên
2. Concierge ghi vào tracking: 1 bypass case, loại "đón con", helper là Tuấn
3. Concierge không nhắc Linh hoặc Tuấn trong group chat — không cần xử lý công khai
4. Nếu pattern bypass từ Linh tăng → concierge nhắn riêng Linh: "Linh ơi, bạn post vào nhóm được không? Để mọi người cùng thấy, nhỡ tuần tới Tuấn bận thì còn có người khác backup"
5. Nhắc theo kiểu gợi ý, không phán xét
6. Linh: "Ừ đúng rồi, mình hay nhắn Tuấn vì mình biết anh ấy hay đi qua khu đó. Lần sau mình post nhóm trước"

**Alternative Flows:**
- *Alt 1:* Linh bypass vì lý do cụ thể (ví dụ: request private, không muốn cả nhóm biết) → concierge không cần can thiệp, tôn trọng

**Post-conditions:**
- Bypass được ghi vào tracking (không ghi tên, chỉ ghi case count)
- Linh được nhắc nhẹ nhàng nếu pattern lặp lại — không phán xét
- Culture của vòng: bypass là bình thường, nhưng post nhóm giúp cả vòng vận hành bền hơn

**Notes:**
- Bypass rate 20% trong Phase 1 là acceptable (target < 30%)
- Pattern bypass của Linh ("ping người quen trước") là rational behavior — không phải lỗi của Linh
- Khi có app: smart routing sẽ giảm bypass vì app matching nhanh hơn nhắn riêng

---

## Tổng quan Use Cases

| UC | Tên | Persona chính | Phase liên quan |
|---|---|---|---|
| UC-001 | Đón con gấp | Linh, Tuấn | Phase 1 (validated) |
| UC-002 | Mượn đồ trẻ em | Mai, Linh | Phase 1 (validated) |
| UC-003 | Trông con ngắn | Mai, Linh | Phase 1 (validated) |
| UC-004 | Carpool request | Mai, Tuấn | Phase 1 (validated) |
| UC-005 | No response 2h urgent | Linh, Concierge | Phase 1 (validated) |
| UC-006 | Helper hủy phút chót | Linh, Hùng | Phase 1 (observed 1 case) |
| UC-007 | Thành viên mới join | Mai, Linh, Concierge | Phase 1 (validated) |
| UC-008 | Được mời, do dự | Mai, Linh | Phase 1 (validated) |
| UC-009 | Discovery — có interest | Linh, Concierge | Phase 1 (signal) |
| UC-010 | Discovery — lo privacy | Mai, Concierge | Phase 1 (signal) |
| UC-011 | Founder mở vòng 2 | Hùng, Concierge mới | Phase 2 (target) |
| UC-012 | Concierge xử lý bypass | Linh, Tuấn, Concierge | Phase 1 (validated) |

---

*Nguồn: Phase 1 pilot observations | `user-flows.md` | `user-personas-v2.md` | `pilot-playbook.md` | `constitution.md`*
*Tạo: 2026-05-16 | Cập nhật khi có thêm cases từ Phase 2*
