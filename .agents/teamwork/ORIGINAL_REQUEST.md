# Original User Request

## 2026-10-14T19:53:33Z

# Teamwork Project Prompt

> Requested team: Multi-agent team with explicit role routing: Technical Writer (Claude Sonnet / ponytail), Frontend Architect (Claude Opus), Frontend Implementation & Motion (Gemini Flash High / impeccable / gsap), QA / Tester (Gemini Flash Low).

Build a "More Information" markdown viewer modal for the React OS-themed portfolio, presenting a highly technical architecture deep-dive of the UE5 Pong-Project extracted from repository code/graphify data and the 2025 CV, animated with GSAP spring physics matching the existing desktop aesthetic. Ensure the technical writer hands off the markdown file to the frontend engineer for testing.

Working directory: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io`
Integrity mode: development

## Worker Model Routing & Assignments

1. **Technical Writer (R1)**: Claude 3.7 / 5.5 Sonnet (Medium Effort)
   - Task: Analyze `/home/faiber/Desktop/Faiber/Pong-Project` (`ARythmPaddle`, `AMusicPlayer`, `BallGenerator`, Quartz/JSON flow) and cross-reference with `/home/faiber/Desktop/IngesoftV/Faiber/Faiber_Piedrahita_CV_2025.docx`.
   - Output: Save the comprehensive architectural deep dive to `src/data/pong-architecture.md`. Use the installed `ponytail` skill for high-signal, zero-bloat technical writing.

2. **Frontend Architecture & Component Design (R2 & R4)**: Claude 5.5 Opus (Medium Effort)
   - Task: Design the modal component hierarchy, dynamic markdown loader, and state management.
   - Dual Access Triggers (R4):
     - Trigger A: Primary "More information" button inside the active Projects Catalog window (`src/components/projects/PS5Projects.jsx`).
     - Trigger B: Double-clicking the project icon or folder shortcut on the OS desktop (`src/components/desktop/Desktop.jsx`).

3. **Frontend Implementation & Motion (R3)**: Gemini 3.8 Flash (High Effort)
   - Task: Implement the JSX and CSS matching `src/index.css`.
   - Apply the installed `impeccable` skill for strict aesthetic parity (retro title bars, window controls, code syntax theme).
   - Apply `@gsap/react` using `gsap-react`, `gsap-core`, and `gsap-performance` skills to animate the modal mounting with a subtle spring/back-out curve originating from the trigger button.

4. **QA / Tester**: Gemini 3.8 Flash (Low Effort)
   - Task: Verify build integrity (`npm run build`), linting (`npm run lint`), markdown rendering, and responsive drag/close behavior.

## Requirements

### R1. Technical Deep-Dive Architecture Markdown
Extract and compose an in-depth technical markdown document analyzing the UE5 Pong-Project architecture located at `/home/faiber/Desktop/Faiber/Pong-Project` using project code and graphify tool output, cross-referenced with relevant experience from `/home/faiber/Desktop/IngesoftV/Faiber/Faiber_Piedrahita_CV_2025.docx`. Detail gameplay loops, rhythm paddle mechanics (`ARythmPaddle`), audio synchronization (`AMusicPlayer`), ball generation (`BallGenerator`), and Quartz/JSON event flows. Save directly to `src/data/pong-architecture.md`.

### R2. OS-Themed Markdown Modal Component
Create a reusable OS-window markdown modal component utilizing `react-markdown` (and any required styling/syntax plugins) styled to strictly match the OS desktop aesthetic (consistent with `src/index.css` and existing window frames). The modal must provide retro title bars, close/minimize controls, clean typography, code block syntax styling, and proper scrolling.

### R3. GSAP Spring Physics Window Animation
Mount and unmount the modal window using `@gsap/react` and `gsap` (leveraging `gsap-react`, `gsap-core`, and `gsap-performance`), implementing a subtle spring/back-out curve originating from the trigger button that harmonizes with existing OS UI motion.

### R4. Dual Access Triggers & State Integration
Integrate state management to open the markdown modal from two locations:
1. Trigger A: Primary "More information" button inside the active Projects Catalog window (`src/components/projects/PS5Projects.jsx`).
2. Trigger B: Double-clicking the project icon or folder shortcut on the OS desktop (`src/components/desktop/Desktop.jsx`).

## Verification Resources & Commands

- Lint check: `npm run lint` (`oxlint`) must pass without errors.
- Build check: `npm run build` (`vite build`) must build the production bundle without errors.
- Content verification: Check that `src/data/pong-architecture.md` exists, contains the core UE5 Pong-Project architectural components, and is dynamically rendered by the new component without React runtime warnings or hydration errors.

## Acceptance Criteria

### Content & Technical Depth
- [ ] `src/data/pong-architecture.md` exists and contains detailed technical analysis of UE5 Pong-Project (`ARythmPaddle`, `AMusicPlayer`, `BallGenerator`, Quartz/JSON event flows, and C++ gameplay loop).
- [ ] Incorporates relevant background and achievements from `Faiber_Piedrahita_CV_2025.docx`.
- [ ] Follows `ponytail` principles (high signal, clear structure, zero filler).

### UI, Motion & Integration
- [ ] `react-markdown`, `@gsap/react`, and `gsap` are properly installed and integrated.
- [ ] Modal window aesthetic strictly adheres to `src/index.css` (retro title bars, window controls, retro scrollbars, code block themes).
- [ ] Modal enters with spring physics / back-out curve originating from the trigger and exits cleanly with animation cleanup.
- [ ] Modal opens via Trigger A ("More information" button inside Projects Catalog) and Trigger B (double-clicking the desktop icon).
- [ ] Modal close button reliably closes and cleans up GSAP animations.

### Code Quality & Build Integrity
- [ ] `npm run build` succeeds with zero errors.
- [ ] `npm run lint` passes without introduced errors.
- [ ] Existing desktop and project preview features remain intact without regressions.
