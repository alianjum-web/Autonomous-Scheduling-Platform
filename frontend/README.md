# Frontend

Next.js 16 patient intake widget and staff dashboard. Part of the [Autonomous Scheduling Platform](../README.md).

## Quick Start

```bash
cp .env.example .env.development   # fill in Supabase + API URL
npm install
npm run dev                        # loads .env.development
```

Open [http://localhost:3000/chat](http://localhost:3000/chat) for the patient chat widget.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |

## Architecture

The frontend follows a **module-based atomic design** pattern. Feature modules are self-contained vertical slices — they own their atoms, molecules, organisms, screens, Redux slice, and hooks. Modules import only from `/common`, never from each other.

### Sprint 1 module: `patient-triage`

```
src/components/patient-triage/
├── atoms/          StatusBadge, TimeSlotChip, TypingIndicator, EmergencyBanner
├── molecules/      MessageRow
├── organisms/      LiveChatPanel
└── screens/        PatientChatScreen
```

### State management (module-colocated)

Each feature module owns its Redux slice, RTK Query endpoints, and hooks:

```
src/components/patient-triage/
├── store/          triageSlice, bookingSlice, triageApi, bookingApi
├── hooks/          useStreamingChat, useBookingFlow
└── __tests__/      *.spec.ts

src/components/appointments/
├── store/          appointmentsSlice, appointmentsApi
├── hooks/          useAppointmentSync, useEscalationWatch
└── __tests__/      *.spec.ts

src/components/clinic-docs/
├── store/          clinicDocsSlice, clinicDocsApi
├── hooks/          useDocumentIngestion
└── __tests__/      *.spec.ts

src/components/common/
├── store/          baseApi, makeStore, StoreProvider
└── hooks/          useAuthSession, useAdminGuard
```

- **Tests** — all unit tests use `__tests__/*.spec.ts` naming

### Multi-tenant routing

`src/proxy.ts` extracts the subdomain from the request host and sets `x-tenant-slug` header for server components.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | Yes | FastAPI base URL |

## Documentation

- [Project README](../README.md) — overview, getting started, compliance
- [Architecture](../docs/ARCHITECTURE.md) — full frontend module layout
- [Database](../docs/DATABASE.md) — schema and RLS
- [Roadmap](../docs/ROADMAP.md) — sprint deliverables
