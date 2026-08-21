/**
 * Date and Time utilities tailored for Israeli timezone and natural Hebrew formatting.
 * Avoids UTC date skew (e.g. ISO string UTC conversion shifts dates between midnight and 3 AM).
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateSafe(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function isSameDay(d1: string | Date, d2: string | Date): boolean {
  const date1 = parseDateSafe(d1);
  const date2 = parseDateSafe(d2);
  return getLocalDateString(date1) === getLocalDateString(date2);
}

export function isToday(dateInput: string | Date): boolean {
  return isSameDay(dateInput, new Date());
}

export function formatTimeHebrew(dateInput: string | Date): string {
  const d = parseDateSafe(dateInput);
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateShortHebrew(dateInput: string | Date): string {
  const d = parseDateSafe(dateInput);
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'numeric',
  }).format(d);
}

export function formatDateHebrewRelative(dateInput: string | Date): string {
  const d = parseDateSafe(dateInput);
  const now = new Date();

  if (isSameDay(d, now)) {
    return `היום, ${formatTimeHebrew(d)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) {
    return `אתמול, ${formatTimeHebrew(d)}`;
  }

  return `${formatDateShortHebrew(d)}, ${formatTimeHebrew(d)}`;
}
