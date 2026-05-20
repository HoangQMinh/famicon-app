# Open Questions Register — Vòng Tròn Tương Trợ

> Các câu hỏi chưa được quyết định, sẽ quyết khi có đủ context.
> Docs Steward Agent track register này và flag cho Master Agent khi deadline đang đến gần.

---

## Quy tắc xử lý

- **Docs Steward track** register này — flag khi deadline gần
- **Trước khi sang phase mới:** review tất cả OQs có deadline thuộc phase đó
- **Khi OQ được quyết:** move entry sang `decision-log.md` + update status ở đây thành RESOLVED + ghi số D-XXX tham chiếu
- **Không tự ý quyết Open Question** — phải qua founder
- **OQ mới** khi phát sinh: thêm vào cuối bảng, báo Master Agent

---

## Bảng Open Questions

| ID     | Question                                                                    | Impact nếu không quyết                   | Deadline          | Status   |
| ------ | --------------------------------------------------------------------------- | ---------------------------------------- | ----------------- | -------- |
| OQ-001 | "2 thành viên lâu năm nhất" hoạt động thế nào khi vòng còn ít người?       | Block invite flow và safety valve design  | Phase 3           | RESOLVED — D-025 |
| OQ-002 | "Mời lại" 1-click: có giữ data cũ của thành viên không?                    | Block member lifecycle design             | Phase 3           | RESOLVED — D-026 |
| OQ-003 | Auth method: Phone OTP, Email, hay cả hai?                                  | Block Sprint 1 (auth flow)                | Phase 3 cuối      | RESOLVED — D-027 |
| OQ-004 | Có dùng LINE Login làm authentication không?                                | Block auth design và ADR-003              | Phase 3 cuối      | RESOLVED — D-027 |
| OQ-005 | Định nghĩa chính xác "active member" cho metrics và Active Circle là gì?   | Block analytics setup và circle lifecycle | Phase 3 cuối      | RESOLVED — D-028 |
| OQ-006 | Invitation link expire sau bao lâu?                                         | Block invite design Sprint 2              | Phase 3           | RESOLVED — D-024 |
| OQ-007 | Match algorithm v1: weight của urgency / location / helper preference?       | Block notification logic Sprint 6         | Phase 4 Sprint 6  | OPEN     |
| OQ-008 | Avatar storage: Supabase Storage hay CDN ngoài (Cloudflare R2, v.v.)?      | Block profile feature Sprint 3            | Phase 3 cuối      | RESOLVED — D-029 |
| OQ-009 | Có cho phép xoá hoàn toàn account (right to erasure) không?                | Block privacy spec và security-privacy.md | Phase 3 cuối      | RESOLVED — D-030 |
| OQ-010 | Aid request tự động expire sau bao lâu nếu không có match?                 | Block request lifecycle design Sprint 4   | Phase 4 Sprint 4  | RESOLVED — D-032 |
| OQ-011 | Disclaimer pháp lý có cần luật sư Nhật review version chính thức không?    | Block launch (Phase 4 cuối)               | Phase 4 cuối      | OPEN     |
| OQ-012 | Có push "vòng chưa có activity 7 ngày" hay không?                          | Block notification spec Sprint 6          | Phase 4 Sprint 6  | RESOLVED — D-034 |
| OQ-013 | Discovery: hiển thị khu vực ở cấp nào? (quận vs thành phố vs bán kính km) | Block discovery UI Sprint 11              | Phase 3           | RESOLVED — D-031 |
| OQ-014 | Discovery: "gửi lời chào" kèm message tuỳ chọn hay chỉ 1-click thuần?     | Block connection flow Sprint 12           | Phase 4 Sprint 11 | OPEN     |
| OQ-015 | Discovery: moderation strategy (block/report) cho Phase 5 là gì?           | Không block Sprint 11-12 nhưng cần plan   | Phase 5           | OPEN     |
| OQ-016 | Discovery: user có thể thấy mình đang visible cho bao nhiêu người không?   | Block privacy UX Sprint 11               | Phase 4 Sprint 11 | OPEN     |
| OQ-017 | Backup helper flow: khi match bị cancel phút chót, app tự re-notify vòng hay cần asker post lại? | Block request lifecycle và UX Sprint 4   | Phase 4 Sprint 4  | RESOLVED — D-033 |

---

## OQ Notes — Cập nhật theo tiến trình

### OQ-014 — Greeting format

**Update 2026-05-18:** Discovery greeting format resolved implicitly — "request to join" silent broadcast model implemented in Sprint 6 (open registration). No custom text field, no 1-click "say hi". Deadline still Sprint 11 for full discovery feature.

---

## OQs theo deadline

### Cần quyết trước Phase 3

- OQ-001 — Safety valve edge case
- OQ-002 — Member lifecycle
- OQ-006 — Invitation expiry
- OQ-013 — Discovery khu vực level

### Cần quyết trước cuối Phase 3

- OQ-003 — Auth method
- OQ-004 — LINE Login
- OQ-005 — Active member definition
- OQ-008 — Avatar storage
- OQ-009 — Account deletion

### Cần quyết trước Sprint 4 (Phase 4)

- ~~OQ-010 — Aid request expiry~~ → RESOLVED D-032
- ~~OQ-017 — Backup helper flow khi cancel phút chót~~ → RESOLVED D-033

### Cần quyết trước Sprint 6 (Phase 4)

- OQ-007 — Match algorithm weight
- ~~OQ-012 — Inactivity notification~~ → RESOLVED D-034

### Cần quyết trước Sprint 11 (Phase 4)

- OQ-014 — Lời chào format
- OQ-016 — Discovery visibility count

### Cần quyết trước Phase 4 cuối

- OQ-011 — Legal disclaimer

### Cần quyết trước Phase 5

- OQ-015 — Discovery moderation

---

## OQs đã resolved

| OQ-001 | Safety valve khi vòng còn ít người | Resolved: 2026-05-16 | Decision: D-025 |
| OQ-002 | "Mời lại" giữ data cũ không | Resolved: 2026-05-16 | Decision: D-026 |
| OQ-003 | Auth method | Resolved: 2026-05-16 | Decision: D-027 |
| OQ-004 | LINE Login | Resolved: 2026-05-16 | Decision: D-027 |
| OQ-005 | Định nghĩa active member | Resolved: 2026-05-16 | Decision: D-028 |
| OQ-006 | Invitation link expiry | Resolved: 2026-05-16 | Decision: D-024 |
| OQ-008 | Avatar storage | Resolved: 2026-05-16 | Decision: D-029 |
| OQ-009 | Xoá account | Resolved: 2026-05-16 | Decision: D-030 |
| OQ-013 | Discovery khu vực | Resolved: 2026-05-16 | Decision: D-031 |
| OQ-010 | Aid request expiry | Resolved: 2026-05-17 | Decision: D-032 |
| OQ-017 | Backup helper flow khi cancel | Resolved: 2026-05-17 | Decision: D-033 |
| OQ-012 | Inactivity notification 7 ngày | Resolved: 2026-05-17 | Decision: D-034 |

---

*Nguồn: `mvp-roadmap-v1.md` Mục 4*
*Khởi tạo: 2026-05-16 | Track bởi Docs Steward Agent*
