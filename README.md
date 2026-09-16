# Parinaam - Web Dashboard

Parinaam is a project for digitizing NDPS field drug-test results — officers use a
mobile app (separate repo: `parinaam`, which also has the backend) to capture and
submit test records. This repo is the **web dashboard** — the frontend where
supervisors, investigating officers, judiciary, and admins log in to review, search,
and export those records.

This repo talks to the backend API (living in the `parinaam` repo) — it doesn't do any
of the mobile capture/classification stuff itself, just displays and manages what's
already been submitted.

## What needs to be built

**Login & accounts**
- Login page (Admin / Supervisor / Judiciary / other reviewer roles — different roles
  see different things)
- Admin screen to add/approve new accounts (e.g. onboarding a new officer or judiciary
  viewer)
- Somewhere to see recent login activity / who got added when

**Dashboard home page**
- Quick overview when you log in — recent activity (new approvals, recent logins),
  some summary numbers (total cases, pending, reviewed, etc.)

**Case log page**
- List/table of all submitted test cases
- Filters: date, location/region, department, officer, kit type/batch, outcome, status
- Search

**Case detail page**
- Click into a case, see everything: image, classification result, confidence score,
  kit details, location, timestamp, officer, hash/signature info — all of this is
  read-only, nothing here should ever be editable
- Show the case's current status (reported / under review / reviewed / escalated —
  whatever makes sense) and let a reviewer change *that* (not the actual record data)

**Exports**
- Export a case (or filtered set of cases) as PDF / DOCX / XLSX
- PDF should be the "court-ready" version — image, hash, certificate info, map
  location, all in one doc

**Charts / analytics**
- Some kind of map or chart showing which regions have more cases
- A trend chart over time (cases, outcomes, whatever's useful)

**SIMS integration**
- Just leave a placeholder/space for this — real NCB SIMS integration isn't happening
  for the hackathon, just make sure there's an obvious spot for it later without
  needing to redesign everything

## Data shape (what a "case record" looks like, coming from the backend)

Just so the frontend knows what it's rendering — records will look roughly like this:

id, createdAt, operatorId, deviceId
kit: { name, model, batchNo, expiry, kitType }
gps: { lat, lon, accuracy, mocked }
imageUrl, imageHash
classification: { outcome, confidence, deltaE, qualityFlags }
recordHash, signature
caseStatus: "reported" | "under_review" | "reviewed" | "escalated"
panchnamaRef (optional)


Everything except `caseStatus` and `panchnamaRef` should be treated as read-only on
this end — the backend owns the truth for those, this app just displays it and lets
reviewers change status/add references through proper actions, not by editing fields
directly.

## Not this repo's job

- Anything about the mobile app (capture, camera, on-device classification)
- Actually building the SIMS connection (just leave room for it)

## Git wkflw

- Create or switch to a separate development or feature branch before making changes.
- try not to push directly to `master`;
