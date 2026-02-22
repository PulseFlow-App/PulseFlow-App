# Feature Specification: Pulse Mobile App

**Feature Branch**: `001-pulse-platform` 
**Created**: 2026-01-27 
**Status**: Draft 
**Platform**: Cross-platform mobile app (iOS 14+, Android 8.0+ API 26+)
**Framework**: React Native with Expo (primary), native modules where required

## Product Vision

Build **Pulse**, a data-first personal intelligence mobile app that converts fragmented lifestyle and body data into **clear, actionable daily signals**.

Pulse does **not** aim to diagnose, treat, or medicalize users. It helps users **understand patterns**, reduce decision fatigue, and adapt daily routines using AI.

> **Philosophy:**
> *No noise. Just signal.*
> One rhythm. One score. Personal context first.

## Core Thesis

People already generate massive amounts of personal data: food photos, workouts, smart scale metrics, sleep, mood, energy, lab results, notes, habits.

Pulse turns these **inputs into signals**, not charts.

At the center is a **Daily Pulse Score (0–100)**  - a personal, adaptive indicator of how aligned today is with the user's baseline and goals.

**Input**: User description: "Build Pulse, a data-first personal intelligence mobile app (iOS and Android) that allows users to submit everyday personal data (food photos, fridge contents, movement, body metrics, lifestyle inputs) and receive a single daily guidance signal called the Daily Pulse (0–100). The system helps users understand patterns and trends relative to their personal baseline, not generic benchmarks. The platform must avoid medical advice and focus on practical, non-clinical insights that reduce daily decision fatigue around food, movement, and recovery. Premium access is gated via token staking and unlocks advanced trend tracking, personal baseline modeling, multi-input reasoning, and unlimited AI requests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Personal Data and Receive Daily Pulse (Priority: P1)

A user submits their daily personal data (food photos, fridge contents, movement data, body metrics, lifestyle inputs) via the mobile app and receives a Daily Pulse score (0-100) that provides practical, non-clinical guidance for their wellness decisions.

**Why this priority**: This is the core value proposition of Pulse. Without the ability to submit data and receive the Daily Pulse, the platform has no primary function. This story establishes the fundamental user flow and must work independently.

**Independent Test**: Can be fully tested by having a user submit at least one type of personal data (food photo, fridge photo, movement, body metric, or lifestyle input) via the mobile app and receiving a Daily Pulse score with guidance. The test validates that data submission works, Daily Pulse calculation occurs, and guidance is presented without medical advice.

**Acceptance Scenarios**:

1. **Given** a user has created an account in the mobile app, **When** they submit a food photo using the camera, **Then** the system processes the image, extracts relevant data, and includes it in Daily Pulse calculation
2. **Given** a user has submitted multiple data types today via the mobile app, **When** they view their Daily Pulse, **Then** the system calculates and displays a score (0-100) with practical, non-clinical guidance, updated dynamically as data is added
3. **Given** a user submits movement data (manually or via HealthKit/Google Fit integration), **When** the system processes it, **Then** the data is stored and factored into Daily Pulse calculation
4. **Given** a user submits body metrics (weight, body composition, sleep, mood, energy), **When** the system processes them, **Then** the metrics are stored relative to their personal baseline (not generic benchmarks)
5. **Given** a user submits lifestyle inputs, **When** the system processes them, **Then** the inputs are stored and influence Daily Pulse guidance
6. **Given** a user views their Daily Pulse, **When** they see the score breakdown, **Then** they see minimal breakdown (Food / Movement / Recovery) with one sentence insight max per day

---

### User Story 1B - Fridge → Meals Feature (Priority: P1)

A user captures their fridge contents using the mobile app camera, receives ingredient detection via computer vision, and gets recipe suggestions using only detected items to help decide what to eat without going to the store.

**Why this priority**: Reduces decision fatigue around food choices by leveraging what's already available. This is a core differentiator that makes Pulse practical and actionable.

**Independent Test**: Can be fully tested by having a user take a photo of their fridge, verify ingredient detection, and receive recipe suggestions using only detected items. Test validates camera integration, computer vision processing, and goal-aware recipe filtering.

**Acceptance Scenarios**:

1. **Given** a user opens the Food section in the mobile app, **When** they tap "Scan Fridge" and capture a photo, **Then** the system detects ingredients via computer vision
2. **Given** ingredients are detected from fridge photo, **When** the user requests meal suggestions, **Then** the system generates recipes using only detected items, filtered by goals (energy, time, recovery)
3. **Given** a user receives meal suggestions, **When** they select a recipe, **Then** they can log the meal simply without calorie obsession UX
4. **Given** a user logs meals from fridge suggestions, **When** the system processes the data, **Then** it provides non-clinical nutrition insights (patterns, not prescriptions) that emphasize "what's possible now"
5. **Given** a premium user uses fridge → meals feature, **When** they request suggestions, **Then** they receive weekly adaptive meal suggestions based on personal nutrition patterns

