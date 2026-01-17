import { useState, type ChangeEvent } from "react";
import type { Metadaten, TarifKategorie, TarifKonfiguration } from "../types/einsatz";
import DateTimePicker from "./ui/date-time-picker";
import { calculateEinsatzstunden, roundTo2 } from "../lib/calculations";
import { formatCurrency, formatNumber } from "../lib/utils";

interface MetadatenFormularProps {
  metadaten: Metadaten;
  tarifConfig: TarifKonfiguration;
  onTarifConfigChange?: (next: TarifKonfiguration) => void;
  onChange: (next: Metadaten) => void;
  onTarifKategorieChange?: (next: TarifKategorie) => void;
  tarifDialogOpen?: boolean;
  onTarifDialogOpen?: () => void;
  onTarifDialogClose?: () => void;
  onReloadTarife?: () => void;
  tarifeStatus?: {
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  };
}

const TARIF_OPTIONEN: Array<{ value: TarifKategorie; label: string }> = [
  { value: "standard", label: "Standard" },
  {
    value: "gesundheit",
    label: "\u00d6ffentl. Gesundheitsinteresse (mit Erwerbsinteresse)"
  },
  {
    value: "gesundheitOhneErwerb",
    label: "\u00d6ffentl. Gesundheitsinteresse (ohne Erwerbsinteresse)"
  }
];

