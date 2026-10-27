# Project: UE5 Pong-Project Markdown Modal & OS Integration

## Architecture
- **Content Layer**: `src/data/pong-architecture.md` (COMPLETE & VERIFIED)
  - Authored using `ponytail` skill (high signal, zero bloat, 632 lines).
  - Contains full technical deep-dive of UE5 Pong-Project (PingBall):
    - Central Rhythm Bus: `URhythmStoreSubsystem` (inherits `UWorldSubsystem`, dynamic multicast delegates: `OnBeat`, `OnBPMSet`, `OnBeatsPerBarSet`).
    - Audio Clock & Quantization: `AAMusicPlayer` (dual-rate synchronization: continuous fractional beat calculation in `Tick()`, discrete metronome quantization via Quartz `SubscribeToQuantizationEvent`).
    - Player Pawn & Timing Windows: `AARythmPaddle` (Enhanced Input, 3-color switching, 50ms anti-mash cooldown, 5-tier graded timing windows: Max ≤45ms to Normal ≤230ms, exact beat deltas 0.045f to 0.230f).
    - Ball Actor & Parametric Lerp: `ABall` (framerate-independent movement via $\alpha = \frac{\text{CurrentBeat} - \text{SpawnBeat}}{\text{TargetBeat} - \text{SpawnBeat}}$, squash-and-stretch hit feedback, passive miss threshold $\alpha \ge 1.2$).
    - Look-Ahead Spawner: `ABallGenerator` (look-ahead offset = 4 beats, spatial thrower transforms).
    - Scoring Engine: `ABaseGameMode` (osu!-inspired 1,000,000 total score formula, 50% accuracy / 50% combo weighting).
    - Chart Parser: `URhythmChartParser` & `kamisama.json` (146 BPM, 3-lane mapping).
    - Author Credentials: Faiber Piedrahita Perlaza (Universidad Icesi, Applied Math III numerical calculus, Discrete Computation formal automata).
- **Component Architecture**:
  - `src/components/modal/MarkdownModal.jsx` & `src/components/modal/MarkdownModal.css`
  - Raw markdown bundling: `import pongArchitectureRaw from '../../data/pong-architecture.md?raw'` (Vite 8 synchronous raw loader).
  - Markdown parser: `react-markdown` with `remark-gfm` and `rehype-highlight`.
  - Retro window frame matching `src/index.css` (`.window`, `.window-header`, `.win-btn`, custom retro frosted glass scrollbar, syntax-highlighted code blocks).
- **Motion & Physics Engine**:
  - `gsap` & `@gsap/react` (`useGSAP`).
  - Spring entrance originating from trigger bounding box (`originRect`), calculating `deltaX`, `deltaY`, `scaleStart`.
  - Easing: `back.out(1.4)` on entrance, `clearProps: 'transform'` upon completion.
  - Smooth unmount exit: `contextSafe` executing `power2.in` reverse tween before `onClose` triggers unmount.
  - Accessibility: `prefers-reduced-motion` detection.
- **Dual Access Triggers**:
  - Trigger A: "More information" button inside `src/components/projects/PS5Projects.jsx` (`.ps5-play-btn`) passing `e.currentTarget.getBoundingClientRect()`.
  - Trigger B: Double-clicking the Pong project icon on the OS desktop in `src/components/desktop/Desktop.jsx` using `/assets/icons/unreal-engine.png`.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | C++ Architecture Extraction | Analyze `URhythmStoreSubsystem`, `AAMusicPlayer`, `AARythmPaddle`, `ABall`, `ABallGenerator`, `ABaseGameMode`, `URhythmChartParser` | M1 | Survey 1 | DONE |
