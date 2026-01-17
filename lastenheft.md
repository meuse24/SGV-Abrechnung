# Lastenheft: Webformular zur Erfassung verrechenbarer Leistungen (SGV)

## 1. Projektübersicht

### 1.1 Zweck
Entwicklung einer webbasierten Anwendung zur Erfassung und Berechnung von Sicherheitsgebühren gemäß der österreichischen Sicherheitsgebühren-Verordnung (SGV) und des Sicherheitspolizeigesetzes (SPG) § 5a.

### 1.2 Zielgruppe
Mitarbeiter der österreichischen Bundespolizei zur Dokumentation und Abrechnung von sicherheitspolizeilichen Leistungen.

### 1.3 Umfang
- Eingabeformular für Einsatzdaten
- Automatische Berechnung von Zeitscheiben und Kosten
- Tabellarische Übersicht aller erfassten Einträge
- Export/Import-Funktionalitaet (CSV/PDF/JSON)
- Responsive Design für Desktop und Tablet

---

## 2. Aktueller Software-Stack (Ist-Stand)

### 2.1 Core-Technologien
- **Build-Tool**: Vite 7
- **Framework**: React 18 + TypeScript
- **Styling**: Custom CSS in `src/styles.css`
- **UI-Komponenten**: native HTML-Inputs + eigene React-Komponenten (Modal, Menu, Date/Time Picker)
- **Formular-Handling**: React Hook Form + Zod
- **Datums/Zeit-Handling**: native `<input type="date">` / `<input type="time">` + eigene Feiertagslogik
- **Tabellen**: HTML-Tabelle mit clientseitigem Sortieren
- **Icons**: Lucide React

### 2.2 Zusaetzliche Libraries und Tools
- **Export**:
  - `jspdf` + `jspdf-autotable` fuer PDF
  - CSV-Export (UTF-8 BOM, Semikolon)
  - JSON Export/Import fuer Formular-Daten
- **State/Persistenz**: React State + localStorage (sgv-metadaten, sgv-eintraege, sgv-draft)
- **Testing**: Vitest (Berechnungslogik)

### 2.3 Entwicklungsumgebung
```bash
npm install
npm run dev
```

---

## 3. Funktionale Anforderungen

### 3.1 Header-Sektion (Metadaten)

#### 3.1.0 Überschrift und rechtliche Grundlage

```
Berechnungsblatt für Überwachungsgebühren
gemäß Sicherheitsgebührenverordnung des BMI über die Festsetzung von 
Gebühren und Kostenersätzen für Leistungen der Sicherheitsexekutive 
nach dem Sicherheitspolizeigesetz.
```

**Design-Vorgaben für Überschrift:**
- Hauptüberschrift: H1, fett, zentriert
- Untertitel: Kleinere Schrift, zentriert, Grauton
- Trennlinie unterhalb
- Abstand zum Formular: 2rem

#### 3.1.1 Metadaten-Felder (oberhalb des Eingabeformulars)

**Grunddaten**

| Feldname | Typ | Validierung | Beschreibung | Position |
|----------|-----|-------------|--------------|----------|
| Dienststelle | Text | Max. 50 Zeichen | z.B. "BPK Dornbirn" | Links oben |
| Veranstaltung | Text | Max. 200 Zeichen | Bezeichnung der Veranstaltung, z.B. "Austria Wien vs Admira" | Links |
| Verein/Veranstalter | Text | Max. 100 Zeichen | Name des Veranstalters | Links |
| Bescheid Zahl | Text | Optional, Max. 50 Zeichen | Geschäftszahl des Bescheids | Links |
| PAD Zahl | Text | Optional, Max. 50 Zeichen | PAD-Nummer | Links |

**Tarife (vorbelegt, aenderbar)**

| Feldname | Typ | Standardwert | Beschreibung | Position |
|----------|-----|--------------|--------------|----------|
| Personal Tarif 1 | Number | 17,00 EUR | Pro halbe Stunde (06:00-22:00, Mo-Sa) | Rechts oben |
| Personal Tarif 2 | Number | 26,00 EUR | Pro halbe Stunde (22:00-06:00 oder So/Feiertag) | Rechts oben |
| Dienstfahrzeug | Number | 13,00 EUR | Pro halbe Stunde (zusaetzlich) | Rechts oben |
| Luftfahrzeug pro Minute | Number | 53,00 EUR | Pro Minute (inkl. Personal) | Rechts oben |
| Durchschn. Stundensatz | Number | 38,40 EUR | **Pro Stunde** (fuer allgemeine Kostenberechnung) | Rechts oben |

**Allgemeine Einsatzzeit (unabhaengig von Tabelle)**

