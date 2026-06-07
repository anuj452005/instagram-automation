# Unit 26: Frontend Analytics Metrics

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build the dashboard home view displaying campaign conversion data and time-series performance charts.

## Why This Unit Exists
To provide creators with clear visual indicators of their campaign conversion metrics and follower engagement.

## Dependencies
- Unit 22: Frontend Leads Manager & Public Forms
- Unit 25: Analytics Events Tracker Worker

## Features Delivered
- Overview dashboard with total metric widgets.
- Charts utilizing Recharts (comments, matches, and leads trends).
- Performance breakdowns per campaign.

## File Structure
```
frontend/src/
├── components/
│   └── AnalyticsChart.tsx
└── pages/
    └── DashboardHomePage.tsx
```

## Success Criteria
- Accessing the main dashboard page displays charts populated with server-synced analytics data.
- Hovering over chart elements displays accurate details in tooltips.
