# Unit 22: Frontend Leads Manager & Public Forms

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build the leads dashboard page containing table list views, search/filter bars, and a CSV exporter, along with the public lead submission form.

## Why This Unit Exists
To allow creators to browse, filter, and export their captured leads, and to provide followers with a mobile-friendly web form.

## Dependencies
- Unit 12: Frontend Automation Builder
- Unit 21: Landing Page Submission API

## Features Delivered
- Leads overview data table (`LeadsPage.tsx`).
- CSV builder generating streams directly on click events.
- Public lead landing page form view (`PublicLeadPage.tsx`).

## File Structure
```
frontend/src/
├── components/
│   └── LeadsTable.tsx
└── pages/
    ├── LeadsPage.tsx
    └── PublicLeadPage.tsx
```

## Success Criteria
- Opening `/dashboard/leads` lists all gathered leads.
- Clicking the download button exports the leads to a CSV file.
- Accessing the public link `/l/:token` opens a form page and submits leads.