| 2 | Quartz Dual-Rate Synchronization | Document audio DSP clock vs game thread continuous beat tracking in `AAMusicPlayer` | M1 | Survey 1 | DONE |
| 3 | 5-Tier Graded Timing Windows | Document Max (45ms), Perfect (90ms), Great (130ms), Good (180ms), Normal (230ms), Miss | M1 | Survey 1 | DONE |
| 4 | Osu! 1,000,000 Scoring Formula | Document 50% accuracy / 50% combo score calculus and combo break mechanics | M1 | Survey 1 | DONE |
| 5 | Parametric Beat Lerp & Look-Ahead Spawner | Document $\alpha = (\text{CurrentBeat} - \text{SpawnBeat}) / (\text{TargetBeat} - \text{SpawnBeat})$ and 4-beat lookahead | M1 | Survey 1 | DONE |
| 6 | Author Qualifications Integration | Cross-reference Faiber Piedrahita's CV (Universidad Icesi, Applied Math III, Discrete Computation) | M1 | Survey 1 / CV | DONE |
| 7 | High-Signal Markdown Authoring | Write `src/data/pong-architecture.md` adhering strictly to `ponytail` skill principles | M1 | R1 | DONE |
| 8 | Package Installation | Install `react-markdown`, `gsap`, `@gsap/react`, `rehype-highlight`, `remark-gfm` cleanly | M2/M3 | Survey 3 / R2/R3 | PLANNED |
| 9 | OS-Themed Modal Component Structure | Create `src/components/modal/MarkdownModal.jsx` matching retro OS window hierarchy | M2/M3 | Survey 2/3 / R2 | PLANNED |
| 10 | Retro Window Styling & Code Theme | Style modal in `src/components/modal/MarkdownModal.css` with frosted glass tokens, scrollbars, and syntax highlighting | M3 | Survey 2/3 / R2 | PLANNED |
| 11 | Synchronous Raw Markdown Loader | Load `pong-architecture.md` via Vite 8 `?raw` loader with zero network latency | M3 | Survey 3 / R2 | PLANNED |
| 12 | GSAP Spring Origin Animation | Animate window from trigger element bounding box using `back.out(1.4)` and `@gsap/react` | M3 | Survey 3 / R3 | PLANNED |
| 13 | Smooth Exit Animation & Cleanup | Intercept close button with `contextSafe` `power2.in` exit tween before unmount | M3 | Survey 3 / R3 | PLANNED |
| 14 | Trigger A: Projects Catalog Button | Wire `PS5Projects.jsx` "More information" button with click handler passing `originRect` | M3 | Survey 2 / R4 | PLANNED |
| 15 | Trigger B: Desktop Shortcut Double-Click | Add UE5 icon to `Desktop.jsx` with `onDoubleClick` event passing `originRect` | M3 | Survey 2 / R4 | PLANNED |
| 16 | Oxlint & Vite Build Verification | Ensure `npm run lint` and `npm run build` pass with 0 errors and no regressions | M4 | QA / Acceptance | PLANNED |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | Scope Survey | Deep survey of Pong-Project, CV, and Frontend repo | none | DONE |
| 1 | Technical Architecture Markdown (R1) | Author `src/data/pong-architecture.md` using ponytail | M0 | DONE |
| 2 | Frontend Component Design (R2 & R4) | Modal component hierarchy, state management, and trigger contracts | M0, M1 | DONE (Integrated in M3) |
| 3 | Frontend Implementation & Motion (R3 & R4) | Packages, Modal JSX/CSS, GSAP spring physics, Triggers A & B | M1 | IN_PROGRESS |
| 4 | QA Verification & Hardening | Oxlint, Vite build, markdown rendering, responsive & drag verification | M3 | PLANNED |

## Code Layout
- `src/data/pong-architecture.md`: Technical deep-dive markdown document.
- `src/components/modal/MarkdownModal.jsx`: Reusable OS markdown viewer modal with GSAP physics.
- `src/components/modal/MarkdownModal.css`: Retro styles, scrollbar styling, syntax highlighting tokens.
- `src/components/desktop/Desktop.jsx`: Desktop shortcuts, double-click handling, modal state.
- `src/components/projects/PS5Projects.jsx`: Projects catalog, Trigger A button handling.
- `package.json`: Dependencies (`gsap`, `@gsap/react`, `react-markdown`, `rehype-highlight`, `remark-gfm`).
