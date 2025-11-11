// Service for fetching and transforming jadwal (schedule) data
// Table: jadwal_sija
// Columns: id, kelas, hari, mapel, guru, banyak_jam, keterangan
// Goal: Provide a normalized structure per day compatible with existing Kelas UI
// The Kelas UI expects for each day (1..5) an array of up to 12 lesson items:
//   { id, subject, teacher }
// We will expand entries by banyak_jam (number of consecutive slots) and truncate/pad to 12.

import { supabase } from './supabase'

const DAY_NAME_TO_NUMBER = {
	'SENIN': 1,
	'SELASA': 2,
	'RABU': 3,
	'KAMIS': 4,
	'JUMAT': 5,
};

// Reverse map if ever needed
const DAY_NUMBER_TO_NAME = Object.fromEntries(
	Object.entries(DAY_NAME_TO_NUMBER).map(([k, v]) => [v, k])
);

function buildKelasVariants(kelasName) {
	const raw = String(kelasName || '').trim();
	if (!raw) return [];
	const upper = raw.toUpperCase();
	const underscore = upper.replace(/[\s\-]+/g, '_').replace(/_+/g, '_');
	const noSpaces = upper.replace(/\s+/g, '');
	const dash = upper.replace(/\s+/g, '-');
	const underscoreFromRaw = raw.replace(/\s+/g, '_');
	const set = new Set([raw, upper, underscore, underscoreFromRaw, noSpaces, dash]);
	return Array.from(set).filter(Boolean);
}

function normalizeKelas(str) {
	if (str == null) return '';
	return String(str)
		.trim()
		.toUpperCase()
		.replace(/[\s\-]+/g, '_')
		.replace(/_+/g, '_');
}

/**
 * Fetch raw jadwal rows from Supabase filtered by kelas (optional)
 * Strategy when kelas provided:
 *  1) Try IN with several normalized class name variants (spaces->underscores, case variants)
 *  2) If empty, try case-insensitive partial match (ilike) with multiple patterns
 */
export async function fetchRawJadwal(kelasName) {
	try {
		const baseSelect = () => supabase.from('jadwal_sija').select('*');

		// If kelas filter provided, try exact first
		if (kelasName && String(kelasName).trim()) {
			const variants = buildKelasVariants(kelasName);
			if (variants.length) {
				const byIn = await baseSelect()
					.in('kelas', variants)
					.order('hari', { ascending: true })
					.order('mapel', { ascending: true });
				if (byIn.error) throw byIn.error;
				if (Array.isArray(byIn.data) && byIn.data.length > 0) {
					return { success: true, data: byIn.data };
				}

				// Fallback: partial searches
				const patterns = Array.from(new Set([
					`%${variants[0]}%`,
					`%${variants[1] || ''}%`,
					`%${variants.find(v => v.includes('_')) || ''}%`,
				].filter(Boolean)));

				for (const p of patterns) {
					const partialTry = await baseSelect()
						.ilike('kelas', p)
						.order('hari', { ascending: true })
						.order('mapel', { ascending: true });
					if (partialTry.error) throw partialTry.error;
					if (Array.isArray(partialTry.data) && partialTry.data.length > 0) {
						return { success: true, data: partialTry.data };
					}
				}
			}
		}

		// No kelas filter: return all
		const all = await baseSelect()
			.order('hari', { ascending: true })
			.order('mapel', { ascending: true });
		if (all.error) throw all.error;
		return { success: true, data: all.data || [] };
	} catch (err) {
		return { success: false, data: [], error: err.message || 'Failed to fetch jadwal' };
	}
}

/**
 * Transform raw jadwal rows into day-indexed expanded lessons.
 * @param {Array} rows raw rows from jadwal_sija
 * @param {number} slotsPerDay number of UI slots (default 12)
 * @returns {{ [dayNumber: number]: Array<{id:string, subject:string, teacher:string, meta?:object}> }}
 */
function normalizeHari(hariVal) {
	if (hariVal == null) return undefined;
	const s = String(hariVal).trim().toUpperCase();
	if (DAY_NAME_TO_NUMBER[s]) return DAY_NAME_TO_NUMBER[s];
	// numeric string 1..5
	const asNum = Number(s);
	if (asNum >= 1 && asNum <= 5) return asNum;
	// common abbreviations fallback
	const short = {
		'SEN': 1, 'SEL': 2, 'RAB': 3, 'KAM': 4, 'JUM': 5,
	};
	if (short[s]) return short[s];
	return undefined;
}

function parseTimeRange(keterangan) {
	if (!keterangan || typeof keterangan !== 'string') {
		return { startMin: Number.POSITIVE_INFINITY, endMin: Number.POSITIVE_INFINITY, label: '' };
	}
	// Remove spaces, unify separators
	const s = keterangan.replace(/\s/g, '');
	const parts = s.split(/[\-–—]/);
	const first = parts[0] || '';
	const second = parts[1] || '';
	const m1 = first.match(/(\d{1,2})[:.](\d{2})/);
	const m2 = second.match(/(\d{1,2})[:.](\d{2})/);
	const h1 = m1 ? parseInt(m1[1], 10) : NaN;
	const mm1 = m1 ? parseInt(m1[2], 10) : NaN;
	const h2 = m2 ? parseInt(m2[1], 10) : NaN;
	const mm2 = m2 ? parseInt(m2[2], 10) : NaN;
	const startMin = Number.isNaN(h1) || Number.isNaN(mm1) ? Number.POSITIVE_INFINITY : h1 * 60 + mm1;
	const endMin = Number.isNaN(h2) || Number.isNaN(mm2) ? Number.POSITIVE_INFINITY : h2 * 60 + mm2;
	const pad = (n) => String(n).padStart(2, '0');
	const toLabel = (mins) => mins === Number.POSITIVE_INFINITY ? '' : `${pad(Math.floor(mins/60))}.${pad(mins%60)}`;
	const label = `${toLabel(startMin)} ${startMin!==Number.POSITIVE_INFINITY && endMin!==Number.POSITIVE_INFINITY ? '–' : ''} ${toLabel(endMin)}`.trim();
	return { startMin, endMin, label };
}

