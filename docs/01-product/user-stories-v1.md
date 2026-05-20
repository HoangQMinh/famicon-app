# User Stories v1 — Vòng Tròn Tương Trợ

**Tạo:** 2026-05-16
**Phase:** Phase 1 — Pre-product Validation
**Phiên bản:** v1 (dựa trên product-discovery-v3.md và user-personas-v1.md)
**Cập nhật tiếp theo:** Sau Phase 1, refine thành v2 dựa trên data thực địa

Format: `As a [persona], I want to [action] so that [benefit]`

Personas: **Linh** (bà mẹ chủ động), **Tuấn** (bố bận rộn), **Mai** (gia đình mới đến), **Hùng** (người kết nối)

Xem thêm: [user-personas-v1.md](./user-personas-v1.md) | [constitution.md](../00-foundation/constitution.md) | [glossary.md](../00-foundation/glossary.md)

---

## MoSCoW Legend

- **Must** — Phải có để Phase 1 có thể validate được
- **Should** — Quan trọng, nên có trong MVP
- **Could** — Tốt nếu có, nhưng không block
- **Won't** — Không làm trong scope hiện tại (ghi lại để tránh scope creep)

---

## Nhóm 1 — Aid Request (Đăng / Phản hồi / Theo dõi)

### US-001 — Post request nhanh
**Priority:** Must

> As **Linh**, I want to post an aid request in under 30 seconds so that I can ask for help without interrupting what I'm doing.

**Acceptance Criteria (Phase 1 — LINE Open Chat):**
- Có format cố định để post (5 loại + thời gian + địa điểm + có gấp không)
- Founder hướng dẫn format trong tuần đầu, sau đó member tự dùng

**Validation signal:** Đo thời gian thực tế từ quyết định "mình cần nhờ" đến lúc tin xuất hiện trong chat.

---

### US-002 — Chỉ định loại aid request
**Priority:** Must

> As **Linh**, I want to clearly label what kind of help I need (đón con / mượn đồ / trông con ngắn / chở đi đâu / khác) so that người trong vòng biết ngay mình cần gì và ai phù hợp có thể phản hồi.

**Validation signal:** Có member nào nhầm lẫn về loại request không? Có loại nào hay dùng hơn không?

---

### US-003 — Đánh dấu request gấp
**Priority:** Must

> As **Linh**, I want to mark my request as "gấp" so that những người trong vòng biết cần phản hồi sớm hơn bình thường.

**Validation signal:** Request gấp có được match nhanh hơn request thường không?

---

### US-004 — Phản hồi "tôi giúp được"
**Priority:** Must

> As **Tuấn**, I want to easily respond "tôi giúp được" to a request so that tôi không phải viết câu trả lời dài, chỉ cần xác nhận ngắn gọn.

**Validation signal:** Tỷ lệ member phản hồi so với tổng số member nhìn thấy request.

---

### US-005 — Từ chối nhẹ nhàng không cần giải thích
**Priority:** Must

> As **Tuấn**, I want to be able to not respond or decline without explaining why so that tôi không cảm thấy bị áp lực khi không giúp được lần này.

**Ghi chú:** Nguyên tắc 3 — Tôn trọng thể diện. Không có feature "ai đã từ chối".

**Validation signal:** Quan sát xem member có hay để trống không trả lời không, hay hay nêu lý do. Tỷ lệ decline kèm giải thích vs không giải thích.

---

### US-006 — Trao đổi chi tiết sau khi match
**Priority:** Must

> As **Linh** (asker), I want to quickly connect with my helper via LINE after they agree to help so that chúng tôi có thể chốt chi tiết mà không cần làm phức tạp trong group chat.

**Ghi chú:** App không build chat — hand-off sang LINE là thiết kế có chủ ý (xem [glossary.md](../00-foundation/glossary.md) — Hand-off).

**Validation signal:** Sau khi match trên LINE Open Chat, bao nhiêu phần trăm case hai bên liên hệ trực tiếp thành công?

---

### US-007 — Đánh dấu request đã hoàn thành
**Priority:** Should

> As **Linh** (asker), I want to mark my request as "done" after receiving help so that nhóm biết việc đã ổn và không ai phải hỏi thêm.

**Validation signal (Phase 1):** Founder theo dõi xem người nhờ có hay update kết quả không, hay để trống.

---

### US-008 — Xem lại lịch sử request của vòng
**Priority:** Could

> As **Hùng**, I want to see recent aid requests in my circle so that tôi có thể nắm tổng thể tình hình vòng mà không cần đọc lại toàn bộ chat history.

**Ghi chú:** Phase 1 dùng LINE Open Chat nên việc này là đọc lại chat. Feature này sẽ quan trọng hơn khi có app.

