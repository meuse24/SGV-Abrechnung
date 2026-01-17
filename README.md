# SGV-Abrechnung (AbrechnungWeb)

Webbasierte Anwendung zur Erfassung und Berechnung von Sicherheitsgebuehren nach der
Sicherheitsgebuehren-Verordnung (SGV). Die App ist rein clientseitig, speichert Daten
nur im Browser und bietet CSV/PDF/JSON-Exporte sowie eine Detail-Auswertung.

## Features
- Einsatzdaten-Formular mit Live-Berechnung
- Einsatztabelle mit Summen und Spitzenbelegung Personal
- Export: CSV, PDF, JSON, Detail-Auswertung (CSV Zeitscheiben)
- Tarife aus `public/tarife.json` ladbar (mit Fallback)
- Responsives Layout inkl. Kartenansicht auf kleinen Screens

## Tech Stack
- Vite + React + TypeScript
- react-hook-form + Zod
- jsPDF + jspdf-autotable
- Vitest

## Lokale Entwicklung
```bash
npm install
npm run dev
```
Standard-Dev-URL: `http://localhost:5173/` (Port kann auto-incrementen).

## Weitere Commands
```bash
npm run lint    # ESLint
npm run test    # Vitest
npm run build   # Production build
npm run preview # Preview der dist/ Ausgabe
```

## Tarife anpassen
1. `public/tarife.json` bearbeiten.
2. In der App auf **"Tarife neu laden"** klicken (oder Seite neu laden, wenn der
   Browser-Flag noch nicht gesetzt ist).

## Daten & Speicherung
- Daten werden lokal im Browser gespeichert (localStorage).
- Kein Server-Backend, kein Upload der Daten.
- Laden/Speichern erfolgt via Datei-Download/Upload (JSON).

## Deployment
- `npm run build` erzeugt `dist/`.
- **Die Inhalte** von `dist/` in den Webspace hochladen (nicht den Ordner selbst).
- Vite ist auf `base: "./"` konfiguriert, damit relative Assets in Subpfaden funktionieren.

## Projektstruktur (Kurz)
- `src/` App-Code
- `src/components/` UI
- `src/lib/` Berechnungen/Export
- `public/` statische Assets (`favicon.ico`, `tarife.json`)
- `tests/` Unit-Tests
