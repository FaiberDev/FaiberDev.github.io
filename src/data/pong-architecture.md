# Data-Driven Rhythm Architecture (UE5 PingBall)
*Sample-Accurate, Framerate-Independent C++ Rhythm Gameplay System*

---

## 1. Executive Summary & System Overview

**PingBall** is an arcade-rhythm gameplay system built in **Unreal Engine 5 (C++)**. It fuses classic Pong mechanics with competitive rhythm game design (osu!, Beatmania IIDX). Rather than relying on traditional frame-dependent physics integration ($\Delta t$-based velocity stepping), PingBall implements a **closed-form parametric trajectory model** driven directly by Unreal Engine's **Quartz Audio DSP Subsystem**.

### Key Architectural Tenets
- **Framerate-Independent Determinism**: Ball trajectories are evaluated as a closed-form parametric function of audio beat time $\alpha(t)$, completely eliminating physics drift under frame spikes.
- **Dual-Rate Audio Synchronization**: Decouples discrete sample-accurate metronome events (Quartz audio thread) from continuous sub-beat tracking (game thread tick).
- **Subsystem Data Bus**: Employs `URhythmStoreSubsystem` (`UWorldSubsystem`) as a centralized, decoupled message broker with zero actor-to-actor pointer coupling.
- **5-Tier Graded Timing Windows**: Sub-millisecond hit evaluation spanning `Max` (≤45ms) to `Normal` (≤230ms), backed by a 50ms anti-mash cooldown state machine.
- **Osu!-Inspired 1,000,000 Scoring Engine**: Normalized score model weighting 50% raw timing accuracy and 50% combo sustain.

```
                      +-----------------------------------+
                      |       Audio Hardware / DSP        |
                      +-----------------------------------+
                                        |
                                        v
                      +-----------------------------------+
                      |      UQuartzClockHandle (UE5)     |
                      |   Sample-Accurate Audio Metronome |
                      +-----------------------------------+
                         /                             \
     Discrete Quantization                              Continuous Clock
     (EQuartzCommandQuantization::Beat)                 (GetEstimatedRunTime)
                       /                                 \
                      v                                   v
+-------------------------------------------------------------------------+
|                  AAMusicPlayer (Audio Clock Driver)                     |
|  - Metronome Delegate: OnQuartzBeat()                                   |
|  - Continuous Sub-Beat: Tick() -> ExactCurrentBeat = AudioTime * BPS    |
+-------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------+
|                URhythmStoreSubsystem (UWorldSubsystem)                  |
|  Central Data Bus & Dynamic Multicast Delegates:                        |
|  - float CurrentBeat                                                    |
|  - FOnBeatEvent OnBeat                                                  |
|  - FOnBPMSet OnBPMSet                                                   |
+-------------------------------------------------------------------------+
        |                                   |                    |
        v                                   v                    v
+--------------------+            +--------------------+  +--------------------+
|   ABallGenerator   |            |       ABall        |  |    AARythmPaddle   |
| 4-Beat Look-Ahead  |            |  Parametric Lerp   |  | Spatial StrikeZone |
| Spawner Pipeline   |            |  Alpha in Tick()   |  | + Color Validation |
+--------------------+            +--------------------+  | + 5 Timing Windows |
        |                                   |             +--------------------+
        | Spawns with Exact TargetBeat     | Evaluates             |
        +---------------------------------->|                      v
                                            +------------->+-------------------+
                                             Hit / Miss    |   ABaseGameMode   |
                                                           | 1M Scoring Engine |
                                                           +-------------------+
```