| Feldname | Typ | Beschreibung | UI-Komponente | Position |
|----------|-----|--------------|---------------|----------|
| Einsatzzeit von | DateTime | Gesamter Einsatzbeginn (Datum + Uhrzeit) | DateTimePicker (native date/time inputs) | Rechts Mitte |
| Einsatzzeit bis | DateTime | Gesamtes Einsatzende (Datum + Uhrzeit) | DateTimePicker (native date/time inputs) | Rechts Mitte |
| Eingesetzte Bedienstete | Number | **Gesamt**anzahl der Bediensteten | Number Input | Rechts Mitte |

**UI-Anforderungen fuer DateTime Picker (Ist-Stand):**
- Zwei native Inputs: Datum (`type="date"`) + Uhrzeit (`type="time"`)
- Anzeige/Format wird vom Browser gesteuert
- Validierung ueber native Inputs + Formular-Validierung

**Berechnete Felder (Read-Only, Live-Anzeige)**

| Feldname | Formel | Beschreibung |
|----------|--------|--------------|
| Einsatzstunden | `(Einsatzzeit bis - Einsatzzeit von)` in Stunden | Gesamtdauer des Einsatzes |
| Tatsächliche Kosten | `Einsatzstunden × Eingesetzte Bedienstete × Durchschn. Stundensatz` | **Live berechnet** während der Eingabe |

**Wichtig**: 
- Die Felder "Einsatzstunden" und "Tatsächliche Kosten" werden **automatisch und live** berechnet, sobald alle drei Werte (von, bis, Bedienstete) eingegeben sind
- Die tatsächlichen Kosten sind unabhängig von den verrechenbaren Leistungen in der Tabelle
- Sie dienen nur der Gesamtübersicht der tatsächlich angefallenen Personalkosten

**Layout-Hinweis:** Diese Metadaten sollten in einem großen Card/Panel oberhalb der Einsatzerfassung dargestellt werden, aufgeteilt in:
- Linke Spalte: Grunddaten (Dienststelle, Veranstaltung, etc.)
- Rechte Spalte: Tarife + Allgemeine Einsatzzeit + Live-Berechnung der tatsächlichen Kosten

### 3.2 Eingabeformular (Einsatzdaten)

#### 3.2.1 Pflichtfelder

| Feldname | Typ | Validierung | UI-Komponente | Beschreibung |
|----------|-----|-------------|---------------|--------------|
| Bezeichnung der Kräfte | Text | Max. 200 Zeichen | Text Input | Freitext zur Beschreibung der Tätigkeit |
| Art der Kräfte | Select | Pflicht | Dropdown | "Personal", "Dienstkraftfahrzeug", "Luftfahrzeug" |
| Anzahl | Number | Min: 1, Max: 999 | Number Input | Anzahl der eingesetzten Einheiten |
| Datum | Date | Gueltiges Datum | Native Date Input | Einsatzdatum |
| Beginn | Time | hh:mm Format | Native Time Input | Startzeit vor Ort (ohne Wegzeit) |
| Ende | Time | hh:mm Format | Native Time Input | Endzeit; Mitternachtsuebergang moeglich |

**Picker im Formular (Ist-Stand):**
- Datum: `<input type="date">`
- Beginn/Ende: `<input type="time">` (Schrittweite 1 Minute)
- Mitternachtsuebergang wird als Hinweis angezeigt (Beginn > Ende)

#### 3.2.2 Berechnete Ausgabefelder (Read-Only)
- Halbstunden Tarif 1
- Halbstunden Tarif 2
- Gesamtkosten (EUR)
- Dauer in Minuten (Anzeige)
- Hinweise/Tags: Tarif 2 aktiv, Minutentarif (Luftfahrzeug), Mitternachtsuebergang

#### 3.2.3 Formular-Aktionen
- **Hinzufuegen/Speichern**: Validierung -> Berechnung -> Eintrag in Tabelle
- **Zuruecksetzen**: Formularfelder leeren
- **Schliessen/Abbrechen**: Dialog schliessen
- **Entwurf**: Auto-Save in localStorage (sgv-draft)

### 3.3 Einsatztabelle

#### 3.3.1 Darstellung
- Responsive HTML-Tabelle mit allen Spalten aus dem Formular
- Tagging: Tarif-2-Werte als Badge, Luftfahrzeug als eigener Tag
- Sortierbar per Klick auf Spaltenkoepfe (Bezeichnung, Art, Anzahl, Datum, Beginn, Ende, Kosten)
- Keine Filterfunktion im Ist-Stand

#### 3.3.2 Aktionen pro Zeile und Tabelle

