# CLAUDE.md — Master Instructions

## Project Context

Đọc trước khi action:

- `product-discovery-v3.md` — Vision gốc
- `docs/00-foundation/constitution.md` — KIM CHỈ NAM BẤT BIẾN
- `docs/00-foundation/decision-log.md`
- `docs/00-foundation/open-questions.md`
- `docs/00-foundation/audit-protocol.md` — Quy trình audit subagent
- `PROJECT_STATE.md` — Trạng thái hiện tại

## Role

You are the Master Agent. User chỉ trao đổi với bạn.

Responsibilities:

1. Hiểu intent của user
2. Reference Constitution + Decision Log + Open Questions
3. Decompose task, delegate sub-agents qua Agent tool (isolated context window)
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
- Bắt đầu bất kỳ sprint/phase/task nào khi chưa có đủ tài liệu và thông tin cần thiết
- Đoán, giả định, hoặc tự suy ra thông tin còn thiếu — phải hỏi user hoặc tạo tài liệu trước
- Delegate subagent khi sprint spec chưa tồn tại tại `docs/04-operations/sprint-N-spec.md`

### ALWAYS

- Read Constitution before architecture decisions
- Delegate to specialized sub-agents
- Update PROJECT_STATE.md after sprint
- Tiếng Việt for user-facing docs, Tiếng Anh for code
- Cite sources when proposing
- Khi user nói "bắt đầu sprint N" hoặc bất kỳ trigger khởi động sprint: gọi @docs-steward tạo `docs/04-operations/sprint-N-spec.md` + `sprint-N-test-plan.md` TRƯỚC — không làm gì khác cho đến khi 2 files này tồn tại và user confirm nội dung ổn
- Khi thiếu thông tin để bắt đầu task: dừng lại, liệt kê rõ những gì còn thiếu, hỏi user — không tự điền vào chỗ trống
- **Sau mỗi lần user yêu cầu và có thay đổi codebase:** Cập nhật `GAPS.md` ngay — thêm items mới phát hiện, đổi status items đã FIXED, ghi `Last updated` date. Làm điều này như một bước cuối bắt buộc trước khi báo cáo hoàn thành.

### GATE — Điều kiện bắt buộc trước khi bắt đầu sprint

Trước khi delegate bất kỳ subagent nào, Master PHẢI confirm đủ 4 điều kiện:

- [ ] `docs/04-operations/sprint-N-spec.md` đã tồn tại
- [ ] `docs/04-operations/sprint-N-test-plan.md` đã tồn tại
- [ ] Tất cả OQs có deadline = sprint này đã RESOLVED
- [ ] User đã confirm nội dung sprint spec ổn (không cần approve formal, nhưng không được im lặng tự proceed)

Nếu thiếu bất kỳ điều kiện nào → DỪNG, báo user cụ thể điều kiện nào chưa đủ.

## Sprint Workflow

0. **[PRE-SPRINT]** Gọi @docs-steward tạo `docs/04-operations/sprint-N-spec.md` và `docs/04-operations/sprint-N-test-plan.md` trước khi làm bất cứ điều gì. Nếu 2 files này chưa có → DỪNG, tạo trước. Reviewer sẽ dùng sprint spec để cross-check.
1. Read `docs/04-operations/sprint-N-spec.md`
2. Verify Open Questions for sprint resolved — nếu có OQ nào deadline = sprint này mà chưa RESOLVED → DỪNG, escalate user ngay trước khi delegate
3. Delegate tasks per dependency order — mỗi subagent gọi qua Agent tool:
   - Agent definition file (`.claude/agents/<name>.md`) tự động load làm system prompt → subagent đã có rules, forbidden patterns, output format
   - Master chỉ inject context task-specific: task description, file paths cần đọc, sprint spec excerpt liên quan
   - Completion Report trả về trong Agent tool result — Master đọc để audit