### Graphify AST Structural Metrics
Static analysis of the C++ codebase via AST graph extraction reveals a modular topology consisting of **253 nodes**, **353 dependency edges**, and **11 functional communities**:
- `AARythmPaddle` (Degree 46): Player pawn, Enhanced Input bindings, material state, spatial strike zone, and 5-tier window cascade.
- `ABall` (Degree 29): Parametric lerp controller, Niagara VFX bindings, and squash-and-stretch mesh interpolator.
- `URhythmStoreSubsystem` (Degree 20): Root world subsystem acting as the central rhythm message bus.
- `AAMusicPlayer` (Degree 18): Quartz audio clock driver and synchronization manager.
- `ABallGenerator` (Degree 18): In-editor thrower placement (`MakeEditWidget`) and 4-beat look-ahead dispatcher.
- `ABaseGameMode` (Degree 17): Chart parser bootloader and osu! 1,000,000 scoring pipeline.

---

## 2. Decoupled Rhythm Bus: `URhythmStoreSubsystem`

In Unreal Engine 5, managing time synchronization via level actors or `GameInstance` singletons introduces initialization race conditions and dangling pointers during world transitions. PingBall solves this by subclassing **`UWorldSubsystem`**.

```cpp
// Source/PingBall/RhythmStoreSubsystem.h
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "RhythmStoreSubsystem.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBeatEvent, int32, BeatNumber);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBPMSet, float, NewBPM);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBeatsPerBarSet, int32, NewBeatsPerBar);

UCLASS()
class PINGBALL_API URhythmStoreSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()

    float CurrentBeat = 0.0f;

public:
    UPROPERTY(BlueprintReadOnly, Category = "Rhythm Store")
    float CurrentBPM = 146.0f;

    UPROPERTY(BlueprintReadOnly, Category = "Rhythm Store")
    int32 TimeSignature = 4;

    UPROPERTY(BlueprintAssignable, Category = "Rhythm Store")
    FOnBeatEvent OnBeat;

    UPROPERTY(BlueprintAssignable, Category = "Rhythm Store")
    FOnBPMSet OnBPMSet;

    UPROPERTY(BlueprintAssignable, Category = "Rhythm Store")
    FOnBeatsPerBarSet OnBeatsPerBarSet;

    void SetBPM(float NewBPM);
    float GetBPM() const { return CurrentBPM; }

    int32 GetTimeSignature() const { return TimeSignature; }
    void SetTimeSignature(float inTimeSignature)
    {
        TimeSignature = inTimeSignature;
        OnBeatsPerBarSet.Broadcast(TimeSignature);
    }

    float GetCurrentBeat() const { return CurrentBeat; }
    void SetCurrentBeat(float InBeat) { CurrentBeat = InBeat; }
};
```

### Architectural Benefits
1. **Deterministic Lifecycle**: Subsystem lifetime is bounded by `UWorld`. It initializes automatically when the level loads and cleans up upon world teardown, preventing memory leaks and zombie delegates.
2. **Global Actor Discovery**: Any actor accesses the store in a single line without hard references or search overhead:
   ```cpp
   URhythmStoreSubsystem* Store = GetWorld()->GetSubsystem<URhythmStoreSubsystem>();
   ```
3. **Decoupled Event Broadcasting**: Actors subscribe dynamically (`AddDynamic`) without knowing the sender's class or memory address.

---

## 3. Audio DSP Engine & Clock Synchronization: `AAMusicPlayer`

Rhythm games face a fundamental engineering hurdle: **the audio rendering engine runs on a high-priority real-time DSP thread, while gameplay logic runs on the game thread subject to variable delta times**. Relying on `Tick(DeltaTime)` alone causes cumulative clock drift, while listening solely to discrete beat events yields choppy motion.

PingBall resolves this through a **dual-rate synchronization architecture**:

### 1. Discrete Sample-Accurate Metronome Quantization
During `BeginPlay()`, `AAMusicPlayer` initializes an Unreal Quartz clock handle (`UQuartzClockHandle`) and binds to the audio render thread's metronome quantization event:

```cpp
void AAMusicPlayer::StartClockAndAudio()
{
    if (!QuartzClockHandle) return;

    if (RhythmStore)
    {
        RhythmStore->OnBPMSet.AddDynamic(this, &AAMusicPlayer::OnBPMChanged);
        QuartzClockHandle->SetBeatsPerMinute(
            this, FQuartzQuantizationBoundary(), FOnQuartzCommandEventBP(),
            QuartzClockHandle, RhythmStore->GetBPM()
        );
    }
    QuartzClockHandle->StartClock(this, QuartzClockHandle);

    // Bind sample-accurate beat delegate
    FOnQuartzMetronomeEventBP BeatDelegate;
    BeatDelegate.BindDynamic(this, &AAMusicPlayer::OnQuartzBeat);
    QuartzClockHandle->SubscribeToQuantizationEvent(
        this, EQuartzCommandQuantization::Beat, BeatDelegate, QuartzClockHandle
    );

    // Start audio playback strictly on quantization boundary
    FQuartzQuantizationBoundary Boundary;
    Boundary.Quantization = EQuartzCommandQuantization::None;

    if (SoundWave && AudioComponent)
    {
        AudioComponent->SetSound(SoundWave);
        AudioComponent->PlayQuantized(this, QuartzClockHandle, Boundary, FOnQuartzCommandEventBP());
    }
}
```

### 2. Continuous Sub-Beat Game-Thread Tracking
To animate projectiles smoothly at 144+ FPS without waiting for the next discrete beat callback, `AAMusicPlayer::Tick` continuously samples the exact audio runtime and translates it to fractional beats:

$$\text{BPS} = \frac{\text{CurrentBPM}}{60.0}$$

$$\text{ExactCurrentBeat} = \text{RunningSeconds} \times \text{BPS}$$

```cpp
void AAMusicPlayer::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (!RhythmStore || !QuartzClockHandle) return;

    // 1. Query exact audio engine elapsed seconds (DSP clock)
    float RunningSeconds = QuartzClockHandle->GetEstimatedRunTime(this);

    // 2. Convert audio seconds into exact continuous fractional beats
    float CurrentBPM = RhythmStore->GetBPM();
    float BPS = CurrentBPM / 60.0f;
    float ExactCurrentBeat = RunningSeconds * BPS;

    // 3. Publish to the central data bus for all actors to consume
    RhythmStore->SetCurrentBeat(ExactCurrentBeat);
}
```

This guarantees zero drift between the audio speakers and visual actors over extended play sessions.

---

## 4. Player Pawn, Enhanced Input & 5-Tier Graded Timing Windows: `AARythmPaddle`

The player pawn (`AARythmPaddle`) is governed by an **Enhanced Input Mapping Context** handling horizontal paddle translation (mouse X) and three discrete chromatic strike actions.

### 1. Chromatic Lane Matching & Anti-Mash Cooldown
Each projectile (`ABall`) is assigned a chromatic index ($1 = \text{Red}$, $2 = \text{Green}$, $3 = \text{Blue}$). To strike a ball, the player must switch the paddle's dynamic material instance (`UMaterialInstanceDynamic`) to the matching color and press the strike trigger inside the strike zone.

To prevent hit-spamming, an anti-mash lockout is enforced via `FTimerHandle`:
```cpp
bCanHit = false;
GetWorldTimerManager().SetTimer(HitCooldownTimer, this, &AARythmPaddle::ResetHitCooldown, 0.05f, false); // 50ms lock
```

### 2. Spatial + Temporal Dual Gating
A purely spatial check fails under framerate variations (balls tunnel through hitboxes). A purely temporal check ignores lane positioning. PingBall employs a two-tier gate:
1. **Spatial Gate**: Queries `UBoxComponent* StrikeZone` ($100 \times 250 \times 100\,\text{uu}$) via `GetOverlappingActors`.
2. **Temporal Gate**: Computes $\Delta\text{Beat} = |\text{TargetBeat} - \text{CurrentBeat}|$ and evaluates against 5 graded windows.