**Aktionen pro Zeile (Icon-Buttons in letzter Spalte):**
- **Bearbeiten** (Stift-Icon): oeffnet Eintrag im Dialog zur Bearbeitung
- **Loeschen** (Papierkorb-Icon): loescht die Zeile mit Bestaetigungsdialog
  - Dialog: "Moechten Sie diesen Einsatz wirklich loeschen?"
  - Buttons: [Abbrechen] [Loeschen]

**Tabellen-Aktionen (im Tabellen-Header rechts):**
- **+ Zeile hinzufuegen**: oeffnet das Eingabeformular im Dialog
- **Alle loeschen**: loescht alle Eintraege mit Bestaetigungsdialog
  - Dialog: "Moechten Sie wirklich alle Eintraege loeschen? Dies kann nicht rueckgaengig gemacht werden."
  - Buttons: [Abbrechen] [Alle loeschen]

#### 3.3.3 Zusammenfassung (Ist-Stand)

**Footer der Tabelle (Verrechenbare Kosten):**
- Summe Eintraege
- **Summe verrechenbar** (nach SGV berechnet)
- Aufschluesselung nach Art der Kraefte:
  - Personal: XXX Halbstunden, XXX EUR
  - Dienstkraftfahrzeuge: XXX Halbstunden, XXX EUR
  - Luftfahrzeug: XXX Minuten, XXX EUR

**Separate Anzeige (Metadaten-Karte):**
- **Tatsaechliche Kosten** (unabhaengig von SGV)
- Formel: `Einsatzstunden x Eingesetzte Bedienstete x Durchschn. Stundensatz`
- Hinweis: "Dies sind die tatsaechlichen Personalkosten, nicht die verrechenbaren Gebuehren."

**Hinweis zur Darstellung (Ist-Stand):**
Die Exportfunktionen sind im oberen Menue gebuendelt; die Tabelle zeigt nur Daten und Zeilenaktionen.

### 3.4 Export-Funktionalitaet

#### 3.4.1 CSV-Export
- **Metadaten-Block** (erste Zeilen):
  - Dienststelle, Veranstaltung, Verein, Bescheid-Zahl, PAD-Zahl
  - Tarife (Personal T1/T2, Dienstfahrzeug, Luftfahrzeug pro Minute, Durchschn. Stundensatz)
  - Einsatzzeit von/bis, Eingesetzte Bedienstete
  - Einsatzstunden (berechnet)
  - Tatsaechliche Kosten (berechnet)
  - Leerzeile als Trenner
- **Einsatzdaten-Tabelle**: Alle Spalten inkl. berechneter Werte
- **Summenzeile** am Ende (Verrechenbare Kosten nach SGV)
- UTF-8 BOM + Semikolon als Trennzeichen (Excel-kompatibel)

**Beispiel CSV-Struktur:**
```
Dienststelle;BPK Dornbirn
Veranstaltung;Austria Wien vs Admira
Verein/Veranstalter;FK Austria Wien
Bescheid Zahl;2025-123456
PAD Zahl;PAD-2025-001

Tarife
Personal Tarif 1;17,00;EUR/30min
Personal Tarif 2;26,00;EUR/30min
Dienstfahrzeug;13,00;EUR/30min
Luftfahrzeug pro Minute;53,00;EUR/min
Durchschn. Stundensatz;38,40;EUR/h

Allgemeine Einsatzzeit
Von;2025-05-10T20:00
Bis;2025-05-10T23:15
Eingesetzte Bedienstete;10
Einsatzstunden;3,25
Tatsaechliche Kosten;1.248,00;EUR

Verrechenbare Leistungen (SGV)
Bezeichnung;Art;Anzahl;Datum;Beginn;Ende;Halbstunden T1;Halbstunden T2;Kosten
...

Summe verrechenbar (SGV);;;;;;;;;;2.500,00;EUR
```

#### 3.4.2 PDF-Export
- Querformat (bessere Spaltenbreite)
- **Kopfbereich**:
  - Ueberschrift "Berechnungsblatt fuer Ueberwachungsgebuehren"
  - Metadaten: Dienststelle, Veranstaltung, Verein, Bescheid-Zahl, PAD-Zahl
  - Tarife: Personal T1/T2, Dienstfahrzeug, Luftfahrzeug pro Minute, Durchschn. Stundensatz
  - Allgemeine Einsatzzeit: Von/Bis, Eingesetzte Bedienstete
- **Hauptteil**: Tabelle mit Einsatzdaten
- **Fussbereich**:
  - Summe verrechenbar (SGV)
  - Exportdatum (Locale de-AT)

