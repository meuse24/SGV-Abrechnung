import { isHoliday } from "./austrian-holidays";
import { TARIF_2_ZEITRAUM } from "../constants/tarife";
import type { ArtDerKraefte, EinsatzEintrag, Tarife } from "../types/einsatz";

export function parseTimeToMinutes(value: string): number | null {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function calculateDurationMinutes(start: string, end: string): number | null {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return null;
  }
  if (endMinutes >= startMinutes) {
    return endMinutes - startMinutes;
  }
  return endMinutes + 24 * 60 - startMinutes;
}

export function parseLocalDate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

export function parseLocalDateTime(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [datePart = "", timePart = ""] = value.split("T");
  const date = parseLocalDate(datePart);
  const minutes = parseTimeToMinutes(timePart);
  if (!date || minutes === null) {
    return null;
  }
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

export function calculateEinsatzstunden(start: string, end: string): number | null {
  const startDate = parseLocalDateTime(start);
  const endDate = parseLocalDateTime(end);
  if (!startDate || !endDate) {
    return null;
  }
  let endTime = endDate.getTime();
  if (endTime < startDate.getTime()) {
    endTime += 24 * 60 * 60 * 1000;
  }
  const diffMinutes = (endTime - startDate.getTime()) / 60000;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

export function calculateTimeSlices(start: string, end: string, date: string): {
  tarif1: number;
  tarif2: number;
  totalMinutes: number;
} {
  const duration = calculateDurationMinutes(start, end) ?? 0;
  const totalSlices = Math.ceil(duration / 30);
  let tarif1 = 0;
  let tarif2 = 0;

  const baseDate = parseLocalDate(date) ?? new Date();
  const startMinutes = parseTimeToMinutes(start) ?? 0;

  for (let i = 0; i < totalSlices; i += 1) {
    const sliceStart = new Date(baseDate.getTime());
    sliceStart.setMinutes(sliceStart.getMinutes() + startMinutes + i * 30);
    const sliceEnd = new Date(baseDate.getTime());
    sliceEnd.setMinutes(
      sliceEnd.getMinutes() + startMinutes + Math.min((i + 1) * 30, duration)
    );

    if (isTarif2(sliceStart)) {
      tarif2 += 1;
    } else {
      tarif1 += 1;
    }
  }

  return { tarif1, tarif2, totalMinutes: duration };
}

export function isTarif2(sliceStart: Date): boolean {
  if (isSundayOrHoliday(sliceStart)) {
    return true;
  }

  const startMinutes = sliceStart.getHours() * 60 + sliceStart.getMinutes();
  return isNightStartMinute(startMinutes);
}

export function isSundayOrHoliday(date: Date): boolean {
  return date.getDay() === 0 || isHoliday(date);
}

function isNightStartMinute(minutes: number): boolean {
  const nightStart = TARIF_2_ZEITRAUM.START * 60;
  const nightEnd = TARIF_2_ZEITRAUM.ENDE * 60;
  return minutes >= nightStart || minutes < nightEnd;
}

export function calculateEntryCosts(
  art: ArtDerKraefte,
  anzahl: number,
  datum: string,
  beginn: string,
  ende: string,
  tarife: Tarife
): { tarif1: number; tarif2: number; gesamt: number; minuten: number } {
  if (art === "Luftfahrzeug") {
    const duration = calculateDurationMinutes(beginn, ende) ?? 0;
    return {
      tarif1: 0,
      tarif2: 0,
      minuten: duration,
      gesamt: roundTo2(anzahl * duration * tarife.luftfahrzeugProMinute)
    };
  }

  const slices = calculateTimeSlices(beginn, ende, datum);
  if (art === "Dienstkraftfahrzeug") {
    const gesamt = anzahl * (slices.tarif1 + slices.tarif2) * tarife.dienstfahrzeug;
    return {
      tarif1: slices.tarif1,
      tarif2: slices.tarif2,
      minuten: slices.totalMinutes,
      gesamt: roundTo2(gesamt)
    };
  }

  const gesamt =
    anzahl * (slices.tarif1 * tarife.personalTarif1 + slices.tarif2 * tarife.personalTarif2);
  return {
    tarif1: slices.tarif1,
    tarif2: slices.tarif2,
    minuten: slices.totalMinutes,
    gesamt: roundTo2(gesamt)
  };
}

/**
 * Ermittelt den Zeitpunkt mit der hoechsten gleichzeitigen Personalbelegung.
 * Auswertung erfolgt als Halboffen-Intervall [Beginn, Ende):
 * Ein Einsatz, der um 10:00 endet und ein anderer um 10:00 beginnt, zaehlt nicht als Ueberlappung.
 */
export function calculatePeakPersonal(
  entries: Array<
    Pick<EinsatzEintrag, "artDerKraefte" | "anzahl" | "datum" | "beginn" | "ende">
  >
): { count: number; time: Date | null } {
  const events: Array<{ time: number; delta: number }> = [];

  entries.forEach((entry) => {
    if (entry.artDerKraefte !== "Personal") {
      return;
    }
    const start = parseLocalDateTime(`${entry.datum}T${entry.beginn}`);
    const end = parseLocalDateTime(`${entry.datum}T${entry.ende}`);
    if (!start || !end || entry.anzahl <= 0) {
      return;
    }
    const startMs = start.getTime();
    let endMs = end.getTime();
    if (endMs <= startMs) {
      endMs += 24 * 60 * 60 * 1000;
    }
    if (endMs === startMs) {
      return;
    }
    events.push({ time: startMs, delta: entry.anzahl });
    events.push({ time: endMs, delta: -entry.anzahl });
  });

  if (events.length === 0) {
    return { count: 0, time: null };
  }

  events.sort((a, b) => (a.time - b.time) || (a.delta - b.delta));

  let current = 0;
  let peak = 0;
  let peakTime: number | null = null;

  for (const event of events) {
    current += event.delta;
    if (current > peak) {
      peak = current;
      peakTime = event.time;
    }
  }

  return { count: peak, time: peakTime ? new Date(peakTime) : null };
}

export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
