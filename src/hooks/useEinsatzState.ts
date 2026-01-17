import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TARIFE } from "../constants/tarife";
import type { EinsatzEintrag, Metadaten, Tarife } from "../types/einsatz";
import { useLocalStorage } from "./useLocalStorage";

export function createDefaultMetadaten(): Metadaten {
  return {
    dienststelle: "",
    veranstaltung: "",
    vereinVeranstalter: "",
    bescheidZahl: "",
    padZahl: "",
    tarife: {
      personalTarif1: DEFAULT_TARIFE.PERSONAL.TARIF_1,
      personalTarif2: DEFAULT_TARIFE.PERSONAL.TARIF_2,
      dienstfahrzeug: DEFAULT_TARIFE.FAHRZEUG.ZUSATZ,
      luftfahrzeugProMinute: DEFAULT_TARIFE.LUFTFAHRZEUG.PRO_MINUTE,
      durchschnStundensatz: DEFAULT_TARIFE.DURCHSCHNITT.STUNDENSATZ
    },
    allgemeineEinsatzzeit: {
      von: "",
      bis: "",
      eingesetzteBedienstete: 0
    }
  };
}

const FALLBACK_TARIFE: Tarife = {
  personalTarif1: DEFAULT_TARIFE.PERSONAL.TARIF_1,
  personalTarif2: DEFAULT_TARIFE.PERSONAL.TARIF_2,
  dienstfahrzeug: DEFAULT_TARIFE.FAHRZEUG.ZUSATZ,
  luftfahrzeugProMinute: DEFAULT_TARIFE.LUFTFAHRZEUG.PRO_MINUTE,
  durchschnStundensatz: DEFAULT_TARIFE.DURCHSCHNITT.STUNDENSATZ
};

export function createDefaultDraft(): Partial<EinsatzEintrag> {
  return {
    bezeichnung: "",
    artDerKraefte: "Personal",
    anzahl: 1,
    datum: "",
    beginn: "",
    ende: ""
  };
}

const DEFAULT_METADATEN = createDefaultMetadaten();
const DEFAULT_DRAFT = createDefaultDraft();
const TARIFE_STORAGE_KEY = "sgv-tarife-loaded";

export function useEinsatzState() {
  const [metadaten, setMetadaten] = useLocalStorage<Metadaten>(
    "sgv-metadaten",
    DEFAULT_METADATEN
  );
  const [eintraege, setEintraege] = useLocalStorage<EinsatzEintrag[]>("sgv-eintraege", []);
  const [draft, setDraft] = useLocalStorage<Partial<EinsatzEintrag>>("sgv-draft", DEFAULT_DRAFT);
  const [tarifeStatus, setTarifeStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ state: "idle" });

  const loadTarifeFromJson = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      setTarifeStatus({ state: "loading", message: "Tarife werden geladen..." });
      const response = await fetch(`${import.meta.env.BASE_URL}tarife.json`, {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("Tarife konnten nicht geladen werden.");
      }
      const data = (await response.json()) as unknown;
      const parsed = parseTarife(data);
      if (!parsed) {
        setTarifeStatus({ state: "error", message: "Tarife ungueltig. Fallback verwendet." });
        setMetadaten((prev) => ({
          ...prev,
          tarife: FALLBACK_TARIFE
        }));
        return;
      }
      setMetadaten((prev) => ({
        ...prev,
        tarife: parsed
      }));
      setTarifeStatus({ state: "success", message: "Tarife geladen." });
    } catch {
      setTarifeStatus({ state: "error", message: "Tarife nicht ladbar. Fallback verwendet." });
      setMetadaten((prev) => ({
        ...prev,
        tarife: FALLBACK_TARIFE
      }));
    } finally {
      window.localStorage.setItem(TARIFE_STORAGE_KEY, "true");
    }
  }, [setMetadaten]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const alreadyLoaded = window.localStorage.getItem(TARIFE_STORAGE_KEY);
    if (!alreadyLoaded) {
      void loadTarifeFromJson();
    }
  }, [loadTarifeFromJson]);

  const upsertEintrag = useCallback(
    (entry: EinsatzEintrag) => {
      setEintraege((prev) => {
        const exists = prev.find((item) => item.id === entry.id);
        if (!exists) {
          return [...prev, entry];
        }
        return prev.map((item) => (item.id === entry.id ? entry : item));
      });
    },
    [setEintraege]
  );

  const deleteEintrag = useCallback(
    (id: string) => {
      setEintraege((prev) => prev.filter((item) => item.id !== id));
    },
    [setEintraege]
  );

  const clearEintraege = useCallback(() => {
    setEintraege([]);
  }, [setEintraege]);

  return {
    metadaten,
    setMetadaten,
    eintraege,
    setEintraege,
    upsertEintrag,
    deleteEintrag,
    clearEintraege,
    draft,
    setDraft,
    loadTarifeFromJson,
    tarifeStatus
  };
}

function parseTarife(value: unknown): Tarife | null {
  if (!isRecord(value)) {
    return null;
  }
  const personalTarif1 = toNumber(value.personalTarif1);
  const personalTarif2 = toNumber(value.personalTarif2);
  const dienstfahrzeug = toNumber(value.dienstfahrzeug);
  const luftfahrzeugProMinute = toNumber(value.luftfahrzeugProMinute);
  const durchschnStundensatz = toNumber(value.durchschnStundensatz);

  if (
    personalTarif1 === null ||
    personalTarif2 === null ||
    dienstfahrzeug === null ||
    luftfahrzeugProMinute === null ||
    durchschnStundensatz === null
  ) {
    return null;
  }

  return {
    personalTarif1,
    personalTarif2,
    dienstfahrzeug,
    luftfahrzeugProMinute,
    durchschnStundensatz
  };
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