#### 3.4.3 JSON-Export/Import
- Export erzeugt eine JSON-Datei mit `version`, `exportedAt`, `metadaten`, `eintraege`
- Import liest das gleiche Format ueber "Formular laden"

---

## 4. Berechnungslogik (Detaillierte Implementierung)

> **Hinweis zu Tarifsystemen**: Das vorliegende Lastenheft basiert auf dem Halbstundensystem gemäß § 1 Abs. 1 SGV (17€/26€ pro halbe Stunde). Falls in der Praxis ein Stundensystem verwendet wird (z.B. 26€/34€ pro Stunde wie im Header-Beispiel), müssen die Konstanten entsprechend angepasst werden. Die Berechnungslogik (Zeitscheiben-Algorithmus) bleibt identisch - nur die Konstanten-Werte ändern sich.

### 4.1 Konstanten (Standard-Gebührensätze gemäß SGV)

**Wichtig**: Diese Werte dienen als **Standardwerte** für die Tarif-Felder in den Metadaten. Der Benutzer kann diese Werte im Interface ändern. Die Berechnungen verwenden immer die aktuellen Werte aus den Metadaten!

```typescript
const DEFAULT_TARIFE = {
  PERSONAL: {
    TARIF_1: 17.00,  // € pro halbe Stunde (06:00-22:00, Mo-Sa)
    TARIF_2: 26.00   // € pro halbe Stunde (22:00-06:00 oder So/Feiertag)
  },
  FAHRZEUG: {
    ZUSATZ: 13.00    // € pro halbe Stunde (zusätzlich zum Personal)
  },
  LUFTFAHRZEUG: {
    PRO_MINUTE: 53.00 // € pro Minute (inkl. Personal)
  },
  DURCHSCHNITT: {
    STUNDENSATZ: 38.40 // € PRO STUNDE (für allgemeine Kostenberechnung)
  }
} as const;

const TARIF_2_ZEITRAUM = {
  START: 22, // 22:00 Uhr
  ENDE: 6    // 06:00 Uhr
};
```

### 4.2 Funktion: Zeitscheiben berechnen

```typescript
/**
 * Berechnet die Anzahl der 30-Minuten-Zeitscheiben
 * § 1 Abs. 1 SGV: Jede angefangene halbe Stunde wird voll verrechnet
 */
function calculateTimeSlices(start: string, end: string, date: Date): {
  tarif1: number;
  tarif2: number;
  totalMinutes: number;
} {
  // 1. Gesamtdauer berechnen (Mitternachtsübergang berücksichtigen)
  const duration = calculateDuration(start, end);
  
  // 2. Anzahl Zeitscheiben = aufrunden(Minuten / 30)
  const totalSlices = Math.ceil(duration / 30);
  
  // 3. Jede Zeitscheibe prüfen: Tarif 1 oder Tarif 2?
  let tarif1Count = 0;
  let tarif2Count = 0;
  
  for (let i = 0; i < totalSlices; i++) {
    const sliceStart = addMinutes(start, i * 30);
    const sliceEnd = addMinutes(start, Math.min((i + 1) * 30, duration));
    
    if (isTarif2(sliceStart, sliceEnd, date)) {
      tarif2Count++;
    } else {
      tarif1Count++;
    }
  }
  
  return { tarif1: tarif1Count, tarif2: tarif2Count, totalMinutes: duration };
}
```

### 4.3 Funktion: Tarif 2 Prüfung

```typescript
/**
 * Prüft, ob eine Zeitscheibe unter Tarif 2 fällt
 * Tarif 2 gilt bei:
 * - Nachtzeit (22:00 - 06:00)
 * - Sonn- oder Feiertag (ganztägig)
 */
function isTarif2(sliceStart: Date, sliceEnd: Date, date: Date): boolean {
  // Prüfung 1: Ist es ein Sonn- oder Feiertag?
  if (isSundayOrHoliday(date)) {
    return true;
  }
  
  // Prüfung 2: Liegt die Zeitscheibe (ganz oder teilweise) in der Nachtzeit?
  const startHour = sliceStart.getHours();
  const endHour = sliceEnd.getHours();
  
  // Nachtzeit: 22:00 - 06:00
  const isNightTime = (
    startHour >= 22 || startHour < 6 ||
    endHour >= 22 || endHour < 6 ||
    (startHour < 6 && endHour >= 22) // Über Mitternacht
  );
  
  return isNightTime;
}
```

### 4.4 Funktion: Feiertage Österreich