export default function MetadatenFormular({
  metadaten,
  tarifConfig,
  onTarifConfigChange,
  onChange,
  onTarifKategorieChange,
  tarifDialogOpen,
  onTarifDialogOpen,
  onTarifDialogClose,
  onReloadTarife,
  tarifeStatus
}: MetadatenFormularProps) {
  const [localTarifDialogOpen, setLocalTarifDialogOpen] = useState(false);
  const isTarifDialogOpen = tarifDialogOpen ?? localTarifDialogOpen;
  const openTarifDialog = onTarifDialogOpen ?? (() => setLocalTarifDialogOpen(true));
  const closeTarifDialog = onTarifDialogClose ?? (() => setLocalTarifDialogOpen(false));
  const einsatzstunden = calculateEinsatzstunden(
    metadaten.allgemeineEinsatzzeit.von,
    metadaten.allgemeineEinsatzzeit.bis
  );
  const hasBerechnung =
    einsatzstunden !== null &&
    metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete > 0 &&
    metadaten.tarife.durchschnStundensatz > 0;

  const tatsaechlicheKosten = hasBerechnung
    ? roundTo2(
        einsatzstunden! *
          metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete *
          metadaten.tarife.durchschnStundensatz
      )
    : null;

  const updateField = (field: keyof Metadaten, value: string) => {
    onChange({ ...metadaten, [field]: value });
  };

  const updateTarifKategorie = (next: TarifKategorie) => {
    if (onTarifKategorieChange) {
      onTarifKategorieChange(next);
      return;
    }
    onChange({ ...metadaten, tarifKategorie: next });
  };

  const updateTarif = (field: keyof Metadaten["tarife"], value: number) => {
    onChange({
      ...metadaten,
      tarife: {
        ...metadaten.tarife,
        [field]: value
      }
    });
  };

  const updateTarifKonfigKategorie = (
    kategorie: TarifKategorie,
    field: "tarif1" | "tarif2",
    value: number
  ) => {
    if (!onTarifConfigChange) {
      return;
    }
    onTarifConfigChange({
      ...tarifConfig,
      kategorien: {
        ...tarifConfig.kategorien,
        [kategorie]: {
          ...tarifConfig.kategorien[kategorie],
          [field]: value
        }
      }
    });
  };

  const updateTarifKonfigZusatz = (
    field: "dienstfahrzeug" | "luftfahrzeugProMinute",
    value: number
  ) => {
    if (!onTarifConfigChange) {
      return;
    }
    onTarifConfigChange({
      ...tarifConfig,
      zusatz: {
        ...tarifConfig.zusatz,
        [field]: value
      }
    });
  };

  const updateEinsatzzeit = (field: keyof Metadaten["allgemeineEinsatzzeit"], value: string | number) => {
    onChange({
      ...metadaten,
      allgemeineEinsatzzeit: {
        ...metadaten.allgemeineEinsatzzeit,
        [field]: value
      }
    });
  };

  const handleNumberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    return Number.isNaN(value) ? 0 : value;
  };

  return (
    <section className="card metadata-card">
      <div className="section-header">
        <h2>Einsatzdaten</h2>
        {onReloadTarife ? (
          <div className="section-actions">
            <button
              type="button"
              className="ghost small-button"
              onClick={openTarifDialog}
            >
              Tarife anzeigen
            </button>
          </div>
        ) : null}
      </div>
      <div className="metadata-row metadata-row-1">
        <div>
          <label htmlFor="dienststelle">Dienststelle</label>
          <input
            id="dienststelle"
            value={metadaten.dienststelle}
            maxLength={50}
            onChange={(event) => updateField("dienststelle", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="veranstaltung">Veranstaltung</label>
          <input
            id="veranstaltung"
            value={metadaten.veranstaltung}
            maxLength={200}
            onChange={(event) => updateField("veranstaltung", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="verein">Verein/Veranstalter</label>
          <input
            id="verein"
            value={metadaten.vereinVeranstalter}
            maxLength={100}
            onChange={(event) => updateField("vereinVeranstalter", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bescheid">Bescheid Zahl</label>
          <input
            id="bescheid"
            value={metadaten.bescheidZahl ?? ""}
            maxLength={50}
            onChange={(event) => updateField("bescheidZahl", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="pad">PAD Zahl</label>
          <input
            id="pad"
            value={metadaten.padZahl ?? ""}
            maxLength={50}
            onChange={(event) => updateField("padZahl", event.target.value)}
          />
        </div>
      </div>

      <div className="metadata-row metadata-row-2">
        <div>
          <label>Einsatzzeit von</label>
          <DateTimePicker
            value={metadaten.allgemeineEinsatzzeit.von}
            onChange={(value) => updateEinsatzzeit("von", value)}
          />
        </div>
        <div>
          <label>Einsatzzeit bis</label>
          <DateTimePicker
            value={metadaten.allgemeineEinsatzzeit.bis}
            onChange={(value) => updateEinsatzzeit("bis", value)}
          />
        </div>
        <div>
          <label htmlFor="bedienstete">Eingesetzte Bedienstete</label>
          <input
            id="bedienstete"
            type="number"
            min={0}
            value={metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete}
            onChange={(event) =>
              updateEinsatzzeit("eingesetzteBedienstete", handleNumberChange(event))
            }
          />
        </div>
        <div className="metadata-summary-line">
          {hasBerechnung ? (
            <span>
              Einsatzstunden: {formatNumber(einsatzstunden!, 2)} Std | Tats&auml;chliche Kosten:{" "}
              {formatCurrency(tatsaechlicheKosten!)} (
              {formatNumber(einsatzstunden!, 2)} *{" "}
              {metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete} *{" "}
              {formatNumber(metadaten.tarife.durchschnStundensatz, 2)})
            </span>
          ) : (
            <small className="muted">
              Bitte alle Felder f&uuml;r die Live-Berechnung ausf&uuml;llen.
            </small>
          )}
        </div>
      </div>

      <div className="metadata-row metadata-row-3">
        <div>
          <label htmlFor="tarifModell">Tarifmodell</label>
          <select
            id="tarifModell"
            value={metadaten.tarifKategorie}
            onChange={(event) => updateTarifKategorie(event.target.value as TarifKategorie)}
          >
            {TARIF_OPTIONEN.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Personal Tarif 1 (pro 30 Min)</label>
          <input type="text" value={formatNumber(metadaten.tarife.personalTarif1, 2)} readOnly />
        </div>
        <div>
          <label>Personal Tarif 2 (pro 30 Min)</label>
          <input type="text" value={formatNumber(metadaten.tarife.personalTarif2, 2)} readOnly />
        </div>
        <div>
          <label>Dienstfahrzeug (pro 30 Min)</label>
          <input type="text" value={formatNumber(metadaten.tarife.dienstfahrzeug, 2)} readOnly />
        </div>
        <div>
          <label>Luftfahrzeug (pro Minute)</label>
          <input type="text" value={formatNumber(metadaten.tarife.luftfahrzeugProMinute, 2)} readOnly />
        </div>
        <div>
          <label htmlFor="stundensatz">Durchschn. Stundensatz</label>
          <input
            id="stundensatz"
            type="number"
            value={metadaten.tarife.durchschnStundensatz}
            step="0.1"
            onChange={(event) => updateTarif("durchschnStundensatz", handleNumberChange(event))}
          />
        </div>
      </div>

      {isTarifDialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card tarif-card">
            <div className="info-header">
              <div>
                <p className="info-kicker">&Uuml;berwachungsgeb&uuml;hren</p>
                <h2 className="info-title">Kurz&uuml;bersicht</h2>
                <p className="info-subtitle">
                  Tarife gem&auml;&szlig; Sicherheitsgeb&uuml;hrenverordnung (SGV).
                </p>
                <small className="muted">
                  Alle Werte in EUR pro 30 Minuten (Luftfahrzeug pro Minute).
                </small>
              </div>
            </div>

            <div className="tarif-table-wrapper">
              <table className="tarif-table">
                <thead>
                  <tr>
                    <th>Art der &Uuml;berwachung</th>
                    <th>Normalzeit (06:00-22:00, Werktage) &ndash; EUR/30 Min</th>
                    <th>Nacht / Sonn- &amp; Feiertage &ndash; EUR/30 Min</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Standard&uuml;berwachung</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.standard.tarif1}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "standard",
                            "tarif1",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.standard.tarif2}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "standard",
                            "tarif2",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>&Ouml;ffentliches Interesse (Gesundheit)</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.gesundheit.tarif1}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "gesundheit",
                            "tarif1",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.gesundheit.tarif2}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "gesundheit",
                            "tarif2",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>&Ouml;ffentliches Interesse ohne Erwerbsinteresse</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.gesundheitOhneErwerb.tarif1}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "gesundheitOhneErwerb",
                            "tarif1",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.kategorien.gesundheitOhneErwerb.tarif2}
                        onChange={(event) =>
                          updateTarifKonfigKategorie(
                            "gesundheitOhneErwerb",
                            "tarif2",
                            handleNumberChange(event)
                          )
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tarif-subsection">
              <h3>Zusatzkosten</h3>
              <table className="tarif-table tarif-table-small">
                <thead>
                  <tr>
                    <th>Zusatz</th>
                    <th>Geb&uuml;hr</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dienstfahrzeug</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.zusatz.dienstfahrzeug}
                        onChange={(event) =>
                          updateTarifKonfigZusatz("dienstfahrzeug", handleNumberChange(event))
                        }
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Luftfahrzeug</td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={tarifConfig.zusatz.luftfahrzeugProMinute}
                        onChange={(event) =>
                          updateTarifKonfigZusatz("luftfahrzeugProMinute", handleNumberChange(event))
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="info-footer">
              <div className="tarif-footer-meta">
                <span>Stand: {new Date().getFullYear()}</span>
                {tarifeStatus && tarifeStatus.state !== "idle" ? (
                  <small className={`status-text status-${tarifeStatus.state}`}>
                    {tarifeStatus.message}
                  </small>
                ) : null}
              </div>
              <div className="tarif-footer-actions">
                {onReloadTarife ? (
                  <button type="button" className="ghost small-button" onClick={onReloadTarife}>
                    Tarife neu laden
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary info-close"
                  onClick={closeTarifDialog}
                >
                  Schlie&szlig;en
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
