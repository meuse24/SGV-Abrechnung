import { useCallback } from "react";
import { DEFAULT_TARIFE } from "../constants/tarife";
import type { EinsatzEintrag, Metadaten } from "../types/einsatz";
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

export function useEinsatzState() {
  const [metadaten, setMetadaten] = useLocalStorage<Metadaten>(
    "sgv-metadaten",
    DEFAULT_METADATEN
  );
  const [eintraege, setEintraege] = useLocalStorage<EinsatzEintrag[]>("sgv-eintraege", []);
  const [draft, setDraft] = useLocalStorage<Partial<EinsatzEintrag>>("sgv-draft", DEFAULT_DRAFT);

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
    setDraft
  };
}