```typescript
/**
 * Gaußsche Osterformel zur Berechnung des Ostersonntags
 * Gültig für gregorianischen Kalender (ab 1583)
 */
function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

/**
 * Österreichische Feiertage (bundesweit)
 * Fixe + bewegliche Feiertage basierend auf Ostersonntag
 */
function isSundayOrHoliday(date: Date): boolean {
  // Sonntag?
  if (date.getDay() === 0) {
    return true;
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Fixe Feiertage (Monat/Tag)
  const fixedHolidays = [
    [1, 1],   // Neujahr
    [1, 6],   // Heilige Drei Könige
    [5, 1],   // Staatsfeiertag
    [8, 15],  // Mariä Himmelfahrt
    [10, 26], // Nationalfeiertag
    [11, 1],  // Allerheiligen
    [12, 8],  // Mariä Empfängnis
    [12, 25], // Christtag
    [12, 26]  // Stefanitag
  ];
  
  // Prüfe fixe Feiertage
  if (fixedHolidays.some(([m, d]) => m === month && d === day)) {
    return true;
  }
  
  // Bewegliche Feiertage (relativ zu Ostern)
  const easter = calculateEasterSunday(year);
  const dateTime = date.getTime();
  
  const movableHolidays = [
    new Date(easter.getTime() + 1 * 86400000),  // Ostermontag (+1 Tag)
    new Date(easter.getTime() + 39 * 86400000), // Christi Himmelfahrt (+39 Tage)
    new Date(easter.getTime() + 50 * 86400000), // Pfingstmontag (+50 Tage)
    new Date(easter.getTime() + 60 * 86400000)  // Fronleichnam (+60 Tage)
  ];
  
  // Prüfe bewegliche Feiertage (nur Datum, nicht Uhrzeit)
  return movableHolidays.some(holiday => 
    holiday.getFullYear() === year &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === day
  );
}
```

### 4.5 Funktion: Kostenberechnung

```typescript
/**
 * Berechnet die Gesamtkosten basierend auf Art, Anzahl und Zeitscheiben
 * Verwendet die aktuellen Tarife aus den Metadaten (nicht die Standardwerte!)
 */
function calculateCosts(
  type: 'Personal' | 'Dienstkraftfahrzeug' | 'Luftfahrzeug',
  amount: number,
  tarif1Slices: number,
  tarif2Slices: number,
  totalMinutes: number,
  tarife: Tarife  // Tarife aus Metadaten!
): number {
  if (type === 'Luftfahrzeug') {
    // § 1 Abs. 2 SGV: 53 € pro Minute (keine Zeitscheiben!)
    // Hinweis: Luftfahrzeug-Tarif ist fix, nicht änderbar
    return amount * totalMinutes * 53.00;
  }
  
  if (type === 'Dienstkraftfahrzeug') {
    // Fahrzeug = Fahrzeug-Zuschlag pro Zeitscheibe
    // Achtung: Kein Nachtzuschlag für das Fahrzeug selbst!
    const totalSlices = tarif1Slices + tarif2Slices;
    return amount * totalSlices * tarife.dienstfahrzeug;
  }
  
  // Personal (Standard)
  const costsT1 = amount * tarif1Slices * tarife.personalTarif1;
  const costsT2 = amount * tarif2Slices * tarife.personalTarif2;
  return costsT1 + costsT2;
}
```

### 4.6 Funktion: Allgemeine Kostenberechnung (Live-Berechnung)

```typescript
/**
 * Berechnet die tatsächlichen Kosten (unabhängig von SGV)
 * Diese Berechnung wird LIVE in den Metadaten angezeigt
 * 
 * Formel: (Einsatzzeit bis - Einsatzzeit von) in Stunden 
 *         × Eingesetzte Bedienstete 
 *         × Durchschn. Stundensatz
 * 
 * Beispiel: 3,25 Std × 10 Bedienstete × 38,40 €/Std = 1.248,00 €
 */
function calculateAllgemeineKosten(
  allgemeineEinsatzzeit: AllgemeineEinsatzzeit,
  durchschnStundensatz: number
): AllgemeineKostenberechnung {
  // Zeitdifferenz in Millisekunden
  const diffMs = allgemeineEinsatzzeit.bis.getTime() - allgemeineEinsatzzeit.von.getTime();
  
  // In Stunden umrechnen (auf 2 Dezimalstellen)
  const einsatzstunden = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  
  // Tatsächliche Kosten berechnen
  const tatsaechlicheKosten = 
    einsatzstunden * 
    allgemeineEinsatzzeit.eingesetzteBedienstete * 
    durchschnStundensatz;
  
  return {
    einsatzstunden,
    tatsaechlicheKosten: Math.round(tatsaechlicheKosten * 100) / 100 // Auf Cent runden
  };
}

/**
 * React Hook für Live-Berechnung (wird bei jeder Änderung aufgerufen)
 */
function useLiveAllgemeineKosten(metadaten: Metadaten): AllgemeineKostenberechnung | null {
  const { allgemeineEinsatzzeit, tarife } = metadaten;
  
  // Nur berechnen, wenn alle Felder ausgefüllt sind
  if (!allgemeineEinsatzzeit.von || 
      !allgemeineEinsatzzeit.bis || 
      !allgemeineEinsatzzeit.eingesetzteBedienstete ||
      allgemeineEinsatzzeit.eingesetzteBedienstete <= 0) {
    return null;
  }
  
  return calculateAllgemeineKosten(allgemeineEinsatzzeit, tarife.durchschnStundensatz);
}
```

