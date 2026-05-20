# Decision Log — Vòng Tròn Tương Trợ

> Tất cả quyết định đã chốt của dự án. Tài liệu này là **append-only** — không xoá, không sửa entry cũ.
> Khi cần thay đổi một quyết định đã có: thêm entry mới với reference đến entry cũ, ghi rõ "Supersedes D-XXX".
> Mọi entry mới phải qua Master Agent + founder approve trước khi thêm.

---

## Quy tắc

- **Append-only:** Chỉ thêm vào cuối, không chỉnh sửa entry đã có
- **Immutable:** Lịch sử quyết định phải được bảo toàn nguyên vẹn
- **Khi quyết định thay đổi:** Thêm entry mới, ghi "Supersedes D-XXX"
- **Nguồn Open Questions:** Khi OQ được quyết → move sang đây + cập nhật open-questions.md

---

## Bảng quyết định

| #     | Quyết định                                                                           | Lý do                                                                                                          | Nguồn              | Ngày       |
| ----- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| D-001 | Mô hình kinh doanh: Lifestyle business, ưu tiên sustainability hơn growth            | Founder không muốn race theo VC growth model                                                                   | Discussion Phase 3 | 2026-05-16 |
| D-002 | Pivot từ "discovery" sang "coordination" là core value                               | Insight từ 10 gia đình pilot: pain point thật là coordination friction, không phải khám phá người lạ            | Discovery v2       | 2026-05-16 |
| D-003 | Mô hình peer-to-peer thuần — không có vai trò admin/coordinator thường trực          | Tránh single point of failure; đảm bảo vòng vận hành không phụ thuộc vào một cá nhân                           | Discovery v2       | 2026-05-16 |
| D-004 | Không có ledger / điểm số / huy hiệu / leaderboard                                  | Văn hoá ân tình của người Việt không vận hành theo logic transactional; vi phạm = giết sản phẩm               | Discovery v2       | 2026-05-16 |
| D-005 | Cơ chế mời: minh bạch thông tin + không vote công khai + safety valve ẩn danh       | Cân bằng giữa default open (tốc độ) và chất lượng vòng (trust); tránh bias thể diện từ vote công khai          | Discovery v2       | 2026-05-16 |
| D-006 | Scope MVP giữ nguyên như đã định trong product-discovery-v3.md Mục 9                 | Founder không cắt thêm scope so với v3                                                                         | Discussion         | 2026-05-16 |
| D-007 | App tiếng Việt duy nhất, không multi-language trong MVP                              | Target user là người Việt tại Nhật; tiếng Nhật/Anh không cần cho MVP                                           | Discussion         | 2026-05-16 |
| D-008 | PWA-first, không build native app ngay                                               | Lifestyle pace, iteration nhanh, không cần App Store approval cycle                                             | Discussion         | 2026-05-16 |
| D-009 | Architect code để có thể migrate sang native (Capacitor) sau này                    | Giữ option open cho tương lai mà không cần rewrite UI                                                           | Discussion         | 2026-05-16 |
| D-010 | Tech stack: Next.js 14 App Router + Supabase + Vercel                               | Boring tech, AI-friendly, ecosystem tốt, chi phí thấp cho lifestyle business                                   | Discussion         | 2026-05-16 |
| D-011 | Notification: Web Push API làm primary + LINE Messaging API làm fallback             | iOS PWA push không reliable; LINE là app người Việt tại Nhật dùng hàng ngày                                    | Discussion         | 2026-05-16 |
| D-012 | Hand-off chat 1-1 sang LINE / Messenger, không build chat trong app                  | Chat 1-1 không phải core value; tránh build tính năng phức tạp cho giá trị cận biên                             | Discovery v2       | 2026-05-16 |
| D-013 | Sprint length: 1 tuần                                                                | AI-augmented workflow cho phép delivery nhanh hơn sprint truyền thống                                           | Discussion         | 2026-05-16 |
| D-014 | AI workflow: Claude Code với subagents pattern                                       | Native, file-based config, phù hợp với solo founder workflow                                                    | Discussion         | 2026-05-16 |
| D-015 | Founder chỉ trao đổi với Master Agent, không trực tiếp với sub-agents               | Giảm cognitive load; Master Agent điều phối và tổng hợp output                                                  | Discussion         | 2026-05-16 |
| D-016 | Founder review tất cả PR trước khi merge vào main                                   | AI có thể hallucinate hoặc có subtle bugs; human review là checkpoint quan trọng                                 | Discussion         | 2026-05-16 |
| D-017 | Docs Steward Agent control toàn bộ documentation lifecycle                           | Đảm bảo docs đầy đủ, consistent, và up-to-date — nền tảng để mọi agent làm việc đúng                           | Discussion         | 2026-05-16 |
| D-018 | Open Questions không force quyết sớm — quyết khi có đủ context                      | Quyết sớm khi thiếu context dẫn đến quyết sai; một số OQ cần data từ pilot để quyết đúng                       | Discussion         | 2026-05-16 |
| D-019 | Đưa discovery nhẹ (tìm gia đình gần) vào MVP (Sprint 11-12)                         | Signal thật từ cộng đồng: nhiều gia đình muốn kết nối nhưng không biết cách; survivor bias trong v2 Insight 1  | Discussion         | 2026-05-16 |
| D-020 | Discovery scope tối thiểu: opt-in, khu vực quận/TP, tuổi con, gửi lời chào → LINE  | Privacy-first; không build matching/feed/browsing; tối giản để giảm rủi ro incident cộng đồng                   | Discussion         | 2026-05-16 |
| D-021 | Discovery đặt sau coordination core: Sprint 11-12, không xen vào Sprint 0-10        | Giữ focus vào core value; discovery có thể cancel nếu coordination core chưa có traction                        | Discussion         | 2026-05-16 |
| D-022 | Navigation structure phải có slot cho Discovery tab ngay từ Phase 3                  | Tránh redesign navigation sau Sprint 10; tab có thể ẩn hoặc "Coming soon" trong Sprint 0-10                     | Discussion         | 2026-05-16 |
| D-023 | Thêm user_discovery_settings table vào schema trong Sprint 3 (cùng profile sprint)   | Cost ~30 phút schema work; tránh migration riêng phức tạp khi đến Sprint 11                                    | Discussion         | 2026-05-16 |
| D-024 | Invitation link expire sau 7 ngày; nhắc người mời vào ngày thứ 5                    | 1 tuần đủ để người được mời quyết định; nhắc sớm 2 ngày để người mời có thể follow up nếu cần                  | OQ-006 Phase 3     | 2026-05-16 |
| D-025 | Safety valve "2 thành viên lâu năm nhất" chỉ kích hoạt khi vòng có >2 thành viên   | Khi vòng còn ≤2 người, không đủ quorum để safety valve hoạt động; cơ chế tự bỏ qua và ghi log                  | OQ-001 Phase 3     | 2026-05-16 |
| D-026 | "Mời lại" 1-click giữ nguyên toàn bộ data cũ của thành viên (profile, history)      | Giảm friction khi thành viên quay lại; data không nhạy cảm, không cần xoá khi rời vòng                         | OQ-002 Phase 3     | 2026-05-16 |
| D-027 | Auth method: Email OTP duy nhất, không Phone OTP, không LINE Login                  | Đơn giản nhất cho MVP; email phổ biến với người Việt tại Nhật; tránh dependency vào LINE SDK trong core auth     | OQ-003, OQ-004     | 2026-05-16 |
| D-028 | "Active member" = thành viên chưa bị xoá khỏi vòng                                 | Định nghĩa đơn giản, không cần track last_active; phù hợp với Nguyên tắc 6 (vô hình hoá)                        | OQ-005 Phase 3     | 2026-05-16 |
| D-029 | Avatar storage: Supabase Storage                                                     | Giữ stack đồng nhất, không thêm dependency CDN ngoài cho MVP; đủ dùng đến 50+ active users                      | OQ-008 Phase 3     | 2026-05-16 |
| D-030 | Không cho xoá account hoàn toàn — chỉ deactivate (ẩn khỏi vòng, giữ data)          | Bảo toàn lịch sử aid request của vòng; APPI compliant với soft delete; hard delete có thể thêm Phase 5           | OQ-009 Phase 3     | 2026-05-16 |
| D-031 | Discovery khu vực: bán kính 5km mặc định, user tự chỉnh được (3km / 5km / 10km)    | Bán kính km trực quan hơn quận/TP; 5km phù hợp di chuyển hàng ngày tại Nhật; user control tăng trust            | OQ-013 Phase 3     | 2026-05-16 |
| D-032 | Aid request tự động expire khi qua thời điểm `scheduled_at` của request              | Sau thời điểm yêu cầu, request không còn actionable; expire theo thực tế nghiệp vụ, không cần thêm config       | OQ-010 Phase 4     | 2026-05-17 |
| D-033 | Khi match bị cancel, app tự re-notify toàn bộ vòng để tìm helper mới                | Giảm friction cho asker — không cần post lại từ đầu; re-notify giữ nguyên request gốc, chỉ reset trạng thái     | OQ-017 Phase 4     | 2026-05-17 |
| D-034 | Không gửi push notification khi vòng không có activity sau 7 ngày                   | Tránh notification spam; người dùng sẽ mở app khi thực sự cần — không cần nudge nhân tạo                        | OQ-012 Phase 4     | 2026-05-17 |
| D-035 | Dual registration model: `/register` (open) song song `/auth` (invite-gated) — flow invite cũ giữ nguyên | Cho phép user không có invite thử app qua open registration mà không phá vỡ trust model của invite flow hiện tại | Sprint 6 Phase 4   | 2026-05-18 |
| D-036 | Bất kỳ thành viên nào trong vòng đều có thể accept join request — không chỉ founder  | Peer-to-peer thuần; nhất quán với Nguyên tắc 7 (không có vai trò đặc quyền thường trực); giảm bottleneck         | Sprint 6 Phase 4   | 2026-05-18 |
| D-037 | `getCirclesNearby()` chỉ expose vị trí của thành viên có `user_discovery_settings.is_visible = true` | Privacy-first discovery; user phải chủ động opt-in mới xuất hiện trong kết quả tìm kiếm gần đây               | Sprint 6 Phase 4   | 2026-05-18 |
| D-038 | Notification type: `'join_request'` cho request mới gửi đến vòng; `'new_member'` khi request được accept | Hai sự kiện có semantics khác nhau — phân biệt để notification copy và routing logic rõ ràng, tránh nhầm lẫn     | Sprint 6 Phase 4   | 2026-05-18 |

---

## Template cho entry mới

Khi cần thêm quyết định mới (qua Master Agent → founder approve):

```
| D-XXX | [Mô tả quyết định ngắn gọn, actionable] | [Lý do 1-2 câu] | [Nguồn] | [YYYY-MM-DD] |
```

Nếu supersede quyết định cũ:

```
| D-XXX | [Quyết định mới] — Supersedes D-YYY | [Lý do thay đổi] | [Nguồn] | [YYYY-MM-DD] |
```

---

*Nguồn: `mvp-roadmap-v1.md` Mục 3*
*Khởi tạo: 2026-05-16 | Append-only từ ngày này*
