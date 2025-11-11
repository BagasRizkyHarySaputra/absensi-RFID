// jadwalService.js - fetch and compute real-time schedule slices
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('🚨 jadwalService: Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DAY_NAMES = ['MINGGU','SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU'];

function normalizeHari(h) {
	if (!h) return '';
	const up = String(h).trim().toUpperCase();
	// map common forms
		const map = { SENIN:'SENIN', SELASA:'SELASA', RABU:'RABU', KAMIS:'KAMIS', JUMAT:'JUMAT', JUMAAT:'JUMAT', "JUM'AT":'JUMAT' };
	return map[up] || up;
}

// Parse keterangan "07:00–08:30" to start/end minutes
function parseRange(ket){
	if(!ket) return {start:Infinity,end:Infinity,label:''};
	const cleaned = ket.replace(/\s/g,'');
	const parts = cleaned.split(/[\-–—]/);
	const re = /(\d{1,2})[:.](\d{2})/;
	const m1 = re.exec(parts[0]||'');
	const m2 = re.exec(parts[1]||'');
	const toMin = (h,m)=> h*60+m;
	const start = m1?toMin(+m1[1],+m1[2]):Infinity;
	const end = m2?toMin(+m2[1],+m2[2]):Infinity;
	const pad = n=>String(n).padStart(2,'0');
	const fmt = mins=> mins===Infinity?'' : `${pad(Math.floor(mins/60))}.${pad(mins%60)}`;
	const label = `${fmt(start)}${(start!==Infinity&&end!==Infinity)?' – ':''}${fmt(end)}`.trim();
	return {start,end,label};
}

// Fetch raw rows for given class & today
export async function fetchTodaySchedule(kelas){
	try {
		const now = new Date();
		const hari = DAY_NAMES[now.getDay()]; // e.g. SELASA
		
		// Convert class name format: "XI SIJA 1" -> "XI_SIJA_1"
		const kelasFormatted = kelas.replace(/\s+/g, '_');
		
		// Convert day name to title case: "SELASA" -> "Selasa"
		const hariFormatted = hari.charAt(0) + hari.slice(1).toLowerCase();
		
		console.log(`🔍 [jadwalService] Fetching schedule for:`, {
			originalClass: kelas,
			formattedClass: kelasFormatted,
			originalDay: hari,
			formattedDay: hariFormatted
		});
		
		// We assume jadwal table name is jadwal_sija (as provided earlier)
		const { data, error } = await supabase
			.from('jadwal_sija')
			.select('*')
			.eq('kelas', kelasFormatted)
			.ilike('hari', `%${hariFormatted}%`)
			.limit(200);
			
		if (error) {
			console.error('❌ [jadwalService] Database error:', {
				error: error,
				message: error?.message,
				code: error?.code,
				details: error?.details
			});
			throw error;
		}
		
		console.log(`✅ [jadwalService] Found ${(data || []).length} schedule entries for ${kelasFormatted} on ${hariFormatted}`);
		
		return { success:true, data: data||[], hari: hariFormatted };
	} catch(err){
		console.error('❌ [jadwalService] fetchTodaySchedule error:', {
			error: err,
			message: err?.message,
			stack: err?.stack
		});
		return { success:false, data:[], error: err.message || 'Unknown error occurred' };
	}
}

// Compute previous / current / next based on real clock
export function computeRealtimeSlots(rows){
	const enriched = rows.map(r=>{
		const {start,end,label} = parseRange(r.keterangan);
		return { ...r, _start:start, _end:end, _label:label };
	}).filter(r=>Number.isFinite(r._start));
	enriched.sort((a,b)=> a._start - b._start);
	const now = new Date();
	const nowMin = now.getHours()*60 + now.getMinutes();
	let currentIndex = -1;
	for(let i=0;i<enriched.length;i++){ if(nowMin >= enriched[i]._start && nowMin < enriched[i]._end){ currentIndex = i; break; } }
	const current = currentIndex>=0 ? enriched[currentIndex] : null;
	const prev = currentIndex>0 ? enriched[currentIndex-1] : null;
	const next = currentIndex>=0 && currentIndex < enriched.length-1 ? enriched[currentIndex+1] : null;
	return { prev, current, next, all: enriched };
}

export async function getRealtimeScheduleSlice(kelas){
	console.log(`🕐 [jadwalService] Getting realtime schedule slice for: ${kelas}`);
	
	const raw = await fetchTodaySchedule(kelas);
	if(!raw.success) {
		console.error('❌ [jadwalService] Failed to fetch schedule:', raw.error);
		return { success:false, error: raw.error, prev:null, current:null, next:null };
	}
	
	const { prev, current, next } = computeRealtimeSlots(raw.data);
	
	console.log(`✅ [jadwalService] Schedule computed:`, {
		total: raw.data.length,
		prev: prev?.mapel || null,
		current: current?.mapel || null,
		next: next?.mapel || null,
		hari: raw.hari
	});
	
	return { success:true, prev, current, next, hari: raw.hari };
}

export default {
	fetchTodaySchedule,
	computeRealtimeSlots,
	getRealtimeScheduleSlice,
};
