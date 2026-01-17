import {
  calculateDurationMinutes,
  calculateEinsatzstunden,
  isTarif2,
  parseLocalDate,
  parseLocalDateTime,
  parseTimeToMinutes,
  roundTo2
} from "./calculations";
import type { EinsatzEintrag, Metadaten } from "../types/einsatz";
import { formatCurrency, formatNumber } from "./utils";

function sanitize(value: string) {
  return value.replace(/;/g, ",");
}

export function buildCsv(metadaten: Metadaten, eintraege: EinsatzEintrag[]): string {
  const lines: string[] = [];
  const pushLine = (values: Array<string | number>) => {
    lines.push(values.map((value) => sanitize(String(value))).join(";"));
  };

  pushLine(["Dienststelle", metadaten.dienststelle]);
  pushLine(["Veranstaltung", metadaten.veranstaltung]);
  pushLine(["Verein/Veranstalter", metadaten.vereinVeranstalter]);
  pushLine(["Bescheid Zahl", metadaten.bescheidZahl ?? ""]);
  pushLine(["PAD Zahl", metadaten.padZahl ?? ""]);
  lines.push("");
  pushLine(["Tarife"]);
  pushLine(["Personal Tarif 1", formatNumber(metadaten.tarife.personalTarif1), "EUR/30min"]);
  pushLine(["Personal Tarif 2", formatNumber(metadaten.tarife.personalTarif2), "EUR/30min"]);
  pushLine(["Dienstfahrzeug", formatNumber(metadaten.tarife.dienstfahrzeug), "EUR/30min"]);
  pushLine([
    "Luftfahrzeug pro Minute",
    formatNumber(metadaten.tarife.luftfahrzeugProMinute),
    "EUR/min"
  ]);
  pushLine([
    "Durchschn. Stundensatz",
    formatNumber(metadaten.tarife.durchschnStundensatz),
    "EUR/h"
  ]);
  lines.push("");
  pushLine(["Allgemeine Einsatzzeit"]);
  pushLine(["Von", metadaten.allgemeineEinsatzzeit.von]);
  pushLine(["Bis", metadaten.allgemeineEinsatzzeit.bis]);
  pushLine([
    "Eingesetzte Bedienstete",
    metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete
  ]);

  const einsatzstunden = calculateEinsatzstunden(
    metadaten.allgemeineEinsatzzeit.von,
    metadaten.allgemeineEinsatzzeit.bis
  );
  if (einsatzstunden !== null) {
    const tatsaechliche = roundTo2(
      einsatzstunden *
        metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete *
        metadaten.tarife.durchschnStundensatz
    );
    pushLine(["Einsatzstunden", formatNumber(einsatzstunden, 2)]);
    pushLine(["Tats\u00e4chliche Kosten", formatCurrency(tatsaechliche)]);
  }
  lines.push("");

  pushLine(["Verrechenbare Leistungen (SGV)"]);
  pushLine([
    "Bezeichnung",
    "Art",
    "Anzahl",
    "Datum",
    "Beginn",
    "Ende",
    "Halbstunden T1",
    "Halbstunden T2",
    "Kosten"
  ]);

  eintraege.forEach((entry) => {
    pushLine([
      entry.bezeichnung,
      entry.artDerKraefte,
      entry.anzahl,
      entry.datum,
      entry.beginn,
      entry.ende,
      entry.zeitscheibenTarif1,
      entry.zeitscheibenTarif2,
      formatCurrency(entry.gesamtkosten)
    ]);
  });

  const total = eintraege.reduce((sum, entry) => sum + entry.gesamtkosten, 0);
  pushLine(["Summe verrechenbar (SGV)", "", "", "", "", "", "", "", formatCurrency(total)]);

  return `\uFEFF${lines.join("\r\n")}`;
}