---

### User Story 2 - View Personal Patterns and Trends (Priority: P2)

A user views their personal patterns and trends over time, seeing how their data relates to their personal baseline rather than generic benchmarks.

**Why this priority**: Understanding patterns is essential for users to make informed decisions. This story enables users to see the value of their data over time and understand their personal wellness trajectory.

**Independent Test**: Can be fully tested by having a user with at least 7 days of data view their patterns and trends. The test validates that trend visualization works, data is presented relative to personal baseline, and no generic benchmarks are shown.

**Acceptance Scenarios**:

1. **Given** a user has submitted data for at least 7 days, **When** they view their trends, **Then** the system displays patterns over time relative to their personal baseline
2. **Given** a user views their patterns, **When** they examine a specific time period, **Then** the system shows how their data points relate to their personal baseline (not generic population benchmarks)
3. **Given** a user has multiple data types, **When** they view trends, **Then** the system shows correlations and patterns across different data types
4. **Given** a user views their baseline, **When** they see how current data compares, **Then** the system clearly indicates deviations from their personal baseline

---

### User Story 3 - Access Premium Features via Token Staking (Priority: P2)

A user stakes tokens to unlock premium features including advanced trend tracking, personal baseline modeling, multi-input reasoning, and unlimited AI requests.

**Why this priority**: Premium features are a key differentiator and revenue mechanism. Users need a clear path to upgrade and understand what premium access provides. This story must work independently of the free tier.

**Independent Test**: Can be fully tested by having a user stake the required tokens and verify that premium features (advanced trend tracking, baseline modeling, multi-input reasoning, unlimited AI requests) become available. The test validates token staking works and premium features are properly gated.

**Acceptance Scenarios**:

1. **Given** a user has tokens available, **When** they stake the required amount, **Then** premium features are unlocked (advanced trend tracking, baseline modeling, multi-input reasoning, unlimited AI requests)
2. **Given** a premium user, **When** they access advanced trend tracking, **Then** they see more detailed analytics and pattern recognition than free users
3. **Given** a premium user, **When** they use AI features, **Then** they have unlimited requests (free users have limited requests)
4. **Given** a user has staked tokens, **When** they unstake, **Then** premium access is revoked and they return to free tier limitations
5. **Given** a premium user, **When** they use multi-input reasoning, **Then** the system provides more sophisticated analysis combining multiple data types

---

### User Story 2B - Movement → Performance Tracking (Priority: P2)

A user tracks their movement and workouts via the mobile app (manual logging or HealthKit/Google Fit integration) and receives AI-generated suggestions for rest vs push, volume adjustment, and consistency nudges based on fitness trend analysis.

**Why this priority**: Movement tracking is essential for Daily Pulse calculation and provides recovery-aware suggestions that help users optimize performance without overtraining.

**Independent Test**: Can be fully tested by having a user log workouts (manually or via integration) and verify that fitness trend analysis works, showing progress, stagnation, or overload patterns with AI-generated suggestions.

**Acceptance Scenarios**:

1. **Given** a user logs a workout manually or via HealthKit/Google Fit, **When** the system processes it, **Then** the workout is stored and factored into Daily Pulse and movement trends
2. **Given** a user has workout history, **When** they view movement trends, **Then** the system shows fitness trend analysis (progress, stagnation, overload) with focus on trends over single workouts
3. **Given** a user views movement insights, **When** they see AI suggestions, **Then** the system provides recovery-aware suggestions (rest vs push, volume adjustment, consistency nudges)
4. **Given** a premium user views movement data, **When** they request advanced analysis, **Then** they receive fitness progress analysis with deeper insights

---

### User Story 2C - Body → Feedback Tracking (Priority: P2)

A user tracks body metrics (weight, body composition, sleep, mood, energy) via the mobile app and views correlation insights showing relationships between sleep ↔ performance, food ↔ energy, stress ↔ recovery.

**Why this priority**: Body metrics provide essential feedback for Daily Pulse calculation and help users understand how different factors correlate with their performance and recovery.

**Independent Test**: Can be fully tested by having a user log body metrics and verify that correlation views work, showing relationships between different data types in a human, non-clinical tone.

**Acceptance Scenarios**:

