# Dispatch for Worker M3 Gen 2 (Frontend Implementation & Motion)

**Role**: Frontend Implementation & Motion Engineer
**Working Directory**: /home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/worker_m3_gen2/

**Required Skills**:
- Impeccable UI Design: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/skills/impeccable/SKILL.md`
- GSAP React: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/skills/gsap-react/SKILL.md`
- GSAP Core: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/skills/gsap-core/SKILL.md`
- GSAP Performance: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/skills/gsap-performance/SKILL.md`

**Input Information**:
- Original User Request: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/ORIGINAL_REQUEST.md`
- Master Project Blueprint: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/orchestrator_1/PROJECT.md`
- Explorer 2 Blueprint (Triggers & CSS Tokens): `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/explorer_survey_2/handoff.md`
- Explorer 3 Blueprint (GSAP Spring Physics & Raw Loader): `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/explorer_survey_3/handoff.md`
- Approved Markdown Document: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/src/data/pong-architecture.md`

**Exclusive Write Ownership**:
- `package.json` (and `package-lock.json`)
- `src/components/modal/MarkdownModal.jsx`
- `src/components/modal/MarkdownModal.css`
- `src/components/desktop/Desktop.jsx`
- `src/components/projects/PS5Projects.jsx`

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Task Specifications**:
1. **Install Dependencies**:
   Install `gsap`, `@gsap/react`, `react-markdown`, `rehype-highlight`, and `remark-gfm`:
   `npm install gsap @gsap/react react-markdown rehype-highlight remark-gfm`
2. **Build `MarkdownModal.jsx` & `MarkdownModal.css`**:
   - Strictly adhere to `impeccable` retro OS styling (frosted glass, retro title bar, traffic light buttons, custom retro scrollbar, clean typography, code block syntax theme).
   - Use Vite's synchronous raw import: `import pongArchitectureRaw from '../../data/pong-architecture.md?raw';`
   - Render markdown with `ReactMarkdown`, `remarkGfm`, and `rehypeHighlight`.
   - Implement GSAP spring physics window entrance/exit:
     * Register `useGSAP` plugin.
     * Calculate delta between `originRect` (trigger button center) and resting modal center (`deltaX`, `deltaY`, `scaleStart`).
     * Entrance tween: `fromTo` `{ x: deltaX, y: deltaY, scale: scaleStart, autoAlpha: 0 }` to `{ x: 0, y: 0, scale: 1, autoAlpha: 1 }` with `ease: 'back.out(1.4)'` and `clearProps: 'transform'`.
     * Exit tween: use `contextSafe` with `power2.in` reverse tween before `onClose` triggers unmount.
     * Support `prefers-reduced-motion` (skip scale/position transitions or use gentle fade).
3. **Wire Dual Access Triggers (R4)**:
   - **Trigger A**: In `src/components/projects/PS5Projects.jsx`, accept `onOpenArchitecture` prop. On `.ps5-play-btn` ("More information"), attach `onClick` passing `e.currentTarget.getBoundingClientRect()`.
   - **Trigger B**: In `src/components/desktop/Desktop.jsx`, add `pong-architecture` shortcut icon with `/assets/icons/unreal-engine.png`. Wire `onDoubleClick` (and mobile tap support) passing `e.currentTarget.getBoundingClientRect()`.
   - Maintain modal state (`isOpen`, `originRect`, `zIndex`) in `Desktop.jsx` and render `<MarkdownModal />`.
4. **Build & Lint Verification**:
   - Run `npm run lint` (`oxlint`). Must pass with 0 errors.
   - Run `npm run build` (`vite build`). Must compile bundle with 0 errors.
5. **Output**:
   Write handoff report to `handoff.md` and notify orchestrator using `send_message`.
