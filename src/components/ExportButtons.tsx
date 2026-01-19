import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Menu } from "lucide-react";
import type { EinsatzEintrag, Metadaten } from "../types/einsatz";
import { downloadCsv, downloadDetailCsv, downloadJson, downloadPdf, type PdfSummary } from "../lib/export";

interface ExportButtonsProps {
  metadaten: Metadaten;
  eintraege: EinsatzEintrag[];
  summary: PdfSummary;
  onImportJson?: (payload: unknown) => void;
  onReset?: () => void;
  onOpenTarife?: () => void;
}

export default function ExportButtons({
  metadaten,
  eintraege,
  summary,
  onImportJson,
  onReset,
  onOpenTarife
}: ExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDetailsElement | null>(null);
  const dinoIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dinoOpen, setDinoOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dinoOpen) {
        setDinoOpen(false);
      }
    };

    if (dinoOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [dinoOpen]);

  useEffect(() => {
    if (dinoOpen && dinoIframeRef.current) {
      // Focus the iframe after a short delay to ensure it's rendered
      const timer = setTimeout(() => {
        dinoIframeRef.current?.focus();
        // Try to focus the content window as well
        try {
          dinoIframeRef.current?.contentWindow?.focus();
        } catch (e) {
          // Ignore cross-origin errors
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dinoOpen]);

  useEffect(() => {
    // Prevent background scrolling when dino overlay is open
    if (dinoOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [dinoOpen]);

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

  const handleOpenTarife = () => {
    if (onOpenTarife) {
      onOpenTarife();
    }
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
          <button type="button" onClick={() => handleExport(() => downloadPdf(metadaten, eintraege, summary))}>
            PDF erstellen
          </button>
          {onOpenTarife ? (
            <button type="button" onClick={handleOpenTarife}>
              Tarife
            </button>
          ) : null}
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
          <button
            type="button"
            onClick={() => {
              setDinoOpen(true);
              setInfoOpen(false);
              setHelpOpen(false);
              closeMenu();
            }}
          >
            Dino Pause
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
                  <li>Tarifmodell w&auml;hlen und Tarife pr&uuml;fen</li>
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
              <div className="info-block">
                <h3>5) Tarifberechnung</h3>
                <ul className="help-list">
                  <li>Abgerechnet wird in 30-Minuten-Schritten: jede begonnene Halbstunde z&auml;hlt.</li>
                  <li>Ma&szlig;geblich ist immer der Beginn der Halbstunde (nicht das Ende).</li>
                  <li>Tarif 2 gilt, wenn die Halbstunde zwischen 22:00 und 06:00 beginnt.</li>
                  <li>Tarif 2 gilt auch, wenn die Halbstunde an einem Sonn- oder Feiertag beginnt.</li>
                  <li>Beispiel (Werktag): 21:15-22:15 = zwei Halbstunden Tarif 1.</li>
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

      {dinoOpen ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDinoOpen(false);
            }
          }}
        >
          <div className="modal-card dino-game-card">
            <div className="dino-game-header">
              <h2 className="info-title">Dino Pause</h2>
              <p className="info-subtitle">
                Drücken Sie die Leertaste oder tippen Sie, um zu springen!
              </p>
            </div>

            <div className="dino-game-container">
              <iframe
                ref={dinoIframeRef}
                key={dinoOpen ? Date.now() : 'closed'}
                src="/dino/index.html"
                title="Dino Game"
                className="dino-game-iframe"
                sandbox="allow-scripts allow-same-origin"
                tabIndex={0}
              />
            </div>

            <div className="info-footer">
              <span>Chrome Dino Clone</span>
              <button
                type="button"
                className="secondary info-close"
                onClick={() => setDinoOpen(false)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
