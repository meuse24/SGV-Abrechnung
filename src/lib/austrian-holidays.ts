const FIXED_HOLIDAYS = [
  { month: 0, day: 1 },  // Neujahr
  { month: 0, day: 6 },  // Heilige Drei Koenige
  { month: 4, day: 1 },  // Staatsfeiertag
  { month: 7, day: 15 }, // Mariae Himmelfahrt
  { month: 9, day: 26 }, // Nationalfeiertag
  { month: 10, day: 1 }, // Allerheiligen
  { month: 11, day: 8 }, // Mariae Empfaengnis
  { month: 11, day: 25 }, // Weihnachten
  { month: 11, day: 26 }  // Stefanitag
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getEasterSunday(year: number): Date {
  // Gaußsche Osterformel (gregorianisch)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

export function getAustrianHolidays(year: number): Date[] {
  const easterSunday = getEasterSunday(year);
  const movable = [
    new Date(easterSunday.getTime() + DAY_IN_MS), // Ostermontag
    new Date(easterSunday.getTime() + 39 * DAY_IN_MS), // Christi Himmelfahrt
    new Date(easterSunday.getTime() + 50 * DAY_IN_MS), // Pfingstmontag
    new Date(easterSunday.getTime() + 60 * DAY_IN_MS)  // Fronleichnam
  ];

  const fixed = FIXED_HOLIDAYS.map((holiday) => new Date(year, holiday.month, holiday.day));

  return [...fixed, ...movable];
}

export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getAustrianHolidays(year);
  return holidays.some((holiday) => isSameDay(holiday, date));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
