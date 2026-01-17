# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript application code.
  - `src/components/` holds UI components (forms, tables, modals).
  - `src/components/ui/` contains small input widgets (date/time pickers).
  - `src/lib/` includes calculation, export, and utility helpers.
  - `src/constants/`, `src/types/`, and `src/hooks/` provide shared config, types, and state helpers.
- `tests/` contains Vitest unit tests (e.g., `calculations.test.ts`).
- `public/` and `index.html` hold static assets and the entry HTML (e.g., `public/favicon.ico`).
  - `public/tarife.json` provides default tariff values loaded on startup (with hardcoded fallback).
- `dist/` is the production build output (generated).

## Build, Test, and Development Commands
- `npm run dev` starts the Vite dev server (default `http://localhost:5173/`, auto-increments if busy).
- `npm run build` runs TypeScript build and Vite production build.
- `npm run preview` serves the production build locally (default `http://localhost:4173/`, auto-increments if busy).
- `npm run test` runs Vitest using `vitest.config.mjs`.
- `npm run lint` runs ESLint on `src/` and `tests/`.

## Coding Style & Naming Conventions
- TypeScript + React with functional components.
- Indentation: 2 spaces (see existing `.tsx` files).
- Use double quotes for strings and semicolons as in current code.
- File naming: PascalCase for React components (e.g., `EinsatzFormular.tsx`), kebab-case for small UI widgets (e.g., `date-time-picker.tsx`).
- ESLint is configured via `.eslintrc.cjs` and `.eslintignore`; keep changes consistent with existing style.

## Testing Guidelines
- Framework: Vitest.
- Tests live in `tests/` and follow `*.test.ts` naming.
- Prefer unit tests for calculation logic in `src/lib/`.

## Commit & Pull Request Guidelines
- Git history is minimal; the initial commit message is simple and imperative ("Initial commit").
- Use concise, imperative commit messages (e.g., "Add peak personnel summary").
- PRs (if used) should include a short description, test status, and screenshots for UI changes.

## Security & Data Handling
- The app stores data locally in the browser (localStorage). No server-side storage is used.
- Avoid adding secrets to the repo; use `.env` files locally (ignored by `.gitignore`).

## Deployment Notes
- Vite is configured with `base: "./"` for relative asset paths.
- Upload the **contents** of `dist/` to your webspace (not the folder itself).

## GitHub Metadata
- Repo: `https://github.com/meuse24/SGV-Abrechnung.git`
- Description: `Webapp zur Erfassung und Berechnung von Sicherheitsgebühren (SGV) mit CSV/PDF/JSON-Export, Detailauswertung und lokalem Browser-Speicher.`
- Topics: `react, vite, typescript, sgv, fee-calculation, csv-export, pdf-export, localstorage, form, police`
