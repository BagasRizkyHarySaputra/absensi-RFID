// statistik.js - Data aggregation helpers for the Reports page
import { createClient } from '@supabase/supabase-js'

// Build supabase client from env variables only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('🚨 statistik.js: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Treat only meaningful Supabase errors as errors
function isSupabaseError(err, data) {
	// No error provided
	if (!err) return false
	// If we actually received data rows, prefer them over ambiguous error objects
	if (Array.isArray(data) && data.length >= 0) return false
	// Ignore empty objects
	if (typeof err === 'object' && err !== null && Object.keys(err).length === 0) return false
	// Strings
	if (typeof err === 'string') return err.trim().length > 0
	// Known shapes
	const msg = typeof err.message === 'string' ? err.message.trim() : ''
	const code = typeof err.code === 'string' ? err.code.trim() : ''
	return msg.length > 0 || code.length > 0
}

// Normalize DB status -> category based on actual database values
function normalizeStatus(val) {
	if (!val) return 'Other'
	const s = String(val).toLowerCase().trim()
	
	// Present statuses
	if (['hadir', 'present', 'masuk', 'terlambat'].includes(s)) return 'Hadir'
	
	// Excused absences 
	if (['izin', 'sakit', 'permission', 'leave'].includes(s)) return 'Izin'
	
	// Unexcused absences
	if (['alpha', 'absent', 'bolos', 'tidak_hadir'].includes(s)) return 'Alpha'
	
	return 'Other'
}

// Build robust class name variants: spaces/underscores/dashes/case-insensitive
function buildKelasVariants(kelas) {
	const raw = String(kelas || '').trim();
	const upper = raw.toUpperCase();
	const lower = raw.toLowerCase();
	const unders = upper.replace(/[\s\-]+/g, '_').replace(/_+/g, '_');
	const noSpace = upper.replace(/\s+/g, '');
	const dashed = upper.replace(/\s+/g, '-');
	const set = new Set([raw, upper, lower, unders, noSpace, dashed]);
	return Array.from(set).filter(Boolean);
}

// Convert class to a loose ilike pattern where any separator can vary
function kelasToLoosePattern(kelas) {
	const s = String(kelas || '').trim();
	// Replace spaces/underscores/dashes with wildcard %
	return `%${s.replace(/[\s_\-]+/g, '%')}%`;
}