---

### US-009 — Post nhiều loại request trong một tuần
**Priority:** Should

> As **Linh**, I want to post different types of requests in the same week without feeling like I'm "taking too much" so that tôi có thể nhờ tự nhiên theo nhu cầu thực tế mà không tự kiểm duyệt.

**Ghi chú:** Liên quan trực tiếp đến Nguyên tắc 2 và 3 — không ledger, không mắc nợ.

**Validation signal:** Member có tự hạn chế số lần post không? Có ai nêu lo ngại "nhờ nhiều quá" không?

---

## Nhóm 2 — Vòng (Tham gia / Mời / Quản lý)

### US-010 — Tạo vòng với tiêu chí rõ ràng
**Priority:** Must

> As **Hùng**, I want to create a circle with clear criteria (khu vực, tuổi con) so that mọi người biết vòng này dành cho ai và ai phù hợp mới vào.

**Ghi chú:** Xem [glossary.md](../00-foundation/glossary.md) — Tiêu chí (Circle Criteria).

**Validation signal (Phase 1):** Khi tạo channel LINE Open Chat, founder có đặt tiêu chí rõ ràng không? Member có đọc và follow tiêu chí không?

---

### US-011 — Mời thành viên mới
**Priority:** Must

> As **Linh**, I want to invite a new family to our circle so that vòng tròn lớn hơn và có thêm người có thể giúp nhau.

**Ghi chú:** Mọi member đều có quyền mời, không chỉ founder. Xem Invite Flow trong [glossary.md](../00-foundation/glossary.md).

**Validation signal:** Ai hay mời người mới? Mời qua kênh nào (LINE, Messenger, in person)?

---

### US-012 — Xem ai trong vòng của mình
**Priority:** Must

> As **Mai**, I want to know who is in my circle so that tôi biết mình đang nhờ những ai và có thể nhớ mặt người sẽ giúp mình.

**Validation signal:** Khi mới join LINE Open Chat, member có hay hỏi "vòng này có ai?" không?

---

### US-013 — Thông báo khi có thành viên mới
**Priority:** Should

> As **Hùng**, I want to be notified when a new member joins so that tôi biết và có thể chào đón họ, đồng thời vòng không có người lạ đột ngột xuất hiện.

**Ghi chú:** Nguyên tắc 8 — Minh bạch = thông tin, không phải vote. Thông báo để biết, không phải để kiểm soát.

---

### US-014 — Rời vòng khi cần
**Priority:** Should

> As **Tuấn**, I want to leave a circle without drama so that tôi có thể ra đi nhẹ nhàng nếu không còn phù hợp, không cần giải thích với cả nhóm.

**Ghi chú:** Nguyên tắc 3 — Khi rời: không thông báo cho vòng, tránh awkwardness. Xem Member Lifecycle trong product-discovery-v3.md.

---

## Nhóm 3 — Notification (Thông báo)

### US-015 — Nhận thông báo đúng lúc
**Priority:** Must

> As **Tuấn**, I want to receive a notification only when there's a request I can actually help with so that tôi không bị làm phiền bởi những request không liên quan đến mình.

**Ghi chú:** Nguyên tắc 4 — Yên tĩnh khi không cần. Không spam.

**Validation signal (Phase 1):** Có member nào tắt notification của LINE Open Chat không? Lý do là gì?

---

### US-016 — Quiet hours
**Priority:** Should

> As **Tuấn**, I want notifications to respect quiet hours (22:00-7:00) so that tôi không bị thức giấc bởi request không khẩn cấp.

**Ghi chú:** Nguyên tắc 4. Trừ request được đánh dấu "gấp".

**Validation signal (Phase 1):** Có request nào được post sau 10pm không? Phản hồi thường đến lúc mấy giờ?

---

### US-017 — Chọn loại request muốn được thông báo
**Priority:** Could

> As **Tuấn**, I want to set which types of aid requests I can help with so that tôi chỉ nhận notification cho đón con và chở đi đâu (vì có xe), không nhận cho mượn đồ hay trông con mà mình không thể giúp.

**Validation signal:** Member có hay mention "việc này mình giúp được, việc kia thì không" không?

---

## Nhóm 4 — Discovery (Tìm kiếm kết nối)

> Nhóm này tập trung validate signal discovery — liệu tính năng tìm gia đình Việt gần nhà có được người dùng muốn không. Đây là giả định A15-A17 trong product-discovery-v3.md cần kiểm chứng trong Phase 1.

### US-018 — Muốn quen gia đình Việt gần nhà
**Priority:** Must (để đo signal)

> As **Mai**, I want to find Vietnamese families near my area who have children around the same age so that tôi có thể xây dựng network mà không cần phụ thuộc vào các sự kiện cộng đồng lớn.

