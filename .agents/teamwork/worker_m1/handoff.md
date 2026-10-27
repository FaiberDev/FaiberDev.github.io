# Handoff Report: Milestone 1 (Technical Architecture Deep-Dive Document)

**Author**: Worker 1 (Technical Writer)  
**Role**: implementer, qa, specialist  
**Working Directory**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/worker_m1/`  
**Target File**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/src/data/pong-architecture.md`  
**Downstream Recipient**: Frontend Architect (Claude Opus / Worker M2) & Implementation (Worker M3)  
**Date**: 2026-10-14T20:06:00Z  

---

## 1. Observation

1. **Source Code & Architecture Evidence**:
   - Central bus: `Source/PingBall/RhythmStoreSubsystem.h` declares `URhythmStoreSubsystem : public UWorldSubsystem` with `float CurrentBeat`, `float CurrentBPM = 146.0f`, `int32 TimeSignature = 4`, and dynamic multicast delegates `FOnBeatEvent OnBeat`, `FOnBPMSet OnBPMSet`, `FOnBeatsPerBarSet OnBeatsPerBarSet`.
   - Audio Clock: `Source/PingBall/MusicPlayer/AMusicPlayer.cpp` implements dual-rate synchronization:
     - Discrete metronome callback: `QuartzClockHandle->SubscribeToQuantizationEvent(this, EQuartzCommandQuantization::Beat, BeatDelegate, QuartzClockHandle)` broadcasting `OnBeat`.
     - Continuous game-thread clock in `Tick(float DeltaTime)`: `float RunningSeconds = QuartzClockHandle->GetEstimatedRunTime(this)`, `float ExactCurrentBeat = RunningSeconds * (CurrentBPM / 60.0f)`, stored via `RhythmStore->SetCurrentBeat(ExactCurrentBeat)`.
   - Player Pawn & Striker: `Source/PingBall/Player/ARythmPaddle.cpp` implements:
     - Strike zone: `UBoxComponent* StrikeZone` with spatial query `StrikeZone->GetOverlappingActors()`.
     - Color filtering: `Ball->BallColorIndex == CurrentColorIndex && !Ball->bWasHit`.
     - Timing window cascade: `MaxWindow` (0.045f), `PerfectWindow` (0.090f), `GreatWindow` (0.130f), `GoodWindow` (0.180f), `NormalWindow` (0.230f), fallback `Miss`.
     - Anti-mash lockout: `bCanHit = false; GetWorldTimerManager().SetTimer(HitCooldownTimer, this, &AARythmPaddle::ResetHitCooldown, 0.05f, false)`.
   - Ball Projectile & Spawner:
     - `Source/PingBall/Ball/Ball.cpp`: Parametric interpolation `RawAlpha = (CurrentBeat - SpawnBeat) / (TargetBeat - SpawnBeat)`, `NewLocation = FMath::Lerp(StartLocation, TargetLocation, Alpha)`, passive miss at `Alpha >= 1.2f`.
     - `Source/PingBall/Ball/BallGenerator.cpp`: 4-beat lookahead `int32 TargetBeatNumber = CurrentAbsoluteBeat + LookAheadOffSet; (LookAheadOffSet = 4)`.
   - Scoring Engine: `Source/PingBall/GameMode/BaseGameMode.cpp`: osu!-inspired 1,000,000 model: `MaxScorePerNote = 1000000.0f / (float)TotalNotes`, `BaseScoreGained = (MaxScorePerNote * 0.5f) * AccuracyWeight`, `BonusScoreGained = (MaxScorePerNote * 0.5f) * BonusMultiplier`.
   - Chart Parser: `Source/PingBall/Utilities/RhythmChartParser.cpp`: converts `kamisama.json` (146 BPM) timestamps to beats `FMath::RoundToInt((TimeInSeconds * OutBPM) / 60.0)` and maps MIDI 40 (`E2`), 41 (`F2`), 43 (`G2`) to thrower lanes 0, 1, 2.
   - Author CV: `Faiber_Piedrahita_CV_2025.docx` validates Faiber Piedrahita's background in Software Engineering at Universidad Icesi, highlighting Applied Mathematics III (numerical analysis, optimization, continuous interpolation) and Discrete Computation II (state automata, formal grammars).