### 4.7 Sonderfall: Mitternachtsübergang

```typescript
/**
 * Berechnet Dauer unter Berücksichtigung von Mitternachtsübergang
 */
function calculateDuration(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Wenn Ende < Start → Mitternachtsübergang
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // +24 Stunden
  }
  
  return endMinutes - startMinutes;
}
```

---

## 5. UI/UX Anforderungen

### 5.1 Layout-Struktur (Ist-Stand)
- Header mit Titel und Untertitel
- Metadaten-Karte (Grunddaten, Einsatzzeit, Tarife, Live-Berechnung)
- Einsatzformular im Modal-Dialog
- Tabelle mit Summenzeile
- Export/Import im Menue rechts oben

### 5.2 Formular-Feedback (Ist-Stand)

#### Live-Berechnung in Metadaten
- **Tatsaechliche Kosten** werden berechnet, sobald von/bis, Bedienstete und Stundensatz befuellt sind
- Anzeigezeile zeigt Einsatzstunden und die Formel (mit aktuellen Werten)
- Hinweistext bei unvollstaendigen Angaben

#### Live-Vorschau Einsatzformular
- Echtzeit-Vorschau: Halbstunden T1/T2, Gesamtkosten, Dauer in Minuten
- Tags: "Tarif 2 aktiv" und "Minutentarif" (Luftfahrzeug)
- Hinweis: "Mitternachtsuebergang erkannt" (Beginn > Ende)

#### Validierung
- Pflichtfelder via Zod
- Native Date/Time Inputs validieren Format
- Inline-Fehlertexte bei Pflichtfeldern

### 5.3 Accessibility (Ist-Stand)
- Semantische Labels fuer alle Inputs
- Native Date/Time Inputs liefern Browser-Accessibility
- Kontrastreiche Farben und ausreichende Touch-Targets

### 5.4 Responsive Breakpoints (Ist-Stand)
- Layout basiert auf CSS-Grid mit automatischem Umbruch
- Breakpoints bei ca. 768px und 640px (kleinere Schrift, gestapelte Inputs)
- Tabelle bleibt als HTML-Tabelle erhalten, Schriftgroesse wird reduziert

---

## 6. Datenmodell

### 6.1 TypeScript Interface (Ist-Stand)

```typescript
interface Tarife {
  personalTarif1: number; // 17.00 EUR pro 30 Minuten
  personalTarif2: number; // 26.00 EUR pro 30 Minuten
  dienstfahrzeug: number; // 13.00 EUR pro 30 Minuten
  luftfahrzeugProMinute: number; // 53.00 EUR pro Minute
  durchschnStundensatz: number; // 38.40 EUR pro Stunde
}

interface AllgemeineEinsatzzeit {
  von: string; // Local datetime: YYYY-MM-DDTHH:mm
  bis: string; // Local datetime: YYYY-MM-DDTHH:mm
  eingesetzteBedienstete: number;
}

interface Metadaten {
  dienststelle: string;
  veranstaltung: string;
  vereinVeranstalter: string;
  bescheidZahl?: string;
  padZahl?: string;
  tarife: Tarife;
  allgemeineEinsatzzeit: AllgemeineEinsatzzeit;
}

interface AllgemeineKostenberechnung {
  einsatzstunden: number;
  tatsaechlicheKosten: number;
}

type ArtDerKraefte = "Personal" | "Dienstkraftfahrzeug" | "Luftfahrzeug";

interface EinsatzEintrag {
  id: string; // UUID
  bezeichnung: string;
  artDerKraefte: ArtDerKraefte;
  anzahl: number;
  datum: string; // YYYY-MM-DD
  beginn: string; // HH:mm
  ende: string; // HH:mm
  zeitscheibenTarif1: number;
  zeitscheibenTarif2: number;
  gesamtkosten: number;
  erstelltAm: string; // ISO
  bearbeitetAm?: string; // ISO
}

interface EinsatzState {
  metadaten: Metadaten;
  eintraege: EinsatzEintrag[];
  filter: {
    datum?: string;
    artDerKraefte?: ArtDerKraefte;
  };
  sortierung: {
    spalte: keyof EinsatzEintrag;
    richtung: "asc" | "desc";
  };
}
```

