---
title: User Stories v2 — Vòng Tròn Tương Trợ
ngày_tạo: 2026-05-16
phase: Phase 2 — Replication Test
---

# User Stories v2 — Vòng Tròn Tương Trợ

**Phiên bản:** v2 (refine từ v1 dựa trên Phase 1 data)
**Tạo:** 2026-05-16
**Tổng stories:** 30 (24 từ v1 + 6 mới từ Phase 1)

> **Hướng đọc tags:**
> - `[VALIDATED]` — Story có evidence từ Phase 1 (observation hoặc phỏng vấn)
> - `[NEW]` — Story mới phát sinh từ Phase 1, không có trong v1
> - `[REVISED]` — Story v1 đã được cập nhật acceptance criteria hoặc wording dựa trên thực tế
> - `[ASSUMED]` — Story vẫn là giả định, chưa có evidence đủ từ Phase 1

Personas: **Linh** (bà mẹ chủ động), **Tuấn** (bố bận rộn), **Mai** (gia đình mới đến), **Hùng** (người kết nối)

Xem thêm: [user-personas-v2.md](./user-personas-v2.md) | [user-flows.md](./user-flows.md) | [constitution.md](../00-foundation/constitution.md)

---

## MoSCoW Legend

- **Must** — Phải có để validate được trong Phase 2
- **Should** — Quan trọng, nên có trong MVP
- **Could** — Tốt nếu có, nhưng không block
- **Won't** — Không làm trong scope hiện tại

---

## Nhóm 1 — Aid Request (Đăng / Phản hồi / Theo dõi)

### US-001 — Post request nhanh `[VALIDATED]`
**Priority:** Must

> As **Linh**, I want to post an aid request in under 30 seconds so that I can ask for help without interrupting what I'm doing.

**Acceptance Criteria (Phase 2 — vẫn LINE Open Chat):**
- Có format cố định để post (5 loại + thời gian + địa điểm + có gấp không)
- Template được pin sẵn trong nhóm — thành viên copy và điền
- Concierge hướng dẫn format tuần đầu, sau đó member tự dùng

**Evidence Phase 1:** Linh và 3 thành viên khác đạt thời gian post dưới 45 giây sau tuần 1.

---

### US-002 — Chỉ định loại aid request `[VALIDATED]`
**Priority:** Must

> As **Linh**, I want to clearly label what kind of help I need (đón con / mượn đồ / trông con ngắn / chở đi đâu / khác) so that người trong vòng biết ngay mình cần gì.

**Evidence Phase 1:** 5 loại đủ bao quát — chỉ có 2 request dùng "khác" trong 3 tuần, cả 2 đều không fit hẳn vào loại nào khác.

---

### US-003 — Đánh dấu request gấp `[VALIDATED]`
**Priority:** Must

> As **Linh**, I want to mark my request as "gấp" so that người trong vòng biết cần phản hồi sớm hơn bình thường.

**Acceptance Criteria cập nhật:** Request gấp phải có thể nhận match trong vòng 30 phút trong giờ active (7am-10pm). Ngoài giờ này — concierge có thể ping thêm.

**Evidence Phase 1:** 4/5 requests gấp được match trong 30 phút. 1 case gấp lúc 11pm — match sau 45 phút.

---

### US-004 — Phản hồi "tôi giúp được" `[VALIDATED]`
**Priority:** Must

> As **Tuấn**, I want to easily respond "tôi giúp được" to a request so that tôi không phải viết câu trả lời dài.

**Acceptance Criteria cập nhật:** Helper được phép thêm điều kiện khi reply (ví dụ: "Tôi giúp được nhưng chỉ lúc 5:30, không phải 5pm"). Đây là behavior thực tế quan sát được, cần support trong design tương lai.

**Evidence Phase 1:** 70% reply đi kèm thêm thông tin cụ thể (giờ, điều kiện). Ít ai chỉ reply "Tôi giúp được" đơn thuần.

---

### US-005 — Từ chối nhẹ nhàng không cần giải thích `[VALIDATED]`
**Priority:** Must

> As **Tuấn**, I want to be able to not respond or decline without explaining why so that tôi không cảm thấy bị áp lực.

