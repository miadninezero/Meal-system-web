const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

function getDhakaParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0=Sun..5=Fri..6=Sat
} {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const DhakaTimeHelper = {
  getTodayDhakaDate(): string {
    const p = getDhakaParts();
    return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
  },

  getCurrentDhakaMonth(): string {
    const p = getDhakaParts();
    return `${p.year}-${pad2(p.month)}`;
  },

  isFriday(dateString: string): boolean {
    try {
      const trimmed = dateString.trim();
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      if (!match) return false;
      const y = Number(match[1]);
      const m = Number(match[2]);
      const d = Number(match[3]);
      // UTC weekday of YYYY-MM-DD directly matches Asia/Dhaka weekday since date is explicit
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCDay() === 5;
    } catch {
      return false;
    }
  },

  /**
   * Checks whether the booking deadline has passed for a specific date and meal deadline.
   * @param dateString Target date in "yyyy-MM-dd" format
   * @param deadlineHHmm Deadline time in "HH:mm" (24-hr) in Asia/Dhaka
   */
  isDeadlinePassed(dateString: string, deadlineHHmm: string): boolean {
    try {
      const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
      if (!dateMatch) return true;
      const y = Number(dateMatch[1]);
      const m = Number(dateMatch[2]);
      const d = Number(dateMatch[3]);

      const parts = deadlineHHmm.split(':');
      const parsedHour = Number.parseInt(parts[0] ?? '', 10);
      const parsedMin = Number.parseInt(parts[1] ?? '', 10);
      const hour = Number.isNaN(parsedHour) ? 9 : parsedHour;
      const minute = Number.isNaN(parsedMin) ? 0 : parsedMin;

      // Target timestamp in UTC corresponding to YYYY-MM-DD HH:mm:00 in Asia/Dhaka (UTC+6)
      const targetUtcMs = Date.UTC(y, m - 1, d, hour, minute, 0, 0) - DHAKA_OFFSET_MS;
      return Date.now() > targetUtcMs;
    } catch {
      return true;
    }
  },

  format12Hour(deadlineHHmm: string): string {
    try {
      const parts = deadlineHHmm.split(':');
      const parsedHour = Number.parseInt(parts[0] ?? '', 10);
      const parsedMin = Number.parseInt(parts[1] ?? '', 10);
      const hour = Number.isNaN(parsedHour) ? 9 : parsedHour;
      const minute = Number.isNaN(parsedMin) ? 0 : parsedMin;
      const amPm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${pad2(displayHour)}:${pad2(minute)} ${amPm}`;
    } catch {
      return deadlineHHmm;
    }
  },

  /**
   * Converts a "yyyy-MM-dd" date string into "dd MMM yyyy", e.g. "10 Nov 2026".
   */
  formatReadableDate(dateString: string): string {
    if (!dateString.trim()) return '';
    try {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
      if (!match) return dateString;
      const y = Number(match[1]);
      const m = Number(match[2]);
      const d = Number(match[3]);
      if (m < 1 || m > 12) return dateString;
      return `${pad2(d)} ${MONTH_ABBR[m - 1]} ${y}`;
    } catch {
      return dateString;
    }
  },

  shiftDate(dateString: string, days: number): string {
    try {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
      if (!match) return dateString;
      const y = Number(match[1]);
      const m = Number(match[2]);
      const d = Number(match[3]);
      const dt = new Date(Date.UTC(y, m - 1, d + days));
      return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
    } catch {
      return dateString;
    }
  },

  getMonthEndDhakaDate(): string {
    const p = getDhakaParts();
    const lastDay = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
    return `${p.year}-${pad2(p.month)}-${pad2(lastDay)}`;
  },

  formatDhakaTimestamp(timestampMs?: number): string {
    if (!timestampMs) return 'Just now';
    const p = getDhakaParts(new Date(timestampMs));
    const amPm = p.hour >= 12 ? 'PM' : 'AM';
    const displayHour = p.hour === 0 ? 12 : p.hour > 12 ? p.hour - 12 : p.hour;
    return `${pad2(p.day)} ${MONTH_ABBR[p.month - 1]}, ${pad2(displayHour)}:${pad2(p.minute)} ${amPm}`;
  },
};

export function formatTaka(amount: number): string {
  const rounded = Math.round(amount);
  if (Math.abs(amount - rounded) < 0.01) {
    return `৳${rounded}`;
  }
  return `৳${amount.toFixed(2)}`;
}

export function formatUnits(units: number): string {
  const rounded = Math.round(units);
  if (Math.abs(units - rounded) < 0.01) {
    return `${rounded}`;
  }
  return units.toFixed(1);
}
