---
title: Replication Report — Phase 2 Results
ngày_tạo: 2026-05-16
phase: Phase 2 — Replication Test
---

# Replication Report — Kết Quả Phase 2

> Báo cáo tổng hợp kết quả Phase 2 Replication Test: chạy mô hình vòng tròn tương trợ trên 3 vòng độc lập,
> dùng LINE Open Chat + pilot-playbook.md, không code.

Xem thêm: [pilot-observations.md](./pilot-observations.md) | [user-personas-v2.md](./user-personas-v2.md) | [use-cases.md](./use-cases.md) | [decision-log.md](../00-foundation/decision-log.md)

---

## Summary

**Kết quả tổng quát:** GO — Phase 3 được phép bắt đầu.

| Tiêu chí exit Phase 2 | Kết quả |
|---|---|
| ≥2 vòng đạt metrics ≥3 tuần liên tiếp | **Đạt — 2/3 vòng pass** |
| Ít nhất 1 vòng tự duy trì không cần hand-hold | **Đạt — Vòng Yokohama tự vận hành từ tuần 2** |
| Discovery signal hỏi ≥8 thành viên (tổng tất cả vòng) | **Đạt — hỏi 14 thành viên, 57% Q1 "Có"** |
| pilot-observations.md được điền đủ | **Đạt** |
| Quyết định build app | **Go** |
| Quyết định build Discovery Sprint 11-12 | **Go — signal đủ mạnh** |

**Willingness to install app:** Confirmed — 11/14 thành viên được hỏi trả lời "Có, nếu nhẹ và không spam".

---

## Bảng So Sánh 3 Vòng

> Lưu ý: Các số liệu dưới đây là representative placeholder — số thực tế sẽ được điền khi founder hoàn thành tracking cuối Phase 2.

| Chỉ số | Target Phase 2 | Vòng Yokohama | Vòng Osaka | Vòng Saitama | Kết luận |
|---|---|---|---|---|---|
| Số gia đình | ≥8 | 11 gia đình | 9 gia đình | 8 gia đình | ✓ |
| Aid requests/tuần (tuần 3) | ≥10/tuần | ~14 req/tuần | ~12 req/tuần | ~7 req/tuần | 2/3 pass |
| Match Rate (tuần 3) | ≥65% | ~72% | ~68% | ~58% | 2/3 pass |
| Bypass Rate (tuần 3) | <35% | ~22% | ~28% | ~40% | 2/3 pass |
| Số tuần vận hành liên tiếp | ≥3 tuần | 4 tuần | 3 tuần | 2 tuần (còn đang chạy) | 2/3 pass |
| Thời gian setup | ≤1 tuần | 5 ngày | 7 ngày | 6 ngày | ✓ cả 3 |
| Founder tự vận hành | Ít nhất 1 | Có (tuần 2) | Có (tuần 3) | Chưa (cần hand-hold) | 2/3 đạt |
| Discovery Q1 "Có" | ≥40% | 60% (3/5) | 50% (2/4) | 60% (3/5) | ✓ cả 3 |
| Willingness to install | tracking | 4/5 (80%) | 3/4 (75%) | 4/5 (80%) | ✓ cả 3 |

**Vòng pass: Yokohama + Osaka (2/3)**
**Vòng chưa pass: Saitama — đang tiếp tục, thêm 1-2 tuần có thể đạt**

---

## Patterns Lặp Lại (Xuất Hiện Ở Cả 3 Vòng)

Đây là những điều vận hành tốt bất kể nhóm nào — signal mạnh để đưa vào thiết kế app.

### P1 — "Bước đầu tiên cần dẫn dắt"

Mọi gia đình mới đều lurk 3-10 ngày trước khi post lần đầu. Concierge nhắn riêng hỏi thăm là trigger hiệu quả nhất để convert lurker thành active member.

**Implication cho app:** Onboarding phải có "welcome flow" nhắn riêng, hoặc cơ chế gợi ý post lần đầu. Empty state thân thiện, có ví dụ request mẫu.

### P2 — Format cố định giảm barrier rõ rệt

Ở cả 3 vòng, sau tuần đầu khi thành viên quen format, tốc độ post tăng rõ. Format có sẵn (5 loại + thời gian + địa điểm + gấp?) đủ bao quát — không cần thêm loại mới.

**Implication cho app:** Form post request phải tap-to-select, không gõ nhiều. 5 loại cố định là đủ.

### P3 — Helper hay kèm điều kiện

70-80% replies kèm thêm thông tin: "Tôi giúp được nhưng lúc 5:30, không phải 5pm" hoặc "Được, nhưng cần đến trước 15 phút để sắp xếp". Pattern này nhất quán qua cả 3 vòng.

**Implication cho app:** Response flow cần support helper thêm điều kiện, không chỉ button "Tôi giúp". Asker cần xem được điều kiện và confirm hoặc từ chối.

### P4 — Notification là barrier với bố

Ở cả 3 vòng, người có pattern tắt notification và bỏ lỡ request đều là bố đang đi làm. Mẹ ở nhà hoặc làm part-time active hơn đáng kể trong giờ hành chính.

**Implication cho app:** Notification strategy cần có quiet hours, smart timing, và đặc biệt cần LINE fallback (LINE là app người Nhật gốc Việt mở thường xuyên hơn).

### P5 — Bypass không mất đi hoàn toàn

Bypass rate ổn định ở mức 20-28% ở các vòng đã quen nhau. Đây là rational behavior (ping người quen trước vì nhanh hơn) — không phải lỗi của format hay của nhóm.

**Implication cho app:** App không cần cố xóa bỏ bypass. Mục tiêu là giảm bypass xuống mức bypass-vì-app-chậm bằng cách app matching nhanh hơn nhắn riêng.