**Ghi chú:** Nguyên tắc 3 — Tôn trọng thể diện. Không có feature "ai đã từ chối".

**Evidence Phase 1:** Nhiều thành viên không reply khi không giúp được — không có ai bị phàn nàn về việc này. Pattern im lặng được cả nhóm ngầm hiểu.

---

### US-006 — Trao đổi chi tiết sau khi match `[VALIDATED]`
**Priority:** Must

> As **Linh** (asker), I want to quickly connect with my helper via LINE after they agree to help so that chúng tôi có thể chốt chi tiết mà không cần làm phức tạp trong group chat.

**Evidence Phase 1:** 100% cases sau match đều tự nhiên chuyển sang LINE để chốt chi tiết. Hand-off hoạt động tốt — không cần thêm cơ chế.

---

### US-007 — Đánh dấu request đã hoàn thành `[REVISED]`
**Priority:** Should

> As **Linh** (asker), I want to mark my request as "done" after receiving help so that nhóm biết việc đã ổn và không ai phải hỏi thêm.

**Acceptance Criteria cập nhật (từ v1):** Không nhất thiết cần format cứng — trong Phase 1, người nhờ hay reply vào thread cũ *"Cảm ơn nhà [tên], đã ok rồi"*. Hành vi tự nhiên này đủ tốt, không cần ép format.

**Evidence Phase 1:** 80% requests được update kết quả — hầu hết qua reply tự nhiên, không cần nhắc.

---

### US-008 — Xem lại lịch sử request của vòng `[ASSUMED]`
**Priority:** Could

> As **Hùng**, I want to see recent aid requests in my circle so that tôi có thể nắm tổng thể mà không cần đọc lại toàn bộ chat.

**Ghi chú:** Phase 1 dùng LINE nên cần cuộn chat. Feature này sẽ quan trọng hơn khi có app.

---

### US-009 — Post nhiều loại request trong một tuần `[VALIDATED]`
**Priority:** Should

> As **Linh**, I want to post different types of requests in the same week without feeling like I'm "taking too much" so that tôi có thể nhờ tự nhiên theo nhu cầu thực tế.

**Ghi chú:** Nguyên tắc 2 — Không ledger, không mắc nợ.

**Evidence Phase 1:** Không có thành viên nào tự hạn chế số lần post vì lo "nhờ nhiều quá". Câu hỏi thăm dò về topic này cho kết quả: *"Mình giúp người ta thì người ta giúp lại thôi, bình thường"* — culture ân tình hoạt động tự nhiên.

---

### US-025 — Concierge nhắc nhẹ khi request chưa được match `[NEW]`
**Priority:** Should

> As **concierge**, I want to gently nudge the group when a request has been unanswered for 2+ hours (urgent) or 24+ hours (regular) so that không ai bị bỏ lại không có người giúp.

**Acceptance Criteria:**
- Request gấp: concierge có thể tag/nhắc sau 2 giờ không có reply
- Request thường: sau 24 giờ concierge nhắc
- Nhắc theo kiểu hỏi thăm tự nhiên, không theo kiểu thúc giục hay áp lực

**Evidence Phase 1:** Tuần 2 có 1 request không ai reply trong 4 giờ. Concierge nhắc → có người reply trong 20 phút. Không có can thiệp = miss case.

---

### US-026 — Helper nêu điều kiện khi nhận giúp `[NEW]`
**Priority:** Should

> As **Tuấn** (helper), I want to specify conditions when I agree to help (ví dụ: "Tôi giúp được nhưng chỉ lúc 5:30") so that asker biết ngay có cần tìm thêm người không.

**Acceptance Criteria:**
- Helper có thể reply "Tôi giúp được, nhưng [điều kiện]"
- Asker xác nhận được không trong vòng 30 phút
- Nếu không xác nhận được → hiểu là asker đang tìm thêm

**Evidence Phase 1:** 70% replies kèm điều kiện cụ thể. Cần design support pattern này.

---

## Nhóm 2 — Vòng (Tham gia / Mời / Quản lý)

### US-010 — Tạo vòng với tiêu chí rõ ràng `[VALIDATED]`
**Priority:** Must

> As **Hùng**, I want to create a circle with clear criteria (khu vực, tuổi con) so that mọi người biết vòng này dành cho ai.

