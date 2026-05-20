# Tracking Template — Phase 1 Pilot

**Tạo:** 2026-05-16
**Phase:** Phase 1 — Pre-product Validation (LINE Open Chat)
**Mục đích:** Google Sheets template để track toàn bộ data Phase 1
**Xem thêm:** [pilot-observations.md](./pilot-observations.md) | [glossary.md](../00-foundation/glossary.md)

---

## Tổng quan cấu trúc Sheet

File Google Sheets gồm 4 sheet:

| Sheet | Tên | Mục đích | Người điền |
|---|---|---|---|
| 1 | **Request Log** | Track từng aid request | Founder, sau mỗi request |
| 2 | **Weekly Summary** | Tổng hợp chỉ số theo tuần | Tự động từ Sheet 1 (formula) |
| 3 | **Interview Notes** | Ghi chép phỏng vấn sâu | Founder, 2 tuần/lần |
| 4 | **Discovery Signals** | Log phản hồi về Discovery feature | Founder, liên tục |

---

## Sheet 1 — Request Log

### Cấu trúc cột

| Cột | Tên cột | Kiểu dữ liệu | Bắt buộc? | Mô tả & Cách điền |
|---|---|---|---|---|
| A | **ID** | Text | Bắt buộc | Format: R001, R002, R003... Tăng tự động |
| B | **Date** | Date (YYYY-MM-DD) | Bắt buộc | Ngày post request trong LINE Open Chat |
| C | **Time** | Time (HH:MM) | Bắt buộc | Giờ post request (giờ Nhật, JST) |
| D | **Poster** | Text | Bắt buộc | Tên thành viên post (hoặc viết tắt để bảo mật). Nhất quán với tên đã dùng ở các row khác |
| E | **Type** | Dropdown | Bắt buộc | Chọn 1 trong 5: `đón con` / `mượn đồ` / `trông con ngắn` / `chở đi đâu` / `khác` |
| F | **Urgent** | Dropdown | Bắt buộc | `Y` = gấp (cần trong vòng 2-3 giờ) / `N` = không gấp |
| G | **Matched** | Dropdown | Bắt buộc | `Y` = có người xác nhận giúp / `N` = không ai giúp / `Pending` = chưa rõ kết quả |
| H | **Helper** | Text | Nếu Matched=Y | Tên helper (hoặc viết tắt). Để trống nếu Matched=N hoặc Pending |
| I | **Time-to-match** | Number (phút) | Nếu Matched=Y | Số phút từ khi post đến khi Helper xác nhận "tôi giúp được". Để trống nếu không match |
| J | **Bypass** | Dropdown | Bắt buộc | `Y` = thành viên nhắn riêng thay vì post vào vòng / `N` = đã post vào vòng. Nếu Y: ghi lý do vào cột Notes |
| K | **Completed** | Dropdown | Không bắt buộc | `Y` = đã hoàn thành và được confirm / `N` = không hoàn thành / `?` = không biết kết quả |
| L | **Notes** | Text | Không bắt buộc | Ghi chú thêm: lý do bypass, context đặc biệt, quote từ thành viên liên quan đến request này |
| M | **Week** | Number | Tự động | Formula: `=WEEKNUM(B2)-WEEKNUM($B$2)+1` — để tính week số mấy trong pilot |

### Quy tắc điền

**Khi nào điền:**
- Điền ngay khi có request mới xuất hiện trong LINE Open Chat
- Cập nhật cột G (Matched), H (Helper), I (Time-to-match) ngay khi có helper phản hồi
- Cập nhật cột K (Completed) sau khi việc hoàn thành (hoặc cuối tuần review)

**Bypass (cột J):**
- Cột quan trọng nhất để đo "còn dùng Messenger không"
- Bypass Y khi: founder biết ai đó nhắn riêng ai đó trực tiếp thay vì post vào LINE Open Chat
- Cách phát hiện bypass: thành viên tự kể, founder thấy trong chat 1-1, hoặc request không bao giờ xuất hiện trong vòng nhưng đã được giải quyết

**Tên thành viên:**
- Dùng tên viết tắt hoặc biệt danh nhất quán (ví dụ: "Linh.E" cho Linh ở Edogawa)
- Không cần tên đầy đủ — đủ để phân biệt là được
- Nếu muốn ẩn danh hơn: dùng mã (Member01, Member02...)

### Formula gợi ý cho Sheet 1

Thêm hàng tổng ở cuối Sheet 1 (ví dụ row 200):

```
Total Requests:       =COUNTA(A2:A200)-1
Matched (Y):          =COUNTIF(G2:G200,"Y")
Not Matched (N):      =COUNTIF(G2:G200,"N")
Match Rate:           =COUNTIF(G2:G200,"Y")/COUNTA(G2:G200)  → format %
Bypass Count:         =COUNTIF(J2:J200,"Y")
Bypass Rate:          =COUNTIF(J2:J200,"Y")/COUNTA(J2:J200)  → format %
Avg Time-to-match:    =AVERAGE(I2:I200)
Avg TTM (urgent):     =AVERAGEIF(F2:F200,"Y",I2:I200)
```

