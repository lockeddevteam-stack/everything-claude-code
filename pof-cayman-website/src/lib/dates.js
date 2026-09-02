/*
  Events archive themselves from this file. An event is "upcoming" until
  the end of its last day, Cayman time (UTC-5, no daylight saving).
  Nobody has to remember to remove anything.
  Plain JavaScript so the same file runs in the build and in `npm test`.
*/
export const CAYMAN_OFFSET_MS = -5 * 60 * 60 * 1000;

/** @param {Date} [now] */
export function caymanToday(now = new Date()) {
  const local = new Date(now.getTime() + CAYMAN_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** @param {{date: Date, endDate?: Date}} event @param {Date} [now] */
export function isUpcoming(event, now = new Date()) {
  const last = event.endDate ?? event.date;
  const lastDay = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate()));
  return lastDay.getTime() >= caymanToday(now).getTime();
}

/**
 * @template {{data: {date: Date, endDate?: Date}}} T
 * @param {T[]} events @param {Date} [now]
 */
export function splitEvents(events, now = new Date()) {
  const upcoming = events.filter((e) => isUpcoming(e.data, now)).sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const past = events.filter((e) => !isUpcoming(e.data, now)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return { upcoming, past };
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** @param {Date} d @param {'day'|'month'|'year'} [precision] */
export function formatDate(d, precision = 'day') {
  const y = d.getUTCFullYear();
  const m = MONTHS[d.getUTCMonth()];
  if (precision === 'year') return String(y);
  if (precision === 'month') return `${m} ${y}`;
  return `${d.getUTCDate()} ${m} ${y}`;
}

/** @param {Date} start @param {Date} [end] */
export function formatRange(start, end) {
  if (!end || end.getTime() === start.getTime()) return formatDate(start);
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return `${start.getUTCDate()} to ${end.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
  }
  return `${formatDate(start)} to ${formatDate(end)}`;
}

/** @param {Date} d */
export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** @param {Date} d */
export function weekday(d) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()];
}