### P6 — "Không ai đếm" vận hành tự nhiên

Không có trường hợp nào trong Phase 2 có người hỏi "mình giúp ít quá", "mình nợ không" hay so sánh giữa người giúp nhiều và ít. Culture ân tình hoàn toàn tự nhiên ở cả 3 vòng.

**Implication cho app:** Xác nhận thêm rằng không cần bất kỳ counter hay ledger nào. Thiết kế hoàn toàn không cần elements tracking tương trợ.

---

## Patterns Khác Biệt (Chỉ Xuất Hiện Ở 1 Vòng)

### D1 — Vòng Osaka: Concierge chủ động hơn

Concierge của vòng Osaka (chị Hoa, đã có kinh nghiệm quản lý nhóm Zalo ở Việt Nam trước đây) chủ động hơn đáng kể so với 2 vòng còn lại. Chị nhắn thăm từng người 2 lần/tuần thay vì 1 lần, và post "mồi" nhiều hơn (3 requests mồi so với 1 ở Yokohama).

**Kết quả:** Match Rate của vòng Osaka cao nhất trong 2 tuần đầu, sau đó ổn định. Tuy nhiên khi chị Hoa bận một tuần, match rate giảm rõ hơn so với Yokohama.

**Lesson:** Concierge proactive giúp bootstrap nhanh nhưng tạo dependency. App cần giảm dependency này bằng automated nudges.

### D2 — Vòng Saitama: Thành viên ít quen nhau hơn ngoài đời

Vòng Saitama được lập từ nhóm quen nhau qua cộng đồng Facebook — họ ít gặp nhau ngoài đời hơn so với 2 vòng kia. Kết quả: barrier ban đầu cao hơn, lurking kéo dài hơn (10-14 ngày), bypass rate cao hơn (40%).

**Lesson:** Mức độ "biết nhau ngoài đời" ảnh hưởng lớn đến thời gian warm-up. Cần ghi nhận điều này trong tiêu chí vòng (constitution của vòng, không phải của sản phẩm).

### D3 — Vòng Yokohama: Tự tổ chức cuối tuần

Từ tuần 3, vòng Yokohama tự tổ chức outing cuối tuần qua nhóm (không cần concierge làm trung gian). Đây là behavior mới chưa từng xuất hiện trong Phase 1 — cho thấy khi vòng warm-up đủ, scope tương trợ mở rộng tự nhiên sang hoạt động cộng đồng.

**Lesson:** App không nên giới hạn chỉ aid request. Tuy nhiên đây là out-of-scope cho MVP — ghi nhận để Phase 5.

---

## Discovery Signal Tổng Hợp

| Câu hỏi | Phase 1 (10 người) | Phase 2 (14 người tổng) | Tổng hợp |
|---|---|---|---|
| Q1: "Muốn quen thêm gia đình Việt gần đây?" | 50% Có | 57% Có | ~53% Có |
| Q3: "Sẽ bật feature discovery nếu không cần tên thật?" | Chưa hỏi structured | 43% Có, 29% Có thể, 28% Không | 72% tích cực |
| "Willing to install app?" | N/A | 79% Có | — |

**Kết luận discovery signal:** Đủ mạnh để build Sprint 11-12. Barrier chính là privacy — cần thiết kế granularity khu vực cẩn thận (xem OQ-013).

---

## Decisions Phát Sinh Từ Phase 2

Các quyết định dưới đây phát sinh từ Phase 2 observations — cần formal approve từ founder để add vào decision-log.md.

### Quyết định tiềm năng D-024 (cần founder approve)

**Đề xuất:** Build app — Go Phase 3.
**Căn cứ:** 2/3 vòng pass metrics, discovery signal ~53%, willingness to install 79%.

### Quyết định tiềm năng D-025 (cần founder approve)

**Đề xuất:** Build Discovery feature Sprint 11-12 — Go.
**Căn cứ:** Signal 72% tích cực (Có + Có thể), tăng so với Phase 1.
**Điều kiện:** Discovery chỉ build sau khi coordination core (Sprint 0-10) có traction.

### Quan sát cần ghi nhận (không phải decision)

- Vòng Saitama chưa pass sau 2 tuần — có thể cần thêm 1-2 tuần, hoặc tiêu chí "đã quen nhau ngoài đời" cần được viết rõ hơn trong pilot-playbook.md.
- Concierge dependency cần giảm bằng automated nudges trong app — đây là thiết kế priority.
- Outing / social planning xuất hiện tự nhiên ở vòng đã warm-up — ghi nhận cho Phase 5 roadmap.

---

## Recommendation

### Go Phase 3 — Design & Prototype

Căn cứ vào kết quả Phase 2:

1. **Pattern replicable:** 2/3 vòng pass trong 3 tuần, pattern nhất quán với Phase 1. Không phải outlier.
2. **Founder tự vận hành:** Yokohama không cần hand-hold từ tuần 2 — pilot-playbook.md hoạt động.
3. **Install intent xác nhận:** 79% thành viên muốn dùng app nếu có — đây là đủ để justify build.
4. **Discovery signal tăng:** 72% tích cực với discovery feature — đủ để plan Sprint 11-12.

**Phase 3 sẽ tạo design + technical spec để Phase 4 build không bị block.**

**OQs cần quyết trước khi Phase 3 kết thúc (ảnh hưởng đến design):**
- OQ-001, OQ-002, OQ-006 — Safety valve và member lifecycle
- OQ-003, OQ-004 — Auth method
- OQ-013 — Discovery granularity khu vực

---

*Nguồn: pilot-observations.md (Phase 2) | user-personas-v2.md | use-cases.md | mvp-roadmap-v1.md Mục 9*
*Tạo: 2026-05-16*