export function transformJadwal(rows, slotsPerDay = 12) {
	const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
		rows.forEach((r, idx) => {
			const dayNum = normalizeHari(r.hari);
			if (!dayNum) return; // skip invalid day
			const { startMin, endMin, label } = parseTimeRange(r.keterangan);
			grouped[dayNum].push({ row: r, idx, startMin, endMin, label });
	});

	const byDay = { 1: [], 2: [], 3: [], 4: [], 5: [] };
		Object.keys(grouped).forEach(k => {
			const dayItems = grouped[k];
			// Sort by start minutes ascending; if missing time, push later.
			// If tie, non-istirahat first, then by original index for stability.
			dayItems.sort((a, b) => {
				const aFinite = Number.isFinite(a.startMin);
				const bFinite = Number.isFinite(b.startMin);
				if (aFinite && bFinite) {
					const diff = a.startMin - b.startMin;
					if (diff !== 0) return diff;
				} else if (aFinite && !bFinite) return -1;
				else if (!aFinite && bFinite) return 1;

				const aIst = String(a.row?.mapel || '').toLowerCase().includes('istirahat');
				const bIst = String(b.row?.mapel || '').toLowerCase().includes('istirahat');
				if (aIst !== bIst) return aIst ? 1 : -1;

				return a.idx - b.idx;
			});
			dayItems.forEach(({ row: r, label }) => {
			const repeat = Math.max(1, Math.floor(Number(r.banyak_jam) || 1));
			for (let i = 0; i < repeat; i++) {
				if (byDay[k].length >= slotsPerDay) break; // truncate overflow
				byDay[k].push({
					id: String(r.id) + (repeat > 1 ? `-${i+1}` : ''),
					subject: r.mapel || '',
					teacher: r.guru || '',
						timeLabel: label || '',
					meta: {
						kelas: r.kelas,
						keterangan: r.keterangan,
						banyak_jam: r.banyak_jam,
					},
				});
			}
		});
	});
	// Pad days to slotsPerDay with empty entries to keep UI stable
		Object.keys(byDay).forEach(k => {
			const dayList = byDay[k];
			// Khusus Jumat (day 5) jangan tambah slot kosong; biarkan hanya jadwal nyata
			if (Number(k) === 5) return;
			for (let i = dayList.length; i < slotsPerDay; i++) {
				dayList.push({ id: `empty-${k}-${i}`, subject: '', teacher: '' });
			}
		});
	return byDay;
}

/**
 * High-level helper: fetch + transform jadwal for a kelas.
 * @param {string|undefined} kelasName
 * @returns {Promise<{ success: boolean, data: object, error?: string }>} transformed schedule
 */
export async function getJadwalSchedule(kelasName) {
	// First attempt: server-side filtered/raw fetch according to kelas
	const raw = await fetchRawJadwal(kelasName);
	if (!raw.success) {
		return { success: false, data: {}, error: raw.error };
	}

	let rows = raw.data || [];
	const normTarget = normalizeKelas(kelasName || '');

	// If kelas provided and result seems empty, fallback: fetch all and filter client-side by normalized kelas
	if (kelasName && rows.length === 0) {
		const all = await fetchRawJadwal(undefined);
		if (all.success && Array.isArray(all.data)) {
			rows = all.data.filter(r => normalizeKelas(r.kelas) === normTarget);
		}
	}

	// Debug logs to help during setup (safe to keep for now)
	if (typeof window !== 'undefined') {
		// eslint-disable-next-line no-console
		console.log('[jadwal] kelas input =', kelasName, 'normalized =', normTarget, 'rows found =', rows.length);
	}

	const transformed = transformJadwal(rows);
	return { success: true, data: transformed };
}

/**
 * Provide a mock schedule (fallback) replicating previous static behavior.
 */
export function getMockSchedule() {
	const teachers = ['Bu Inung', 'Bu Nisa', 'Frau Vanda'];
	const subjects = ['KK SIJA', 'B. Jerman', 'Matematika', 'Fisika', 'Bahasa Indonesia', 'PKK'];
	const out = { 1: [], 2: [], 3: [], 4: [], 5: [] };
	for (let d = 1; d <= 5; d++) {
		for (let j = 1; j <= 12; j++) {
			const subj = subjects[(d + j) % subjects.length] || subjects[0];
			const teach = teachers[(d + j) % teachers.length] || teachers[0];
			out[d].push({ id: `${d}-${j}`, subject: subj, teacher: teach });
		}
	}
	return out;
}

export default {
	fetchRawJadwal,
	transformJadwal,
	getJadwalSchedule,
	getMockSchedule,
};