**Evidence Phase 1:** Vòng pilot có tiêu chí rõ từ đầu. Thành viên mới join đều đọc và tự hiểu scope — không ai hỏi "vòng này là gì".

---

### US-011 — Mời thành viên mới `[VALIDATED]`
**Priority:** Must

> As **Linh**, I want to invite a new family to our circle so that vòng tròn lớn hơn và có thêm người có thể giúp nhau.

**Evidence Phase 1:** 3 thành viên được mời trong Phase 1, tất cả qua LINE cá nhân. Không ai đến qua link public. Pattern: mời riêng, giải thích ngắn, họ join.

---

### US-012 — Xem ai trong vòng của mình `[VALIDATED]`
**Priority:** Must

> As **Mai**, I want to know who is in my circle so that tôi biết mình đang nhờ những ai và có thể nhớ mặt người sẽ giúp mình.

**Evidence Phase 1:** Mai hỏi concierge *"Vòng này có ai ở gần khu mình không?"* ngay tuần đầu. Nhu cầu biết thành viên (đặc biệt theo khu vực) là thật.

---

### US-013 — Thông báo khi có thành viên mới `[VALIDATED]`
**Priority:** Should

> As **Hùng**, I want to be notified when a new member joins so that tôi biết và có thể chào đón họ.

**Ghi chú:** Nguyên tắc 8 — Minh bạch = thông tin, không phải vote.

**Evidence Phase 1:** Khi 3 thành viên mới join, Hùng và Linh tự nhiên chào đón trong group chat. Behavior này diễn ra spontaneous — chứng tỏ nhu cầu thật.

---

### US-014 — Rời vòng khi cần `[ASSUMED]`
**Priority:** Should

> As **Tuấn**, I want to leave a circle without drama so that tôi có thể ra đi nhẹ nhàng nếu không còn phù hợp.

**Ghi chú:** Không có case rời vòng trong Phase 1. Story vẫn là giả định nhưng quan trọng cho design.

---

### US-027 — Concierge onboard thành viên mới `[NEW]`
**Priority:** Must

> As **concierge**, I want to personally welcome new members and guide them to their first action so that gia đình mới đến không bị lurk lâu mà không dùng vòng.

**Acceptance Criteria:**
- Trong 48 giờ sau khi thành viên mới join: concierge nhắn riêng chào hỏi
- Hỏi thăm ngắn: khu vực, tuổi con, điều họ hay cần giúp nhất
- Mời họ post request thử (dù nhỏ) trong tuần đầu
- Nếu sau 7 ngày vẫn không có action: concierge nhắn thêm lần nữa

**Evidence Phase 1:** Mai chỉ post lần đầu sau khi concierge nhắn riêng. Không có concierge onboard = lurker kéo dài.

---

## Nhóm 3 — Notification (Thông báo)

### US-015 — Nhận thông báo đúng lúc `[VALIDATED]`
**Priority:** Must

> As **Tuấn**, I want to receive a notification only when there's a request I can actually help with so that tôi không bị làm phiền bởi những request không liên quan.

**Evidence Phase 1:** 2 thành viên tắt notification LINE Open Chat vì *"có quá nhiều tin khác"*. Đây là friction thật — cần giải quyết trong design app.

---

### US-016 — Quiet hours `[ASSUMED]`
**Priority:** Should

> As **Tuấn**, I want notifications to respect quiet hours (22:00-7:00) so that tôi không bị thức giấc bởi request không khẩn cấp.

**Evidence Phase 1:** Có 2 request được post sau 10pm. Không có thành viên nào phàn nàn — nhưng cả 2 đều không được match đến sáng hôm sau. Quiet hours vẫn là design cần thiết khi có app.

---

### US-017 — Chọn loại request muốn được thông báo `[REVISED]`
**Priority:** Should

> As **Tuấn**, I want to set which types of aid requests I can help with so that tôi chỉ nhận notification phù hợp với khả năng của mình.

**Evidence Phase 1:** Tuấn tự nói muốn *"chỉ thấy request đón con và chở đi đâu"*. Priority tăng từ Could lên Should dựa trên feedback thực tế.

---

## Nhóm 4 — Discovery (Tìm kiếm kết nối)

