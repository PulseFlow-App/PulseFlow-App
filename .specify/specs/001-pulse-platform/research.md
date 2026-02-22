# Research: Pulse Platform

**Date**: 2026-01-27
**Feature**: 001-pulse-platform

## Technology Decisions

### Mobile Framework: React Native with Expo and TypeScript

**Decision**: Use React Native with Expo (latest stable) and TypeScript for cross-platform mobile development targeting iOS 14+ and Android 8.0+ (API 26+).

**Rationale**: 
- Single codebase for iOS and Android reduces development and maintenance overhead
- Expo provides excellent tooling for camera, image picker, and native module integration
- Strong ecosystem for mobile-first performance optimization
- TypeScript provides type safety for complex data models (Daily Pulse, baselines, trends)
- Excellent support for image handling (food photos, fridge photos), offline storage, and network optimization
- Native modules available for HealthKit (iOS) and Google Fit (Android) via react-native-health
- Web3 wallet integration libraries available for token staking
- Large community and extensive documentation
- Direct framework capabilities align with minimal abstractions principle
- App Store and Play Store compliant with Expo's managed workflow

**Alternatives considered**:
- Flutter: Strong performance but Dart learning curve and smaller ecosystem for health/wellness apps
- Native iOS/Android: Better performance but requires separate codebases, violating efficiency goals
- React Native without Expo: More setup complexity, Expo provides better developer experience for camera, image processing, and native integrations

### Backend Framework: Node.js with TypeScript and Express.js

**Decision**: Use Node.js 20+ with TypeScript and Express.js for the backend API.

**Rationale**:
- TypeScript ensures type safety across mobile and backend (shared types)
- Express.js provides minimal abstractions, direct HTTP handling
- Excellent ecosystem for image processing (Sharp), AI integrations (OpenAI SDK), and database access
- Async/await patterns suitable for AI reasoning and data processing
- Easy integration with PostgreSQL (pg library) and object storage (AWS SDK)
- Containerization-friendly for deployment

**Alternatives considered**:
- Python/FastAPI: Strong for ML/AI but adds language diversity, TypeScript provides better mobile-backend type sharing
- Go: Excellent performance but smaller ecosystem for AI/ML integrations

### Database: PostgreSQL with TimescaleDB Extension

**Decision**: Use PostgreSQL with TimescaleDB extension for time-series trend analysis.

**Rationale**:
- PostgreSQL handles structured data (users, data entries, baselines) efficiently
- TimescaleDB extension provides optimized time-series queries for trend analysis
- Single database reduces complexity (no separate time-series DB)
- Excellent support for JSON columns (flexible data entry schemas)
- Strong privacy controls (row-level security, encryption at rest)
- Long-term data retention with efficient querying for 1+ year trends

**Alternatives considered**:
- Separate time-series DB (InfluxDB): Adds complexity, PostgreSQL + TimescaleDB sufficient for scale
- MongoDB: Less suitable for relational data (users, baselines, relationships)

### Object Storage: S3-Compatible (AWS S3 or MinIO)

**Decision**: Use S3-compatible object storage for food photos and media.

**Rationale**:
- Efficient storage and retrieval of images
- CDN integration for mobile performance
- Cost-effective for large media files
- Privacy controls (encrypted storage, access policies)
- Direct framework integration (AWS SDK)

### AI/ML: OpenAI API with Anthropic Claude as Fallback

**Decision**: Use OpenAI API (GPT-4 Vision for food and fridge photo analysis, GPT-4 for guidance and Daily Pulse calculation) with Anthropic Claude as fallback.

**Rationale**:
- GPT-4 Vision excels at food photo analysis, ingredient detection, and fridge content recognition
- GPT-4 provides strong reasoning for multi-input Daily Pulse calculation and recipe generation
- API-based approach (vs self-hosted) reduces infrastructure complexity
- Modular design allows swapping providers without core changes
- Explainability: API responses can be logged and audited
- Fallback ensures reliability (Constitution: explainable AI)
- GPT-4 Vision can detect ingredients from fridge photos for recipe generation feature

**Alternatives considered**:
- Self-hosted models: Higher infrastructure complexity, violates minimal abstractions
- Single provider: Fallback ensures reliability for critical Daily Pulse feature
- Specialized computer vision APIs: GPT-4 Vision provides sufficient accuracy (80%+) for ingredient detection while maintaining single AI provider simplicity

### Token/Blockchain: $PULSE on Pump.fun (Solana)

