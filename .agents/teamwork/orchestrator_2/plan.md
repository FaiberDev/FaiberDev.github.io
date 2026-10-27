# Execution Plan: Milestone 3 & 4 (Orchestrator Gen 2)

## Context & Objectives
- Pick up after Milestone 1 completion (`src/data/pong-architecture.md` is complete, verified, and audited CLEAN).
- Execute Milestone 3 (Frontend Implementation & Motion):
  1. Dependency installation (`gsap`, `@gsap/react`, `react-markdown`, `rehype-highlight`, `remark-gfm`).
  2. Implement `src/components/modal/MarkdownModal.jsx` & `src/components/modal/MarkdownModal.css` with retro OS aesthetic, frosted glass tokens, traffic light controls, custom retro scrollbar, highlight.js syntax styling, and GSAP spring physics window entrance/exit curves originating from the trigger button with full cleanup.
  3. Wire Dual Access Triggers:
     - Trigger A: "More information" button inside `src/components/projects/PS5Projects.jsx`.
     - Trigger B: Double-clicking desktop icon in `src/components/desktop/Desktop.jsx`.
  4. Ensure linting (`npm run lint`) and build (`npm run build`) pass.
- Execute Milestone 3 Gate Verification:
  - 2 Reviewers independently checking correctness, aesthetic match, code quality, and interface conformance.
  - 2 Challengers empirically checking interaction edge cases (double-click, mobile tap, rapid open/close, escape key, focus trap, reduced motion).
  - 1 Forensic Auditor running integrity checks.
- Milestone 4: Final QA & Acceptance Verification:
  - Verify complete end-to-end integration across triggers, animations, and builds.
  - Submit final report to Sentinel.

## Step-by-Step Plan
1. **Heartbeat Cron**: Start 10-minute heartbeat cron.
2. **Dispatch Worker M3**:
   - Working Directory: `.agents/teamwork/worker_m3_gen2/`
   - Arm with skills: `impeccable`, `gsap-react`, `gsap-core`, `gsap-performance`.
   - Provide exact requirements, file paths, and mandatory integrity warning.
3. **Monitor Worker M3**: Wait for handoff report.
4. **Dispatch Gate Evaluators**:
   - 2 Reviewers (`teamwork_preview_reviewer`)
   - 2 Challengers (`teamwork_preview_challenger`)
   - 1 Forensic Auditor (`teamwork_preview_auditor`)
5. **Gate Evaluation**:
   - Record verdicts in `GATE_STATUS.md`.
   - Ensure strict AND: build passes, all Reviewers APPROVE, all Challengers pass, Auditor CLEAN.
6. **Milestone 4 QA & Final Report**:
   - Aggregate final results, synthesize evidence, and notify parent/Sentinel via `send_message`.
