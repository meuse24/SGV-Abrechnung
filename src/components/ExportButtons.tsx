import { useRef, useState, type ChangeEvent } from "react";
import { Menu } from "lucide-react";
import type { EinsatzEintrag, Metadaten } from "../types/einsatz";
import { downloadCsv, downloadDetailCsv, downloadJson, downloadPdf } from "../lib/export";

interface ExportButtonsProps {
  metadaten: Metadaten;
  eintraege: EinsatzEintrag[];
  onImportJson?: (payload: unknown) => void;
  onReset?: () => void;
}

export default function ExportButtons({
  metadaten,
  eintraege,
  onImportJson,
  onReset
}: ExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDetailsElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const year = new Date().getFullYear();

  const closeMenu = () => {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  };

  const handleImportClick = () => {
    closeMenu();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      onImportJson?.(parsed);
    } catch {
      window.alert("Die JSON-Datei konnte nicht geladen werden.");
    } finally {
      event.target.value = "";
    }
  };

  const handleExport = (action: () => void) => {
    action();
    closeMenu();
  };

  return (
    <div className="actions export-actions">
      <details className="menu" ref={menuRef}>
        <summary className="menu-trigger">
          <Menu size={18} />
          Menü
        </summary>
        <div className="menu-content">
          <button type="button" onClick={handleImportClick}>
            Formular laden
          </button>
          <button type="button" onClick={() => handleExport(() => downloadJson(metadaten, eintraege))}>
            Formular speichern
          </button>
          <button
            type="button"
            onClick={() => {
              onReset?.();
              closeMenu();
            }}
          >
            Formular zurücksetzen
          </button>
          <button type="button" onClick={() => handleExport(() => downloadCsv(metadaten, eintraege))}>
            CSV Export
          </button>
          <button
            type="button"
            onClick={() => handleExport(() => downloadDetailCsv(metadaten, eintraege))}
          >
            Detail Auswertung
          </button>
          <button type="button" onClick={() => handleExport(() => downloadPdf(metadaten, eintraege))}>
            PDF erstellen
          </button>
          <button
            type="button"
            onClick={() => {
              setHelpOpen(true);
              setInfoOpen(false);
              closeMenu();
            }}
          >
            Hilfe
          </button>
          <button
            type="button"
            onClick={() => {
              setInfoOpen(true);
              setHelpOpen(false);
              closeMenu();
            }}
          >
            Info
          </button>
        </div>
      </details>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {infoOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card info-card">
            <div className="info-header">
              <div>
                <p className="info-kicker">SGV Erfassung</p>
                <h2 className="info-title">Info</h2>
                <p className="info-subtitle">
                  Webformular zur Erfassung und Berechnung verrechenbarer Leistungen.
                </p>
              </div>
            </div>

            <div className="info-banner">
              <span>&Uuml;berwachungsgeb&uuml;hren &middot; Sicherheitsgeb&uuml;hrenverordnung</span>
            </div>

            <div className="info-grid">
              <div className="info-block">
                <h3>Software-Stack</h3>
                <ul className="info-list">
                  <li>Vite, React, TypeScript</li>
                  <li>React Hook Form, Zod</li>
                  <li>date-fns, TanStack Table</li>
                  <li>jsPDF, jsPDF AutoTable</li>
                </ul>
              </div>
              <div className="info-block">
                <h3>Datenhaltung</h3>
                <p>
                  Keine Daten werden am Server gespeichert. Speichern/Laden erfolgt lokal im Browser.
                </p>
              </div>
              <div className="info-block">
                <h3>KI-Unterstützung</h3>
                <p>Codex und Claude Code für Analyse, Umsetzung und Tests.</p>
              </div>
            </div>

            <div className="info-footer">
              <span>© {year} Günther Meusburger</span>
              <button type="button" className="secondary info-close" onClick={() => setInfoOpen(false)}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {helpOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card help-card">
            <div className="info-header">
              <div>
                <p className="info-kicker">Kurzanleitung</p>
                <h2 className="info-title">Hilfe</h2>
                <p className="info-subtitle">
                  So erfassen Sie Eins&auml;tze und erstellen Exporte in wenigen Schritten.
                </p>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-block">
                <h3>1) Metadaten</h3>
                <ul className="help-list">
                  <li>Dienststelle, Veranstaltung und Veranstalter eintragen</li>
                  <li>Einsatzzeit von/bis w&auml;hlen</li>
                  <li>Bedienstete und Tarife pr&uuml;fen/anpassen</li>
                </ul>
              </div>
              <div className="info-block">
                <h3>2) Einsatz erfassen</h3>
                <ul className="help-list">
                  <li>Bezeichnung, Art, Anzahl, Datum, Beginn und Ende ausf&uuml;llen</li>
                  <li>Live-Vorschau pr&uuml;fen (Tarif 2/Minutentarif)</li>
                  <li>Mit &quot;Hinzuf&uuml;gen&quot; speichern</li>
                </ul>
              </div>
              <div className="info-block">
                <h3>3) Tabelle &amp; Aktionen</h3>
                <ul className="help-list">
                  <li>Eintr&auml;ge per Stift bearbeiten oder per Papierkorb l&ouml;schen</li>
                  <li>Sortierung durch Klick auf Spaltenk&ouml;pfe</li>
                  <li>Summen im Tabellen-Footer beachten</li>
                </ul>
              </div>
              <div className="info-block">
                <h3>4) Export/Import</h3>
                <ul className="help-list">
                  <li>Men&uuml; oben rechts &ouml;ffnen</li>
                  <li>CSV, PDF oder JSON exportieren</li>
                  <li>JSON f&uuml;r sp&auml;teres Laden speichern</li>
                </ul>
              </div>
            </div>

            <div className="info-footer">
              <span>Stand: {year}</span>
              <button type="button" className="secondary info-close" onClick={() => setHelpOpen(false)}>
                Schlie&szlig;en
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