2. **Artifact Generation & Validation**:
   - `src/data/pong-architecture.md` was created with 632 lines and 28,636 bytes.
   - Linter command `npm run lint` exited with return code `0` (0 errors).
   - Build command `npm run build` completed with return code `0` (`✓ built in 192ms`, 43 modules transformed).

---

## 2. Logic Chain

1. **Adherence to Ponytail Style**:
   - The document avoids promotional fluff, conversational filler, or pseudo-technical generalizations.
   - Each section directly pairs architectural theory with verbatim C++ signatures, exact mathematical formulas, and concrete structural ASCII diagrams.
2. **Technical Depth & Correctness**:
   - Every formula ($\alpha(t)$ lerp, dual-weighted osu! 1M score, sample-accurate BPS conversion) reflects the exact logic from the C++ source files.
   - Structural bridge from Quartz audio DSP thread to `UWorldSubsystem` to game actors provides a clean reference for why the architecture is framerate-independent and drift-free.
3. **Downstream Integration Readiness**:
   - The file is placed exactly at `src/data/pong-architecture.md` per `PROJECT.md` and `DISPATCH.md`.
   - It is compatible with Vite's synchronous raw asset importer (`import pongArchitectureRaw from '../../data/pong-architecture.md?raw'`) and standard GitHub-Flavored Markdown renderers (`react-markdown`, `remark-gfm`, `rehype-highlight`).

---

## 3. Caveats

1. **Mermaid Rendering Plugin**:
   - The document utilizes a clean, standard ASCII architecture diagram and standard Markdown tables/syntax blocks to ensure it renders flawlessly whether or not a dedicated Mermaid runtime plugin is enabled in `react-markdown`.
2. **Prototype Scope**:
   - The document accurately identifies that PingBall is an architectural gameplay prototype (`miau` branch) with one production chart (`kamisama.json`) and no automated editor or in-game UMG results screen.
3. **No Caveats on Content**:
   - All 10 requirements outlined in `DISPATCH.md` and `PROJECT.md` have been fully authored and verified.

---

## 4. Conclusion

Milestone 1 is **COMPLETE**. `src/data/pong-architecture.md` provides an exhaustive, mathematically rigorous, and high-signal architectural breakdown of the UE5 PingBall project and its alignment with Faiber Piedrahita's software engineering credentials. The document is verified, passes all build checks, and is ready for immediate consumption by Milestone 2 (Frontend Architecture) and Milestone 3 (Modal Component & Motion Implementation).

---

## 5. Verification Method

To independently verify the outputs of Milestone 1:

1. **Verify File Existence and Line Count**:
   ```bash
   wc -l /home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/src/data/pong-architecture.md
   # Expected: 632 lines
   ```

2. **Verify Node.js Readability**:
   ```bash
   node -e "
   const fs = require('fs');
   const text = fs.readFileSync('src/data/pong-architecture.md', 'utf8');
   console.assert(text.includes('URhythmStoreSubsystem'), 'Missing URhythmStoreSubsystem');
   console.assert(text.includes('AAMusicPlayer'), 'Missing AAMusicPlayer');
   console.assert(text.includes('AARythmPaddle'), 'Missing AARythmPaddle');
   console.assert(text.includes('MaxWindow = 0.045f'), 'Missing MaxWindow');
   console.assert(text.includes('1,000,000'), 'Missing 1M scoring');
   console.log('Verification assertions passed!');
   "
   ```

3. **Verify Linter and Production Build**:
   ```bash
   npm run lint
   # Expected: 0 errors
   npm run build
   # Expected: vite build completes with exit code 0
   ```
