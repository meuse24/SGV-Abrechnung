import { useCallback, useEffect, useState } from "react";
import { DEFAULT_DURCHSCHN_STUNDENSATZ, DEFAULT_TARIFKONFIG } from "../constants/tarife";
import type {
  EinsatzEintrag,
  Metadaten,
  TarifKategorie,
  TarifKonfiguration,
  Tarife
} from "../types/einsatz";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_TARIFKATEGORIE: TarifKategorie = "gesundheit";

export function createDefaultMetadaten(): Metadaten {
  const tarife = buildTarife(DEFAULT_TARIFKONFIG, DEFAULT_TARIFKATEGORIE, DEFAULT_DURCHSCHN_STUNDENSATZ);
  return {
    dienststelle: "",
    veranstaltung: "",
    vereinVeranstalter: "",
    bescheidZahl: "",
    padZahl: "",
    tarifKategorie: DEFAULT_TARIFKATEGORIE,
    tarife,
    allgemeineEinsatzzeit: {
      von: "",
      bis: "",
      eingesetzteBedienstete: 0
    }
  };
}

export function createDefaultDraft(): Partial<EinsatzEintrag> {
  return {
    bezeichnung: "",
    datum: "",
    beginn: "",
    ende: ""
  };
}

const DEFAULT_METADATEN = createDefaultMetadaten();
const DEFAULT_DRAFT = createDefaultDraft();
const TARIFCONFIG_STORAGE_KEY = "sgv-tarif-config";
const LAST_INPUT_STORAGE_KEY = "sgv-last-input";

export function useEinsatzState() {
  const [metadaten, setMetadaten] = useLocalStorage<Metadaten>(
    "sgv-metadaten",
    DEFAULT_METADATEN
  );
  const [eintraege, setEintraege] = useLocalStorage<EinsatzEintrag[]>("sgv-eintraege", []);
  const [draft, setDraft] = useLocalStorage<Partial<EinsatzEintrag>>("sgv-draft", DEFAULT_DRAFT);
  const [lastInput, setLastInput] = useLocalStorage<Partial<EinsatzEintrag>>(
    LAST_INPUT_STORAGE_KEY,
    DEFAULT_DRAFT
  );
  const [tarifConfig, setTarifConfig] = useState<TarifKonfiguration>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_TARIFKONFIG;
    }
    const stored = window.localStorage.getItem(TARIFCONFIG_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_TARIFKONFIG;
    }
    try {
      const parsed = parseTarifKonfiguration(JSON.parse(stored) as unknown);
      return parsed ?? DEFAULT_TARIFKONFIG;
    } catch {
      return DEFAULT_TARIFKONFIG;
    }
  });
  const [hasStoredTarifConfig] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(TARIFCONFIG_STORAGE_KEY) !== null;
  });
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
      const parsed = parseTarifKonfiguration(data);
      if (!parsed) {
        setTarifeStatus({
          state: "error",
          message: "Tarife ungueltig. Bestehende Werte bleiben."
        });
        return;
      }
      setTarifConfig(parsed);
      setMetadaten((prev) => applyTarifKategorie(prev, parsed));
      setTarifeStatus({ state: "success", message: "Tarife geladen." });
    } catch {
      setTarifeStatus({
        state: "error",
        message: "Tarife nicht ladbar. Bestehende Werte bleiben."
      });
    }
  }, [setMetadaten, setTarifConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasStoredTarifConfig) {
      void loadTarifeFromJson();
    }
  }, [hasStoredTarifConfig, loadTarifeFromJson]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(TARIFCONFIG_STORAGE_KEY, JSON.stringify(tarifConfig));
  }, [tarifConfig]);

  useEffect(() => {
    setMetadaten((prev) => {
      const kategorie = isTarifKategorie(prev.tarifKategorie)
        ? prev.tarifKategorie
        : DEFAULT_TARIFKATEGORIE;
      const durchschnStundensatz =
        prev.tarife?.durchschnStundensatz ?? DEFAULT_DURCHSCHN_STUNDENSATZ;
      const derived = buildTarife(tarifConfig, kategorie, durchschnStundensatz);
      if (prev.tarifKategorie === kategorie && tarifeEqual(prev.tarife, derived)) {
        return prev;
      }
      return {
        ...prev,
        tarifKategorie: kategorie,
        tarife: derived
      };
    });
  }, [setMetadaten, tarifConfig]);

  const setTarifKategorie = useCallback(
    (kategorie: TarifKategorie) => {
      setMetadaten((prev) => {
        const durchschnStundensatz =
          prev.tarife?.durchschnStundensatz ?? DEFAULT_DURCHSCHN_STUNDENSATZ;
        return {
          ...prev,
          tarifKategorie: kategorie,
          tarife: buildTarife(tarifConfig, kategorie, durchschnStundensatz)
        };
      });
    },
    [setMetadaten, tarifConfig]
  );

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

  const clearLastInput = useCallback(() => {
    setLastInput(DEFAULT_DRAFT);
  }, [setLastInput]);

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
    lastInput,
    setLastInput,
    clearLastInput,
    tarifConfig,
    setTarifConfig,
    setTarifKategorie,
    loadTarifeFromJson,
    tarifeStatus
  };
}