```
       Incoming Ball Trajectory --->
  [================== STRIKE ZONE (Box Collision) ==================]
       |         |          |       |       |          |         |
     Miss     Normal      Good    Great  Perfect     Great     Normal     Miss
   (>230ms)  (≤230ms)   (≤180ms) (≤130ms) (≤90ms)   (≤130ms)  (≤230ms)  (>230ms)
                                    |
                             [ Max: ≤45ms ]
```

### 3. Timing Window Specifications

| Grade | Internal Property | Beat Delta ($\Delta\text{Beat}$) Threshold | Approx. Window (146 BPM) | Judgement Name | Base Accuracy Pts | Combo Multiplier Impact |
|:---|:---|:---|:---|:---|:---|:---|
| **Max** | `MaxWindow` | $\le 0.045$ beats | $\le 18.5\,\text{ms}$ | Rainbow 300 | 300 pts | Fixed at $1.00$ (Max bonus) |
| **Perfect** | `PerfectWindow` | $\le 0.090$ beats | $\le 37.0\,\text{ms}$ | Normal 300 | 300 pts | $-0.05$ penalty |
| **Great** | `GreatWindow` | $\le 0.130$ beats | $\le 53.4\,\text{ms}$ | Great 200 | 200 pts | $-0.20$ penalty |
| **Good** | `GoodWindow` | $\le 0.180$ beats | $\le 73.9\,\text{ms}$ | Good 100 | 100 pts | $-0.40$ penalty |
| **Normal** | `NormalWindow` | $\le 0.230$ beats | $\le 94.5\,\text{ms}$ | Normal 50 | 50 pts | $-0.60$ penalty |
| **Miss** | Fallback / Out of bounds | $> 0.230$ beats | $> 94.5\,\text{ms}$ | Miss | 0 pts | Multiplier resets to $0.0$, Combo broken |

### 4. Strike Evaluation Pipeline (`AARythmPaddle::AttemptHit`)

```cpp
void AARythmPaddle::AttemptHit()
{
    if (!bCanHit) return;

    URhythmStoreSubsystem* RhythmStore = GetWorld()->GetSubsystem<URhythmStoreSubsystem>();
    if (!RhythmStore) return;

    TArray<AActor*> OverlappingBalls;
    StrikeZone->GetOverlappingActors(OverlappingBalls, ABall::StaticClass());

    ABall* BestBall = nullptr;
    float SmallestOffset = 9999.0f;
    float CurrentBeat = RhythmStore->GetCurrentBeat();

    // 1. Candidate search: filter matching color and unhit balls
    for (AActor* Actor : OverlappingBalls)
    {
        if (ABall* Ball = Cast<ABall>(Actor))
        {
            if (Ball->BallColorIndex == CurrentColorIndex && !Ball->bWasHit)
            {
                float Offset = FMath::Abs(Ball->TargetBeat - CurrentBeat);
                if (Offset < SmallestOffset)
                {
                    SmallestOffset = Offset;
                    BestBall = Ball;
                }
            }
        }
    }

    // 2. Cascading temporal evaluation (tightest to widest)
    if (BestBall)
    {
        if (SmallestOffset <= MaxWindow)
        {
            BestBall->TriggerPerfectHitSquish(EHitQuality::Max);
            if (GameMode) GameMode->RegisterHit(EHitQuality::Max);
            TriggerHitGlow(EHitQuality::Max);
        }
        else if (SmallestOffset <= PerfectWindow)
        {
            BestBall->TriggerPerfectHitSquish(EHitQuality::Perfect);
            if (GameMode) GameMode->RegisterHit(EHitQuality::Perfect);
            TriggerHitGlow(EHitQuality::Perfect);
        }
        else if (SmallestOffset <= GreatWindow)
        {
            BestBall->TriggerPerfectHitSquish(EHitQuality::Great);
            if (GameMode) GameMode->RegisterHit(EHitQuality::Great);
            TriggerHitGlow(EHitQuality::Great);
        }
        else if (SmallestOffset <= GoodWindow)
        {
            BestBall->TriggerPerfectHitSquish(EHitQuality::Good);
            if (GameMode) GameMode->RegisterHit(EHitQuality::Good);
            TriggerHitGlow(EHitQuality::Good);
        }
        else if (SmallestOffset <= NormalWindow)
        {
            BestBall->TriggerPerfectHitSquish(EHitQuality::Normal);
            if (GameMode) GameMode->RegisterHit(EHitQuality::Normal);
            TriggerHitGlow(EHitQuality::Normal);
        }
        else
        {
            if (GameMode) GameMode->RegisterHit(EHitQuality::Miss);
        }
    }
    else
    {
        // Active miss: Empty air strike or wrong paddle color
        if (GameMode) GameMode->RegisterHit(EHitQuality::Miss);
    }

    // 3. Engage anti-mash cooldown
    bCanHit = false;
    GetWorldTimerManager().SetTimer(HitCooldownTimer, this, &AARythmPaddle::ResetHitCooldown, 0.05f, false);
}
```

