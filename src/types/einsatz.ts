export interface Tarife {
  personalTarif1: number;
  personalTarif2: number;
  dienstfahrzeug: number;
  luftfahrzeugProMinute: number;
  durchschnStundensatz: number;
}


export type TarifKategorie =
  | "standard"
  | "gesundheit"
  | "gesundheitOhneErwerb";

export interface TarifKonfiguration {
  kategorien: {
    standard: { tarif1: number; tarif2: number };
    gesundheit: { tarif1: number; tarif2: number };
    gesundheitOhneErwerb: { tarif1: number; tarif2: number };
  };
  zusatz: {
    dienstfahrzeug: number;
    luftfahrzeugProMinute: number;
  };
}

export interface AllgemeineEinsatzzeit {
  von: string; // Local datetime: YYYY-MM-DDTHH:mm
  bis: string; // Local datetime: YYYY-MM-DDTHH:mm
  eingesetzteBedienstete: number;
}

export interface Metadaten {
  dienststelle: string;
  veranstaltung: string;
  vereinVeranstalter: string;
  bescheidZahl?: string;
  padZahl?: string;
  tarifKategorie: TarifKategorie;
  tarife: Tarife;
  allgemeineEinsatzzeit: AllgemeineEinsatzzeit;
}

export interface AllgemeineKostenberechnung {
  einsatzstunden: number;
  tatsaechlicheKosten: number;
}

export type ArtDerKraefte = "Personal" | "Dienstkraftfahrzeug" | "Luftfahrzeug";

export interface EinsatzEintrag {
  id: string;
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

export interface EinsatzState {
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