**Validation signal (Phase 1 — câu hỏi phỏng vấn):**
- "Bạn có muốn quen thêm gia đình Việt gần đây không?"
- "Nếu có, bạn đang tìm bằng cách nào?"
- "Nếu app có tính năng tìm gia đình gần theo khu vực + tuổi con, bạn có bật lên không?"

**Mức độ quan trọng:** Nếu ≥50% pilot members trả lời "Có" → signal đủ để build Discovery feature. Xem tracking-template.md — Sheet 4.

---

### US-019 — Opt-in hiển thị thông tin tối thiểu
**Priority:** Should (nếu Discovery được xác nhận)

> As **Mai**, I want to choose to show only my district and children's ages — not my name or exact address — so that tôi cảm thấy an toàn khi muốn được tìm thấy.

**Ghi chú:** Nguyên tắc 9 — Vòng kín. Discovery profile chỉ hiển thị khu vực quận/TP + tuổi con. Không tên thật, không ảnh, không ga cụ thể.

---

### US-020 — Gửi lời chào, không phải lời mời kết bạn chính thức
**Priority:** Could (nếu Discovery được xác nhận)

> As **Mai**, I want to send a short greeting to another family so that chúng tôi có thể bắt đầu nói chuyện trên LINE mà không cần commit vào bất cứ điều gì ngay.

**Ghi chú:** Decline không notify người gửi (Nguyên tắc 3 — thể diện). Accept → LINE hand-off. Không có in-app chat.

---

### US-021 — Từ chối lời chào mà không cần giải thích
**Priority:** Must (nếu Discovery được xác nhận)

> As **Linh** (đang visible trong discovery), I want to decline a greeting without the sender knowing so that tôi không phải lo về việc giải thích hay tạo ra sự khó xử với người gửi.

**Ghi chú:** Nguyên tắc 3. Decline ẩn danh, người gửi không biết mình bị decline.

---

## Nhóm 5 — Trải nghiệm chung

### US-022 — Cảm giác an toàn trong vòng kín
**Priority:** Must

> As **Mai**, I want to know that only circle members can see my requests so that tôi cảm thấy an toàn khi nhờ vả mà không sợ người ngoài nhìn vào chuyện gia đình.

**Ghi chú:** Nguyên tắc 9 — Vòng kín. Không có feed công cộng, không share ra ngoài.

**Validation signal:** Member có hỏi "ai sẽ thấy tin mình post?" không?

---

### US-023 — Không bị nhắc nhở hay so sánh
**Priority:** Must

> As **Tuấn**, I want to not see how many times I've helped or been helped so that việc tương trợ cảm giác tự nhiên, không như giao dịch phải ghi sổ.

**Ghi chú:** Nguyên tắc 2 — Không ledger, không đo đếm. Vi phạm nguyên tắc này là fatal cho sản phẩm.

**Validation signal:** Có member nào tự hỏi "mình giúp mấy lần rồi nhỉ?" không? Phản ứng nếu founder cố tình hỏi câu này.

---

### US-024 — Onboard nhanh, không phức tạp
**Priority:** Must

> As **Mai** (người mới), I want to understand how to use the circle in under 5 minutes so that tôi không cần ai hướng dẫn từng bước mới dùng được.

**Validation signal (Phase 1):** Founder quan sát xem member mới có tự hiểu format và post đúng không, hay cần nhắc nhiều lần.

---

## Tổng quan MoSCoW

| Priority | Số stories | IDs |
|---|---|---|
| **Must** | 11 | US-001, 002, 003, 004, 005, 006, 010, 011, 012, 015, 018, 021, 022, 023, 024 |
| **Should** | 6 | US-007, 009, 013, 014, 016, 019 |
| **Could** | 3 | US-008, 017, 020 |
| **Won't (scope hiện tại)** | — | In-app chat, ledger, points, leaderboard, public feed, booking dịch vụ |

---

## Discovery Validation Stories — Phase 1 Priority

Ba stories quan trọng nhất để validate Discovery signal trong Phase 1:

1. **US-018** — Đo nhu cầu quen gia đình Việt gần nhà (câu hỏi phỏng vấn)
2. **US-019** — Đo willingness opt-in với thông tin tối thiểu
3. **US-021** — Validate expectation về privacy khi decline

Kết quả sẽ quyết định có build Discovery feature (Sprint 11-12) hay không.

---

*Nguồn: `product-discovery-v3.md` Mục 7, 9, 14, 15 | `user-personas-v1.md` | `mvp-roadmap-v1.md` Phase 1-2*
*Tạo: 2026-05-16 | Cập nhật thành v2 sau Phase 1 validation*