1. **Given** a user logs weight and body composition (manually or via smart scale), **When** the system processes it, **Then** the metrics are stored and interpreted (unlimited for premium users)
2. **Given** a user logs sleep, mood, and energy check-ins, **When** the system processes them, **Then** the data is stored with focus on pattern-first approach (1 seen, not journaling)
3. **Given** a user has multiple body metrics logged, **When** they view correlation insights, **Then** the system shows relationships (sleep ↔ performance, food ↔ energy, stress ↔ recovery) in human, non-clinical tone
4. **Given** a user views body feedback, **When** they see insights, **Then** the tone emphasizes pattern-first, not perfection

---

### User Story 4 - Receive Practical Guidance to Reduce Decision Fatigue (Priority: P1)

A user receives practical, non-clinical guidance that helps reduce daily decision fatigue around food, movement, and recovery choices.

**Why this priority**: Reducing decision fatigue is a core value proposition. Users need actionable, practical guidance that makes daily wellness decisions easier without being overwhelmed by options or clinical complexity.

**Independent Test**: Can be fully tested by having a user receive Daily Pulse guidance and verifying that it provides practical, actionable recommendations for food, movement, and recovery that are clearly non-clinical and help reduce decision complexity.

**Acceptance Scenarios**:

1. **Given** a user receives Daily Pulse guidance, **When** they view food recommendations, **Then** the system provides practical, non-clinical suggestions that reduce food decision fatigue
2. **Given** a user receives Daily Pulse guidance, **When** they view movement recommendations, **Then** the system provides practical suggestions for activity that reduce decision complexity
3. **Given** a user receives Daily Pulse guidance, **When** they view recovery recommendations, **Then** the system provides practical suggestions that are clearly non-clinical
4. **Given** a user receives guidance, **When** they review it, **Then** all recommendations are clearly marked as informational and non-diagnostic

---

### Edge Cases