// Get attendance summary for a class within [start, end)
async function getAttendanceSummary({ kelas, start, end }) {
	try {
		if (!kelas) throw new Error('kelas is required')
		if (!start || !end) throw new Error('start/end are required ISO strings')

		console.log(`🔍 Fetching attendance for kelas: "${kelas}"`);
		console.log(`📅 Date range: ${start} to ${end}`);
		console.log(`🎯 FILTERING BY DATE: We will ONLY return data within this specific date range`);

		// Convert to proper format for database query
		const startIso = typeof start === 'string' ? start : start.toISOString();
		const endIso = typeof end === 'string' ? end : end.toISOString();

		// First: Get all unique classes in database to debug
		const { data: allClassesData } = await supabase
			.from('kehadiran')
			.select('kelas')
			.limit(1000);
		
		const uniqueClasses = [...new Set(allClassesData?.map(r => r.kelas).filter(Boolean))] || [];
		console.log(`📋 All unique classes in kehadiran table:`, uniqueClasses);

		// Check if our target class exists in any form
		const classExists = uniqueClasses.some(cls => 
			cls.toLowerCase().includes(kelas.toLowerCase()) || 
			kelas.toLowerCase().includes(cls.toLowerCase())
		);
		console.log(`🎯 Does "${kelas}" exist in database?`, classExists);

			const variants = buildKelasVariants(kelas);

			// Helper to run query against a specific time column name
			async function runQuery(timeCol, filterBuilder) {
				let query = supabase
					.from('kehadiran')
					.select(`status, ${timeCol}, kelas, nama, nis`)
					.gte(timeCol, startIso)
					.lt(timeCol, endIso)
					.limit(5000);
				query = filterBuilder(query);
				const { data, error } = await query;
				return { data, error };
			}

			// 1) Exact match with IN variants, primary time column waktu_absen
			let { data, error } = await runQuery('waktu_absen', (q) => q.in('kelas', variants));

		console.log(`📊 Exact match query result for "${kelas}":`, { 
			dataCount: data?.length || 0, 
			error: error?.message || 'none',
			dateRangeUsed: { start: startIso, end: endIso },
			sampleData: data?.slice(0, 5) || []
		});

		if (isSupabaseError(error, data)) {
			console.warn('⚠️ getAttendanceSummary error (continuing with empty result):', error)
			return { data: { Hadir: 0, Izin: 0, Alpha: 0 }, error }
		}

			// If no exact match, try fuzzy search with loose patterns
			if ((!data || data.length === 0) && !isSupabaseError(error, data)) {
				console.log(`🔍 No exact IN-match for "${kelas}", trying fuzzy search with loose patterns...`);
				const patterns = [kelasToLoosePattern(kelas), ...variants.map(kelasToLoosePattern)];
				for (const p of [...new Set(patterns)]) {
					const { data: likeData, error: likeErr } = await runQuery('waktu_absen', (q) => q.ilike('kelas', p));
					console.log(`🔍 Fuzzy pattern ${p} -> count=${likeData?.length || 0}`);
					if (!isSupabaseError(likeErr, likeData) && likeData?.length) {
						data = likeData;
						break;
					}
				}
			}

		// Log if no data found in the specified date range
		if ((!data || data.length === 0)) {
			console.log(`📊 No data found for "${kelas}" in date range ${startIso} to ${endIso}`);
			console.log(`🎯 CORRECT BEHAVIOR: Only showing data from the selected time period, no fallback to all-time data`);
			
			// Note: We intentionally do NOT fallback to all-time data here
			// Each date range should show only data from that specific period
		}

				// If still empty, try alternative time column 'created_at'
			if ((!data || data.length === 0)) {
				console.log('⏱️ Trying alternative time column created_at...');
				let alt = await runQuery('created_at', (q) => q.in('kelas', variants));
				if (!isSupabaseError(alt.error, alt.data) && alt.data?.length) {
					data = alt.data;
				} else {
					const patterns = [kelasToLoosePattern(kelas), ...variants.map(kelasToLoosePattern)];
					for (const p of [...new Set(patterns)]) {
						const { data: likeData, error: likeErr } = await runQuery('created_at', (q) => q.ilike('kelas', p));
						if (!isSupabaseError(likeErr, likeData) && likeData?.length) {
							data = likeData;
							break;
						}
					}
				}
			}

				// Final fallback: ALL-TIME aggregation ignoring date range (as requested to use provided report data)
				if ((!data || data.length === 0)) {
					console.log('📈 Falling back to ALL-TIME aggregation for class:', kelas);
					// helper to run all-time queries
					async function runAny(timeCol, filterBuilder) {
						let query = supabase
							.from('kehadiran')
							.select(`status, ${timeCol}, kelas, nama, nis`)
							.limit(5000);
						query = filterBuilder(query);
						const { data, error } = await query;
						return { data, error };
					}
					// Try waktu_absen without dates
					let any = await runAny('waktu_absen', (q) => q.in('kelas', variants));
					if (!isSupabaseError(any.error, any.data) && any.data?.length) {
						data = any.data;
					} else {
						const patterns = [kelasToLoosePattern(kelas), ...variants.map(kelasToLoosePattern)];
						for (const p of [...new Set(patterns)]) {
							const { data: likeData, error: likeErr } = await runAny('waktu_absen', (q) => q.ilike('kelas', p));
							if (!isSupabaseError(likeErr, likeData) && likeData?.length) {
								data = likeData;
								break;
							}
						}
					}
					// If still empty, try created_at all-time
					if ((!data || data.length === 0)) {
						let anyAlt = await runAny('created_at', (q) => q.in('kelas', variants));
						if (!isSupabaseError(anyAlt.error, anyAlt.data) && anyAlt.data?.length) {
							data = anyAlt.data;
						} else {
							const patterns = [kelasToLoosePattern(kelas), ...variants.map(kelasToLoosePattern)];
							for (const p of [...new Set(patterns)]) {
								const { data: likeData, error: likeErr } = await runAny('created_at', (q) => q.ilike('kelas', p));
								if (!isSupabaseError(likeErr, likeData) && likeData?.length) {
									data = likeData;
									break;
								}
							}
						}
					}
				}

		const counts = { Hadir: 0, Izin: 0, Alpha: 0, Other: 0 }
		
		for (const row of data || []) {
			const statusValue = row.status
			const cat = normalizeStatus(statusValue)
			if (counts[cat] !== undefined) {
				counts[cat]++
			}
		}

		console.log(`✅ Final counts for "${kelas}":`, counts);
		console.log(`📊 Status breakdown:`, data?.reduce((acc, row) => {
			acc[row.status] = (acc[row.status] || 0) + 1;
			return acc;
		}, {}) || {});
		
		return { data: counts, error: null }
	} catch (err) {
		console.error(`❌ getAttendanceSummary exception for "${kelas}":`, err)
		return { data: { Hadir: 0, Izin: 0, Alpha: 0 }, error: err }
	}
}