export function buildDetailCsv(metadaten: Metadaten, eintraege: EinsatzEintrag[]): string {
  const lines: string[] = [];
  const pushLine = (values: Array<string | number>) => {
    lines.push(values.map((value) => sanitize(String(value))).join(";"));
  };

  pushLine(["Detailauswertung (Zeitscheiben)"]);
  pushLine(["Dienststelle", metadaten.dienststelle]);
  pushLine(["Veranstaltung", metadaten.veranstaltung]);
  pushLine(["Verein/Veranstalter", metadaten.vereinVeranstalter]);
  lines.push("");

  pushLine([
    "Bezeichnung",
    "Art",
    "Datum",
    "Scheibe Start",
    "Scheibe Ende",
    "Scheibentyp",
    "Tarif",
    "Einheiten",
    "Satz (EUR)",
    "Berechnung",
    "Kosten (EUR)"
  ]);

  eintraege.forEach((entry) => {
    const detailRows = buildEntryDetailRows(entry, metadaten.tarife);
    detailRows.forEach((row) => pushLine(row));
  });

  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(metadaten: Metadaten, eintraege: EinsatzEintrag[]) {
  const csv = buildCsv(metadaten, eintraege);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `sgv-export-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function downloadDetailCsv(metadaten: Metadaten, eintraege: EinsatzEintrag[]) {
  const csv = buildDetailCsv(metadaten, eintraege);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `sgv-detail-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function downloadJson(metadaten: Metadaten, eintraege: EinsatzEintrag[]) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    metadaten,
    eintraege
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  triggerDownload(blob, `sgv-export-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function downloadPdf(metadaten: Metadaten, eintraege: EinsatzEintrag[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default as (
    doc: InstanceType<typeof jsPDF>,
    options: {
      startY?: number;
      head: string[][];
      body: string[][];
    }
  ) => void;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Berechnungsblatt f\u00fcr \u00dcberwachungsgeb\u00fchren", 14, 16);
  doc.setFontSize(10);
  doc.text(
    "gem\u00e4\u00df Sicherheitsgeb\u00fchrenverordnung des BMI \u00fcber die Festsetzung von Geb\u00fchren und Kosteners\u00e4tzen.",
    14,
    22
  );

  let cursor = 30;
  doc.text(`Dienststelle: ${metadaten.dienststelle}`, 14, cursor);
  cursor += 6;
  doc.text(`Veranstaltung: ${metadaten.veranstaltung}`, 14, cursor);
  cursor += 6;
  doc.text(`Verein/Veranstalter: ${metadaten.vereinVeranstalter}`, 14, cursor);
  cursor += 6;
  doc.text(`Bescheid Zahl: ${metadaten.bescheidZahl ?? ""}`, 14, cursor);
  doc.text(`PAD Zahl: ${metadaten.padZahl ?? ""}`, 120, cursor);
  cursor += 8;

  doc.text(
    `Tarife: P1 ${formatNumber(metadaten.tarife.personalTarif1)} | P2 ${formatNumber(
      metadaten.tarife.personalTarif2
    )} | Fahrzeug ${formatNumber(metadaten.tarife.dienstfahrzeug)} | Luft/min ${formatNumber(
      metadaten.tarife.luftfahrzeugProMinute
    )} | Std ${formatNumber(metadaten.tarife.durchschnStundensatz)}`,
    14,
    cursor
  );
  cursor += 8;

  const einsatzVon = formatLocalDateTime(metadaten.allgemeineEinsatzzeit.von);
  const einsatzBis = formatLocalDateTime(metadaten.allgemeineEinsatzzeit.bis);
  doc.text(`Allgem. Einsatzzeit: ${einsatzVon} - ${einsatzBis}`, 14, cursor);
  cursor += 6;
  doc.text(
    `Eingesetzte Bedienstete: ${metadaten.allgemeineEinsatzzeit.eingesetzteBedienstete}`,
    14,
    cursor
  );
  cursor += 8;

  autoTable(doc, {
    startY: cursor,
    head: [[
      "Bezeichnung",
      "Art",
      "Anzahl",
      "Datum",
      "Von",
      "Bis",
      "Halbstunden T1",
      "Halbstunden T2",
      "Kosten"
    ]],
    body: eintraege.map((entry) => [
      entry.bezeichnung,
      entry.artDerKraefte,
      String(entry.anzahl),
      formatLocalDate(entry.datum),
      entry.beginn,
      entry.ende,
      String(entry.zeitscheibenTarif1),
      String(entry.zeitscheibenTarif2),
      formatCurrency(entry.gesamtkosten)
    ])
  });

  const total = eintraege.reduce((sum, entry) => sum + entry.gesamtkosten, 0);
  const docWithTable = doc as InstanceType<typeof jsPDF> & {
    lastAutoTable?: { finalY?: number };
  };
  const finalY = docWithTable.lastAutoTable?.finalY ?? cursor + 60;
  doc.text(`Summe verrechenbar (SGV): ${formatCurrency(total)}`, 14, finalY + 8);
  doc.text(
    `Exportdatum: ${new Date().toLocaleString("de-AT", {
      dateStyle: "short",
      timeStyle: "short"
    })}`,
    200,
    finalY + 8
  );

  doc.save(`sgv-export-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatLocalDate(value: string): string {
  const parsed = parseLocalDate(value);
  if (!parsed) {
    return value;
  }
  return parsed.toLocaleDateString("de-AT");
}

function formatLocalDateTime(value: string): string {
  const parsed = parseLocalDateTime(value);
  if (!parsed) {
    return value;
  }
  return `${parsed.toLocaleDateString("de-AT")} ${parsed.toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function buildEntryDetailRows(
  entry: EinsatzEintrag,
  tarife: Metadaten["tarife"]
): Array<Array<string | number>> {
  if (entry.artDerKraefte === "Luftfahrzeug") {
    return buildMinuteRows(entry, tarife);
  }
  return buildSliceRows(entry, tarife);
}

function buildSliceRows(entry: EinsatzEintrag, tarife: Metadaten["tarife"]): Array<Array<string | number>> {
  const duration = calculateDurationMinutes(entry.beginn, entry.ende);
  if (!duration || duration <= 0) {
    return [];
  }
  const totalSlices = Math.ceil(duration / 30);
  const baseDate = parseLocalDate(entry.datum);
  const startMinutes = parseTimeToMinutes(entry.beginn);
  if (!baseDate || startMinutes === null) {
    return [];
  }

  const rows: Array<Array<string | number>> = [];
  for (let i = 0; i < totalSlices; i += 1) {
    const sliceStart = new Date(baseDate.getTime());
    sliceStart.setMinutes(sliceStart.getMinutes() + startMinutes + i * 30);
    const sliceEnd = new Date(baseDate.getTime());
    sliceEnd.setMinutes(sliceEnd.getMinutes() + startMinutes + Math.min((i + 1) * 30, duration));

    const tarif2Active = isTarif2(sliceStart, sliceEnd);
    const tarifLabel = tarif2Active ? "T2" : "T1";
    const satz =
      entry.artDerKraefte === "Dienstkraftfahrzeug"
        ? tarife.dienstfahrzeug
        : tarif2Active
          ? tarife.personalTarif2
          : tarife.personalTarif1;
    const kosten = roundTo2(entry.anzahl * satz);

    rows.push([
      entry.bezeichnung,
      entry.artDerKraefte,
      formatDateOnly(sliceStart),
      formatTimeOnly(sliceStart),
      formatTimeOnly(sliceEnd),
      "30min",
      tarifLabel,
      entry.anzahl,
      formatNumber(satz, 2),
      `${entry.anzahl} x ${formatNumber(satz, 2)}`,
      formatCurrency(kosten)
    ]);
  }

  return rows;
}

function buildMinuteRows(entry: EinsatzEintrag, tarife: Metadaten["tarife"]): Array<Array<string | number>> {
  const duration = calculateDurationMinutes(entry.beginn, entry.ende);
  if (!duration || duration <= 0) {
    return [];
  }
  const baseDate = parseLocalDate(entry.datum);
  const startMinutes = parseTimeToMinutes(entry.beginn);
  if (!baseDate || startMinutes === null) {
    return [];
  }

  const rows: Array<Array<string | number>> = [];
  for (let i = 0; i < duration; i += 1) {
    const minuteStart = new Date(baseDate.getTime());
    minuteStart.setMinutes(minuteStart.getMinutes() + startMinutes + i);
    const minuteEnd = new Date(minuteStart.getTime());
    minuteEnd.setMinutes(minuteEnd.getMinutes() + 1);
    const kosten = roundTo2(entry.anzahl * tarife.luftfahrzeugProMinute);

    rows.push([
      entry.bezeichnung,
      entry.artDerKraefte,
      formatDateOnly(minuteStart),
      formatTimeOnly(minuteStart),
      formatTimeOnly(minuteEnd),
      "1min",
      "MIN",
      entry.anzahl,
      formatNumber(tarife.luftfahrzeugProMinute, 2),
      `${entry.anzahl} x ${formatNumber(tarife.luftfahrzeugProMinute, 2)}`,
      formatCurrency(kosten)
    ]);
  }

  return rows;
}

function formatDateOnly(value: Date): string {
  return value.toLocaleDateString("de-AT");
}

function formatTimeOnly(value: Date): string {
  return value.toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
