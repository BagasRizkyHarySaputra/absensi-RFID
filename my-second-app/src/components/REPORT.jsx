"use client";

import React, { useEffect, useMemo, useState } from 'react';
import '../static/css/REPORT.css';
import '../static/js/REPORT.js';
import HEADERINpage from './HEADERINpage';
import { getAttendanceSummary } from '../lib/report';
import { subscribeKehadiran } from '../lib/statistik';
import statistikService from '../lib/statistik';

// Build a conic-gradient pie background from values and colors
// If no data (all zeros), return neutral gray background
function pieBackground(values, colors, emptyColor = '#CBD5E1') {
	const total = values.reduce((s, v) => s + v, 0);
	if (total <= 0) return emptyColor;
	let acc = 0;
	const stops = values.map((v, i) => {
		const start = (acc / total) * 100;
		const end = ((acc + v) / total) * 100;
		acc += v;
		return `${colors[i]} ${start}% ${end}%`;
	});
	return `conic-gradient(${stops.join(', ')})`;
}

export default function REPORT() {
	const [range, setRange] = useState('This Month');
	
	// Dynamic class list from database
	const [classes, setClasses] = useState([]);
	const [classesLoading, setClassesLoading] = useState(true);

	// Build cards from dynamic classes
	const cards = useMemo(() => {
		return classes.map(className => ({ 
			class: className, 
			values: [0, 0, 0] 
		}));
	}, [classes]);

	// Live values from database keyed by class name
	const [liveValues, setLiveValues] = useState({});
	const [loading, setLoading] = useState(false);

	// Compute ISO start/end by selected range
	function computeRange(rangeLabel) {
		const now = new Date();
		
		if (rangeLabel === 'Today') {
			const start = new Date(now);
			start.setHours(0, 0, 0, 0);
			const end = new Date(start);
			end.setDate(end.getDate() + 1);
			return { start: start.toISOString(), end: end.toISOString() };
		}
		
		if (rangeLabel === 'This Week') {
			const start = new Date(now);
			const day = start.getDay();
			const diffToMonday = (day + 6) % 7; // Monday=0
			start.setDate(start.getDate() - diffToMonday);
			start.setHours(0, 0, 0, 0);
			const end = new Date(start);
			end.setDate(end.getDate() + 7);
			return { start: start.toISOString(), end: end.toISOString() };
		}
		
		if (rangeLabel === 'This Semester') {
			const start = new Date(now);
			const end = new Date(now);
			const month = now.getMonth(); // 0-based (0=Jan, 11=Dec)
			
			if (month < 6) {
				// First semester: January 1 to June 30
				start.setMonth(0, 1); // January 1st
				start.setHours(0, 0, 0, 0);
				end.setMonth(6, 1); // July 1st (exclusive end)
				end.setHours(0, 0, 0, 0);
			} else {
				// Second semester: July 1 to December 31
				start.setMonth(6, 1); // July 1st
				start.setHours(0, 0, 0, 0);
				end.setFullYear(end.getFullYear() + 1, 0, 1); // January 1st next year
				end.setHours(0, 0, 0, 0);
			}
			
			return { start: start.toISOString(), end: end.toISOString() };
		}
		
		// Default: This Month
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		start.setHours(0, 0, 0, 0);
		const end = new Date(start);
		end.setMonth(end.getMonth() + 1);
		end.setHours(0, 0, 0, 0);
		
		return { start: start.toISOString(), end: end.toISOString() };
	}

	// Fetch list of classes from database on mount
	useEffect(() => {
		async function loadClasses() {
			try {
				setClassesLoading(true);
				console.log('🔍 Fetching available classes from database...');
				
				// Get unique classes from statistik service
				const classesResult = await statistikService.getClasses(20); // Get up to 20 classes
				
				console.log('📚 Available classes from database:', classesResult);
				
				if (classesResult?.classes && Array.isArray(classesResult.classes)) {
					setClasses(classesResult.classes);
					console.log('✅ Classes loaded:', classesResult.classes);
				} else {
					console.warn('⚠️ No classes found, using fallback');
					// Fallback to hardcoded classes if database is empty
					setClasses(['XI SIJA 1', 'XI SIJA 2', 'XI SIJA 3']);
				}
			} catch (error) {
				console.error('❌ Failed to load classes:', error);
				// Fallback to hardcoded classes on error
				setClasses(['XI SIJA 1', 'XI SIJA 2', 'XI SIJA 3']);
			} finally {
				setClassesLoading(false);
			}
		}
		
		loadClasses();
	}, []);

	// Fetch per-class values from DB whenever range changes or classes are loaded
	useEffect(() => {
		// Don't load data if classes are still loading or empty
		if (classesLoading || cards.length === 0) {
			return;
		}
		
		let mounted = true;
		
		async function load() {
			setLoading(true);
			
			// Clear previous data to show loading state
			setLiveValues({});
			
			const { start, end } = computeRange(range);
			
			console.log(`📊 Loading report data for range "${range}":`, { start, end });
			console.log(`🎓 Loading data for ${cards.length} classes:`, cards.map(c => c.class));
			
			// Debug database content on first load
			if (range === 'This Month') {
				console.log(`📊 Loading report data using new DATE-BASED logic:`);
				console.log(`- Hadir: count of attendance records per day`);
				console.log(`- Izin: count of approved leave days from report table`);
				console.log(`- Alpha: count of absent days (student not in kehadiran AND not in izin per date)`);
			}
			
			// Add a small delay to show loading state
			await new Promise(resolve => setTimeout(resolve, 500));
			
			try {
				const results = await Promise.all(
					cards.map(async (c) => {
						console.log(`🔍 Fetching data for class: ${c.class}`);
						
						// Use new report logic with 3 data sources
						const res = await getAttendanceSummary({ 
							kelas: c.class, 
							start: start, 
							end: end
						});
						
						console.log(`📈 Data for ${c.class}:`, res);
						
						const hadir = res?.hadir || 0;
						const izin = res?.izin || 0;
						const alpha = res?.alpha || 0;
						const values = [hadir, izin, alpha];
						
						console.log(`📊 Processed values for ${c.class}:`, { 
							hadir, 
							izin, 
							alpha, 
							total: hadir + izin + alpha,
							totalSchoolDays: res?.totalSchoolDays || 0,
							sources: res?.sources || {} 
						});
						
						return { kelas: c.class, values };
					})
				);
				
				if (!mounted) return;
				
				// Update state with new values
				const map = {};
				results.forEach((r) => { 
					map[r.kelas] = r.values; 
					console.log(`✅ Setting values for ${r.kelas}:`, r.values);
				});
				
				setLiveValues(map);
				console.log('📊 Final live values:', map);
				
			} catch (e) {
				console.error('❌ Failed loading report values:', e);
				// Set empty values on error
				const map = {};
				cards.forEach(c => { map[c.class] = [0, 0, 0]; });
				setLiveValues(map);
			} finally {
				if (mounted) setLoading(false);
			}
		}
		
		load();
		
		return () => {
			mounted = false;
		};
	}, [range, cards, classesLoading]);

	// Realtime: listen for kehadiran changes and refresh affected class
	useEffect(() => {
		const { start, end } = computeRange(range);
		const withinRange = (iso) => {
			const t = new Date(iso).getTime();
			return t >= new Date(start).getTime() && t < new Date(end).getTime();
		};
		
		const unsub = subscribeKehadiran({
			onChange: async (payload) => {
				const row = payload.new || payload.record || payload?.old || {};
				const kelas = row.kelas;
				const waktu = row.waktu_absen || row.created_at || row.updated_at;
				if (!kelas || !waktu) return;
				
				// Only refresh if this card exists and change is inside current range
				if (cards.some((c) => c.class === kelas) && withinRange(waktu)) {
					console.log(`🔄 Real-time update for class ${kelas}`);
					
					try {
						// Use new report logic for real-time updates
						const res = await getAttendanceSummary({ 
							kelas, 
							start: start, 
							end: end 
						});
						
						const values = [res?.hadir || 0, res?.izin || 0, res?.alpha || 0];
						const total = values.reduce((a,b)=>a+b,0);
						
						if (total >= 0) {
							setLiveValues((prev) => ({ ...prev, [kelas]: values }));
							console.log(`✅ Updated ${kelas} with real-time data:`, values);
						}
					} catch (error) {
						console.error(`❌ Failed to update real-time data for ${kelas}:`, error);
					}
				}
			},
		});
		
		return () => { 
			try { 
				unsub?.(); 
			} catch {} 
		};
	}, [range, cards, classesLoading]);

	// Blue and rose palette matching the mock
	const pieColors = ['#2E65D8', '#82A9F4', '#E6BFD4']; // hadir, izin, alpha

	return (
		<div className="report-page">
			<HEADERINpage title="Reports" />
			<div className="report-controls">
				<select className="range-pill" value={range} onChange={(e) => setRange(e.target.value)} disabled={loading || classesLoading}>
					<option>This Month</option>
					<option>This Week</option>
					<option>Today</option>
					<option>This Semester</option>
				</select>
				{(loading || classesLoading) && (
					<div className="loading-indicator" style={{
						marginLeft: '1rem',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						color: '#5B62B3',
						fontSize: '0.875rem',
						fontWeight: '600'
					}}>
						<div className="spinner" style={{
							width: '16px',
							height: '16px',
							border: '2px solid #E5E7EB',
							borderTop: '2px solid #5B62B3',
							borderRadius: '50%',
							animation: 'spin 1s linear infinite'
						}}></div>
						{classesLoading ? 'Loading classes...' : 'Loading data...'}
					</div>
				)}
			</div>

			{/* Show loading state while classes are being fetched */}
			{classesLoading ? (
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '400px',
					flexDirection: 'column',
					gap: '1rem'
				}}>
					<div className="spinner" style={{
						width: '40px',
						height: '40px',
						border: '4px solid #E5E7EB',
						borderTop: '4px solid #5B62B3',
						borderRadius: '50%',
						animation: 'spin 1s linear infinite'
					}}></div>
					<p style={{ color: '#6B7280', fontSize: '1rem' }}>Loading classes from database...</p>
				</div>
			) : cards.length === 0 ? (
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '400px',
					flexDirection: 'column',
					gap: '1rem'
				}}>
					<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
					<h3 style={{ color: '#374151', margin: 0 }}>No Classes Found</h3>
					<p style={{ color: '#6B7280', margin: 0, textAlign: 'center' }}>
						No classes were found in the database.<br/>
						Please add some classes to the siswa table first.
					</p>
				</div>
			) : (
				<section className="report-grid mock-layout">
					{cards.map((card, idx) => (
						<article key={`${card.class}-${idx}`} className={`report-card ${idx === 2 ? 'span-row' : ''}`}>
						<div className="card-head">
							<h3 className="card-heading">Student Attendance Report</h3>
						</div>
						<div className="card-content" style={{ background: 'transparent', boxShadow: 'none', border: 0 }}>
							{loading ? (
								// Loading state
								<div className="loading-card-content" style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									minHeight: '200px',
									gap: '1rem'
								}}>
									<div className="spinner" style={{
										width: '32px',
										height: '32px',
										border: '3px solid #E5E7EB',
										borderTop: '3px solid #5B62B3',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite'
									}}></div>
									<p style={{ 
										color: '#6B7280', 
										margin: 0, 
										fontSize: '0.875rem',
										textAlign: 'center'
									}}>
										Loading {card.class} data...
									</p>
								</div>
							) : (
								// Data state
								<>
									<div className="legend-stack">
										{(() => {
											const values = liveValues[card.class] || [0,0,0];
											const total = (values || []).reduce((a,b)=>a+b,0) || 1;
											const pct = values.map(v => Math.round((v/total)*100));
											return (
												<>
													<button className="chip hadir"><span className="chip-label">Hadir</span><span className="chip-percentage">{pct[0]}%</span></button>
													<button className="chip izin"><span className="chip-label">Izin</span><span className="chip-percentage">{pct[1]}%</span></button>
													<button className="chip alpha"><span className="chip-label">Alpha</span><span className="chip-percentage">{pct[2]}%</span></button>
												</>
											);
										})()}
									</div>
									<div className="pie-wrap">
										{(() => {
											const values = liveValues[card.class] || [0,0,0];
											const total = values.reduce((a,b) => a+b, 0);
											
											if (total === 0) {
												// No data state
												return (
													<div className="no-data-state" style={{
														width: '120px',
														height: '120px',
														borderRadius: '50%',
														background: '#F3F4F6',
														display: 'flex',
														flexDirection: 'column',
														alignItems: 'center',
														justifyContent: 'center',
														border: '2px dashed #D1D5DB',
														color: '#9CA3AF',
														fontSize: '0.75rem',
														textAlign: 'center'
													}}>
														<div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
														<div>No data</div>
														<div>available</div>
													</div>
												);
											}
											
											return (
												<div
													className="pie"
													style={{ background: pieBackground(values, pieColors) }}
													role="img"
													aria-label="Pie chart"
												/>
											);
										})()}
									</div>
								</>
							)}
						</div>
						<div className="card-footer">
							<span className="class-pill">{card.class}</span>
						</div>
					</article>
				))}
				</section>
			)}

			{/* Add CSS for spinner animation */}
			<style jsx>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}