- What happens when a user submits invalid or corrupted data (e.g., corrupted image file, invalid metric values)?
- How does the system handle users with insufficient data to calculate a meaningful Daily Pulse?
- What happens when token staking fails or tokens are insufficient?
- How does the system handle users who submit data multiple times per day?
- What happens when AI reasoning services are unavailable or rate-limited?
- How does the system handle users with no historical data (new users) for baseline calculation?
- What happens when a user's personal baseline cannot be calculated due to insufficient data history?
- How does the system handle conflicting data inputs (e.g., movement data suggests high activity but body metrics suggest fatigue)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to submit food photos via mobile app camera for processing and analysis
- **FR-001B**: System MUST allow users to capture fridge contents via mobile app camera and detect ingredients via computer vision
- **FR-001C**: System MUST generate recipe suggestions using only detected fridge ingredients, filtered by user goals (energy, time, recovery)
- **FR-002**: System MUST allow users to submit movement data (steps, activity type, duration, intensity) via manual logging or HealthKit (iOS) / Google Fit (Android) integration
- **FR-002B**: System MUST provide fitness trend analysis (progress, stagnation, overload) with focus on trends over single workouts
- **FR-002C**: System MUST provide recovery-aware AI suggestions (rest vs push, volume adjustment, consistency nudges)
- **FR-003**: System MUST allow users to submit body metrics (weight, body composition, sleep, mood, energy) via mobile app with smart scale interpretation (unlimited for premium)
- **FR-003B**: System MUST provide correlation views showing relationships between sleep ↔ performance, food ↔ energy, stress ↔ recovery
- **FR-003C**: System MUST present body feedback in human, non-clinical tone emphasizing pattern-first approach, not perfection
- **FR-004**: System MUST allow users to submit lifestyle inputs (sleep, stress, mood, hydration, or other qualitative/quantitative lifestyle factors)
- **FR-005**: System MUST calculate and display a Daily Pulse score (0-100) in the mobile app, updating dynamically as data is added, based on deviation from personal baseline, short-term vs long-term trends, and recovery vs load balance
- **FR-005B**: System MUST display Daily Pulse with minimal breakdown (Food / Movement / Recovery) and one sentence insight max per day (e.g., "Today's Pulse dipped mainly due to low sleep consistency")
- **FR-006**: System MUST provide practical, non-clinical guidance with Daily Pulse that helps reduce decision fatigue
- **FR-007**: System MUST calculate and maintain a personal baseline for each user based on their historical data
- **FR-008**: System MUST display patterns and trends relative to user's personal baseline, not generic population benchmarks
- **FR-009**: System MUST clearly communicate that all guidance is informational and non-diagnostic (no medical advice)
- **FR-010**: System MUST support token staking mechanism for premium access via mobile app wallet connection (read-only chain interaction, no in-app token trading for store compliance)
- **FR-011**: System MUST gate premium features (advanced trend tracking, personal baseline modeling, multi-input reasoning, unlimited AI requests) behind token staking
- **FR-012**: System MUST provide advanced trend tracking for premium users that goes beyond basic free tier trends
- **FR-013**: System MUST provide personal baseline modeling for premium users that offers deeper insights into their patterns
- **FR-014**: System MUST provide multi-input reasoning for premium users that combines multiple data types for sophisticated analysis
- **FR-014B**: System MUST provide weekly adaptive meal suggestions for premium users based on personal nutrition patterns
- **FR-015**: System MUST provide unlimited AI requests for premium users (free users have limited requests)
- **FR-016**: System MUST store all submitted personal data securely with user consent
- **FR-017**: System MUST allow users to view their historical data and patterns over time
- **FR-018**: System MUST process and analyze food photos to extract relevant nutritional or meal information
- **FR-019**: System MUST combine multiple data inputs (food, movement, body metrics, lifestyle) to calculate Daily Pulse
- **FR-020**: System MUST provide explainable AI outputs that show how Daily Pulse and guidance are derived
- **FR-021**: Mobile app MUST be fully compatible with iOS 14+ (iPhone + iPad) and Android 8.0+ (API 26+)
- **FR-022**: Mobile app MUST be App Store and Play Store compliant, especially regarding health data policies
- **FR-023**: Mobile app MUST use React Native with Expo (primary) with native modules where required (HealthKit, camera, sensors)
- **FR-024**: Mobile app MUST implement dark-first UI design system (background: #050505, accent: Indigo/electric blue, glass-morphism sparingly, rounded corners 24-32px)
- **FR-025**: Mobile app MUST present Daily Pulse score as important, not gamified, with minimal charts and strong typography

### Key Entities *(include if feature involves data)*

- **User**: Represents a platform user with account, personal baseline, data history, and subscription tier (free/premium)
- **Daily Pulse**: A calculated score (0-100) representing daily wellness guidance signal based on user's submitted data
- **Personal Data Entry**: Individual data submission (food photo, movement data, body metric, lifestyle input) with timestamp and metadata
- **Personal Baseline**: User-specific historical patterns and averages calculated from their data over time, used as reference point instead of generic benchmarks
- **Pattern/Trend**: Visualized representation of user data over time showing correlations, changes, and relationships relative to personal baseline
- **Token Stake**: User's staked tokens that unlock premium features, with staking/unstaking capabilities
- **Premium Feature**: Advanced functionality (advanced trend tracking, baseline modeling, multi-input reasoning, unlimited AI requests) accessible only to users with active token stakes
- **AI Guidance**: Explainable, non-clinical recommendations for food, movement, and recovery that help reduce decision fatigue
- **FridgeScan**: Fridge contents photo with ingredient detection and recipe generation
- **MealSuggestion**: Recipe suggestions using only detected fridge ingredients, goal-aware filtered
- **MovementTrend**: Fitness trend analysis showing progress, stagnation, or overload patterns
- **CorrelationInsight**: Views showing relationships between different data types (sleep ↔ performance, food ↔ energy, stress ↔ recovery)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit at least one type of personal data (food photo, movement, body metric, or lifestyle input) and receive Daily Pulse within 5 minutes of submission
- **SC-002**: Daily Pulse calculation completes successfully for 95% of users with valid data submissions
- **SC-003**: 90% of users can view their personal patterns and trends without errors when they have at least 7 days of data
- **SC-004**: Token staking for premium access completes successfully for 98% of users with sufficient tokens
- **SC-005**: Premium features are accessible within 1 minute of successful token staking for 99% of users
- **SC-006**: 85% of users report that Daily Pulse guidance reduces their decision fatigue around food, movement, and recovery choices
- **SC-007**: Personal baseline calculation is accurate (within acceptable variance) for users with at least 14 days of historical data
- **SC-008**: All guidance and recommendations are clearly marked as non-clinical and non-diagnostic (100% compliance)
- **SC-009**: System processes food photos and extracts relevant data with 80% accuracy (as measured by user validation)
- **SC-010**: Multi-input reasoning for premium users provides insights that combine at least 3 different data types successfully
- **SC-011**: Free tier users can make at least 10 AI requests per day before hitting limits
- **SC-012**: Premium users experience no rate limits on AI requests (unlimited access)
- **SC-013**: Data submission and Daily Pulse retrieval work on mobile devices with performance suitable for mobile networks (load time under 3 seconds on 4G)
- **SC-014**: Users understand their day in <10 seconds via Daily Pulse score
- **SC-015**: Pulse score feels accurate and personal to users
- **SC-016**: App is calm, not demanding, with dark-first UI design
- **SC-017**: Premium value is obvious to users
- **SC-018**: App is approved by both App Store and Play Store
- **SC-019**: Fridge → Meals feature detects ingredients with 80%+ accuracy
- **SC-020**: Recipe suggestions use only detected ingredients and respect user goals
