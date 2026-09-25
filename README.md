# Parinaam Web Dashboard

Parinaam is an NCB-themed web dashboard for reviewing NDPS field drug-test records. It provides role-based access for administrators, supervisors, investigating officers, and judiciary users.

> **Current build status:** this repository is a self-contained hackathon/demo application. It uses an in-memory mock store and demo authentication; it is not yet connected to the production backend or Supabase.


Open [https://parinaam-web-v1-0.vercel.app](https://parinaam-web-v1-0.vercel.app) for v1.

## Features

- Dashboard overview with case, status, outcome, and activity summaries
- Searchable and filterable case log
- Read-only case details with kit, GPS, image, classification, and integrity data
- Review workflow for changing case status and adding a panchnama reference
- Server-side RBAC and record-scope enforcement
- PDF, DOCX, XLSX, and CSV exports
- Analytics charts and an interactive MapLibre map using key-free Esri raster tiles
- Administrator-only user management screen
- SIMS integration placeholder for a future backend integration

## Tech stack

- Next.js 15 App Router and React 19
- TypeScript
- Tailwind CSS 4
- MapLibre GL / `react-map-gl`
- Recharts
- TanStack React Table
- `@react-pdf/renderer`, `docx`, and `exceljs`

## Requirements

- Node.js 20 or newer
- npm

## Local development

```bash
npm install
npm run dev
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@parinaam.gov.in` | `admin123` |
| Supervisor | `supervisor@parinaam.gov.in` | `supervisor123` |
| Investigating Officer | `io@parinaam.gov.in` | `io123` |
| Judiciary | `judiciary@parinaam.gov.in` | `judiciary123` |

These credentials are for local demonstration only. Do not use them in a real government deployment.

## Roles and access

| Role | Record scope | Main permissions |
| --- | --- | --- |
| Administrator | All records | Manage users, review cases, change status, export, recompute integrity, view audit data |
| Supervisor | Unit records | Review cases, change status, export, recompute integrity, view audit data |
| Investigating Officer | Own records | View, export, and recompute integrity for owned records |
| Judiciary | Unit records | View, export, and view audit data |

Sealed record content is immutable. The dashboard only permits authorized changes to case status and the panchnama reference; it does not permit editing hashes, images, GPS, kit data, or classification results.

## Main pages

- `/` — dashboard summary
- `/cases` — searchable case log
- `/cases/[id]` — read-only case details and review actions
- `/analytics` — charts and geographic map; restricted by role
- `/admin` — account management; administrator-only
- `/login` — demo sign-in

## API surface

The app includes route handlers under `src/app/api` for:

- authentication (`login`, `logout`)
- cases (`GET`, `POST`, detail operations)
- case status and integrity actions
- facets and mock image data
- PDF, DOCX, XLSX, and CSV exports
- administrator user management

## Production limitations and next steps

- Replace the public Esri tile endpoint with an approved, contracted, or self-hosted basemap provider for production traffic.
- Implement the NCB SIMS integration and complete the remaining lab workflows.
- Add integration, authorization, accessibility, and end-to-end tests before production use.