function applyTarifKategorie(metadaten: Metadaten, config: TarifKonfiguration): Metadaten {
  const kategorie = isTarifKategorie(metadaten.tarifKategorie)
    ? metadaten.tarifKategorie
    : DEFAULT_TARIFKATEGORIE;
  const durchschnStundensatz =
    metadaten.tarife?.durchschnStundensatz ?? DEFAULT_DURCHSCHN_STUNDENSATZ;
  return {
    ...metadaten,
    tarifKategorie: kategorie,
    tarife: buildTarife(config, kategorie, durchschnStundensatz)
  };
}

function buildTarife(
  config: TarifKonfiguration,
  kategorie: TarifKategorie,
  durchschnStundensatz: number
): Tarife {
  const selected = config.kategorien[kategorie];
  return {
    personalTarif1: selected.tarif1,
    personalTarif2: selected.tarif2,
    dienstfahrzeug: config.zusatz.dienstfahrzeug,
    luftfahrzeugProMinute: config.zusatz.luftfahrzeugProMinute,
    durchschnStundensatz
  };
}

function tarifeEqual(left: Tarife, right: Tarife): boolean {
  return (
    left.personalTarif1 === right.personalTarif1 &&
    left.personalTarif2 === right.personalTarif2 &&
    left.dienstfahrzeug === right.dienstfahrzeug &&
    left.luftfahrzeugProMinute === right.luftfahrzeugProMinute &&
    left.durchschnStundensatz === right.durchschnStundensatz
  );
}

function parseTarifKonfiguration(value: unknown): TarifKonfiguration | null {
  if (!isRecord(value)) {
    return null;
  }
  const kategorien = isRecord(value.kategorien) ? value.kategorien : null;
  const zusatz = isRecord(value.zusatz) ? value.zusatz : null;
  if (!kategorien || !zusatz) {
    return null;
  }

  const standard = parseTarifSet(kategorien.standard);
  const gesundheit = parseTarifSet(kategorien.gesundheit);
  const gesundheitOhneErwerb = parseTarifSet(kategorien.gesundheitOhneErwerb);
  const dienstfahrzeug = toNumber(zusatz.dienstfahrzeug);
  const luftfahrzeugProMinute = toNumber(zusatz.luftfahrzeugProMinute);

  if (!standard || !gesundheit || !gesundheitOhneErwerb) {
    return null;
  }
  if (dienstfahrzeug === null || luftfahrzeugProMinute === null) {
    return null;
  }

  return {
    kategorien: {
      standard,
      gesundheit,
      gesundheitOhneErwerb
    },
    zusatz: {
      dienstfahrzeug,
      luftfahrzeugProMinute
    }
  };
}

function parseTarifSet(value: unknown): { tarif1: number; tarif2: number } | null {
  if (!isRecord(value)) {
    return null;
  }
  const tarif1 = toNumber(value.tarif1);
  const tarif2 = toNumber(value.tarif2);
  if (tarif1 === null || tarif2 === null) {
    return null;
  }
  return { tarif1, tarif2 };
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTarifKategorie(value: unknown): value is TarifKategorie {
  return value === "standard" || value === "gesundheit" || value === "gesundheitOhneErwerb";
}