---

## 5. Parametric Projectile Mechanics & Framerate Invariance: `ABall` & `ABallGenerator`

### 1. Mathematical Formulation for Projectile Trajectory
Traditional projectile movement relies on numeric integration:

$$\vec{P}_{t+\Delta t} = \vec{P}_t + \vec{V} \cdot \Delta t$$

Under variable delta times ($\Delta t$), rounding errors accumulate, causing note arrival times to drift relative to the audio track. PingBall replaces this with a **closed-form parametric interpolation**:

$$\alpha(t) = \max\left(0.0, \; \frac{\text{CurrentBeat}(t) - \text{SpawnBeat}}{\text{TargetBeat} - \text{SpawnBeat}}\right)$$

$$\vec{P}(t) = \text{Lerp}(\vec{P}_{\text{start}}, \; \vec{P}_{\text{target}}, \; \alpha(t)) = (1 - \alpha(t))\vec{P}_{\text{start}} + \alpha(t)\vec{P}_{\text{target}}$$

When $\alpha(t) = 1.0$, the ball arrives at the strike zone with mathematical precision at the exact audio beat.

```cpp
// Source/PingBall/Ball/Ball.cpp
void ABall::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // 1. Squash-and-stretch mesh interpolation
    FVector CurrentScale = GetActorScale3D();
    if (!CurrentScale.Equals(TargetScale, 0.01f))
    {
        FVector NewScale = FMath::VInterpTo(CurrentScale, TargetScale, DeltaTime, ScaleInterpSpeed);
        SetActorScale3D(NewScale);
    }

    // 2. Closed-form parametric position update
    if (!bWasHit)
    {
        float CurrentBeat = RhythmStore->GetCurrentBeat();
        float RawAlpha = (CurrentBeat - SpawnBeat) / (TargetBeat - SpawnBeat);
        float Alpha = FMath::Max(0.0f, RawAlpha);

        FVector NewLocation = FMath::Lerp(StartLocation, TargetLocation, Alpha);
        SetActorLocation(NewLocation);

        // Passive miss: Ball travels past paddle without hit
        if (Alpha >= 1.2f)
        {
            ABaseGameMode* GameMode = Cast<ABaseGameMode>(GetWorld()->GetAuthGameMode());
            if (GameMode && !bWasHit)
            {
                GameMode->RegisterHit(EHitQuality::Miss);
            }
            Destroy();
        }
    }
}
```

### 2. Look-Ahead Spawner Scheduling (`ABallGenerator`)
Notes cannot spawn at the moment they must be struck. `ABallGenerator` listens to `URhythmStoreSubsystem::OnBeat` and implements a **4-beat lookahead window**:

$$\text{TargetBeatNumber} = \text{CurrentAbsoluteBeat} + \text{LookAheadOffset} \quad (\text{LookAheadOffset} = 4)$$