> Phase 1 xác nhận signal: **5/10 gia đình (50%) muốn quen thêm gia đình Việt gần đây.** Đây là ngưỡng đủ để expand discovery stories từ 4 lên 6. Xem chi tiết trong [user-personas-v2.md](./user-personas-v2.md).

### US-018 — Muốn quen gia đình Việt gần nhà `[VALIDATED]`
**Priority:** Must (để tiếp tục đo signal trong Phase 2)

> As **Mai**, I want to find Vietnamese families near my area who have children around the same age so that tôi có thể xây dựng network mà không cần phụ thuộc vào sự kiện cộng đồng lớn.

**Evidence Phase 1:** 5/10 thành viên trả lời "Có" cho Q1. Signal đủ mạnh để prioritize discovery feature.

**Validation signal Phase 2:** Hỏi câu này ở vòng mới (2-3 vòng). Nếu tỷ lệ "Có" vẫn ≥40% → confirmed.

---

### US-019 — Opt-in hiển thị thông tin tối thiểu `[VALIDATED]`
**Priority:** Should

> As **Mai**, I want to choose to show only my district and children's ages — not my name or exact address — so that tôi cảm thấy an toàn khi muốn được tìm thấy.

**Ghi chú:** Nguyên tắc 9 — Vòng kín. Discovery profile: khu vực quận/TP + tuổi con. Không tên, không ảnh, không ga cụ thể.

**Evidence Phase 1:** Mai và 2 thành viên khác xác nhận sẽ opt-in nếu chỉ cần khu vực + tuổi con, không cần tên thật.

---

### US-020 — Gửi lời chào, không phải lời mời kết bạn chính thức `[ASSUMED]`
**Priority:** Could

> As **Mai**, I want to send a short greeting to another family so that chúng tôi có thể bắt đầu nói chuyện trên LINE mà không cần commit vào bất cứ điều gì ngay.

**Ghi chú:** Decline không notify người gửi (Nguyên tắc 3). Accept → LINE hand-off. Không in-app chat.

---

### US-021 — Từ chối lời chào mà không cần giải thích `[VALIDATED]`
**Priority:** Must (nếu Discovery được build)

> As **Linh** (đang visible trong discovery), I want to decline a greeting without the sender knowing so that tôi không phải lo về việc giải thích hay tạo ra sự khó xử.

**Evidence Phase 1:** Khi được hỏi về discovery, nhiều thành viên tự nêu concern *"Nhỡ mình không muốn quen thì phải từ chối người ta, kỳ lắm"*. Ẩn danh decline là điều kiện tiên quyết để họ opt-in.

---

### US-028 — Discovery theo context vòng tròn `[NEW]`
**Priority:** Should (nếu Discovery được build)

> As **Hùng** (founder muốn mở rộng vòng), I want to find families who match my circle's criteria so that tôi có thể mời người phù hợp vào vòng, không chỉ kết bạn cá nhân.

**Acceptance Criteria:**
- Discovery có thể filter theo: khu vực + tuổi con (giống tiêu chí vòng)
- Kết quả discovery có thể convert thành "gửi lời mời vào vòng" thay vì chỉ gửi lời chào cá nhân
- Flow: Hùng thấy profile → gửi lời chào kèm *"Mình đang có vòng tương trợ khu X, bạn có muốn join không?"* → hand-off sang LINE

**Evidence Phase 1:** Hùng hỏi founder về khả năng dùng discovery để tìm thành viên mới cho vòng — đây là use case khác biệt so với Mai (tìm bạn cá nhân).

---

### US-029 — Tắt discovery khi không muốn `[NEW]`
**Priority:** Must (nếu Discovery được build)

> As **Mai**, I want to easily turn off my discovery visibility so that tôi có thể kiểm soát khi nào mình muốn được tìm thấy và khi nào không.

**Acceptance Criteria:**
- Default: Discovery tắt
- Khi bật: tự động expire sau 30 ngày, có nhắc gia hạn
- Tắt ngay lập tức được bất cứ lúc nào, không cần giải thích

**Ghi chú:** Nguyên tắc 9 và Constitution forbid pattern về privacy — default off là bắt buộc.

---

### US-030 — Discovery không reveal vòng đang tham gia `[NEW]`
**Priority:** Must (nếu Discovery được build)

