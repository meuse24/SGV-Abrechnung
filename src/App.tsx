import { useMemo, useState } from "react";
import Header from "./components/Header";
import MetadatenFormular from "./components/MetadatenFormular";
import EinsatzFormular, { type EinsatzFormValues } from "./components/EinsatzFormular";
import EinsatzTabelle from "./components/EinsatzTabelle";
import ExportButtons from "./components/ExportButtons";
import { createDefaultDraft, createDefaultMetadaten, useEinsatzState } from "./hooks/useEinsatzState";
import { calculateEntryCosts, calculatePeakPersonal } from "./lib/calculations";
import type { EinsatzEintrag } from "./types/einsatz";

const EMPTY_DRAFT: Partial<EinsatzFormValues> = createDefaultDraft();

export default function App() {
  const {
    metadaten,
    setMetadaten,
    eintraege,
    setEintraege,
    upsertEintrag,
    deleteEintrag,
    clearEintraege,
    draft,
    setDraft
  } = useEinsatzState();
  const [editing, setEditing] = useState<EinsatzEintrag | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sort, setSort] = useState<{ key: keyof EinsatzEintrag; direction: "asc" | "desc" }>(
    {
      key: "datum",
      direction: "asc"
    }
  );

  const computedEntries = useMemo(() => {
    return eintraege.map((entry) => {
      const costs = calculateEntryCosts(
        entry.artDerKraefte,
        entry.anzahl,
        entry.datum,
        entry.beginn,
        entry.ende,
        metadaten.tarife
      );
      return {
        ...entry,
        zeitscheibenTarif1: costs.tarif1,
        zeitscheibenTarif2: costs.tarif2,
        gesamtkosten: costs.gesamt,
        minuten: costs.minuten
      };
    });
  }, [eintraege, metadaten.tarife]);

  const sortedEntries = useMemo(() => {
    const sorted = [...computedEntries];
    sorted.sort((a, b) => {
      const key = sort.key;
      const aValue = a[key];
      const bValue = b[key];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [computedEntries, sort]);

  const summary = useMemo(() => {
    const aggregated = computedEntries.reduce(
      (acc, entry) => {
        acc.totalKosten += entry.gesamtkosten;
        acc.totalEintraege += 1;
        if (entry.artDerKraefte === "Personal") {
          acc.personal.scheiben += entry.zeitscheibenTarif1 + entry.zeitscheibenTarif2;
          acc.personal.kosten += entry.gesamtkosten;
        }
        if (entry.artDerKraefte === "Dienstkraftfahrzeug") {
          acc.fahrzeug.scheiben += entry.zeitscheibenTarif1 + entry.zeitscheibenTarif2;
          acc.fahrzeug.kosten += entry.gesamtkosten;
        }
        if (entry.artDerKraefte === "Luftfahrzeug") {
          acc.luft.minuten += (entry as { minuten?: number }).minuten ?? 0;
          acc.luft.kosten += entry.gesamtkosten;
        }
        return acc;
      },
      {
        totalKosten: 0,
        totalEintraege: 0,
        personal: { scheiben: 0, kosten: 0 },
        fahrzeug: { scheiben: 0, kosten: 0 },
        luft: { minuten: 0, kosten: 0 }
      }
    );
    return { ...aggregated, peakPersonal: calculatePeakPersonal(computedEntries) };
  }, [computedEntries]);

  const handleSubmit = (values: EinsatzFormValues) => {
    const costs = calculateEntryCosts(
      values.artDerKraefte,
      values.anzahl,
      values.datum,
      values.beginn,
      values.ende,
      metadaten.tarife
    );
    const now = new Date().toISOString();
    const entry: EinsatzEintrag = {
      id: editing?.id ?? crypto.randomUUID(),
      bezeichnung: values.bezeichnung,
      artDerKraefte: values.artDerKraefte,
      anzahl: values.anzahl,
      datum: values.datum,
      beginn: values.beginn,
      ende: values.ende,
      zeitscheibenTarif1: costs.tarif1,
      zeitscheibenTarif2: costs.tarif2,
      gesamtkosten: costs.gesamt,
      erstelltAm: editing?.erstelltAm ?? now,
      bearbeitetAm: editing ? now : undefined
    };

    upsertEintrag(entry);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(false);
  };

  const handleImportJson = (payload: unknown) => {
    if (!isRecord(payload)) {
      window.alert("Ung\u00fcltiges JSON-Format.");
      return;
    }
    const metadatenData = payload.metadaten;
    const eintraegeData = payload.eintraege;
    if (!isRecord(metadatenData) || !Array.isArray(eintraegeData)) {
      window.alert("JSON enth\u00e4lt keine g\u00fcltigen Formulardaten.");
      return;
    }
    setMetadaten(metadatenData as typeof metadaten);
    setEintraege(eintraegeData as EinsatzEintrag[]);
    setDraft(EMPTY_DRAFT);
    setEditing(null);
    setDialogOpen(false);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleReset = () => {
    if (!window.confirm("Formular wirklich zur\u00fccksetzen? Alle Daten gehen verloren.")) {
      return;
    }
    setMetadaten(createDefaultMetadaten());
    setEintraege([]);
    setDraft(EMPTY_DRAFT);
    setEditing(null);
    setDialogOpen(false);
  };

  return (
    <main>
      <div className="top-actions">
        <ExportButtons
          metadaten={metadaten}
          eintraege={computedEntries}
          onImportJson={handleImportJson}
          onReset={handleReset}
        />
      </div>
      <Header />
      <MetadatenFormular metadaten={metadaten} onChange={setMetadaten} />
      {dialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <EinsatzFormular
              tarife={metadaten.tarife}
              initialValue={editing ?? draft}
              onSubmit={handleSubmit}
              onDraftChange={setDraft}
              isEditing={Boolean(editing)}
              onCancelEdit={closeDialog}
            />
          </div>
        </div>
      ) : null}
      <EinsatzTabelle
        eintraege={sortedEntries}
        onEdit={(entry) => {
          setEditing(entry);
          setDraft(entry);
          setDialogOpen(true);
        }}
        onDelete={deleteEintrag}
        onClear={clearEintraege}
        onAddNew={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        sort={sort}
        onSortChange={(key) =>
          setSort((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
          }))
        }
        summary={summary}
      />
    </main>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