When `OnBeat` triggers:
1. Spawner queries `BeatMap` for notes matching `TargetBeatNumber`.
2. Queries the spawn thrower transform (`Throwers[Note.ChosenThrower]`).
3. Instantiates `ABall` and passes:
   $$\text{ExactSpawnBeat} = \text{Store}->\text{GetCurrentBeat}()$$
   $$\text{ExactTargetBeat} = \text{ExactSpawnBeat} + \text{LookAheadOffset}$$

```cpp
// Source/PingBall/Ball/BallGenerator.cpp
void ABallGenerator::GetBeatFromStore(int32 BeatNumber)
{
    CurrentAbsoluteBeat++;
    int32 TargetBeatNumber = CurrentAbsoluteBeat + LookAheadOffSet;

    if (TargetBeatNumber >= 1)
    {
        LookAheadForNextBeat(TargetBeatNumber);
    }
}
```

### 3. Tactile Impact Feedback (`TriggerPerfectHitSquish`)
Upon receiving a valid strike:
- Disables collision immediately (`SetActorEnableCollision(false)`) to prevent multiple hits.
- Sets `TargetScale = FVector(0,0,0)` with interpolation speed $20.0$, collapsing the mesh into a snappy visual implosion.
- Broadcasts `OnBallHit.Broadcast(HitType)` to trigger Niagara particle bursts.
- Sets actor lifespan to $1.0\,\text{s}$ for clean memory reclamation.

---

## 6. Competitive Scoring Engine: `ABaseGameMode`

`ABaseGameMode` implements a **normalized 1,000,000-point scoring model** inspired by competitive rhythm simulators (osu!mania, Chunithm).

### 1. Mathematical Formulation
Total score is partitioned into **50% Raw Accuracy** and **50% Combo Multiplier**:

$$\text{MaxScorePerNote} = \frac{1,000,000}{N_{\text{total}}}$$

$$\text{Score}_{\text{note}} = \left(\text{MaxScorePerNote} \times 0.5 \times W_{\text{acc}}\right) + \left(\text{MaxScorePerNote} \times 0.5 \times M_{\text{bonus}}\right)$$

### 2. Weight Distribution by Hit Quality

| Judgement Grade | Accuracy Weight ($W_{\text{acc}}$) | Bonus Multiplier Step ($\Delta M_{\text{bonus}}$) | Accuracy Points Added | Combo Counter |
|:---|:---|:---|:---|:---|
| **Max (Rainbow 300)** | $1.00$ | Reset to $1.00$ (Full bonus) | $+300$ | Increment ($+1$) |
| **Perfect (Normal 300)** | $1.00$ | $-0.05$ | $+300$ | Increment ($+1$) |
| **Great (200)** | $0.66$ | $-0.20$ | $+200$ | Increment ($+1$) |
| **Good (100)** | $0.33$ | $-0.40$ | $+100$ | Increment ($+1$) |
| **Normal (50)** | $0.16$ | $-0.60$ | $+50$ | Increment ($+1$) |
| **Miss (0)** | $0.00$ | Reset to $0.00$ | $+0$ | Reset to $0$ |

### 3. Cumulative Accuracy Percentage

$$\text{Accuracy}_{\text{cumulative}} = \left(\frac{\text{ActualAccuracyPoints}}{N_{\text{evaluated}} \times 300}\right) \times 100\%$$

