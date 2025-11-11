// report.js - Aggregated reporting helpers for the Reports page
// Connects to Supabase and computes summaries from tables:
// - kehadiran: attendance status per student entry (for 'hadir' status)
// - report: approved leave requests (for 'izin' status) 
// - siswa: student roster with class (kelas)
// - alpha: calculated if student not found in kehadiran or report tables

import { createClient } from '@supabase/supabase-js'

// Use environment variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('🚨 report.js: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helpers
const toIso = (d) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString())

// Compute [start, end) based on a friendly range label
export function getRangeBounds(label = 'This Month') {
	const now = new Date()
	const start = new Date(now)
	const end = new Date(now)

	switch (label) {
		case 'Today': {
			start.setHours(0, 0, 0, 0)
			end.setDate(start.getDate() + 1)
			end.setHours(0, 0, 0, 0)
			break
		}
		case 'This Week': {
			// Start on Monday
			const day = start.getDay() || 7
			if (day !== 1) start.setHours(-24 * (day - 1), 0, 0, 0)
			else start.setHours(0, 0, 0, 0)
			end.setTime(start.getTime())
			end.setDate(start.getDate() + 7)
			break
		}
		case 'This Semester': {
			// Simple semester heuristic: Jan–Jun, Jul–Dec
			const month = start.getMonth()
			const semesterStartMonth = month < 6 ? 0 : 6
			start.setMonth(semesterStartMonth, 1)
			start.setHours(0, 0, 0, 0)
			end.setMonth(semesterStartMonth + 6, 1)
			end.setHours(0, 0, 0, 0)
			break
		}
		case 'This Month':
		default: {
			start.setDate(1)
			start.setHours(0, 0, 0, 0)
			end.setMonth(start.getMonth() + 1, 1)
			end.setHours(0, 0, 0, 0)
			break
		}
	}

	return { start, end, startIso: toIso(start), endIso: toIso(end) }
}

// Get a unique list of classes from siswa table (fallback to kehadiran if needed)
export async function getClasses(limit = 6) {
	// Try siswa first for completeness
	const { data, error } = await supabase
		.from('siswa')
		.select('kelas')
		.order('kelas', { ascending: true })
		.limit(1000)

	if (error) {
		console.warn('getClasses(): siswa failed, falling back to kehadiran', error?.message)
		const { data: kData, error: kErr } = await supabase
			.from('kehadiran')
			.select('kelas')
			.order('kelas', { ascending: true })
			.limit(1000)
		if (kErr) return { classes: [], error: kErr }
		const uniq = [...new Set((kData || []).map((r) => r.kelas).filter(Boolean))]
		return { classes: uniq.slice(0, limit), error: null }
	}

	const uniq = [...new Set((data || []).map((r) => r.kelas).filter(Boolean))]
	return { classes: uniq.slice(0, limit), error: null }
}

// Normalize status values to the 3 categories used by the UI
function normalizeStatus(val) {
	if (!val) return 'other'
	const s = String(val).toLowerCase().trim()
	
	// Present statuses
	if (['hadir', 'present', 'masuk', 'terlambat'].includes(s)) return 'hadir'
	
	// Excused absences 
	if (['izin', 'sakit', 'permission', 'leave'].includes(s)) return 'izin'
	
	// Unexcused absences
	if (['alpha', 'absent', 'bolos', 'tidak_hadir'].includes(s)) return 'alpha'
	
	return 'other'
}