### 6.2 Lokale Speicherung

```typescript
// localStorage Schema (Ist-Stand)
{
  "sgv-metadaten": Metadaten,
  "sgv-eintraege": EinsatzEintrag[],
  "sgv-draft": Partial<EinsatzEintrag>
}
```

---

## 7. Nicht-funktionale Anforderungen

### 7.1 Performance
- Initiales Laden < 2 Sekunden
- Formular-Reaktionszeit < 100ms
- Tabelle mit bis zu 1000 Einträgen flüssig

### 7.2 Browser-Kompatibilität
- Chrome/Edge (aktuelle Version - 2)
- Firefox (aktuelle Version - 2)
- Safari 15+

### 7.3 Sicherheit
- Keine sensiblen Daten im localStorage (nur Einsatzdaten)
- Input-Sanitization für alle Eingaben
- XSS-Schutz durch React-Standard

### 7.4 Wartbarkeit
- Komponenten < 300 Zeilen Code
- Klare Ordnerstruktur (siehe unten)
- TSDoc-Kommentare für alle Berechnungsfunktionen
- Unit-Tests für Berechnungslogik (Vitest)

---

## 8. Projektstruktur

```
abrechnungweb/
|-- src/
|   |-- components/
|   |   |-- ui/
|   |   |   |-- date-time-picker.tsx
|   |   |   |-- time-picker.tsx
|   |   |-- EinsatzFormular.tsx
|   |   |-- EinsatzTabelle.tsx
|   |   |-- ExportButtons.tsx
|   |   |-- Header.tsx
|   |   |-- MetadatenFormular.tsx
|   |-- constants/
|   |   |-- tarife.ts
|   |-- hooks/
|   |   |-- useEinsatzState.ts
|   |   |-- useLocalStorage.ts
|   |-- lib/
|   |   |-- austrian-holidays.ts
|   |   |-- calculations.ts
|   |   |-- export.ts
|   |   |-- utils.ts
|   |-- types/
|   |   |-- einsatz.ts
|   |-- App.tsx
|   |-- main.tsx
|   |-- styles.css
|-- tests/
|   |-- calculations.test.ts
|-- public/
|-- index.html
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- tsconfig.node.json
|-- vite.config.ts
```

---

## 9. Testfälle

### 9.1 Standardfall
- **Input**: Personal, 10 Einheiten, 10.05.2025, 20:00-23:15
- **Erwartung**: 
  - Dauer: 195 Min → 7 Zeitscheiben
  - T1: 4 Scheiben (20:00-22:00)
  - T2: 3 Scheiben (22:00-23:15, Nachtzuschlag)
  - Kosten: 10 × (4 × 17€ + 3 × 26€) = 1.460€

### 9.2 Mitternachtsübergang
- **Input**: Personal, 5 Einheiten, 10.05.2025, 23:00-01:30
- **Erwartung**: 
  - Dauer: 150 Min → 5 Zeitscheiben
  - T1: 0 Scheiben
  - T2: 5 Scheiben (komplett Nachtzeit)
  - Kosten: 5 × 5 × 26€ = 650€

### 9.3 Sonntagseinsatz
- **Input**: Personal, 8 Einheiten, 11.05.2025 (Sonntag), 10:00-14:00
- **Erwartung**: 
  - Dauer: 240 Min → 8 Zeitscheiben
  - T1: 0 Scheiben
  - T2: 8 Scheiben (Sonntag → ganztägig T2)
  - Kosten: 8 × 8 × 26€ = 1.664€

### 9.4 Luftfahrzeug
- **Input**: Luftfahrzeug, 1 Einheit, 10.05.2025, 15:00-15:37
- **Erwartung**: 
  - Dauer: 37 Minuten (exakt!)
  - Keine Zeitscheiben
  - Kosten: 1 × 37 × 53€ = 1.961€

### 9.5 Fahrzeug + Personal
- **Input**: Dienstkfz, 2 Einheiten, 10.05.2025, 20:00-23:15
- **Erwartung**: 
  - 7 Zeitscheiben
  - Nur Fahrzeugkosten: 2 × 7 × 13€ = 182€
  - (Personal muss separat erfasst werden!)

