import { getEventBySlug } from '../../../src/data/events.ts';
import { createHostMessage, createSmsUri } from '../../lib/host-message.js';
import { maskUsMobileNumber } from '../../lib/phone.js';

const ATTENDANCE_FILTERS = new Set(['all', 'attending', 'declines']);
const SORTS = {
  newest: 'submitted_at DESC',
  oldest: 'submitted_at ASC',
  name: 'guest_name COLLATE NOCASE ASC, submitted_at DESC',
};

const jsonHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  let text = String(value).replace(/\r\n?/g, '\n');
  if (/^[=+\-@\t\r]/.test(text.trimStart())) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvResponse(rows, eventSlug) {
  const columns = [
    ['Event', 'event_slug'],
    ['Guest name', 'guest_name'],
    ['Attendance', 'attendance_status'],
    ['Adults', 'adults'],
    ['Children', 'children'],
    ['Dietary restrictions', 'dietary_restrictions'],
    ['Message', 'message'],
    ['Submitted at', 'submitted_at'],
  ];
  const lines = [
    columns.map(([label]) => escapeCsv(label)).join(','),
    ...rows.map((row) => columns.map(([, key]) => escapeCsv(row[key])).join(',')),
  ];
  const suffix = eventSlug === 'all' ? 'all-events' : eventSlug;
  return new Response(`\uFEFF${lines.join('\r\n')}\r\n`, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="rsvps-${suffix}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return json({ ok: false, message: 'Method not allowed.' }, 405);
  }
  if (!context.env.DB || typeof context.env.DB.prepare !== 'function') {
    return json({ ok: false, message: 'The RSVP database binding is unavailable.' }, 503);
  }

  const url = new URL(context.request.url);
  const attendance = url.searchParams.get('attendance') ?? 'all';
  const eventSlug = url.searchParams.get('event') ?? 'all';
  const sort = url.searchParams.get('sort') ?? 'newest';
  const format = url.searchParams.get('format') ?? 'json';
  if (!ATTENDANCE_FILTERS.has(attendance)) return json({ ok: false, message: 'Invalid attendance filter.' }, 400);
  if (eventSlug !== 'all' && !getEventBySlug(eventSlug)) return json({ ok: false, message: 'Invalid event filter.' }, 400);
  if (!Object.hasOwn(SORTS, sort)) return json({ ok: false, message: 'Invalid sort order.' }, 400);
  if (format !== 'json' && format !== 'csv') return json({ ok: false, message: 'Invalid response format.' }, 400);

  const listFilters = [];
  const listValues = [];
  if (eventSlug !== 'all') {
    listFilters.push('event_slug = ?');
    listValues.push(eventSlug);
  }
  if (attendance !== 'all') {
    listFilters.push('attendance_status = ?');
    listValues.push(attendance);
  }
  const where = listFilters.length ? `WHERE ${listFilters.join(' AND ')}` : '';
  const limit = format === 'csv' ? 5000 : 1000;

  try {
    const rowsResult = await context.env.DB.prepare(`
      SELECT id, event_slug, guest_name, mobile_number, attendance_status, adults, children,
        dietary_restrictions, message, submitted_at
      FROM rsvps
      ${where}
      ORDER BY ${SORTS[sort]}
      LIMIT ${limit}
    `).bind(...listValues).all();
    if (!rowsResult.success) throw new Error('D1 list query failed.');
    if (format === 'csv') return csvResponse(rowsResult.results, eventSlug);

    const rsvps = rowsResult.results.map((row) => {
      const textMessage = row.mobile_number ? createHostMessage(row) : null;
      return {
        ...row,
        masked_mobile_number: maskUsMobileNumber(row.mobile_number),
        text_message: textMessage,
        sms_uri: row.mobile_number && textMessage ? createSmsUri(row.mobile_number, textMessage) : null,
      };
    });

    const summaryFilters = [];
    const summaryValues = [];
    if (eventSlug !== 'all') {
      summaryFilters.push('event_slug = ?');
      summaryValues.push(eventSlug);
    }
    const summaryWhere = summaryFilters.length ? `WHERE ${summaryFilters.join(' AND ')}` : '';
    const summary = await context.env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN attendance_status = 'attending' THEN 1 ELSE 0 END), 0) AS attending,
        COALESCE(SUM(CASE WHEN attendance_status = 'declines' THEN 1 ELSE 0 END), 0) AS declines,
        COALESCE(SUM(adults), 0) AS adults,
        COALESCE(SUM(children), 0) AS children
      FROM rsvps
      ${summaryWhere}
    `).bind(...summaryValues).first();

    return json({
      ok: true,
      summary: summary ?? { attending: 0, declines: 0, adults: 0, children: 0 },
      rsvps,
      truncated: rsvps.length === limit,
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Host RSVP query failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
    return json({ ok: false, message: 'The RSVP list could not be loaded.' }, 500);
  }
}
