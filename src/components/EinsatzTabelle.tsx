import { Pencil, Trash2 } from "lucide-react";
import type { EinsatzEintrag } from "../types/einsatz";
import { formatCurrency } from "../lib/utils";

interface EinsatzTabelleProps {
  eintraege: EinsatzEintrag[];
  onEdit: (entry: EinsatzEintrag) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onAddNew: () => void;
  sort: {
    key: keyof EinsatzEintrag;
    direction: "asc" | "desc";
  };
  onSortChange: (key: keyof EinsatzEintrag) => void;
  summary: {
    totalKosten: number;
    totalEintraege: number;
    personal: { scheiben: number; kosten: number };
    fahrzeug: { scheiben: number; kosten: number };
    luft: { minuten: number; kosten: number };
    peakPersonal: { count: number; time: Date | null };
  };
}

export default function EinsatzTabelle({
  eintraege,
  onEdit,
  onDelete,
  onClear,
  onAddNew,
  sort,
  onSortChange,
  summary
}: EinsatzTabelleProps) {
  const ariaSortFor = (key: keyof EinsatzEintrag) => {
    if (sort.key !== key) {
      return "none";
    }
    return sort.direction === "asc" ? "ascending" : "descending";
  };

  return (
    <section className="card">
      <div className="table-header">
        <h2>Verrechenbare Leistungen (SGV)</h2>
        <div className="actions table-header-actions">
          <button type="button" onClick={onAddNew}>
            + Zeile hinzuf&uuml;gen
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (
                window.confirm(
                  "M\u00f6chten Sie wirklich alle Eintr\u00e4ge l\u00f6schen? Dies kann nicht r\u00fcckg\u00e4ngig gemacht werden."
                )
              ) {
                onClear();
              }
            }}
          >
            Alle l&ouml;schen
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => onSortChange("bezeichnung")} aria-sort={ariaSortFor("bezeichnung")}>
                Bezeichnung
              </th>
              <th onClick={() => onSortChange("artDerKraefte")} aria-sort={ariaSortFor("artDerKraefte")}>
                Art
              </th>
              <th onClick={() => onSortChange("anzahl")} aria-sort={ariaSortFor("anzahl")}>
                Anzahl
              </th>
              <th onClick={() => onSortChange("datum")} aria-sort={ariaSortFor("datum")}>
                Datum
              </th>
              <th onClick={() => onSortChange("beginn")} aria-sort={ariaSortFor("beginn")}>
                Beginn
              </th>
              <th onClick={() => onSortChange("ende")} aria-sort={ariaSortFor("ende")}>
                Ende
              </th>
              <th>T1</th>
              <th>T2</th>
              <th onClick={() => onSortChange("gesamtkosten")} aria-sort={ariaSortFor("gesamtkosten")}>
                Kosten
              </th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {eintraege.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <small className="muted">Noch keine Eintr&auml;ge vorhanden.</small>
                </td>
              </tr>
            ) : (
              eintraege.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.bezeichnung}</td>
                  <td>
                    <span
                      className={`tag ${
                        entry.artDerKraefte === "Luftfahrzeug" ? "luft" : ""
                      }`}
                    >
                      {entry.artDerKraefte}
                    </span>
                  </td>
                  <td>{entry.anzahl}</td>
                  <td>{entry.datum}</td>
                  <td>{entry.beginn}</td>
                  <td>{entry.ende}</td>
                  <td>{entry.zeitscheibenTarif1}</td>
                  <td>
                    {entry.zeitscheibenTarif2 > 0 ? (
                      <span className="tag tarif2">{entry.zeitscheibenTarif2}</span>
                    ) : (
                      entry.zeitscheibenTarif2
                    )}
                  </td>
                  <td>{formatCurrency(entry.gesamtkosten)}</td>
                  <td>
                    <div className="table-row-actions">
                      <button
                        type="button"
                        className="icon-button ghost"
                        aria-label="Bearbeiten"
                        title="Bearbeiten"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-button secondary"
                        aria-label="L\u00f6schen"
                        title="L\u00f6schen"
                        onClick={() => {
                          if (
                            window.confirm(
                              "M\u00f6chten Sie diesen Einsatz wirklich l\u00f6schen?"
                            )
                          ) {
                            onDelete(entry.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards">
        {eintraege.length === 0 ? (
          <div className="mobile-card empty-card">
            <small className="muted">Noch keine Eintr&auml;ge vorhanden.</small>
          </div>
        ) : (
          eintraege.map((entry) => (
            <div className="mobile-card" key={entry.id}>
              <div className="mobile-card-header">
                <div className="mobile-card-title">{entry.bezeichnung}</div>
                <span
                  className={`tag ${
                    entry.artDerKraefte === "Luftfahrzeug" ? "luft" : ""
                  }`}
                >
                  {entry.artDerKraefte}
                </span>
              </div>
              <div className="mobile-card-row">
                <span>Datum</span>
                <span>{entry.datum}</span>
              </div>
              <div className="mobile-card-row">
                <span>Beginn</span>
                <span>{entry.beginn}</span>
              </div>
              <div className="mobile-card-row">
                <span>Ende</span>
                <span>{entry.ende}</span>
              </div>
              <div className="mobile-card-row">
                <span>Anzahl</span>
                <span>{entry.anzahl}</span>
              </div>
              <div className="mobile-card-row">
                <span>Halbstunden T1</span>
                <span>{entry.zeitscheibenTarif1}</span>
              </div>
              <div className="mobile-card-row">
                <span>Halbstunden T2</span>
                <span>
                  {entry.zeitscheibenTarif2 > 0 ? (
                    <span className="tag tarif2">{entry.zeitscheibenTarif2}</span>
                  ) : (
                    entry.zeitscheibenTarif2
                  )}
                </span>
              </div>
              <div className="mobile-card-row">
                <span>Kosten</span>
                <strong>{formatCurrency(entry.gesamtkosten)}</strong>
              </div>
              <div className="mobile-card-actions">
                <button
                  type="button"
                  className="icon-button ghost"
                  aria-label="Bearbeiten"
                  title="Bearbeiten"
                  onClick={() => onEdit(entry)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button secondary"
                  aria-label="L\u00f6schen"
                  title="L\u00f6schen"
                  onClick={() => {
                    if (window.confirm("M\u00f6chten Sie diesen Einsatz wirklich l\u00f6schen?")) {
                      onDelete(entry.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="summary">
        <div>Summe Eintr&auml;ge: {summary.totalEintraege}</div>
        <div>Summe verrechenbar: {formatCurrency(summary.totalKosten)}</div>
        <div>
          Personal: {summary.personal.scheiben} Halbstunden | {formatCurrency(summary.personal.kosten)}
        </div>
        <div>
          Fahrzeuge: {summary.fahrzeug.scheiben} Halbstunden | {formatCurrency(summary.fahrzeug.kosten)}
        </div>
        <div>
          Luftfahrzeug: {summary.luft.minuten} Minuten | {formatCurrency(summary.luft.kosten)}
        </div>
        <div>
          Spitzenbelegung Personal:{" "}
          {summary.peakPersonal.count > 0 && summary.peakPersonal.time
            ? `${summary.peakPersonal.count} am ${summary.peakPersonal.time.toLocaleString("de-AT", {
                dateStyle: "short",
                timeStyle: "short"
              })}`
            : "—"}
        </div>
      </div>
    </section>
  );
}