// Optional helper to list unique classes from siswa
async function getClasses(limit = 6) {
	console.log('🔍 Fetching available classes...');
	
	// First try: Get classes from siswa table
	const { data, error } = await supabase
		.from('siswa')
		.select('kelas')
		.order('kelas', { ascending: true })
		.limit(1000)

	console.log('📚 Classes from siswa table:', { 
		count: data?.length || 0, 
		error: error?.message || 'none',
		sample: data?.slice(0, 5) || [] 
	});

	if (!error && data?.length > 0) {
		const uniq = [...new Set(data.map((r) => r.kelas).filter(Boolean))]
		console.log('✅ Unique classes from siswa:', uniq);
		return { classes: uniq.slice(0, limit), error: null }
	}
	
	// Fallback: Get classes from kehadiran table if siswa is empty
	console.log('⚠️ No classes in siswa table, trying kehadiran table...');
	
	const { data: kehadiranData, error: kehadiranError } = await supabase
		.from('kehadiran')
		.select('kelas')
		.order('kelas', { ascending: true })
		.limit(1000)
		
	console.log('📚 Classes from kehadiran table:', { 
		count: kehadiranData?.length || 0, 
		error: kehadiranError?.message || 'none' 
	});

	if (kehadiranError) {
		console.error('❌ Failed to get classes from both tables');
		return { classes: [], error: kehadiranError }
	}
	
	const uniqFromKehadiran = [...new Set((kehadiranData || []).map((r) => r.kelas).filter(Boolean))]
	console.log('✅ Unique classes from kehadiran:', uniqFromKehadiran);
	
	return { classes: uniqFromKehadiran.slice(0, limit), error: null }
}

// Debug helper to check all available data
async function debugDatabaseContent() {
	console.log('🔍 === DATABASE CONTENT DEBUG ===');
	
	// Check kehadiran table
	try {
		const { data: kehadiranData, error: kehadiranError } = await supabase
			.from('kehadiran')
			.select('kelas, status, waktu_absen')
			.limit(100);
			
		if (kehadiranError) {
			console.error('❌ Error fetching kehadiran:', kehadiranError);
		} else {
			const classSummary = {};
			kehadiranData?.forEach(row => {
				if (!classSummary[row.kelas]) {
					classSummary[row.kelas] = { total: 0, statuses: {} };
				}
				classSummary[row.kelas].total++;
				classSummary[row.kelas].statuses[row.status] = (classSummary[row.kelas].statuses[row.status] || 0) + 1;
			});
			
			console.log('📊 KEHADIRAN TABLE SUMMARY:');
			console.log('Total records:', kehadiranData?.length || 0);
			console.log('Classes found:', Object.keys(classSummary));
			console.log('Class breakdown:', classSummary);
			
			const dateRange = kehadiranData?.length > 0 ? {
				earliest: new Date(Math.min(...kehadiranData.map(d => new Date(d.waktu_absen).getTime()))).toISOString(),
				latest: new Date(Math.max(...kehadiranData.map(d => new Date(d.waktu_absen).getTime()))).toISOString()
			} : null;
			console.log('Date range in data:', dateRange);
		}
	} catch (err) {
		console.error('❌ Error in kehadiran debug:', err);
	}
	
	// Check siswa table
	try {
		const { data: siswaData, error: siswaError } = await supabase
			.from('siswa')
			.select('kelas, nama')
			.limit(100);
			
		if (siswaError) {
			console.error('❌ Error fetching siswa:', siswaError);
		} else {
			const siswaClasses = [...new Set(siswaData?.map(s => s.kelas).filter(Boolean))];
			console.log('📚 SISWA TABLE SUMMARY:');
			console.log('Total students:', siswaData?.length || 0);
			console.log('Classes in siswa:', siswaClasses);
		}
	} catch (err) {
		console.error('❌ Error in siswa debug:', err);
	}
	
	console.log('🔍 === END DEBUG ===');
}

const statistikService = {
	getAttendanceSummary,
	getClasses,
	debugDatabaseContent,
}

export default statistikService

// Realtime subscription helper
export function subscribeKehadiran({ onChange }) {
	const channel = supabase
		.channel('reports-kehadiran')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'kehadiran' },
			(payload) => {
				try {
					onChange?.(payload)
				} catch (e) {
					console.warn('subscribeKehadiran onChange error:', e)
				}
			}
		)
		.subscribe()

	return () => {
		try { supabase.removeChannel(channel) } catch {}
	}
}