---

## Sheet 2 — Weekly Summary

### Cấu trúc

Mỗi hàng là 1 tuần. Cột tự động tính từ Sheet 1.

| Cột | Tên cột | Formula (ví dụ cho Week 1) | Mô tả |
|---|---|---|---|
| A | **Week** | 1, 2, 3, 4 | Số tuần trong pilot |
| B | **Date From** | Nhập tay | Ngày đầu tuần |
| C | **Date To** | Nhập tay | Ngày cuối tuần |
| D | **Members Active** | Nhập tay | Số member có ít nhất 1 action (post hoặc giúp) |
| E | **Total Members** | Nhập tay | Tổng số member trong vòng tuần đó |
| F | **Active Rate** | `=D2/E2` | % member active — format % |
| G | **Total Requests** | `=COUNTIFS('Request Log'!M:M,A2)` | Số request trong tuần |
| H | **Matched** | `=COUNTIFS('Request Log'!M:M,A2,'Request Log'!G:G,"Y")` | Số request được match |
| I | **Match Rate** | `=H2/G2` | % — format %. Target ≥70% |
| J | **Urgent Requests** | `=COUNTIFS('Request Log'!M:M,A2,'Request Log'!F:F,"Y")` | Số request gấp |
| K | **Avg TTM (All)** | `=AVERAGEIFS('Request Log'!I:I,'Request Log'!M:M,A2)` | Phút — trung bình tất cả |
| L | **Avg TTM (Urgent)** | `=AVERAGEIFS('Request Log'!I:I,'Request Log'!M:M,A2,'Request Log'!F:F,"Y")` | Phút — chỉ request gấp. Target <30 phút |
| M | **Bypass Count** | `=COUNTIFS('Request Log'!M:M,A2,'Request Log'!J:J,"Y")` | Số lần bypass |
| N | **Bypass Rate** | `=M2/(G2+M2)` | % bypass. Target <30% và giảm dần |
| O | **Unique Askers** | Nhập tay (đếm từ Sheet 1) | Số người khác nhau đã post request |
| P | **Unique Helpers** | Nhập tay | Số người khác nhau đã giúp |
| Q | **Notes** | Nhập tay | Observation ngắn gọn của tuần — link sang pilot-observations.md |

### Biểu đồ gợi ý (tạo trong Sheet 2)

1. **Line chart** — Match Rate theo tuần (target line ở 70%)
2. **Bar chart** — Requests theo type (đón con / mượn đồ / trông con / chở / khác)
3. **Line chart** — Bypass Rate theo tuần (target line ở 30%, muốn thấy giảm dần)
4. **Column chart** — Avg TTM (Urgent) theo tuần (target line ở 30 phút)

---

## Sheet 3 — Interview Notes

### Mục đích

Ghi chép phỏng vấn sâu với thành viên. Thực hiện mỗi 2 tuần, 3-4 thành viên mỗi đợt. Tổng Phase 1: phỏng vấn ít nhất 6-8 thành viên đại diện các loại persona.

### Cấu trúc cột

| Cột | Tên cột | Mô tả |
|---|---|---|
| A | **Interview ID** | Format: I001, I002... |
| B | **Date** | Ngày phỏng vấn |
| C | **Member** | Tên / viết tắt của người được phỏng vấn |
| D | **Persona Type** | Linh / Tuấn / Mai / Hùng (gần với persona nào nhất) |
| E | **Duration** | Thời gian phỏng vấn (phút) |
| F | **Channel** | LINE / gặp trực tiếp / điện thoại |
| G | **Q1 — Trải nghiệm tổng thể** | Họ cảm thấy thế nào về việc dùng LINE Open Chat cho tương trợ? |
| H | **Q2 — Friction chính** | Điều gì khó chịu hoặc bất tiện nhất? |
| I | **Q3 — Điều họ thích** | Điều gì họ thấy dễ hoặc tốt hơn trước? |
| J | **Q4 — Bypass reason** | Khi nào họ không post mà nhắn riêng? Lý do? |
| K | **Q5 — Discovery** | Có muốn quen thêm gia đình Việt gần nhà không? Bằng cách nào? |
| L | **Q6 — App vs LINE** | Nếu có app riêng (không phải LINE Open Chat), họ sẽ dùng không? |
| M | **Key Insights** | 2-3 insight quan trọng nhất từ phỏng vấn này |
| N | **Quotes** | Quote đáng nhớ nhất (chính xác, không paraphrase) |
| O | **Action Items** | Điều cần thay đổi hoặc test dựa trên phỏng vấn này |

### Câu hỏi phỏng vấn gợi ý

**Mở đầu (2 phút):**
- "Bạn đang dùng LINE Open Chat này được mấy tuần rồi? Cảm giác chung thế nào?"

**Về Aid Request (5 phút):**
- "Lần gần nhất bạn post nhờ giúp — kể cho mình nghe từ đầu đến cuối. Dễ không?"
- "Lần gần nhất bạn giúp người khác — bạn thấy request như thế nào?"
- "Có lần nào bạn muốn nhờ nhưng cuối cùng không post không? Sao vậy?"
- "Có lần nào nhắn riêng ai đó thay vì post vào đây không? Tại sao?"

