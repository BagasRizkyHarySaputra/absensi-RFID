"use client";

import React, { useEffect, useMemo, useState } from 'react';
import '../static/css/REPORT.css';
import '../static/js/REPORT.js';
import HEADERINpage from './HEADERINpage';

// Build a conic-gradient pie background from values and colors
function pieBackground(values, colors) {
	const total = values.reduce((s, v) => s + v, 0) || 1;
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

	// Three cards as in the mock (XI SIJA 1, 2, 3)
	const cards = useMemo(
		() => [
			{ class: 'XI SIJA 1', values: [70, 20, 10] },
			{ class: 'XI SIJA 2', values: [68, 24, 8] },
			{ class: 'XI SIJA 3', values: [72, 22, 6] },
		],
		[]
	);

	// Blue and rose palette matching the mock
	const pieColors = ['#2E65D8', '#82A9F4', '#E6BFD4']; // hadir, izin, alpha

	return (
		<div className="report-page">
			<HEADERINpage title="Reports" />
			<div className="report-controls">
				<select className="range-pill" value={range} onChange={(e) => setRange(e.target.value)}>
					<option>This Month</option>
					<option>This Week</option>
					<option>Today</option>
					<option>This Semester</option>
				</select>
			</div>

			<section className="report-grid mock-layout">
				{cards.map((card, idx) => (
					<article key={idx} className={`report-card ${idx === 2 ? 'span-row' : ''}`}>
						<div className="card-head">
							<h3 className="card-heading">Student Attendance Report</h3>
						</div>
						<div className="card-content" style={{ background: 'transparent', boxShadow: 'none', border: 0 }}>
											<div className="legend-stack">
												<button className="chip hadir"><span className="chip-plus">+</span><span className="chip-text">Hadir</span></button>
												<button className="chip izin"><span className="chip-plus">+</span><span className="chip-text">Izin</span></button>
												<button className="chip alpha"><span className="chip-plus">+</span><span className="chip-text">Alpha</span></button>
											</div>
							<div className="pie-wrap">
								<div
									className="pie"
									style={{ background: pieBackground(card.values, pieColors) }}
									role="img"
									aria-label="Pie chart"
								/>
							</div>
						</div>
						<div className="card-footer">
							<span className="class-pill">{card.class}</span>
						</div>
					</article>
				))}
			</section>
		</div>
	);
}

