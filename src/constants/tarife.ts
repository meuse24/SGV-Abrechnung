export const DEFAULT_TARIFKONFIG = {
  kategorien: {
    standard: {
      tarif1: 17.0,
      tarif2: 26.0
    },
    gesundheit: {
      tarif1: 13.0,
      tarif2: 17.0
    },
    gesundheitOhneErwerb: {
      tarif1: 7.0,
      tarif2: 7.0
    }
  },
  zusatz: {
    dienstfahrzeug: 13.0,
    luftfahrzeugProMinute: 53.0
  }
} as const;

export const DEFAULT_DURCHSCHN_STUNDENSATZ = 38.4;

export const TARIF_2_ZEITRAUM = {
  START: 22,
  ENDE: 6
} as const;
