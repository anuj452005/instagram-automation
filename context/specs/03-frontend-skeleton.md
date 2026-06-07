# Unit 03: Frontend Skeleton and Theme Integration

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Scaffold the React single-page application under Vite with TailwindCSS, configure design variables matching UI context, and structure root routing.

## Why This Unit Exists
To provide a clean, styled dashboard skeleton where views can be added incrementally.

## Dependencies
- Unit 02: Backend Gateway and Service Health Check

## Features Delivered
- Vite + React + TypeScript setup.
- TailwindCSS styling configuration with custom OKLCH color properties.
- TanStack Query (React Query) and Axios setup.

## File Structure
```
frontend/
├── src/
│   ├── components/
│   ├── lib/
│   │   └── axios.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Success Criteria
- Frontend boots locally on `http://localhost:5173`.
- Root page applies dark-mode styles, demonstrating working Tailwind classes and font configurations.