// Fetch and aggregate attendance for a class and date range using new logic:
// 1. Get 'hadir' count from kehadiran table 
// 2. Get 'izin' count from report table (approved leave requests)
// 3. Calculate 'alpha' by counting days where students were absent (not in kehadiran or report)
export async function getAttendanceSummary({ kelas, start, end }) {
	if (!kelas) return { hadir: 0, izin: 0, alpha: 0, total: 0 }
	const startIso = toIso(start)
	const endIso = toIso(end)

	console.log(`🔍 [report.js] Fetching attendance for "${kelas}", range: ${startIso} to ${endIso}`);

	try {
		// 1. Get total students in this class
		const { data: siswaData, error: siswaError } = await supabase
			.from('siswa')
			.select('nis, nama')
			.eq('kelas', kelas)

		if (siswaError) {
			console.error('Error fetching siswa:', siswaError);
			return { hadir: 0, izin: 0, alpha: 0, total: 0, error: siswaError }
		}

		const totalStudents = siswaData?.length || 0;
		console.log(`👥 Total students in ${kelas}: ${totalStudents}`);

		if (totalStudents === 0) {
			return { hadir: 0, izin: 0, alpha: 0, total: 0 };
		}

		// 2. Generate list of dates in the range (excluding weekends for school days)
		const dates = [];
		const currentDate = new Date(start);
		const endDate = new Date(end);
		
		while (currentDate < endDate) {
			const dayOfWeek = currentDate.getDay();
			// Only include Monday-Friday (1-5) for school days
			if (dayOfWeek >= 1 && dayOfWeek <= 5) {
				dates.push(new Date(currentDate).toISOString().split('T')[0]);
			}
			currentDate.setDate(currentDate.getDate() + 1);
		}
		
		console.log(`📅 School days in range: ${dates.length} days`, dates);

		// 3. Get 'hadir' count from kehadiran table (present students)
		const { data: kehadiranData, error: kehadiranError } = await supabase
			.from('kehadiran')
			.select('nis, status, waktu_absen')
			.eq('kelas', kelas)
			.gte('waktu_absen', startIso)
			.lt('waktu_absen', endIso)
			.limit(5000)

		if (kehadiranError) {
			console.error('Error fetching kehadiran:', kehadiranError);
		}

		// Count 'hadir' from kehadiran (including 'hadir' and 'terlambat')
		const hadirCount = (kehadiranData || []).filter(row => {
			const status = normalizeStatus(row.status);
			return status === 'hadir';
		}).length;

		console.log(`✅ Hadir count from kehadiran: ${hadirCount}`);

		// 4. Get 'izin' count from report table (approved leave requests)
		const { data: reportData, error: reportError } = await supabase
			.from('report')
			.select('nis, nama, izin, tanggal_mulai, tanggal_selesai')
			.eq('kelas', kelas)
			.eq('izin', true) // Only approved leave requests

		if (reportError) {
			console.error('Error fetching report:', reportError);
		}

		// Count izin days (each student can have multiple days of approved leave)
		let izinCount = 0;
		const izinDaysPerStudent = new Map(); // Track which dates each student was on izin

		(reportData || []).forEach(report => {
			const startDate = new Date(report.tanggal_mulai);
			const endDate = new Date(report.tanggal_selesai);
			
			// Count each day between tanggal_mulai and tanggal_selesai
			const currentDate = new Date(startDate);
			while (currentDate <= endDate) {
				const dateStr = currentDate.toISOString().split('T')[0];
				
				// Only count if the date is within our range and is a school day
				if (dates.includes(dateStr)) {
					const nis = report.nis;
					if (!izinDaysPerStudent.has(nis)) {
						izinDaysPerStudent.set(nis, new Set());
					}
					izinDaysPerStudent.get(nis).add(dateStr);
					izinCount++;
				}
				
				currentDate.setDate(currentDate.getDate() + 1);
			}
		});

		console.log(`📋 Izin count from report (total days): ${izinCount}`);

		// 5. Calculate alpha count per date
		let alphaCount = 0;
		const hadirDaysPerStudent = new Map(); // Track which dates each student was hadir

		// Map kehadiran data to dates and students
		(kehadiranData || []).forEach(record => {
			const status = normalizeStatus(record.status);
			if (status === 'hadir') {
				const dateStr = record.waktu_absen.split('T')[0];
				const nis = record.nis;
				
				if (!hadirDaysPerStudent.has(nis)) {
					hadirDaysPerStudent.set(nis, new Set());
				}
				hadirDaysPerStudent.get(nis).add(dateStr);
			}
		});

		// For each student and each school day, check if they were absent (alpha)
		siswaData.forEach(siswa => {
			const nis = siswa.nis;
			const hadirDates = hadirDaysPerStudent.get(nis) || new Set();
			const izinDates = izinDaysPerStudent.get(nis) || new Set();

			dates.forEach(date => {
				// If student was not hadir AND not on izin, count as alpha
				if (!hadirDates.has(date) && !izinDates.has(date)) {
					alphaCount++;
				}
			});
		});

		console.log(`❌ Alpha count (calculated per day): ${alphaCount}`);

		const result = { 
			hadir: hadirCount, 
			izin: izinCount, 
			alpha: alphaCount, 
			total: totalStudents,
			totalSchoolDays: dates.length,
			sources: {
				kehadiranRecords: (kehadiranData || []).length,
				reportRecords: (reportData || []).length,
				datesChecked: dates.length
			}
		};

		console.log(`✅ [report.js] Final summary for "${kelas}":`, result);
		return result;

	} catch (error) {
		console.error('getAttendanceSummary() unexpected error:', error);
		return { hadir: 0, izin: 0, alpha: 0, total: 0, error }
	}
}

// Convenience: build card data for a set of classes
export async function getReportCards({ rangeLabel = 'This Month', classes: presetClasses }) {
	const { start, end } = getRangeBounds(rangeLabel)

	let classes = presetClasses
	if (!classes || classes.length === 0) {
		const { classes: cls } = await getClasses(3)
		classes = cls
	}

	const results = []
	for (const kelas of classes) {
		const s = await getAttendanceSummary({ kelas, start, end })
		results.push({ class: kelas, values: [s.hadir, s.izin, s.alpha] })
	}

	return results
}

export default {
	getRangeBounds,
	getClasses,
	getAttendanceSummary,
	getReportCards,
}

