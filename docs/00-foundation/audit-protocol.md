---
title: Audit Protocol — Master Agent ↔ Subagent
phase: Phase 4+
last_updated: 2026-05-17
---

# Audit Protocol — Master Agent ↔ Subagent

> Quy trình bắt buộc để Master Agent verify subagent đã làm đúng, đủ công việc.
> Không có APPROVED từ Reviewer → không mark task DONE trong PROJECT_STATE.md.

---

## Tại sao cần Audit Protocol

Vấn đề nếu không có:
- Subagent tự report "done" mà không ai verify
- Reviewer bị gọi muộn, phát hiện vi phạm Constitution sau khi đã build nhiều
- Master Agent không biết task nào thực sự xong vs chỉ partially done
- Forbidden patterns lọt qua vì không có checkpoint bắt buộc

---

## Luồng chuẩn (mỗi task delegation)

```
┌─────────────────────────────────────────────────────────────┐
│ MASTER AGENT                                                │
│  0. Verify `docs/04-operations/sprint-N-spec.md` tồn tại   │
│     Nếu không → gọi @docs-steward tạo trước, KHÔNG proceed │
│  1. Đọc sprint spec → xác định tasks                        │
│  2. Verify OQs cho sprint đã resolved                       │
│  3. Delegate task cho subagent + đính kèm sprint spec        │
└──────────────────────┬──────────────────────────────────────┘
                       │ delegate
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ SUBAGENT (@schema / @backend / @frontend / @tester / etc.)  │
│  1. Làm task                                                │
│  2. Self-check Forbidden Patterns trước khi report          │
│  3. Viết Completion Report theo schema                      │
│  4. Gửi lại Master Agent                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Completion Report
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ MASTER AGENT — Audit Checklist                              │
│  1. Completeness: tất cả tasks có trong checklist?          │
│  2. Exit criteria: tất cả đã met?                           │
│  3. Files listed: đủ không, có gì thiếu không?             │
│  4. Forbidden patterns: subagent đã tự-check chưa?         │
│  5. Blockers: có gì cần escalate không?                     │
│                                                             │
│  → Nếu pass: forward cho Reviewer Agent                     │
│  → Nếu fail: gửi lại Subagent với feedback cụ thể          │
└──────────────────────┬──────────────────────────────────────┘
                       │ forward Completion Report + files
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ REVIEWER AGENT                                              │
│  1. Verify Completion Report trung thực (đọc actual files)  │
│  2. Chạy Constitution + Security checklist                  │
│  3. Cross-check với sprint spec                             │
│  4. Output verdict: APPROVED / CHANGES REQUESTED / REJECTED  │
└──────────────────────┬──────────────────────────────────────┘
                       │ verdict
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ MASTER AGENT — Final Action                                 │
│  APPROVED → update PROJECT_STATE.md, mark done             │
│  CHANGES REQUESTED → gửi lại Subagent với issues cụ thể   │
│  REJECTED → escalate lên user ngay, không proceed          │
└─────────────────────────────────────────────────────────────┘
```

---

## Completion Report Schema

Mọi subagent phải dùng format này khi báo cáo xong task:

```markdown
## Completion Report — @[agent-name]

**Sprint:** [Sprint N — Theme]
**Task:** [mô tả task được giao]
**Status:** DONE / BLOCKED / PARTIAL

### Checklist
- [x] / [ ] [từng task item trong sprint spec]

### Files Changed
- `path/to/file` — [mô tả thay đổi]

### Forbidden Patterns Self-Check
- [x] / [ ] [items phù hợp với loại agent]

### Tests
- [x] / [ ] [test types applicable]

### Exit Criteria (từ sprint spec)
- [x] / [ ] [từng exit criteria]

### Blockers / Escalations
[Nếu có]

### Notes for Reviewer
[Điều gì cần Reviewer chú ý đặc biệt]
```

---

## Master Agent Audit Checklist

Chạy checklist này khi nhận Completion Report trước khi forward cho Reviewer:

```markdown
## Master Audit — Pre-Reviewer Check

**Agent:** @[agent]
**Sprint:** [N]

### Completeness
- [ ] Tất cả task items trong sprint spec đã có trong checklist subagent?
- [ ] Tất cả exit criteria đã được address?
- [ ] Files changed list đủ? (không có file quan trọng nào bị bỏ qua)

### Self-Check Quality
- [ ] Forbidden patterns self-check đã điền đầy đủ?
- [ ] Không có [ ] tick trống trong checklist mà không có giải thích?

### Blockers
- [ ] Có blockers nào cần Master resolve trước khi Reviewer xem?
- [ ] Có Open Questions nào bị ảnh hưởng?

### Decision
- [ ] FORWARD to Reviewer — pass tất cả
- [ ] SEND BACK to Subagent — [lý do cụ thể]
```

---

## Reviewer Audit Checklist (khi nhận từ Master)

Reviewer không chỉ đọc Completion Report — phải **verify thực tế**:

```markdown
## Reviewer Audit

**Agent:** @[agent]
**Sprint:** [N]

### Step 1 — Verify Report Truthfulness
- [ ] Files listed trong report có thực sự tồn tại? (Read/Grep verify)
- [ ] Checklist ✅ items có thực sự done? (kiểm tra code thực tế)
- [ ] Exit criteria đã thực sự met? (không tin report, tự verify)

### Step 2 — Constitution + Security (chạy full checklist)
[Xem review checklist trong reviewer.md]

### Step 3 — Sprint Spec Cross-Check
- [ ] File `docs/04-operations/sprint-N-spec.md` có tồn tại không? Nếu không → báo Master, DỪNG audit, yêu cầu tạo spec trước.
- [ ] Sprint spec yêu cầu gì? Subagent đã làm đủ chưa?
- [ ] Có task nào trong spec bị bỏ qua không có lý do?

### Verdict
APPROVED ✅ / CHANGES REQUESTED ⚠️ / REJECTED ❌
```

---

## Quy tắc về "DONE"

| Condition | Status |
|---|---|
| Subagent report done, chưa có Reviewer APPROVED | ❌ KHÔNG được mark done |
| Reviewer APPROVED | ✅ Mark done trong PROJECT_STATE.md |
| Reviewer CHANGES REQUESTED | 🔄 Subagent fix → re-review |
| Reviewer REJECTED | 🚨 Escalate user ngay |
| Subagent BLOCKED / PARTIAL | ⏸ Master note blocker, không proceed |

---

## Escalation Matrix

| Tình huống | Action |
|---|---|
| Subagent không gửi Completion Report | Master yêu cầu report trước khi forward |
| Completion Report thiếu exit criteria | Master send back, yêu cầu bổ sung |
| Reviewer CHANGES REQUESTED | Master gửi issues list cho subagent, track re-review |
| Reviewer REJECTED — Constitution violation | Master DỪNG sprint, escalate user ngay |
| Reviewer REJECTED — Security critical | Master DỪNG sprint, escalate user ngay |
| Subagent BLOCKED vì OQ chưa quyết | Master flag OQ cho user, ghi vào open-questions.md |
| Master Audit phát hiện missing tasks | Master send back, không forward Reviewer |
| Sprint spec file không tồn tại khi Reviewer cần cross-check | Master gọi @docs-steward tạo ngay, Reviewer tạm dừng |

---

## Scope theo loại agent

| Agent | Forbidden Patterns Focus | Exit Criteria Source |
|---|---|---|
| @schema | Ledger columns, RLS correctness | Migration pass, RLS tests |
| @backend | Ledger endpoints, PII in errors, auth checks | Unit tests pass, Server Actions return typed |
| @frontend | Ledger UI, dark patterns, states đầy đủ | 4 states present, microcopy correct |
| @tester | Tests pass, coverage, bugs found | All tests green, E2E flows pass |
| @architect | Ledger architecture, tech in-scope | ADR written, decision documented |
| @docs-steward | Accuracy, cross-references | Acceptance criteria met, PROJECT_STATE updated |

---

*Tạo: 2026-05-17 | Maintain bởi Docs Steward Agent*
*Reference: CLAUDE.md — Audit Protocol section*