**Decision**: **$PULSE token already exists** on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump). We do **not** create or deploy a token contract. Integration is read-only (balance / staking checks) via Solana RPC.

**Rationale**:
- Token is live on Pump.fun; no token contract to write or deploy
- Solana/Pump.fun integration for wallet checks and staking status
- Modular design: Token service only reads chain state
- Clear separation: Blockchain logic isolated in token-service module

**Alternatives considered**:
- Creating a new token: Not needed  - $PULSE already exists on Pump.fun

### Image Processing: Sharp (Node.js)

**Decision**: Use Sharp library for server-side image processing and optimization.

**Rationale**:
- Fast, efficient image processing (resize, format conversion)
- Mobile performance: Optimize images before storage/transmission
- Privacy: Process images server-side, don't send raw data to mobile
- Direct framework capability (no custom abstraction layer)

### Testing: Jest for Both Mobile and Backend

**Decision**: Use Jest for testing across mobile (React Native Testing Library) and backend.

**Rationale**:
- Single testing framework reduces complexity
- Strong TypeScript support
- Excellent mocking for AI services, database, blockchain
- TDD support: Write tests first, verify failures, implement
- Integration testing: Test mobile-backend contracts

## Architecture Patterns

### Modular AI Components

**Pattern**: AI components (food-analysis, pulse-calculator, guidance-generator, explainability) are separate modules with clear interfaces.

**Rationale**: 
- Swappable implementations (OpenAI today, different provider tomorrow)
- Testable in isolation (mock AI responses)
- Explainability module ensures Daily Pulse reasoning is auditable
- Aligns with library-first architecture principle

### Privacy-First Data Flow

**Pattern**: Data encryption at rest and in transit, minimal data collection, user consent tracking.

**Rationale**:
- Constitution requirement: Privacy-first data handling
- Health data sensitivity requires encryption
- User control: Users can delete data, export data
- Compliance: GDPR, HIPAA considerations

### Mobile-First Performance

**Pattern**: Optimize API responses, image compression, offline data viewing, efficient network usage.

**Rationale**:
- Constitution requirement: Mobile performance
- Battery life: Minimize network calls, efficient data sync
- Network constraints: Compress responses, cache trends locally
- Offline capability: View historical data without network

### Explainable Daily Pulse

**Pattern**: Daily Pulse calculation logs all inputs, weights, and reasoning steps. Explainability module provides user-facing explanations.

**Rationale**:
- Constitution requirement: Explainable AI outputs
- Testability: Calculation logic is testable (no black-box)
- User trust: Users see why they got a specific score
- Debugging: Issues can be traced through calculation steps

## Integration Points

### Mobile ↔ Backend API
- REST API with JSON
- Authentication: JWT tokens
- Rate limiting: Free tier (10 AI requests/day), Premium (unlimited)

### Backend ↔ AI Services
- OpenAI API (primary)
- Anthropic Claude (fallback)
- Modular interface allows provider swapping

### Backend ↔ Blockchain
- Web3.js for token staking
- Transaction monitoring for premium access
- Gas optimization for mobile users

### Backend ↔ Storage
- PostgreSQL for structured data
- S3-compatible for images
- TimescaleDB for time-series queries

## Performance Optimizations

### Mobile
- Image compression before upload
- Lazy loading for trends
- Local caching of Daily Pulse and recent trends
- Background sync for data submission

### Backend
- Database indexing for user queries and trends
- Image processing optimization (Sharp)
- AI request batching where possible
- CDN for image delivery

### Database
- TimescaleDB compression for historical data
- Partitioning by user_id for efficient queries
- Indexes on timestamp, user_id, data_type

## Security Considerations

### Data Privacy
- End-to-end encryption for sensitive data
- User consent tracking
- Data retention policies
- User data export/deletion

### API Security
- JWT authentication
- Rate limiting
- Input validation
- SQL injection prevention (parameterized queries)

### Blockchain Security
- Transaction verification
- Gas limit protection
- Token balance validation

## Scalability Considerations

### Initial Scale (1K-10K users)
- Single backend instance
- PostgreSQL on single server
- S3 for images

### Growth Scale (100K users)
- Horizontal scaling: Multiple backend instances
- Database read replicas
- CDN for image delivery
- Caching layer (Redis) for Daily Pulse calculations

### Data Volume
- 1+ year retention per user
- TimescaleDB compression for efficiency
- Archive old data to cold storage if needed
