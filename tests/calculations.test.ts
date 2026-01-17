import { describe, expect, it } from "vitest";
import {
  calculateDurationMinutes,
  calculateEntryCosts,
  calculatePeakPersonal,
  calculateTimeSlices
} from "../src/lib/calculations";
import { DEFAULT_TARIFE } from "../src/constants/tarife";
import type { EinsatzEintrag } from "../src/types/einsatz";

const tarife = {
  personalTarif1: DEFAULT_TARIFE.PERSONAL.TARIF_1,
  personalTarif2: DEFAULT_TARIFE.PERSONAL.TARIF_2,
  dienstfahrzeug: DEFAULT_TARIFE.FAHRZEUG.ZUSATZ,
  luftfahrzeugProMinute: DEFAULT_TARIFE.LUFTFAHRZEUG.PRO_MINUTE,
  durchschnStundensatz: DEFAULT_TARIFE.DURCHSCHNITT.STUNDENSATZ
};

describe("calculations", () => {
  it("calculates duration with midnight", () => {
    expect(calculateDurationMinutes("23:00", "01:30")).toBe(150);
  });

  it("calculates time slices and tariffs", () => {
    const slices = calculateTimeSlices("20:00", "23:15", "2025-05-10");
    expect(slices.tarif1).toBe(4);
    expect(slices.tarif2).toBe(3);
  });

  it("calculates personnel costs", () => {
    const result = calculateEntryCosts(
      "Personal",
      10,
      "2025-05-10",
      "20:00",
      "23:15",
      tarife
    );
    expect(result.gesamt).toBe(1460);
  });

  it("calculates luftfahrzeug costs per minute", () => {
    const result = calculateEntryCosts(
      "Luftfahrzeug",
      1,
      "2025-05-10",
      "15:00",
      "15:37",
      tarife
    );
    expect(result.gesamt).toBe(1961);
  });

  it("finds peak simultaneous personal deployment", () => {
    const entries: Array<Pick<EinsatzEintrag, "artDerKraefte" | "anzahl" | "datum" | "beginn" | "ende">> = [
      {
        artDerKraefte: "Personal",
        anzahl: 5,
        datum: "2025-05-10",
        beginn: "20:00",
        ende: "22:00"
      },
      {
        artDerKraefte: "Personal",
        anzahl: 3,
        datum: "2025-05-10",
        beginn: "21:00",
        ende: "23:00"
      },
      {
        artDerKraefte: "Dienstkraftfahrzeug",
        anzahl: 2,
        datum: "2025-05-10",
        beginn: "21:00",
        ende: "22:00"
      }
    ];

    const result = calculatePeakPersonal(entries);
    expect(result.count).toBe(8);
    expect(result.time?.getHours()).toBe(21);
    expect(result.time?.getMinutes()).toBe(0);
  });
});