### 9.6 Beweglicher Feiertag (Ostermontag)
- **Input**: Personal, 6 Einheiten, 21.04.2025 (Ostermontag), 08:00-12:00
- **Erwartung**: 
  - Dauer: 240 Min → 8 Zeitscheiben
  - T1: 0 Scheiben
  - T2: 8 Scheiben (Ostermontag → ganztägig T2)
  - Kosten: 6 × 8 × 26€ = 1.248€
  - **Wichtig**: Gaußsche Osterformel muss Ostern 2025 = 20.04. berechnen → Ostermontag = 21.04.

### 9.7 Allgemeine Kostenberechnung (Metadaten - Live-Berechnung)
- **Input (Metadaten)**:
  - Einsatzzeit von: 10.05.2025 20:00
  - Einsatzzeit bis: 10.05.2025 23:15
  - Eingesetzte Bedienstete: 10
  - Durchschn. Stundensatz: 38,40 €/Std
- **Erwartung**:
  - Einsatzdauer: 3 Std 15 Min = 3,25 Std
  - Formel: 3,25 Std × 10 Bedienstete × 38,40 €/Std
  - **Tatsächliche Kosten: 1.248,00 €**
  - **Wichtig**: 
    - Diese Berechnung läuft LIVE während der Eingabe
    - Unabhängig von den verrechenbaren Kosten in der Tabelle!
    - Wird im Metadaten-Bereich sofort angezeigt

### 9.8 Live-Update Test
- **Szenario**: Benutzer ändert "Eingesetzte Bedienstete" von 10 auf 15
- **Input**: 
  - Einsatzzeit unverändert: 3,25 Std
  - Eingesetzte Bedienstete: 15 (geändert)
  - Durchschn. Stundensatz: 38,40 €/Std
- **Erwartung**:
  - UI aktualisiert sich automatisch
  - Neue Tatsächliche Kosten: 3,25 × 15 × 38,40 = **1.872,00 €**
  - Kein "Berechnen"-Button nötig!

---

## 10. Implementierungsstand (Ist-Stand)

### 10.1 Kernmodule
- `src/App.tsx`: State, Sortierung, Dialog-Steuerung, Summenberechnung
- `src/components/*.tsx`: Header, Metadaten-Formular, Einsatz-Formular, Tabelle, Export-Menue
- `src/components/ui/*`: Native Date/Time Inputs
- `src/lib/calculations.ts`: Berechnungslogik (Zeitscheiben, Feiertage, Kosten)
- `src/lib/export.ts`: CSV/PDF/JSON Export
- `src/hooks/useEinsatzState.ts`: localStorage Persistenz
- `tests/calculations.test.ts`: Unit-Tests fuer Berechnungen

### 10.2 Kritische Punkte (Ist-Stand)
- Halbstunden-Aufrundung: jede angefangene 30 Minuten zaehlt voll
- Sonntag/Feiertag => Tarif 2 ganztags
- Mitternachtsuebergang (Ende < Beginn) wird korrekt berechnet
- Luftfahrzeug: Abrechnung pro Minute, keine Zeitscheiben
- Tarife kommen aus Metadaten (veraenderbar)
- Durchschn. Stundensatz bezieht sich auf 1 Stunde

---

## 11. Lieferumfang

### 11.1 Finales Deliverable
- Voll funktionsfähige Webanwendung
- `README.md` mit Setup-Anleitung
- Beispiel-Daten (5-10 Testeinträge)
- Build-Skripte (`npm run build`)
- Development-Server (`npm run dev`)

### 11.2 Dokumentation
- Inline-Kommentare für komplexe Logik
- JSDoc für alle öffentlichen Funktionen
- `CHANGELOG.md` für spätere Erweiterungen

---

## 12. Zukünftige Erweiterungen (Optional)

Diese Features sind NICHT Teil des ersten Releases, können aber später ergänzt werden:
- 🔄 Mehrere Einsätze gleichzeitig erfassen (Batch-Mode)
- 📊 Statistik-Dashboard (monatliche Auswertungen)
- 👥 Multi-User mit Backend (Datenbank)
- 🖨️ Direkte Rechnungserstellung mit Logo
- 📱 Native Mobile App (React Native)

---

## Anhang: Gesetzliche Grundlagen

**Sicherheitsgebühren-Verordnung (SGV)**
- § 1 Abs. 1: Zeitscheiben-Abrechnung Personal (17€/26€)
- § 1 Abs. 2: Fahrzeuge (13€) & Luftfahrzeuge (53€/Min)
- § 3: Wegzeiten werden nicht verrechnet

**Sicherheitspolizeigesetz (SPG)**
- § 5a: Rechtsgrundlage für Gebührenverrechnung

---

**Erstellt am**: 2026-01-17  
**Version**: 1.1  
**Autor**: Bundespolizei Vorarlberg

---

## Quick-Start

```bash
npm install
npm run dev
npm run test
npm run build
```