```cpp
// Source/PingBall/GameMode/BaseGameMode.cpp
void ABaseGameMode::RegisterHit(EHitQuality HitQuality)
{
    if (TotalNotes == 0) return;

    float AccuracyWeight = 0.0f;
    bool bComboBroken = false;

    switch (HitQuality)
    {
        case EHitQuality::Max:
            AccuracyWeight = 1.0f;
            BonusMultiplier = 1.0f;
            CurrentCombo++;
            ActualAccuracyPoints += 300;
            break;
        case EHitQuality::Perfect:
            AccuracyWeight = 1.0f;
            BonusMultiplier -= 0.05f;
            CurrentCombo++;
            ActualAccuracyPoints += 300;
            break;
        case EHitQuality::Great:
            AccuracyWeight = 0.66f;
            BonusMultiplier -= 0.20f;
            CurrentCombo++;
            ActualAccuracyPoints += 200;
            break;
        case EHitQuality::Good:
            AccuracyWeight = 0.33f;
            BonusMultiplier -= 0.40f;
            CurrentCombo++;
            ActualAccuracyPoints += 100;
            break;
        case EHitQuality::Normal:
            AccuracyWeight = 0.16f;
            BonusMultiplier -= 0.60f;
            CurrentCombo++;
            ActualAccuracyPoints += 50;
            break;
        case EHitQuality::Miss:
            AccuracyWeight = 0.0f;
            bComboBroken = true;
            break;
    }

    MaxPossibleAccuracyPoints += 300;

    // Combo management
    if (bComboBroken)
    {
        CurrentCombo = 0;
        BonusMultiplier = 0.0f;
    }
    else
    {
        if (CurrentCombo > MaxCombo) MaxCombo = CurrentCombo;
        BonusMultiplier = FMath::Clamp(BonusMultiplier, 0.0f, 1.0f);
    }

    // 1-Million normalization calculus
    float MaxScorePerNote = 1000000.0f / (float)TotalNotes;
    float BaseScoreGained = (MaxScorePerNote * 0.5f) * AccuracyWeight;
    float BonusScoreGained = (MaxScorePerNote * 0.5f) * BonusMultiplier;

    InternalFloatScore += (BaseScoreGained + BonusScoreGained);
    TotalScore = FMath::RoundToInt32(InternalFloatScore);
    CurrentAccuracy = ((float)ActualAccuracyPoints / (float)MaxPossibleAccuracyPoints) * 100.0f;

    // Broadcast state for decoupled UI
    OnScoreUpdated.Broadcast(TotalScore, CurrentCombo, CurrentAccuracy);
}
```

---

## 7. Chart Parsing & Beatmap Pipeline: `URhythmChartParser` & `kamisama.json`

Charts are authored in external Digital Audio Workstations (DAW) or MIDI editors and exported as JSON beatmaps. The parser loads and deserializes these charts during game initialization.

### 1. Beatmap Ingestion Flow

```
[ DAW / MIDI File ] ---> [ Tone.js / Custom JSON Exporter ]
                                      |
                                      v
                          [ Content/Data/kamisama.json ]
                                      |
                                      v
                          [ URhythmChartParser::ParseChart() ]
                           - Extract BPM & Time Signature
                           - Convert Note Timestamps to Beat Indices
                           - Route MIDI Pitches to Thrower Lanes
                                      |
                                      v
                          [ ABallGenerator::BeatMap ]
                           Array of FBeatMapNote structs
```

### 2. Conversion Formula: Seconds to Absolute Beats
MIDI note timestamps in seconds ($t_{\text{sec}}$) are mapped to discrete integer beat units:

$$\text{CalculatedBeat} = \text{RoundToInt}\left(\frac{t_{\text{sec}} \times \text{BPM}}{60.0}\right)$$

### 3. Chromatic Pitch Routing
Pitches are assigned to spatial thrower lanes:
- **MIDI 40 (`E2`)** $\rightarrow$ Lane 0 (Left thrower)
- **MIDI 41 (`F2`)** $\rightarrow$ Lane 1 (Center thrower)
- **MIDI 43 (`G2`)** $\rightarrow$ Lane 2 (Right thrower)