**Về cảm giác trong vòng (5 phút):**
- "Cảm giác khi nhờ ở đây khác gì so với nhắn riêng trên Messenger không?"
- "Bạn có cảm thấy 'mắc nợ' khi nhờ ai đó không?"
- "Khi bạn giúp ai, bạn thấy thế nào?"

**Về Discovery (3 phút):**
- "Bạn có muốn quen thêm gia đình Việt gần nhà không?"
- "Nếu có, bạn đang tìm bằng cách nào?"
- "Nếu có tính năng tìm gia đình Việt gần theo khu vực + tuổi con — chỉ thấy quận và tuổi con thôi, không tên thật — bạn có bật lên không?"

**Kết thúc (2 phút):**
- "Nếu mình làm app riêng cho việc này (không phải LINE Open Chat), bạn sẽ dùng không?"
- "Bạn muốn thêm gì mà hiện tại chưa có?"

---

## Sheet 4 — Discovery Signals

### Mục đích

Log tất cả phản hồi liên quan đến Discovery feature — từ phỏng vấn, từ chat, từ quan sát. Đây là dữ liệu quyết định có build Sprint 11-12 không.

### Cấu trúc cột

| Cột | Tên cột | Mô tả |
|---|---|---|
| A | **Signal ID** | Format: DS001, DS002... |
| B | **Date** | Ngày ghi nhận signal |
| C | **Source** | `Interview` / `Chat` / `In-person` / `Other` |
| D | **Member** | Tên / viết tắt |
| E | **Q1 — Muốn quen thêm?** | `Có` / `Không` / `Không biết` |
| F | **Q2 — Đang tìm thế nào?** | Mô tả cách họ đang tìm gia đình Việt gần nhà hiện tại |
| G | **Q3 — Sẽ bật Discovery?** | `Có` / `Không` / `Có thể` / `Cần biết thêm` |
| H | **Privacy Concern** | Họ có lo ngại gì về privacy không? Nếu có, là gì? |
| I | **Điều kiện để bật** | Họ cần điều kiện gì để sẵn sàng bật Discovery? |
| J | **Quote** | Quote chính xác nếu có |
| K | **Signal Strength** | `Strong` (rõ ràng muốn) / `Moderate` (muốn nhưng có điều kiện) / `Weak` (không chắc) / `Negative` (không muốn) |

### Threshold để quyết định build Discovery

Xem thêm [user-stories-v1.md](./user-stories-v1.md) — US-018.

| Chỉ số | Threshold | Action |
|---|---|---|
| Q1 "Muốn quen thêm" ≥50% | Go | Tiến hành build Discovery |
| Q3 "Sẽ bật" ≥40% | Go | Tiến hành build Discovery |
| Signal Strength "Strong" + "Moderate" ≥50% | Go | Tiến hành build Discovery |
| Q3 <30% hoặc Privacy Concern cao | Stop / Pivot | Không build Discovery Sprint 11-12, tập trung coordination |

---

## Lịch điền và review

| Hoạt động | Tần suất | Người thực hiện |
|---|---|---|
| Điền Request Log | Sau mỗi request | Founder |
| Cập nhật Matched / Time-to-match | Ngay khi có helper | Founder |
| Phỏng vấn thành viên | Mỗi 2 tuần (3-4 người) | Founder |
| Điền Interview Notes | Ngay sau phỏng vấn | Founder |
| Điền Discovery Signals | Liên tục khi có | Founder |
| Review Weekly Summary | Cuối mỗi tuần | Founder |
| Update pilot-observations.md | Cuối mỗi tuần | Founder |

---

## Tạo Google Sheets — Hướng dẫn nhanh

1. Tạo file Google Sheets mới: "FAMICON — Phase 1 Tracking"
2. Tạo 4 tab: "Request Log", "Weekly Summary", "Interview Notes", "Discovery Signals"
3. Trong "Request Log": tạo cột theo cấu trúc Sheet 1 bên trên, thêm Data Validation cho các cột Dropdown (Type, Urgent, Matched, Bypass, Completed)
4. Trong "Weekly Summary": nhập formula từ mục Sheet 2 bên trên
5. Share với đồng sáng lập hoặc người hỗ trợ pilot (nếu có)
6. Pin file này trong LINE Open Chat của pilot group để dễ truy cập

**Data Validation gợi ý cho Request Log:**
- Cột E (Type): `đón con, mượn đồ, trông con ngắn, chở đi đâu, khác`
- Cột F (Urgent): `Y, N`
- Cột G (Matched): `Y, N, Pending`
- Cột J (Bypass): `Y, N`
- Cột K (Completed): `Y, N, ?`

---

*Nguồn: `product-discovery-v3.md` Mục 15 | `mvp-roadmap-v1.md` Mục 8.3 | [glossary.md](../00-foundation/glossary.md)*
*Tạo: 2026-05-16 | Dùng trong Phase 1 — Pre-product Validation*
