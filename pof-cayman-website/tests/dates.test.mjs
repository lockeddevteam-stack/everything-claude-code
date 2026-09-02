import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUpcoming, splitEvents, caymanToday, formatDate, formatRange } from '../src/lib/dates.js';

const d = (s) => new Date(s + 'T00:00:00Z');

test('an event today in Cayman is still upcoming', () => {
  const now = new Date('2026-09-02T23:30:00Z'); // 6:30 pm in Cayman on 2 Sept
  assert.equal(isUpcoming({ date: d('2026-09-02') }, now), true);
});

test('an event yesterday has archived without anyone touching it', () => {
  const now = new Date('2026-09-03T05:01:00Z'); // 12:01 am Cayman on 3 Sept
  assert.equal(isUpcoming({ date: d('2026-09-02') }, now), false);
});

test('UTC midnight does not archive a Cayman event early', () => {
  const now = new Date('2026-09-03T02:00:00Z'); // still 9 pm on 2 Sept in Cayman
  assert.equal(isUpcoming({ date: d('2026-09-02') }, now), true);
});

test('multi-day events stay until their last day', () => {
  const now = new Date('2026-09-05T15:00:00Z');
  assert.equal(isUpcoming({ date: d('2026-09-04'), endDate: d('2026-09-06') }, now), true);
  assert.equal(isUpcoming({ date: d('2026-09-04'), endDate: d('2026-09-06') }, new Date('2026-09-07T15:00:00Z')), false);
});

test('splitEvents sorts upcoming ascending and past descending', () => {
  const now = new Date('2026-09-02T15:00:00Z');
  const list = [
    { id: 'a', data: { date: d('2026-10-01') } },
    { id: 'b', data: { date: d('2026-09-10') } },
    { id: 'c', data: { date: d('2026-01-10') } },
    { id: 'd', data: { date: d('2026-05-10') } },
  ];
  const { upcoming, past } = splitEvents(list, now);
  assert.deepEqual(upcoming.map((e) => e.id), ['b', 'a']);
  assert.deepEqual(past.map((e) => e.id), ['d', 'c']);
});

test('caymanToday returns a UTC-midnight date for the Cayman calendar day', () => {
  assert.equal(caymanToday(new Date('2026-09-03T03:00:00Z')).toISOString(), '2026-09-02T00:00:00.000Z');
});

test('dates format in plain British English', () => {
  assert.equal(formatDate(d('2025-04-30')), '30 April 2025');
  assert.equal(formatDate(d('2026-03-01'), 'month'), 'March 2026');
  assert.equal(formatRange(d('2026-09-19'), d('2026-09-20')), '19 to 20 September 2026');
});