```cpp
// Source/PingBall/Utilities/RhythmChartParser.cpp
void URhythmChartParser::GiveChartToBallGenerator(
    TSharedPtr<FJsonObject> RootObject,
    TArray<FBeatMapNote>& OutBeatMap,
    float OutBPM)
{
    const TArray<TSharedPtr<FJsonValue>>* TracksArray;
    if (RootObject->TryGetArrayField(TEXT("tracks"), TracksArray))
    {
        OutBeatMap.Empty();
        for (const auto& TrackVal : *TracksArray)
        {
            TSharedPtr<FJsonObject> TrackObj = TrackVal->AsObject();
            const TArray<TSharedPtr<FJsonValue>>* NotesArray;

            if (TrackObj->TryGetArrayField(TEXT("notes"), NotesArray) && NotesArray->Num() > 0)
            {
                for (const auto& NoteVal : *NotesArray)
                {
                    TSharedPtr<FJsonObject> NoteObj = NoteVal->AsObject();
                    double TimeInSeconds = NoteObj->GetNumberField(TEXT("time"));
                    int32 MidiNote = NoteObj->GetIntegerField(TEXT("midi"));

                    int32 CalculatedBeat = FMath::RoundToInt((TimeInSeconds * OutBPM) / 60.0);

                    int32 ThrowerIndex = 0;
                    switch (MidiNote)
                    {
                        case 40: ThrowerIndex = 0; break; // E2 -> Left Lane
                        case 41: ThrowerIndex = 1; break; // F2 -> Center Lane
                        case 43: ThrowerIndex = 2; break; // G2 -> Right Lane
                        default: ThrowerIndex = 0; break;
                    }

                    FBeatMapNote NewNote;
                    NewNote.BeatToSpawn = CalculatedBeat;
                    NewNote.ChosenThrower = ThrowerIndex;
                    OutBeatMap.Add(NewNote);
                }
            }
        }
    }
}
```

---

## 8. Author Background & Theoretical Foundations

The architecture of PingBall is a direct reflection of **Faiber Piedrahita Perlaza's** academic training and systems engineering focus at **Universidad Icesi** (Cali, Colombia):

- **Applied Mathematics III (*Matemáticas Aplicadas III*)**:
  The course's emphasis on numerical analysis, linear algebra, and mathematical optimization provided the theoretical foundation for PingBall's **parametric time-lerp interpolation** $\alpha(t)$ and normalized **1,000,000-point scoring calculus**. Rather than relying on non-deterministic physics stepping, the gameplay loops are framed as closed-form functions of continuous audio time.
- **Discrete Computation & Formal Structures II (*Computación y Estructuras Discretas II*)**:
  The formalization of deterministic finite state automata (DFA), formal grammars, and decidability directly informs the **chart parser**, the **quantized note event queues**, and the **5-tier graded timing window classifier**.
- **Software Engineering & Design Patterns (*Proyecto Integrador*)**:
  The separation of concerns between `URhythmStoreSubsystem` (event broker), `AAMusicPlayer` (hardware clock driver), and `AARythmPaddle` (input consumer) demonstrates adherence to modern decoupled software architecture, eliminating fragile actor coupling and race conditions.

---

## 9. Architectural Takeaways & Future Work

| Architectural Dimension | PingBall Implementation | Industry Standard Comparison |
|:---|:---|:---|
| **Audio Synchronization** | Dual-rate Quartz DSP clock + continuous sub-beat game-thread tick | Superior to wall-clock `GetGameTimeSinceCreation()`; matches Beatmania IIDX / StepMania |
| **Projectile Motion** | Closed-form parametric beat lerp $\vec{P}(\alpha)$ | Framerate-independent; immune to physics drift or delta-time variance |
| **State Coupling** | `UWorldSubsystem` event bus with dynamic multicast delegates | Zero actor pointers; cleanly outclasses GameInstance singletons |
| **Hit Detection** | Spatial bounding box intersection + temporal sub-millisecond offset gating | Eliminates false-positives from hitbox expansion or clipping |

*Note: Future iterations include integrating procedural MIDI import via libremidi and extending UMG HUD layers with real-time accuracy radial graphs.*
