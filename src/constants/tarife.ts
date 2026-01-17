export const DEFAULT_TARIFE = {
  PERSONAL: {
    TARIF_1: 17.0,
    TARIF_2: 26.0
  },
  FAHRZEUG: {
    ZUSATZ: 13.0
  },
  LUFTFAHRZEUG: {
    PRO_MINUTE: 53.0
  },
  DURCHSCHNITT: {
    STUNDENSATZ: 38.4
  }
} as const;

export const TARIF_2_ZEITRAUM = {
  START: 22,
  ENDE: 6
} as const;
