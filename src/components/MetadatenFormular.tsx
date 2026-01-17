import type { ChangeEvent } from "react";
import type { Metadaten } from "../types/einsatz";
import DateTimePicker from "./ui/date-time-picker";
import { calculateEinsatzstunden, roundTo2 } from "../lib/calculations";
import { formatCurrency, formatNumber } from "../lib/utils";

interface MetadatenFormularProps {
  metadaten: Metadaten;
  onChange: (next: Metadaten) => void;
}

export default function MetadatenFormular({ metadaten, onChange }: MetadatenFormularProps) {
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

  const updateTarif = (field: keyof Metadaten["tarife"], value: number) => {
    onChange({
      ...metadaten,
      tarife: {
        ...metadaten.tarife,
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
      <h2>Metadaten</h2>
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
          <label htmlFor="tarif1">Personal Tarif 1 (pro 30 Min)</label>
          <input
            id="tarif1"
            type="number"
            value={metadaten.tarife.personalTarif1}
            step="0.1"
            onChange={(event) =>
              updateTarif("personalTarif1", handleNumberChange(event))
            }
          />
        </div>
        <div>
          <label htmlFor="tarif2">Personal Tarif 2 (pro 30 Min)</label>
          <input
            id="tarif2"
            type="number"
            value={metadaten.tarife.personalTarif2}
            step="0.1"
            onChange={(event) =>
              updateTarif("personalTarif2", handleNumberChange(event))
            }
          />
        </div>
        <div>
          <label htmlFor="fahrzeug">Dienstfahrzeug (pro 30 Min)</label>
          <input
            id="fahrzeug"
            type="number"
            value={metadaten.tarife.dienstfahrzeug}
            step="0.1"
            onChange={(event) =>
              updateTarif("dienstfahrzeug", handleNumberChange(event))
            }
          />
        </div>
        <div>
          <label htmlFor="luftfahrzeug">Luftfahrzeug (pro Minute)</label>
          <input
            id="luftfahrzeug"
            type="number"
            value={metadaten.tarife.luftfahrzeugProMinute}
            step="0.1"
            onChange={(event) =>
              updateTarif("luftfahrzeugProMinute", handleNumberChange(event))
            }
          />
        </div>
        <div>
          <label htmlFor="stundensatz">Durchschn. Stundensatz</label>
          <input
            id="stundensatz"
            type="number"
            value={metadaten.tarife.durchschnStundensatz}
            step="0.1"
            onChange={(event) =>
              updateTarif("durchschnStundensatz", handleNumberChange(event))
            }
          />
        </div>
      </div>
    </section>
  );
}
