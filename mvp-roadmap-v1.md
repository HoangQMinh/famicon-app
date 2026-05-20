# MVP Roadmap — Vòng Tròn Tương Trợ
## Lộ trình triển khai cho Solo Founder + AI-augmented workflow (Claude Code subagents)

> **Companion document** của `product-discovery-v2.md`
> **Phiên bản:** 1.0
> **Bối cảnh người làm:** Solo fullstack dev (background low-code + Node.js), chưa làm Next.js, mới có khái niệm Postgres/Supabase, dùng Claude Code với subagents pattern
> **Mô hình kinh doanh:** Lifestyle business — ưu tiên sustainability hơn growth
> **Vai trò người làm:** Product Owner / Architect / Final Reviewer — chỉ trao đổi với Master Agent, control AI làm gì và đến đâu

---

## 📋 Mục lục

1. [Executive Summary](#1-executive-summary)
2. [Project Constitution](#2-project-constitution)
3. [Decision Log](#3-decision-log)
4. [Open Questions Register](#4-open-questions-register)
5. [Documentation Pyramid & Timeline](#5-documentation-pyramid--timeline)
6. [Tổng quan Phase 0-5](#6-tổng-quan-phase-0-5)
7. [Phase 0 — Foundation Setup](#7-phase-0--foundation-setup-1-tuần)
8. [Phase 1 — Pre-product Validation](#8-phase-1--pre-product-validation-3-4-tuần)
9. [Phase 2 — Replication Test](#9-phase-2--replication-test-4-6-tuần)
10. [Phase 3 — Design & Prototype](#10-phase-3--design--prototype-3-4-tuần)
11. [Phase 4 — Build MVP](#11-phase-4--build-mvp-10-13-tuần)
12. [Phase 5 — Sustainable Expansion](#12-phase-5--sustainable-expansion-6-tháng)
13. [Tech Stack & Architecture Reference](#13-tech-stack--architecture-reference)
14. [Next.js & Supabase Primer](#14-nextjs--supabase-primer)
15. [AI Agent Architecture](#15-ai-agent-architecture)
16. [Critical AI Files: CLAUDE.md & PROJECT_STATE.md](#16-critical-ai-files-claudemd--project_statemd)
17. [Knowledge Gaps & Risk Areas](#17-knowledge-gaps--risk-areas)
18. [Phụ lục: Templates & Prompts](#18-phụ-lục-templates--prompts)

---

## 1. Executive Summary

### TL;DR

Build một **PWA điều phối tương trợ + kết nối gia đình** cho cộng đồng Việt tại Nhật. Hai lớp giá trị: (1) coordination cho vòng đã có, (2) discovery nhẹ giúp gia đình tìm nhau. Mô hình peer-to-peer, không ledger, không vote công khai. Solo build với Claude Code subagents.

### Đường đi tổng quát

```
Phase 0 (1 tuần)      → Foundation: docs nền + AI setup
Phase 1 (3-4 tuần)    → Validate với LINE Open Chat (CHƯA CODE)
Phase 2 (4-6 tuần)    → Replicate pattern với 2-3 vòng khác (CHƯA CODE)
Phase 3 (3-4 tuần)    → Design + prototype + technical specs
Phase 4 (12-15 tuần)  → Build MVP: Sprint 0-10 coordination core + Sprint 11-12 discovery
Phase 5 (6+ tháng)    → Sustainable expansion
```

**Tổng đến MVP ổn định: 7-9 tháng.**

### Stack đã chốt

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui (PWA)
- **Backend:** Supabase (Postgres + Auth + Realtime + Edge Functions + Storage)
- **Hosting:** Vercel + Supabase managed
- **Notification:** Web Push + LINE Messaging API (fallback)
- **Analytics:** PostHog
- **Error tracking:** Sentry
- **AI Workflow:** Claude Code với subagents

**Chi phí pilot:** ~$0-30/tháng đến khi vượt 50 active users.

---

## 2. Project Constitution

**Đây là kim chỉ nam bất biến. Mọi agent và mọi quyết định phải tuân theo. Nếu vi phạm bất kỳ điểm nào, đó là red flag cần dừng lại.**

### Sản phẩm là gì
> Công cụ điều phối tương trợ cho các vòng tròn gia đình Việt đã quen nhau ngoài đời tại Nhật, kèm lớp discovery nhẹ giúp gia đình Việt tìm nhau để kết bạn.

**Hai lớp giá trị:**
1. **Core — Coordination:** Điều phối tương trợ trong vòng đã có (Sprint 0-10)
2. **Extension — Discovery:** Giúp gia đình Việt tìm nhau ở gần, kết nối 1-1 qua LINE (Sprint 11-12)

Discovery là **cầu nối vào coordination**, không phải mạng xã hội. Hành trình: tìm nhau → kết bạn qua LINE → quen rồi → hình thành vòng mới.

### Sản phẩm KHÔNG phải
- Mạng xã hội / app lướt profile
- Marketplace dịch vụ trông trẻ
- Forum nuôi dạy con
- Booking dịch vụ chuyên nghiệp

### 10 Nguyên tắc bất biến

1. **Coordination trước, discovery sau** — Core value là điều phối tương trợ trong vòng đã có. Discovery là lớp mở rộng, phải opt-in, và tối giản. Nếu discovery phức tạp hoá UX coordination → cắt discovery.

2. **Không có ledger, không đo đếm** — Không hiển thị số lần giúp/nhận giúp, không điểm, không huy hiệu, không leaderboard. Vi phạm = giết sản phẩm.

3. **Tôn trọng thể diện** — Nhờ giúp không gây cảm giác mắc nợ. Từ chối không cần giải thích. Không show "ai đã từ chối."

4. **Yên tĩnh khi không cần** — Notification chỉ khi: urgent, match cao, hoặc user tự bật. Không spam.

5. **Nhanh khi cần** — Post aid request trong <30 giây. Cắt mọi friction.

6. **Vô hình hoá điều phối** — User không cần biết app làm gì phía sau. Họ chỉ thấy: nhờ → được giúp.

7. **Peer-to-peer thuần** — Không có vai trò admin/coordinator thường trực. Mọi thành viên bình đẳng.

8. **Minh bạch không xét duyệt** — Lời mời được thông báo cho cả vòng, nhưng không vote. Default = open.

9. **Vòng kín** — Không public, không share ra ngoài, không có feed công cộng.

10. **Không monetize bằng quảng cáo, không monetize bằng data** — Vi phạm cảm giác "vòng tròn riêng tư."

### Forbidden patterns (cho mọi agent)

- ❌ Tạo column/field tracking "số lần giúp" hay "số lần được giúp"
- ❌ Tạo UI hiển thị ranking, leaderboard, badge
- ❌ Tạo feature vote công khai cho việc accept/reject thành viên
- ❌ Tạo public profile cho user ngoài vòng
- ❌ Auto-kick thành viên inactive
- ❌ Hardcode admin role với super permissions
- ❌ Sử dụng dark pattern để tăng engagement
- ❌ Build chat 1-1 trong app (hand-off sang LINE/Messenger)

### Glossary (thuật ngữ chuẩn)

| Thuật ngữ | Định nghĩa |
|---|---|
| **Vòng (Circle)** | Nhóm 5-20 gia đình đã quen ngoài đời, có tiêu chí chung công khai |
| **Tiêu chí (Criteria)** | Bộ rules định nghĩa "bản sắc" của vòng: khu vực, tuổi con, ngôn ngữ |
| **Founder** | Người tạo vòng. Sau khi tạo xong, trở thành member bình thường. Không có quyền đặc biệt thường trực |
| **Member** | Thành viên vòng. Bình đẳng với founder |
| **Asker** | Người post aid request |
| **Helper** | Người response "Tôi giúp được" cho aid request |
| **Aid Request** | Yêu cầu giúp đỡ, 5 loại: đón con / mượn đồ / trông con ngắn / chở / khác |
| **Safety Valve** | Cơ chế ≥2 flag concern ẩn danh trong 48h đầu → tạm dừng invite để review |
| **Active Circle** | Vòng có ≥2 thành viên và có activity gần đây *(định nghĩa "gần đây" cần quyết — Open Question)* |
| **Setting-up Circle** | Vòng mới tạo, <7 ngày, chưa có member thứ 2. Tự archive sau 7 ngày nếu không có |
| **Archived Circle** | Vòng không active. Có thể reactivate trong 30 ngày |
| **Discovery Profile** | Hồ sơ tối thiểu opt-in: khu vực (quận/TP), độ tuổi con, giới thiệu ngắn. Không hiển thị tên thật, ảnh, ga cụ thể |
| **Connection Request** | "Gửi lời chào" từ người này đến người kia qua discovery. Accept → hand-off LINE |

---

## 3. Decision Log

Các quyết định đã chốt trong quá trình thảo luận. Khi cần thay đổi, phải đánh dấu rõ và update toàn bộ docs liên quan.

| # | Quyết định | Lý do | Nguồn |
|---|---|---|---|
| D-001 | Mô hình kinh doanh: Lifestyle business | Founder không muốn race VC growth | Discussion Phase 3 |
| D-002 | Pivot từ "discovery" sang "coordination" | Insight từ 10 gia đình pilot | Discovery v2 |
| D-003 | Mô hình peer-to-peer thuần | Tránh single point of failure | Discovery v2 |
| D-004 | Không có ledger / điểm số | Văn hoá ân tình Việt | Discovery v2 |
| D-005 | Cơ chế mời: minh bạch + không vote + safety valve | Cân bằng default open và chất lượng | Discovery v2 |
| D-006 | Scope MVP giữ nguyên Mục 9 v2 | Founder không cắt thêm | Discussion |
| D-007 | App tiếng Việt duy nhất | Target user là người Việt ở Nhật | Discussion |
| D-008 | PWA-first (không native ngay) | Lifestyle pace, iteration nhanh | Discussion |
| D-009 | Architect code để migrate sang native sau | Giữ option open | Discussion |
| D-010 | Stack: Next.js + Supabase + Vercel | Boring tech, AI-friendly | Discussion |
| D-011 | Notification: Web Push primary + LINE fallback | iOS PWA push không reliable | Discussion |
| D-012 | Hand-off chat 1-1 sang LINE | Không phải core value | Discovery v2 |
| D-013 | Sprint 1 tuần | AI-augmented workflow | Discussion |
| D-014 | AI workflow: Claude Code với subagents | Native, file-based config | Discussion |
| D-015 | Bạn chỉ trao đổi với Master Agent | Giảm cognitive load | Discussion |
| D-016 | Bạn review tất cả PR trước merge | AI có thể hallucinate | Discussion |
| D-017 | Documentation Agent control docs lifecycle | Đảm bảo docs đầy đủ + consistent | Discussion |
| D-018 | Open Questions không force quyết sớm | Quyết khi đủ context | Discussion |
| D-019 | Đưa discovery (tìm gia đình gần) vào MVP | Signal thật từ cộng đồng: nhiều gia đình muốn kết nối nhưng không biết cách. Survivor bias trong v2 Insight 1 | Discussion |
| D-020 | Discovery scope tối thiểu: opt-in, khu vực quận/TP, tuổi con, gửi lời chào → LINE | Privacy-first, không build matching/feed/browsing | Discussion |
| D-021 | Discovery đặt sau coordination core: Sprint 11-12 (không xen Sprint 0-10) | Giữ focus core, cancel được nếu traction thấp | Discussion |
| D-022 | Quyết navigation structure có slot discovery trong Phase 3 | Tránh rework khi thêm Sprint 11-12 | Discussion |
| D-023 | Thêm discovery_settings vào schema Sprint 3 (cùng profile) | Cost 30 phút, tránh migration riêng Sprint 11 | Discussion |

---

## 4. Open Questions Register

**Các câu hỏi chưa quyết, sẽ quyết khi có đủ context.**

| ID | Question | Impact nếu không quyết | Deadline | Status |
|---|---|---|---|---|
| OQ-001 | "2 thành viên lâu năm nhất" hoạt động thế nào khi vòng còn ít người? | Block invite flow | Phase 3 | OPEN |
| OQ-002 | "Mời lại" 1-click có giữ data cũ không? | Block lifecycle design | Phase 3 | OPEN |
| OQ-003 | Auth: Phone OTP, Email, hay cả hai? | Block Sprint 1 | Phase 3 cuối | OPEN |
| OQ-004 | Có dùng LINE Login làm auth không? | Block auth design | Phase 3 cuối | OPEN |
| OQ-005 | Định nghĩa "active member" cho metrics? | Block analytics setup | Phase 3 cuối | OPEN |
| OQ-006 | Invitation expire sau bao lâu? | Block invite design | Phase 3 | OPEN |
| OQ-007 | Match algorithm v1: weight thế nào? | Block notification logic | Phase 4 Sprint 6 | OPEN |
| OQ-008 | Avatar storage: Supabase hay CDN ngoài? | Block profile feature | Phase 3 cuối | OPEN |
| OQ-009 | Có cho xoá hoàn toàn account không? | Block privacy spec | Phase 3 cuối | OPEN |
| OQ-010 | Aid request expire tự động không? | Block request lifecycle | Phase 4 Sprint 4 | OPEN |
| OQ-011 | Disclaimer pháp lý cần luật sư review version chính thức? | Block launch | Phase 4 cuối | OPEN |
| OQ-012 | Push "vòng chưa có activity 7 ngày" có không? | Block notification spec | Phase 4 Sprint 6 | OPEN |
| OQ-013 | Discovery: hiển thị khu vực ở cấp nào? (quận vs thành phố vs bán kính km) | Block discovery UI | Phase 3 | OPEN |
| OQ-014 | Discovery: "gửi lời chào" kèm message hay chỉ 1-click? | Block connection flow | Phase 4 Sprint 11 | OPEN |
| OQ-015 | Discovery: moderation strategy (block/report) cho Phase 5? | Không block Sprint 11-12 nhưng cần plan | Phase 5 | OPEN |
| OQ-016 | Discovery: user có thấy được mình đang visible cho bao nhiêu người không? | Block privacy UX | Phase 4 Sprint 11 | OPEN |

**Quy tắc xử lý:**
- Docs Steward Agent track register này
- Trước khi sang phase mới, review OQs deadline thuộc phase đó
- Quyết định mới → move sang Decision Log + update related docs

---

## 5. Documentation Pyramid & Timeline

5 tầng tài liệu, tạo theo thứ tự phụ thuộc.

```
┌──────────────────────────────┐
│ Tầng 5: Operational (P4-5)   │  Sprint specs, Runbooks
└──────────────────────────────┘
              ▲
┌──────────────────────────────┐
│ Tầng 4: Technical (P3-4)     │  ADR, Schema, API, Security
└──────────────────────────────┘
              ▲
┌──────────────────────────────┐
│ Tầng 3: Design (P3)          │  IA, Screen Spec, Wireframes
└──────────────────────────────┘
              ▲
┌──────────────────────────────┐
│ Tầng 2: Product (P1-2)       │  Personas, Stories, Flows
└──────────────────────────────┘
              ▲
┌──────────────────────────────┐
│ Tầng 1: Foundation (P0)      │  Constitution, Vision, Glossary
└──────────────────────────────┘
```

### Tầng 1 — Foundation Docs (Phase 0)

| Doc | Acceptance |
|---|---|
| `constitution.md` | 10 nguyên tắc + forbidden patterns |
| `vision.md` | Extract gọn từ v2, 1-2 trang |
| `glossary.md` | ≥20 thuật ngữ |
| `non-goals.md` | Explicit list từ Mục 9 v2 |
| `decision-log.md` | Initialize 18 quyết định |
| `open-questions.md` | Initialize 12 OQs |
| `README.md` | Navigation guide |

### Tầng 2 — Product Specs (Phase 1-2)

| Doc | Acceptance |
|---|---|
| `user-personas.md` | 4 personas: goals, pain, behaviors |
| `user-stories.md` | ≥30 stories, MoSCoW priority |
| `user-flows.md` | Mermaid diagrams 3 journeys |
| `use-cases.md` | ≥10 scenarios concrete |
| `pilot-observations.md` | Weekly updates Phase 1-2 |

### Tầng 3 — Design Docs (Phase 3)

| Doc | Acceptance |
|---|---|
| `information-architecture.md` | Sitemap đầy đủ |
| `screen-specs/*.md` | Mỗi screen 1 file |
| `wireframes/` | 3 journeys testable |
| `design-system.md` | Tokens + components |
| `microcopy.md` | Tone guide + samples |

### Tầng 4 — Technical Specs (Phase 3 cuối → Phase 4 đầu)

| Doc | Acceptance |
|---|---|
| `adr/ADR-*.md` | ≥10 ADRs đầu MVP |
| `data-model.md` | ERD + RLS rules mọi table |
| `api-contract.md` | Server Actions + Edge Functions |
| `notification-strategy.md` | Decision matrix |
| `coding-conventions.md` | Project-specific |
| `security-privacy.md` | Threat model + APPI compliance |
| `test-strategy.md` | Per-layer strategy |

### Tầng 5 — Operational Docs (Phase 4-5)

| Doc | Khi nào tạo |
|---|---|
| `sprint-N-spec.md` | Đầu mỗi sprint |
| `sprint-N-test-plan.md` | Cùng sprint spec |
| `deployment-runbook.md` | Sprint 0 |
| `incident-playbook.md` | Sprint 9 |
| `founder-onboarding-playbook.md` | Phase 5 |
| `CHANGELOG.md` | Mỗi release |
| `PROJECT_STATE.md` | Mỗi sprint |

### Documentation Agent (Docs Steward) responsibilities

**Docs Steward Agent control toàn bộ docs lifecycle:**

1. **Propose**: đầu mỗi phase, list docs cần tạo, ask Master Agent
2. **Generate**: tạo template + nội dung theo acceptance criteria
3. **Verify**: check completeness trước khi mark done
4. **Cross-reference**: khi 1 doc thay đổi, identify related docs
5. **Maintain**: update PROJECT_STATE.md mỗi sprint
6. **Track**: Open Questions Register — flag khi deadline gần
7. **Escalate**: inconsistency, conflict, missing critical doc

**Tiền đề:** Agent phải biết tạo gì cho đầy đủ và chính xác. Quality bar:
- Đầy đủ acceptance criteria
- Naming convention đúng
- Cross-references đúng
- Tiếng Việt natural (không Google Translate)
- Format consistent

**KHÔNG được tự ý:** quyết Open Question, update Constitution, generate template không có context, skip verification.

### Folder structure

```
/vongtron
├── README.md
├── CLAUDE.md
├── PROJECT_STATE.md
├── docs/
│   ├── 00-foundation/      # Tầng 1
│   ├── 01-product/         # Tầng 2
│   ├── 02-design/          # Tầng 3
│   ├── 03-technical/       # Tầng 4
│   ├── 04-operations/      # Tầng 5
│   └── decisions/          # ADRs
├── .claude/
│   └── agents/             # Sub-agents config
└── product-discovery-v2.md
```

---

## 6. Tổng quan Phase 0-5

| Phase | Thời gian | Mục tiêu | Exit Criteria |
|---|---|---|---|
| Phase 0 | 1 tuần | Foundation docs + AI setup | Constitution + Glossary done, subagents config xong |
| Phase 1 | 3-4 tuần | Validate coordination pattern | ≥15 requests/tuần, match rate ≥70%, bypass <30% |
| Phase 2 | 4-6 tuần | Pattern lặp lại ở 2-3 vòng | ≥2 vòng độc lập đạt metric Phase 1 |
| Phase 3 | 3-4 tuần | Design + spec (coordination + discovery slot) | Tầng 3-4 docs done, wireframe tested, navigation có discovery slot |
| Phase 4 | 12-15 tuần | MVP build: Sprint 0-10 core + Sprint 11-12 discovery | Vòng pilot dùng app primary, discovery opt-in live |
| Phase 5 | 6+ tháng | Sustainable expansion | ≥10 vòng active healthy hoặc decision dừng/pivot |

---

## 7. Phase 0 — Foundation Setup (1 tuần)

### Mục tiêu
Setup nền tảng: docs Tầng 1, Claude Code subagents, repo structure.

### Việc cần làm

#### 7.1 Setup repo & docs structure

Tạo folder structure như Mục 5. Init Git repo.

#### 7.2 Setup Claude Code subagents

Tạo file trong `.claude/agents/`:
- `docs-steward.md`
- `architect.md`
- `schema.md`
- `frontend.md`
- `backend.md`
- `reviewer.md`
- `tester.md`

Chi tiết system prompt cho mỗi agent ở [Section 15](#15-ai-agent-architecture).

#### 7.3 Tham vấn pháp lý nhanh

- Tìm luật sư Nhật quen với startup/cộng đồng Việt
- 2 câu hỏi chính:
  1. App facilitate informal childcare giữa người quen có liability gì?
  2. Compliance gì với APPI?
- Cost: ~$200-500
- Output: notes inform privacy policy + disclaimer

#### 7.4 Setup tools account

- GitHub (free)
- Vercel (free tier)
- Supabase (free tier)
- PostHog (free tier 1M events)
- Sentry (free tier)
- Domain (~$10/năm)
- LINE Developers account

### Docs to produce in Phase 0

**Docs Steward Agent control. Verify acceptance criteria trước khi mark done.**

| Doc | Owner Agent | Acceptance |
|---|---|---|
| `constitution.md` | Docs Steward + Master review | 10 nguyên tắc + forbidden |
| `vision.md` | Docs Steward | Extract từ v2, 1-2 trang |
| `glossary.md` | Docs Steward | ≥20 thuật ngữ |
| `non-goals.md` | Docs Steward | Explicit list |
| `decision-log.md` | Docs Steward | 18 quyết định initial |
| `open-questions.md` | Docs Steward | 12 OQs initial |
| `README.md` | Docs Steward | Navigation guide |
| `CLAUDE.md` | Master (manual) | Instructions cho sessions |
| `PROJECT_STATE.md` | Docs Steward | Template + state Phase 0 |
| `.claude/agents/*.md` | Master (manual) | 7 sub-agent configs |

### Exit Criteria Phase 0

- [ ] Tất cả docs Tầng 1 done
- [ ] Claude Code subagents config + test delegation work
- [ ] Master Agent đọc Constitution và refuse forbidden patterns
- [ ] Repo Git clean, có CI cơ bản
- [ ] Notes từ consultation pháp lý (hoặc booking)

---

## 8. Phase 1 — Pre-product Validation (3-4 tuần)

### Mục tiêu
Validate A1 (coordination friction là pain đủ lớn) trước code. Test với pilot 10 gia đình trên LINE Open Chat.

### Việc cần làm

#### 8.1 Setup LINE Open Chat

Tạo Open Chat riêng, pin template aid request:
```
🆘 Cần: [đón con / mượn đồ / trông con ngắn / chở / khác]
📅 Khi nào:
📍 Ở đâu (ga):
⏰ Gấp: [có / không]
```

#### 8.2 Bạn làm "concierge"

- Nhắc khi ai định nhắn riêng
- Ghi log mọi request
- Phỏng vấn 3-4 thành viên mỗi 2 tuần
- **Thêm câu hỏi discovery:** "Bạn có muốn quen thêm gia đình Việt gần đây không? Nếu có, bạn đang tìm bằng cách nào? Nếu app có tính năng tìm gia đình gần, bạn có bật lên không?"

#### 8.3 Tracking sheet Google Sheets

Cột: timestamp post, loại, urgent, matched, time-to-match, helper, completed, notes.

### Docs to produce in Phase 1

| Doc | Owner Agent | Acceptance |
|---|---|---|
| `user-personas-v1.md` | Docs Steward | 4 personas |
| `user-stories-v1.md` | Docs Steward | ≥20 stories từ observation |
| `pilot-observations.md` | Master notes + Docs Steward | Weekly |
| `tracking-template.md` | Docs Steward | Sheet template + cột định nghĩa |

### Metrics

- ≥15 requests/tuần
- Match rate ≥70%
- Time to match urgent <30 phút
- Bypass rate <30%, giảm dần
- ≥5/10 nói "dễ nhờ hơn"

### Red flags
- Sau 2 tuần chỉ 2-3 người post
- Mọi người vẫn nhắn riêng
- Match rate <40%

### Exit Criteria
- Đạt metrics ≥2 tuần liên tiếp
- ≥3 câu chuyện cụ thể "request này nhờ Open Chat mà không bị miss"
- Docs Tầng 2 v1 done

---

## 9. Phase 2 — Replication Test (4-6 tuần)

### Mục tiêu
Validate A4 (pattern lặp lại được).

### Việc cần làm

#### 9.1 Tìm 2-3 founder candidate

Tiêu chí:
- Nhóm ≥8 gia đình đang coordinate qua Messenger/LINE
- Đã tự nhiên đóng vai "đầu mối"
- Sẵn lòng thử 4-6 tuần

#### 9.2 Onboard bằng playbook

- Soạn playbook từ Phase 1
- Onboard 1 call 30-45 phút
- Weekly check-in nhẹ

#### 9.3 Quan sát từ xa

- Can thiệp tối thiểu
- Mục tiêu: pattern chạy không cần bạn
- Phỏng vấn founder mỗi 2 tuần

### Docs to produce in Phase 2

| Doc | Owner Agent | Acceptance |
|---|---|---|
| `pilot-playbook.md` | Docs Steward | Step-by-step founder mới |
| `user-personas-v2.md` | Docs Steward | Refine từ 2-3 vòng |
| `user-stories-v2.md` | Docs Steward | Refine + stories mới |
| `user-flows.md` | Docs Steward | Mermaid 3 journeys |
| `use-cases.md` | Docs Steward | ≥10 scenarios |
| `replication-report.md` | Docs Steward | Patterns + decisions |

### Exit Criteria
- ≥2/3 vòng đạt metrics Phase 1
- Founder mới tự duy trì không cần nhắc
- Willingness to install app khi có
- Docs Tầng 2 v2 done

### Decision Gate sau Phase 2

**Fail:** Pattern không scale → pause/pivot
**Pass:** Đi tiếp Phase 3

---

## 10. Phase 3 — Design & Prototype (3-4 tuần)

### Mục tiêu
Có đủ design + technical spec để Phase 4 build không bị block.

### Việc cần làm

#### 10.1 Information Architecture
- Cây màn hình
- Navigation structure
- URL structure
- **⚠️ CRITICAL (D-022): Navigation phải có slot cho Discovery tab ngay từ đầu.** Sprint 0-10 tab có thể ẩn hoặc show "Coming soon", Sprint 11 bật lên. Tránh redesign navigation sau.

#### 10.2 Screen Specifications

Mỗi screen có: purpose, personas, elements, states (empty/loading/error/success), behaviors, cross-refs.

Danh sách screens MVP:

**Coordination core (Sprint 0-10):**
1. Onboarding (welcome + disclaimer)
2. Auth
3. Profile setup
4. Create circle
5. Invite members
6. Accept invitation
7. Circle home
8. Post aid request (form 30s)
9. Aid request detail
10. Aid response flow
11. Notification settings
12. Member profile in circle
13. Multi-circle switcher
14. Settings / Account

**Discovery (Sprint 11-12):**
15. Discovery opt-in / settings (bật/tắt, chọn khu vực hiển thị, tuổi con)
16. Discovery list (gia đình gần đây đang visible)
17. Gửi lời chào / Connection request
18. Connection requests received
14. Settings / Account

#### 10.3 AI-rendered Wireframes

- Viết prompt cho từng screen (template Mục 18.4)
- AI render HTML/React mockup
- Test với 5 user pilot (click-through)
- Iterate

#### 10.4 Design System Tokens
- Colors: tone trầm, warm beige + soft greens
- Typography: base 16px, line-height generous
- Spacing scale 4px base
- Component primitives

#### 10.5 Microcopy Guidelines
- Tone ấm áp, không corporate
- "Bạn" thay "User"
- Empty states: invitation-style

#### 10.6 Technical Specs

**ADRs ≥10:**
- ADR-001: Stack (Next.js + Supabase + Vercel)
- ADR-002: PWA over native
- ADR-003: Auth strategy (sau OQ-003, OQ-004)
- ADR-004: Notification strategy
- ADR-005: Data model approach
- ADR-006: Realtime strategy
- ADR-007: File storage
- ADR-008: State management
- ADR-009: Form handling
- ADR-010: Testing strategy
- ADR-011: Discovery feature scope + privacy model (D-019, D-020)

**Data Model spec** — ERD + RLS:
- users, children
- circles, circle_members
- invitations, invitation_flags
- aid_requests, aid_responses
- notifications_log
- user_discovery_settings (Sprint 3 schema)
- connection_requests (Sprint 11 schema)

**API Contract** — TypeScript types

**Security & Privacy** — threat model + RLS + APPI

**Test Strategy** — Vitest + Playwright

### Docs to produce in Phase 3

| Doc | Owner Agent | Acceptance |
|---|---|---|
| `information-architecture.md` | Docs Steward + Architect | Sitemap đầy đủ |
| `screen-specs/*.md` | Docs Steward + Architect | 14 screens |
| `wireframes/` | Master + AI render | 3 journeys testable |
| `design-system.md` | Docs Steward | Tokens + components |
| `microcopy.md` | Docs Steward | Tone + samples |
| `adr/ADR-*.md` | Architect | ≥10 ADRs |
| `data-model.md` | Schema | ERD + RLS |
| `api-contract.md` | Architect | Server Actions + Functions |
| `notification-strategy.md` | Architect | Decision matrix |
| `coding-conventions.md` | Architect | Project-specific |
| `security-privacy.md` | Architect + Schema | Threat model + APPI |
| `test-strategy.md` | Tester | Per-layer |

### Exit Criteria
- Wireframes tested ≥5 user, ≥4/5 hoàn thành tasks <30s
- Tất cả Tầng 3 + 4 docs done
- OQ-001 đến OQ-009, OQ-013 đã quyết
- Navigation structure có discovery slot (D-022)
- Discovery screen specs (15-18) ít nhất là draft
- Rough plan cho 12 sprints Phase 4

---

## 11. Phase 4 — Build MVP (12-15 tuần)

### Triết lý sprint AI-augmented

- Sprint = 1 tuần
- Mỗi sprint deploy được cho pilot
- Bạn spec + review + integrate, AI execute
- Master Agent orchestrate, subagents execute
- **Sprint 0-10:** Coordination core
- **Sprint 11-12:** Discovery layer (cancel được nếu core traction thấp)

### Workflow chuẩn mỗi sprint

```
T2: Plan sprint, viết spec, Master Agent break down
T3-4: Subagents execute (Schema → Backend → Frontend → Tester)
T5: Master integrate, bạn review PR, deploy preview
T6: Test với pilot 1-2 user, fix bugs
Weekend: Light work
```

### Roadmap 12 sprints

#### Sprint 0 — Setup & Foundation

**Features:** none (setup)

**Việc:**
- Init Next.js 14 + TS + Tailwind + shadcn/ui
- Setup Supabase (DB, Auth, Storage, Functions)
- RLS policies cơ bản (defense in depth)
- Vercel deploy + custom domain
- PostHog + Sentry
- CI/CD GitHub Actions
- PWA basics (manifest, SW)
- Design tokens Tailwind

**Sub-agents:** Architect, Schema, Frontend, Tester, Reviewer

**Deliverable:** Empty app deployed, routing + auth chưa work

**Docs:** Sprint 0 spec, Deployment runbook initial

---

#### Sprint 1 — Auth & User Profile

**Features:**
- Đăng ký phone OTP / email (theo OQ-003)
- Login flow
- Profile wizard: tên, ảnh (optional), ga, tuổi con
- Settings cơ bản
- Onboarding screen + disclaimer pháp lý

**Sub-agents:** Schema, Backend, Frontend, Tester, Reviewer (security focus)

**Test pilot:** 2-3 người tự đăng ký không cần hỗ trợ?

**Risk:** OTP cost, email deliverability

---

#### Sprint 2 — Tạo Vòng & Mời Cơ Bản

**Features:**
- Tạo vòng + tiêu chí cứng
- Vòng "setting up" 7 ngày
- Invite link unique, expirable (OQ-006)
- Share native API
- Preview vòng → accept → join
- Member list view

**Chưa làm:** nhắc tiêu chí, safety valve, duplicate detect (Sprint 7)

**Sub-agents:** Schema, Backend, Frontend, Tester, Reviewer

**Test pilot:** Founder tạo vòng + mời 3 thành viên <5 phút?

---

#### Sprint 3 — Profile mở rộng & Polish foundation

**Features:**
- Member profile view trong vòng
- "Khả năng có thể giúp" preferences
- Multi-circle tham gia + switch
- Edit profile
- **⚠️ (D-023) Thêm `user_discovery_settings` table vào schema** — chỉ table + RLS, chưa build UI. Cost ~30 phút, tránh migration riêng Sprint 11.

**Sub-agents:** Schema (đặc biệt: tạo discovery_settings table), Frontend, Tester

**Test pilot:** Vòng dùng app làm quen thông tin

---

#### Sprint 4 — Aid Request: Post & View ⭐

**Sprint quan trọng nhất.**

**Features:**
- "Nhờ giúp" button prominent
- Form 30s (loại, khi nào, ở đâu, gấp, mô tả optional)
- Realtime appear trong circle feed
- Detail view
- Auto-expire (OQ-010)

**Sub-agents:** Schema (RLS + realtime publication), Backend, Frontend (form <30s), Tester (performance), Reviewer (realtime security)

**Test pilot:** 2-3 người post được aid request thật

**Risk:** Realtime performance

---

#### Sprint 5 — Aid Response & Match flow

**Features:**
- "Tôi giúp được" / "Không lần này"
- Notify asker khi response
- Confirm match → status changed
- Hand-off LINE deeplink
- Mark complete (cả 2 bên)
- Hide ledger info

**Sub-agents:** Schema, Backend, Frontend, Tester (full E2E lifecycle), **Reviewer CRITICAL (verify không ledger leak)**

**Test pilot:** Chu kỳ aid request → response → match → complete với 2 cặp user

**🎯 Deliverable: App có giá trị end-to-end (Alpha)**

---

#### Sprint 6 — Notification System

**Features:**
- Web Push registration (PWA)
- Edge function dispatch: aid request mới, response, invitation
- LINE notification fallback
- User settings: tắt theo ngày/giờ, mute vòng
- Smart matching v1 (OQ-007): urgent → all, non-urgent → "có thể giúp"
- Quiet hours 22:00-7:00 trừ urgent

**Sub-agents:** Schema, Backend (Edge Functions + LINE bot), Frontend, Tester (iOS), Reviewer (PII trong payload)

**Test pilot:** 1 tuần usage, có miss? Có annoying?

**Risk:** iOS PWA push reliability — có thể fail → pivot toàn bộ sang LINE

---

#### Sprint 7 — Invite Quality Controls

**Features:**
- Nhắc tiêu chí khi mời
- Thông báo nhẹ vòng khi invite accepted
- Flag concern button (ẩn danh) 48h
- ≥2 flags → paused
- Founder review screen
- Duplicate detection tạo vòng

**Sub-agents:** Schema (anonymity!), Backend, Frontend, Tester (edge cases), Reviewer (anonymity verification)

**Test pilot:** Scenario test invite + simulate flag

---

#### Sprint 8 — Member Lifecycle & Polish

**Features:**
- Rời vòng (no notify)
- "Mời lại" 1-click (OQ-002)
- Auto-archive sau 7 ngày setting-up
- Reactivate trong 30 ngày
- Multi-circle nhắc khi vượt 5
- Vòng không activity 30 ngày → hỏi founder

**Polish:**
- Loading/error states
- Onboarding refinement
- Lighthouse ≥85
- Accessibility cơ bản

**Sub-agents:** Schema (cron jobs), Backend, Frontend (polish), Tester (regression + Lighthouse), Reviewer (a11y)

---

#### Sprint 9 — Migration & Hardening

**Việc:**
- Migration plan pilot từ LINE Open Chat → app dần dần
- Announcement + onboarding guide
- Backup/restore procedures
- DIY security audit (RLS, auth, ledger leak check, PII payload)
- Privacy policy final (sau luật sư review OQ-011)
- Analytics dashboard final
- Bug fix marathon Sprint 4-8

**Sub-agents:** Reviewer (lead audit), Schema/Backend/Frontend review, Docs Steward (privacy + onboarding)

---

#### Sprint 10 — Full Migration & Monitoring

**Việc:**
- Pilot dùng app primary
- Daily monitoring
- Weekly check-in từng user
- Hotfix bugs (emotional impact priority)
- Document patterns + insights

**Sub-agents:** All standby, Docs Steward capture patterns

**Deliverable:** 4 tuần data pilot dùng app primary

---

#### 🔵 Decision Gate sau Sprint 10

**Trước khi bắt đầu Sprint 11-12, review:**
- Coordination core có traction không? (match rate ≥70%)
- Pilot có dùng app primary không?
- Có signal từ Phase 1-2 interview về nhu cầu discovery không?

**Nếu yes cả 3:** Proceed Sprint 11-12
**Nếu coordination core chưa ổn:** Fix core trước, delay discovery
**Nếu không có signal discovery:** Cancel Sprint 11-12, chuyển thời gian sang polish/expand core

---

#### Sprint 11 — Discovery: Schema + Privacy Flow + Opt-in UI

**Features:**
- `user_discovery_settings` table đã có từ Sprint 3 → build UI opt-in/off (default OFF)
- Privacy opt-in wizard với giải thích rõ ràng: "Bật để gia đình Việt gần bạn có thể tìm thấy bạn"
- User chọn: khu vực hiển thị (OQ-013), tuổi con hiển thị, giới thiệu ngắn (max 100 ký tự)
- Auto-expire 30 ngày + nhắc gia hạn
- Bật/tắt bất cứ lúc nào
- `connection_requests` table + RLS
- Navigation tab Discovery bật lên (slot đã có từ Phase 3, D-022)

**Không hiển thị cho người lạ:** tên thật, ảnh, ga cụ thể, vòng đang tham gia

**Sub-agents:**
- Schema: `connection_requests` table + RLS (discovery_settings đã có)
- Backend: toggle visibility, connection request Server Actions
- Frontend: opt-in wizard, discovery settings screen, tab activation
- Tester: privacy tests (verify người không opt-in KHÔNG hiện trong list)
- **Reviewer CRITICAL: RLS cho discovery — người lạ nhìn vào, strict hơn coordination RLS**

**Test pilot:** 3-5 người bật opt-in. Verify: thấy nhau đúng khu vực, không leak thông tin private.

---

#### Sprint 12 — Discovery: List + Gửi Lời Chào + Hand-off LINE

**Features:**
- Discovery list: gia đình visible gần khu vực user, filter theo tuổi con
- "Gửi lời chào" button (OQ-014: kèm message hay 1-click?)
- Bên nhận: notification "Có gia đình muốn kết nối" → xem khu vực + tuổi con → Accept/Decline
- Accept → hiện LINE ID hoặc deeplink LINE để nói chuyện (hand-off, không build chat)
- Connection history (ai đã gửi, ai đã accept — chỉ user thấy của mình)
- Decline không thông báo cho người gửi (giữ thể diện, nguyên tắc 3)
- Rate limit: tối đa 5 lời chào/tuần (chống spam)

**Sub-agents:**
- Schema: connection lifecycle states
- Backend: connection flow + rate limit + notification dispatch
- Frontend: discovery list + gửi lời chào + received requests + connection history
- Tester: E2E connection flow + rate limit + decline privacy
- Reviewer: spam prevention + PII check

**Test pilot:** 2-3 cặp user thử flow: bật → thấy nhau → gửi lời chào → accept → nói chuyện LINE

**🎯 Deliverable: MVP có cả coordination + discovery (Beta)**

### Docs to produce in Phase 4

Mỗi sprint có sprint spec + test plan + retro. Phase 4 cũng tạo deployment runbook, incident playbook, privacy policy final, terms of service, CHANGELOG.

### Caveats quan trọng

1. **Timeline 12 sprints realistic 15-17 tuần** với buffer (vacation, sick, burnout)
2. **Burnout risk cao** — rest tuần giữa Sprint 5-6 và giữa Sprint 10-11
3. **AI không thay thinking time** — architecture của bạn
4. **Code review vẫn cần** — AI có subtle bugs
5. **Sprint 11-12 có thể cancel** — nếu core chưa ổn, discovery delay không mất gì (schema đã có từ Sprint 3)

### Exit Criteria Phase 4

- Vòng pilot dùng app primary ≥4 tuần
- Match rate ≥ Phase 1 baseline
- Time to match ≤ Phase 1 baseline
- ≥1 vòng thứ 2 onboard thành công
- Privacy policy final với luật sư review
- Security audit pass
- Discovery opt-in live, ≥3 user thử bật

---

## 12. Phase 5 — Sustainable Expansion (6+ tháng)

### Triết lý
Lifestyle pace, không growth hacking. **Match rate ≥70% pilot ≥4 tuần liên tiếp** mới mở vòng thứ 2.

### Workflow mở rộng

```
T1-2 sau P4: Stabilize pilot
T3-6: Vòng thứ 2 (concierge full)
T7-10: Vòng thứ 3 + playbook test
T11+: Patterns & decisions
```

**Tối đa 1 vòng mới/tháng trong 6 tháng đầu.**

### Vòng health metrics

**Healthy:**
- ≥3 aid requests/tuần
- Match rate ≥70%
- ≥60% members active trong tháng
- Top 1 helper ≤40% tổng helps
- 0 drama

**Cần can thiệp:**
- <1 request/tuần trong 2 tuần liên tiếp
- Match rate <50%
- 1 member gánh >60% helps

**Nguy hiểm:**
- 0 activity trong 4 tuần
- Founder churn
- Drama lan ra cộng đồng

### Monetization decision (lifestyle)

- **Không monetize** nếu cover được $30-50/tháng
- Cân nhắc khi infrastructure cost >$200/tháng (~50+ active circles)
- Phù hợp lifestyle: **Mục 17 Option 2 v2** (hợp tác địa phương — phòng khám, dịch vụ pháp lý Việt)

### Stop/Pivot/Scale criteria

- **Pause/pivot** nếu sau 6 tháng: <3 vòng healthy
- **Sunset** nếu sau 12 tháng: <5 vòng active hoặc burnout
- **Scale up** nếu sau 12 tháng: ≥15 vòng + organic growth + demand mạnh

### Docs to produce in Phase 5

| Doc | When |
|---|---|
| `founder-onboarding-playbook.md` | Tuần 1-2 sau P4 |
| `circle-health-dashboard.md` | Weekly update |
| `expansion-log.md` | Mỗi vòng mới |
| `monetization-decision.md` | Khi cần |
| `stop-pivot-scale-review.md` | 3-month interval |

---

## 13. Tech Stack & Architecture Reference

### High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER DEVICE                          │
│  ┌──────────────────┐    ┌──────────────────┐           │
│  │  PWA (Next.js)   │    │   LINE App       │           │
│  │  - UI            │    │  - Notification  │           │
│  │  - Service Worker│    │    fallback      │           │
│  │  - Web Push      │    │  - 1-1 chat      │           │
│  └────────┬─────────┘    └────────┬─────────┘           │
└───────────┼───────────────────────┼─────────────────────┘
            │                       │
            │ HTTPS                 │ LINE Webhook
            ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│                  VERCEL (Edge)                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  Next.js App                                 │       │
│  │  - Server Components (rendering)             │       │
│  │  - Server Actions (mutations)                │       │
│  │  - Route Handlers (webhooks, API)            │       │
│  └────────────────────┬─────────────────────────┘       │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Auth    │  │ Postgres │  │  Realtime            │   │
│  │          │  │  + RLS   │  │  (aid request live)  │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
│  ┌──────────┐  ┌──────────────────────────────────┐     │
│  │ Storage  │  │ Edge Functions                   │     │
│  │ (avatar) │  │ - Notification dispatcher        │     │
│  │          │  │ - LINE bot handler               │     │
│  │          │  │ - Cron: archive rings            │     │
│  └──────────┘  └──────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐  ┌──────────────┐
                  │  PostHog     │  │  Sentry      │
                  │  (analytics) │  │  (errors)    │
                  └──────────────┘  └──────────────┘
```

### Data model overview (architecture level)

**Core entities:**
- `users` — identity + profile (name, station, line_user_id)
- `children` — birth_year (privacy)
- `circles` — group + criteria (JSONB)
- `circle_members` — junction với role + status
- `invitations` + `invitation_flags`
- `aid_requests` — core feature
- `aid_responses` — junction request và helper
- `notifications_log` — audit + analytics

**Discovery entities (Sprint 3 schema, Sprint 11-12 UI):**
- `user_discovery_settings` — opt-in flag, visible_area, intro_text, expires_at, auto_expire_days
- `connection_requests` — from_user, to_user, status (pending/accepted/declined), created_at

**Relationships:**
- `circle` 1-N `circle_members` N-1 `user`
- `user` 1-N `aid_requests` N-1 `circle`
- `aid_request` 1-N `aid_responses` N-1 `user`
- `user` 1-1 `user_discovery_settings`
- `user` 1-N `connection_requests` (as sender) N-1 `user` (as receiver)

**RLS principle (CRITICAL):**
> **Coordination:** Mọi query đến aid_requests, circle_members, etc. **phải filter qua circle_members table** để verify user là thành viên. Không hardcode user_id check.
>
> **Discovery:** Chỉ user có `is_visible = true` mới hiện trong discovery list. User tự kiểm soát mình có hiện hay không. Connection request chỉ visible cho sender + receiver.

**Forbidden columns** (vi phạm Constitution):
- ❌ `user.helps_given_count`
- ❌ `user.helps_received_count`
- ❌ `user.reputation_score`
- ❌ Bất kỳ aggregate counter nào về tương trợ
- ❌ `user_discovery_settings.connection_count` (không đếm kết nối)

### Stack details

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Server Components, Server Actions, Vercel-native |
| Language | TypeScript | Type safety quan trọng cho RLS + API |
| Styling | Tailwind + shadcn/ui | Boring, AI-friendly |
| State (client) | Zustand | Đơn giản |
| State (server) | TanStack Query | Cache + sync realtime |
| Forms | React Hook Form + Zod | Validation + TS native |
| Backend | Supabase | All-in-one, RLS native |
| Database | Postgres (Supabase) | Relational + JSONB |
| Auth | Supabase Auth | Method TBD (OQ-003, OQ-004) |
| Realtime | Supabase Realtime | Native Postgres |
| Storage | Supabase Storage | Avatar |
| Edge functions | Supabase (Deno) | Webhook, cron |
| PWA | next-pwa / Serwist | Service worker |
| Push | Web Push API | Primary |
| Push fallback | LINE Messaging API | iOS reliability |
| Hosting (FE) | Vercel | Native Next.js |
| Analytics | PostHog Cloud | Free tier rộng |
| Errors | Sentry | Free tier đủ |
| Tests | Vitest + Playwright | Modern, AI-friendly |
| CI/CD | GitHub Actions | Free, integrated |

### Migration path

- PWA → Native: wrap **Capacitor** (không rewrite UI)
- Supabase → tự host: Postgres exports + standard SQL
- Vercel → self-host: Next.js chạy mọi Node.js host

### Chi phí ước tính pilot

- Vercel: $0 (Hobby)
- Supabase: $0 (Free)
- PostHog: $0
- Sentry: $0
- Domain: ~$10/năm
- LINE Messaging: $0 (500 msgs/tháng free)
- **Total: ~$0/tháng** đến khi vượt 50 active users
- Sau scale: Supabase Pro $25/tháng

---

## 14. Next.js & Supabase Primer

> Tóm tắt khái niệm architecture cho background low-code + Node.js, chưa làm Next.js + chưa quen Supabase. Mental model, không phải cú pháp.

### 14.1 Next.js App Router

**Khác Express:**

| Express | Next.js App Router |
|---|---|
| `app.get('/api/users', ...)` | File-based: `app/users/page.tsx` |
| Server render template hoặc API-only | Server Components mặc định, Client opt-in |
| REST endpoints | Server Actions (function gọi như local) |
| Stateless API + frontend state | Mix server state (RSC) + client state |

**Mental model:**
- Mỗi folder trong `app/` = một route
- `page.tsx` = main UI
- `layout.tsx` = wrapper
- `loading.tsx` = skeleton
- `error.tsx` = error boundary
- Server Components mặc định, đụng browser API (useState, onClick) thì thêm `'use client'`

**Server Actions:**

Function chạy trên server, gọi từ client như function thường. Paradigm shift từ REST — không cần build API endpoint cho mọi mutation.

**Khi nào dùng cái gì:**

| Use case | Cách làm |
|---|---|
| Hiển thị aid requests list | Server Component query trực tiếp |
| Post aid request | Server Action |
| Realtime feed update | Client Component + Supabase subscription |
| LINE webhook | Route Handler |
| Cron archive circles | Supabase Edge Function (cron) |

### 14.2 Supabase

**Mental model:** Supabase = Postgres + Auth + Realtime + Storage + Functions, qua một SDK duy nhất.

**RLS (Row Level Security) — quan trọng nhất:**

Postgres feature define policies dạng: "user chỉ thấy aid_requests của vòng mà họ là thành viên (qua circle_members)."

→ Khi user query, Postgres tự động filter rows. Frontend có thể query trực tiếp Supabase, RLS đảm bảo không leak.

**Rủi ro:**
- RLS sai = data leak nghiêm trọng
- Khó debug khi policy phức tạp
- **Area #1 cần Reviewer Agent đặc biệt cẩn thận**

**Realtime:**

Postgres logical replication → Supabase publish → client subscribe.

**Khi nào dùng:**
- ✅ Aid request mới trong feed
- ✅ Response mới
- ❌ Notification (push, không realtime)
- ❌ Static data

**Edge Functions vs Server Actions:**

| Edge Functions (Supabase) | Server Actions (Next.js) |
|---|---|
| Deno runtime | Node.js (Vercel) |
| Webhooks bên thứ 3 (LINE) | Mutations từ frontend |
| Cron jobs | Không cron (cần Vercel Cron) |
| Triggered events | Logic chạy khi user click |

→ Default Server Actions, Edge Functions cho webhook/cron/triggered.

### 14.3 Khái niệm cần đào sâu

Khi cần, search hoặc hỏi Master Agent:

- Next.js: "Server Components vs Client Components", "Server Actions", "Streaming + Suspense", "Route Groups"
- Supabase: "Row Level Security policies", "Realtime subscriptions", "Edge Functions", "Auth helpers Next.js"
- PWA: "Service Worker lifecycle", "Web Push iOS", "Manifest configuration"

---

## 15. AI Agent Architecture

### Pattern: Master-Worker với Claude Code subagents

```
              ┌──────────────────┐
   Bạn ◄────► │  Master Agent    │  ← chỉ bạn nói với agent này
              │ (Claude Code     │
              │  main instance)  │
              └────────┬─────────┘
                       │ delegate qua Task tool
   ┌───────────┬───────┴────────┬────────────┬──────────────┐
   ▼           ▼                ▼            ▼              ▼
┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Architect│ │ Schema  │ │ Frontend │ │ Backend  │ │ Reviewer │ │  Docs    │
│         │ │         │ │          │ │          │ │          │ │ Steward  │
└────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
                                                                    │
                                                                    └─► Tester
```

### Master Agent (main Claude Code session)

**Bạn chỉ trao đổi với agent này.**

**Responsibilities:**
1. Hiểu intent
2. Reference Constitution + Decision Log + Open Questions
3. Decompose task → delegate sub-agent
4. Synthesize output → present clearly
5. Track sprint state (PROJECT_STATE.md)
6. Escalate: forbidden patterns, OQ block, scope creep, decision lớn

**Master KHÔNG:**
- Bypass review của bạn cho PR
- Tự quyết Open Question
- Tự thay đổi Constitution
- Modify production mà không qua sub-agent + PR

### Sub-agents roster

#### 1. Architect Agent
- **Role:** ADR, tech decisions, architecture
- **Focus:** Đọc Constitution trước, default boring tech, ADR justify mọi quyết định
- **Tools:** Read, Write, Grep, WebSearch
- **Outputs:** ADRs

#### 2. Schema Agent
- **Role:** Data model, migrations, RLS
- **Focus:** RLS first principle, không tạo ledger columns, migration reversible
- **Tools:** Read, Write, Edit, Grep, Bash (Supabase CLI)
- **Outputs:** SQL migrations, RLS verification reports
- **SPECIAL CAUTION:** Risk cao nhất cho data leak

#### 3. Backend Agent
- **Role:** Server Actions, Edge Functions, business logic
- **Focus:** Default Server Actions, Edge Functions chỉ webhook/cron, validate Zod, error explicit
- **Tools:** Read, Write, Edit, Grep, Bash
- **Outputs:** Server Action files, Edge Function files

#### 4. Frontend Agent
- **Role:** React Components, UI, client state
- **Focus:** Default Server Components, shadcn/ui first, microcopy theo guidelines, states đầy đủ
- **Tools:** Read, Write, Edit, Grep, Bash
- **Outputs:** Component files, page files

#### 5. Reviewer Agent
- **Role:** Code review, security audit, Constitution compliance
- **Focus:** VETO POWER cho violations, RLS verification, security check (PII, auth bypass, injection), performance smell, test coverage
- **Tools:** Read, Grep (chủ yếu)
- **Outputs:** Review reports approve/request-changes/reject
- **SPECIAL:** Lương tâm dự án. Không bypass.

#### 6. Tester Agent
- **Role:** Tests, edge cases
- **Focus:** Unit + Integration + E2E, edge cases first
- **Tools:** Read, Write, Edit, Bash
- **Outputs:** Test files, reports

#### 7. Docs Steward Agent ⭐

**Role:** Control toàn bộ documentation lifecycle.

**System prompt:**

```
Bạn là Docs Steward Agent. Trách nhiệm:

1. KNOW: Documentation Pyramid (5 tầng) trong MVP Roadmap
2. PROPOSE: Đầu mỗi phase, list docs cần tạo + nhắc Master
3. VERIFY: Mỗi doc draft, check acceptance trước khi mark done
4. CROSS-REFERENCE: Khi 1 doc đổi, identify related docs cần update
5. MAINTAIN: PROJECT_STATE.md update mỗi sprint
6. TRACK: Open Questions Register — flag khi deadline gần
7. ESCALATE: Inconsistency, conflict, missing critical doc

QUALITY BAR mỗi doc:
- Đầy đủ acceptance criteria
- Naming convention đúng
- Cross-references đúng
- Tiếng Việt natural
- Format consistent

KHÔNG được:
- Tự quyết Open Question
- Tự update Constitution
- Generate template chưa biết context
- Skip acceptance verification

KHI THIẾU CONTEXT:
- Ask Master Agent
- Reference docs đã có
- Không hallucinate
```

**Tools:** Read, Write, Edit, Grep

**Triggers:**
- Đầu mỗi phase (propose docs)
- Sau mỗi sprint (update PROJECT_STATE)
- Khi có doc draft (verify)
- Khi có decision mới (update Log)
- Khi OQ resolved (move sang Log)

### Workflow examples

**Example 1: "Bắt đầu Sprint 4"**

```
Bạn → Master: "Bắt đầu Sprint 4 (Aid Request Post & View)"

Master:
  1. Read sprint-4-spec.md (nếu chưa có, ask Docs Steward tạo)
  2. Read related: data-model.md, screen-specs/post-aid-request.md
  3. Check Constitution: OK, no forbidden
  4. Decompose dependency order:
     - Schema: tạo aid_requests + RLS
     - Backend: post_aid_request Server Action
     - Frontend: form + feed screens
     - Tester: E2E sau khi 3 trên xong
  5. Delegate Schema Agent first

Schema Agent:
  → Propose migration + RLS
  → Output: migration + RLS verification
  → Return

Master:
  → Show output cho bạn
  → "Schema ready. Continue Backend?"

Bạn → Master: "Yes"
(... continue ...)
```

**Example 2: Docs check end of Phase 0**

```
Bạn → Master: "Phase 0 xong chưa?"

Master → Docs Steward: "Verify Phase 0 docs"

Docs Steward:
  Report:
    ✅ constitution.md — đầy đủ
    ✅ vision.md
    ✅ glossary.md — 22 thuật ngữ
    ⚠️  non-goals.md — thiếu vài mục
    ❌ CLAUDE.md — chưa tạo
  Recommend: hoàn thành ⚠️ và ❌

Master → bạn: present report
```

### File config sub-agent

Mỗi sub-agent trong `.claude/agents/<name>.md`:

```markdown
---
name: docs-steward
description: Manages documentation lifecycle, verifies completeness
tools: Read, Write, Edit, Grep
---

# Docs Steward Agent

[system prompt như trên]
```

### Quy tắc chung cho sub-agents

1. Reference Constitution trước mọi action
2. Reference Decision Log + Open Questions trước propose
3. Không action production mà không qua review
4. Output rõ ràng: action, files changed, next step
5. Escalate khi ambiguity
6. Tiếng Việt trong docs, tiếng Anh trong code

---

## 16. Critical AI Files: CLAUDE.md & PROJECT_STATE.md

### CLAUDE.md — Master instructions

File này Claude Code đọc tự động mỗi session.

**Cấu trúc đề xuất:**

```markdown
# CLAUDE.md — Master Instructions

## Project Context

Đọc trước khi action:
- `product-discovery-v2.md` — Vision gốc
- `docs/00-foundation/constitution.md` — KIM CHỈ NAM BẤT BIẾN
- `docs/00-foundation/decision-log.md`
- `docs/00-foundation/open-questions.md`
- `PROJECT_STATE.md` — Trạng thái hiện tại

## Role

You are the Master Agent. User chỉ trao đổi với bạn.

Responsibilities:
1. Hiểu intent của user
2. Reference Constitution + Decision Log + Open Questions
3. Decompose task, delegate sub-agents qua Task tool
4. Synthesize output, present clearly
5. Update PROJECT_STATE.md mỗi sprint
6. Escalate forbidden patterns, scope creep, blocked decisions

## Sub-agents Available

- @architect — ADR, tech decisions
- @schema — DB, migrations, RLS
- @backend — Server Actions, Edge Functions
- @frontend — React Components, UI
- @reviewer — Code review, security, Constitution compliance
- @tester — Tests (unit/integration/E2E)
- @docs-steward — Documentation lifecycle

## Rules

### NEVER
- Bypass Constitution forbidden patterns
- Self-decide Open Questions
- Modify production without user review of PR
- Skip Reviewer Agent for code changes
- Use ledger/counter patterns

### ALWAYS
- Read Constitution before architecture decisions
- Delegate to specialized sub-agents
- Update PROJECT_STATE.md after sprint
- Tiếng Việt for user-facing docs, Tiếng Anh for code
- Cite sources when proposing

## Sprint Workflow

1. Read sprint-N-spec.md
2. Verify Open Questions for sprint resolved
3. Delegate tasks per dependency order
4. Run Reviewer Agent before any merge
5. Update PROJECT_STATE.md end of sprint
6. Schedule retro

## Communication Style

- Concise, action-oriented
- Show output clearly (what done, files changed, next step)
- Flag risks early
- Ask user when ambiguous, không hallucinate
```

### PROJECT_STATE.md — Current state

Update **mỗi sprint** bởi Docs Steward.

```markdown
# PROJECT_STATE.md

**Last updated:** [date]
**Current phase:** [Phase X]
**Current sprint:** [Sprint N — name]
**Days into sprint:** [N/7]

## Sprint Status

### Goal
[1-2 sentences]

### Tasks
- [x] Task 1 — @schema — done
- [ ] Task 2 — @backend — in progress (PR #42)
- [ ] Task 3 — @frontend — blocked by Task 2
- [ ] Task 4 — @tester — waiting

### Blockers
- [Description] — owner: [who] — ETA: [when]

## Recent Decisions (this sprint)
- D-XXX: [Decision summary]

## Resolved Open Questions
- OQ-XXX: [Question] → [Resolution]

## New Open Questions
- OQ-XXX: [New question]

## Metrics (Phase 1+)
- Aid requests/week: X
- Match rate: X%
- Time to match (urgent): X min

## Next Sprint Preview
[1-2 sentences]
```

---

## 17. Knowledge Gaps & Risk Areas

Những area bạn (mid-level dev mới với stack này) cần đặc biệt cẩn thận.

### 17.1 Row Level Security (HIGHEST RISK)

**Risk:** RLS sai = data leak. Khó test thủ công. AI có thể generate RLS sai nhưng trông đúng.

**Mitigation:**
- Schema Agent verify RLS với explicit test queries
- Reviewer Agent veto power
- Test với multiple users (impersonation testing)
- Supabase "Database → Policies" UI check
- Resource: Supabase RLS deep dive docs

**Pattern an toàn:**
- Check qua `circle_members` (không hardcode user_id)
- Default deny (no policy = no access)
- Test SELECT, INSERT, UPDATE, DELETE separately

### 17.2 iOS PWA Push Notification

**Risk:** iOS support từ iOS 16.4 nhưng có quirks. User phải "Add to Home Screen". Reliability thấp hơn native.

**Mitigation:**
- Test trên iOS thật từ Sprint 6 (không emulator)
- LINE fallback mandatory
- Onboarding hướng dẫn "Add to Home Screen"
- Monitor delivery qua PostHog

### 17.3 Realtime Subscriptions Performance

**Risk:** Mỗi user subscribe → connection persistent. Free tier giới hạn concurrent. Memory leak nếu không cleanup.

**Mitigation:**
- Subscribe chỉ khi cần (active circle screen)
- Unsubscribe trong cleanup hooks
- Channel naming convention (1/circle)
- Monitor connection count

### 17.4 Service Worker Caching

**Risk:** Cache strategy sai → data cũ. SW update tricky. Offline cần design.

**Mitigation:**
- Network-first cho data
- Cache-first cho static
- Clear strategy cho update SW
- Test offline thật (Chrome DevTools)

### 17.5 Auth + Session edge cases

**Risk:** Multi-device session, token refresh, email verification, OTP rate limit.

**Mitigation:**
- Supabase Auth helpers cho Next.js (đã handle)
- Không tự build auth flow
- Test: login → logout → login lại device khác

### 17.6 PII trong Notification Payload

**Risk:** Push payload có thể bị OS log. LINE message visible. PII leak.

**Mitigation:**
- Notification chỉ metadata, không nội dung
- "Có yêu cầu mới" thay "[Tên] cần đón con ở [địa chỉ]"
- User mở app mới load detail
- Reviewer specific check

### 17.7 Cron jobs reliability

**Risk:** Archive setting-up circles phải reliable. Edge Function cron có thể fail.

**Mitigation:**
- Idempotent
- Logging mỗi run
- Manual fallback procedure

### 17.8 Next.js Server vs Client Components confusion

**Risk:** Background low-code không quen paradigm. AI có thể mix sai. 'use client' sai chỗ → bug.

**Mitigation:**
- Học pattern kỹ trước Sprint 0
- Architect Agent guideline rõ
- Code review pattern specific

### 17.9 Supabase free tier limits

**Limits:**
- DB: 500MB (pilot OK)
- Storage: 1GB (avatars OK)
- Bandwidth: 2GB/tháng
- MAU: 50K
- Edge functions: 500K invocations
- Realtime: 200 concurrent

**Mitigation:**
- Monitor dashboard
- Upgrade Pro ($25/mo) khi cần
- Plan: pilot stay free, ≥3 vòng cân nhắc upgrade

### 17.10 Discovery RLS + Privacy (NEW)

**Risk:** Discovery cho người lạ nhìn vào profile nhau. RLS sai = leak thông tin cá nhân cho stranger. Khác hẳn coordination RLS (chỉ members trong circle nhìn nhau).

**Mitigation:**
- RLS discovery_settings: chỉ trả về rows có `is_visible = true` AND `expires_at > now()`
- KHÔNG bao giờ return: tên thật, ảnh, ga cụ thể, vòng tham gia
- Chỉ return: khu vực (quận/TP), tuổi con, intro text
- Reviewer Agent: dedicated review cho discovery RLS — strict hơn coordination
- Test: user A không opt-in → verify A KHÔNG hiện trong list bất kỳ ai
- Connection request: chỉ sender + receiver thấy, không leak cho người khác

**Cộng đồng risk:** Nếu có incident (stalking, spam, harassment qua discovery) → có thể giết cả product. Cộng đồng Việt nhỏ, gossip lan nhanh (Rủi ro 6 v2).

**Mitigation:** Rate limit 5 lời chào/tuần, auto-expire 30 ngày, decline không notify.

---

## 18. Phụ lục: Templates & Prompts

### 18.1 Sprint spec template

```markdown
# Sprint N — [Name]

## Goal
[1-2 sentences]

## Features
1. [Feature 1] — US #X
2. [Feature 2] — US #Y

## Out of scope
- [Thing not done]

## Acceptance Criteria
- [ ] Criterion 1 (testable)
- [ ] Criterion 2

## Dependencies
- Depends on Sprint N-1
- OQ-XXX must be resolved

## Risks
- Risk 1: [description] — Mitigation: [how]

## Sub-agent breakdown
- @schema: [task]
- @backend: [task]
- @frontend: [task]
- @tester: [task]
- @reviewer: [task]

## Test plan reference
See `sprint-N-test-plan.md`

## Definition of Done
- All acceptance criteria met
- Reviewer approved
- Tests pass CI
- Deployed to preview
- User-tested với ≥2 pilot
```

### 18.2 ADR template

```markdown
# ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Date:** YYYY-MM-DD
**Deciders:** Master + [agents]

## Context
[Issue, forces at play]

## Decision
[What we decided]

## Rationale
[Why, alternatives considered]

## Consequences
**Positive:** ...
**Negative:** ...
**Neutral:** ...

## Alternatives Considered
1. [Alternative 1] — Rejected because [reason]
2. [Alternative 2] — Rejected because [reason]

## References
- [Link]
```

### 18.3 Screen Spec template

```markdown
# Screen: [Name]

## Purpose
[1-2 sentences]

## User Personas
- Primary: [Persona]
- Secondary: [Persona]

## User Stories Covered
- US-XXX, US-YYY

## URL / Route
`/path/to/screen`

## Elements
- Header: [description]
- Body: [description]
- Footer: [description]
- Modals: [description]

## States
### Empty
[Description + microcopy]

### Loading
[Description]

### Success
[Description]

### Error
- [Error type]: [Microcopy]

## Behaviors
- On mount: [action]
- On [interaction]: [action]
- On submit: [action]

## Permissions / Access
- Who can access?
- RLS implication: [reference data-model.md]

## Cross-references
- Data model: [tables]
- API: [Server Actions]
- Design tokens: [components]

## Mockup
[Link AI-rendered mockup]
```

### 18.4 Prompt template cho AI-rendered wireframe

```
Render giúp tôi màn hình [tên màn hình] của app điều phối tương trợ
cho gia đình Việt tại Nhật.

Context: [mô tả app 1-2 dòng]

User on screen: [Asker/Helper/Founder/Member]

User journey step: [step nào trong journey nào]

Elements needed:
- [Element 1 + behavior]
- [Element 2 + behavior]

States to render:
- [ ] Empty state
- [ ] Loading state
- [ ] Success state
- [ ] Error state (specify which)

Constraints:
- Mobile-first (375px width)
- Tiếng Việt only
- Tone: yên tĩnh, ấm áp, không corporate
- Typography: dễ đọc cho phụ huynh 30-45 tuổi
- Design system: [reference tokens nếu có]
- Tech: HTML + Tailwind, clickable navigate to [next screen]

Constitution compliance:
- KHÔNG hiển thị số lần giúp/nhận giúp
- KHÔNG show ranking/badge
- KHÔNG có vote UI

Output: Single HTML file, inline CSS Tailwind CDN, working click navigation
```

### 18.5 Sub-agent config template

```markdown
---
name: [agent-name]
description: [1-2 sentence role]
tools: [list]
---

# [Agent Name]

## Role
[Description]

## Pre-action Checklist
Before any action:
1. Read `docs/00-foundation/constitution.md`
2. Read `docs/00-foundation/decision-log.md`
3. Read relevant feature spec
4. Check Open Questions for blocking

## Responsibilities
- [Responsibility 1]
- [Responsibility 2]

## Authority
- CAN: [autonomous actions]
- CANNOT: [requires Master approval]
- VETO POWER: [if any]

## Output Format
[Structure]

## Escalation Triggers
- [Trigger 1]
- [Trigger 2]

## Forbidden Patterns
- [Pattern 1] — Reference Constitution rule X

## Style
- Concise, action-oriented
- Cite sources
- Tiếng Việt docs, Tiếng Anh code
```

### 18.6 Code Review Checklist (for Reviewer Agent)

```markdown
# Code Review Checklist

## Constitution Compliance
- [ ] No ledger/counter columns or UI
- [ ] No ranking/badge/leaderboard
- [ ] No vote UI for invites
- [ ] No public profile outside circle
- [ ] No admin role with super permissions
- [ ] No dark patterns

## Security
- [ ] RLS policies present and tested cho table mới
- [ ] RLS qua circle_members (no hardcoded user_id)
- [ ] Input validated với Zod
- [ ] No PII trong notification payloads
- [ ] No PII trong error messages
- [ ] No secrets trong code
- [ ] Auth checks cho mọi protected route

## Code Quality
- [ ] TypeScript types complete (no `any` unless justified)
- [ ] Error handling explicit
- [ ] Loading states present
- [ ] Empty states present
- [ ] Component naming clear
- [ ] File structure follows conventions

## Performance
- [ ] No N+1 queries
- [ ] Realtime subscriptions cleaned up
- [ ] Images optimized
- [ ] Code split where appropriate

## Tests
- [ ] Unit tests cho logic mới
- [ ] Integration tests cho flow mới
- [ ] E2E test cho critical paths
- [ ] Coverage meets target

## Docs
- [ ] Data model updated if schema changed
- [ ] API contract updated if endpoints changed
- [ ] ADR written if new decision
- [ ] PROJECT_STATE.md updated

## Accessibility (Sprint 8+)
- [ ] Semantic HTML
- [ ] Alt text cho images
- [ ] Keyboard navigation
- [ ] Color contrast sufficient

## i18n
- [ ] Tiếng Việt natural
- [ ] No hardcoded English UI
- [ ] Microcopy follows guidelines
```

---

## Closing Notes

Đây là tài liệu sống. Update theo những gì học được.

**Quy tắc update:**
- Constitution: chỉ update với approval explicit của bạn (founder)
- Decision Log: append, không edit (immutable)
- Open Questions: move sang Decision Log khi resolved
- Mọi update: qua PR + review

**Khi nào reference:**
- Đầu mỗi phase (review checklist)
- Khi onboard sub-agent mới
- Khi có decision lớn
- Khi tham gia retro

**Liên hệ với product-discovery-v2.md:**
- v2 là source of truth về Vision + Strategy
- File này là source of truth về Execution + Workflow
- Conflict → v2 thắng (Constitution dựa trên v2)

---

*Tài liệu được tạo trong cuộc thảo luận với Claude, dựa trên product-discovery-v2.md và yêu cầu cụ thể của founder. Mọi quyết định ghi trong Decision Log Mục 3. Mọi câu hỏi chưa quyết trong Open Questions Register Mục 4.*