> As **Mai**, I want my current circles to not be shown in my discovery profile so that thông tin trong vòng của mình không bị lộ ra ngoài.

**Acceptance Criteria:**
- Discovery profile không chứa: tên thật, ảnh, ga cụ thể, địa chỉ, vòng đang tham gia
- Chỉ hiển thị: khu vực quận/TP, tuổi con, giới thiệu ngắn tuỳ chọn (≤100 ký tự)

**Ghi chú:** Directly từ Constitution — Forbidden Patterns về Privacy trong Discovery.

---

## Nhóm 5 — Trải nghiệm chung

### US-022 — Cảm giác an toàn trong vòng kín `[VALIDATED]`
**Priority:** Must

> As **Mai**, I want to know that only circle members can see my requests so that tôi cảm thấy an toàn khi nhờ vả mà không sợ người ngoài nhìn vào.

**Evidence Phase 1:** Không có ai hỏi "ai sẽ thấy tin mình post?" — cho thấy cảm giác vòng kín đã được thiết lập rõ từ đầu (qua LINE Open Chat invite-only).

---

### US-023 — Không bị nhắc nhở hay so sánh `[VALIDATED]`
**Priority:** Must

> As **Tuấn**, I want to not see how many times I've helped or been helped so that việc tương trợ cảm giác tự nhiên, không như giao dịch phải ghi sổ.

**Ghi chú:** Nguyên tắc 2 — Không ledger, không đo đếm.

**Evidence Phase 1:** Khi founder thử hỏi *"Tuần này ai giúp nhiều nhất nhỉ?"* (test), một thành viên reply ngay *"Ừ mà đếm làm gì, ai rảnh thì giúp thôi"* — culture tự nhiên đúng hướng.

---

### US-024 — Onboard nhanh, không phức tạp `[REVISED]`
**Priority:** Must

> As **Mai** (người mới), I want to understand how to use the circle in under 5 minutes so that tôi không cần ai hướng dẫn từng bước mới dùng được.

**Acceptance Criteria cập nhật:** Thành viên mới cần có ít nhất 1 action (post hoặc reply) trong tuần đầu tiên. Lurk quá 7 ngày = onboard chưa thành công, cần concierge can thiệp.

**Evidence Phase 1:** Không phải tất cả thành viên tự nhiên onboard trong 5 phút — cần concierge hỗ trợ cho persona Mai. Acceptance criteria điều chỉnh thực tế hơn.

---

## Tổng quan MoSCoW — v2

| Priority | Số stories | IDs |
|---|---|---|
| **Must** | 14 | US-001, 002, 003, 004, 005, 006, 010, 011, 012, 015, 018, 021, 022, 023, 024, 027, 029, 030 |
| **Should** | 9 | US-007, 009, 013, 014, 016, 017, 019, 025, 026, 028 |
| **Could** | 2 | US-008, 020 |
| **Won't (scope hiện tại)** | — | In-app chat, ledger, points, leaderboard, public feed, booking dịch vụ |

*Lưu ý: US-021, 029, 030 chỉ Must nếu Discovery feature được build (quyết định sau Phase 2).*

---

## Discovery Stories — Phase 2 Priority

Phase 1 đã confirm signal 50% (5/10 gia đình muốn quen thêm). Phase 2 cần validate tính nhất quán của signal này ở các vòng mới.

**6 discovery stories cần theo dõi trong Phase 2:**

1. **US-018** — Tiếp tục đo Q1 ở vòng mới (target ≥40% Có)
2. **US-019** — Đo willingness opt-in tối thiểu ở vòng mới
3. **US-021** — Validate privacy expectation khi decline
4. **US-028** — Discovery theo context vòng (use case của Hùng)
5. **US-029** — Confirm rằng default-off là đúng
6. **US-030** — Confirm privacy boundaries được chấp nhận

Nếu Phase 2 xác nhận signal: prioritize build Discovery feature trong Sprint 11-12.

---

*Nguồn: `user-stories-v1.md` | Phase 1 pilot observations | `user-personas-v2.md` | `constitution.md` | `mvp-roadmap-v1.md` Phase 2*
*Tạo: 2026-05-16 | Cập nhật thành v3 sau Phase 2 validation*