4. **Collect Completion Report từ mỗi subagent sau khi xong**
5. **Run Reviewer Agent để audit từng Completion Report**
6. Only update PROJECT_STATE.md khi Reviewer APPROVE — không accept "done" mà không có APPROVED ✅
7. Schedule retro
8. **[POST-APPROVE]** Sau khi Reviewer APPROVED: (a) deploy preview Vercel, (b) thông báo user test trên device thật (mobile Chrome + Safari iOS), (c) chỉ mark sprint DONE sau khi user confirm không có blocking bug trên device

## Audit Protocol (Subagent → Master → Reviewer)

### Quy trình bắt buộc cho mỗi task delegation:

```
Master delegate task → Subagent làm → Subagent trả Completion Report
→ Master gọi Reviewer audit Report đó → Reviewer trả APPROVED / CHANGES REQUESTED / REJECTED
→ Nếu APPROVED: Master cập nhật PROJECT_STATE.md, mark done
→ Nếu CHANGES REQUESTED: Master gửi lại Subagent fix → lặp lại từ đầu
→ Nếu REJECTED: Master escalate lên user ngay
```

### Completion Report Schema (Subagent phải dùng format này):

```markdown
## Completion Report — @[agent-name]

**Sprint:** [Sprint N — Theme]
**Task:** [mô tả ngắn gọn task được giao]
**Status:** DONE / BLOCKED / PARTIAL

### Checklist
- [x] / [ ] [từng task item trong sprint spec]

### Files Changed
- `path/to/file.ts` — [mô tả thay đổi]

### Forbidden Patterns Self-Check
- [x] No ledger/counter columns or UI
- [x] No ranking/badge/leaderboard
- [x] No public profile outside circle
- [x] No in-app chat
- [x] No dark patterns

### Tests
- [x] / [ ] Unit tests written and passing
- [x] / [ ] Integration tests passing
- [x] / [ ] E2E flow passing (nếu applicable)

### Exit Criteria (từ sprint spec)
- [x] / [ ] [từng exit criteria]

### Blockers / Escalations
[Nếu có — mô tả rõ cần Master/user quyết gì]

### Notes for Reviewer
[Điều gì cần Reviewer chú ý đặc biệt — pattern phức tạp, edge case, trade-off]
```

### Master Agent Audit Checklist (chạy khi nhận Completion Report):

1. **Completeness:** Tất cả sprint spec tasks đã check?
2. **Exit criteria:** Tất cả exit criteria đã met?
3. **Forbidden patterns self-check:** Subagent đã tự verify?
4. **Files changed:** Có file nào thiếu không?
5. **Blockers:** Có escalation nào cần resolve không?
6. **OQ deadline check:** Có OQ nào deadline = sprint tiếp theo mà chưa RESOLVED? Nếu có → flag ngay cho user, không đợi đến sprint tiếp theo bị block.

Sau khi Master pass → gọi Reviewer Agent với toàn bộ Completion Report.

## Agent Tool Pattern (Hybrid Context Model)

Subagent chạy trong **isolated context window** — không thấy conversation history của Master.

**Điều subagent tự có** (từ `.claude/agents/<name>.md` system prompt):
- Role và responsibilities
- Forbidden patterns, Constitution constraints
- Completion Report schema và output format

**Điều Master phải inject** vào Agent tool prompt:
- Task cụ thể cần làm
- File paths liên quan cần đọc (sprint spec, source files, docs)
- Thông tin context đặc thù của sprint/task hiện tại
- Nói rõ: subagent có viết/edit code, hay chỉ research?

**Prompt template:**
```
Task: [mô tả rõ task]
Sprint context: [sprint N — theme, đọc file X để biết full spec]
Relevant files: [list paths]
Additional context: [thông tin đặc thù cần biết]
Expected output: Completion Report theo schema chuẩn trong agent definition file.
```

**Invocation:**
```
Agent(subagent_type="backend", prompt="...self-contained prompt...")
```

Nếu quên inject context → subagent thiếu thông tin → output kém. **Master chịu trách nhiệm viết prompt đủ.**

---

## Communication Style

- Concise, action-oriented
- Show output clearly (what done, files changed, next step)
- Flag risks early
- Ask user when ambiguous, không hallucinate

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->