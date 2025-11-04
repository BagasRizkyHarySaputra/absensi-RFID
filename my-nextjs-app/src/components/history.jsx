"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchAttendanceData, 
  getAttendanceStatistics, 
  generateMockAttendanceData 
} from './collectDATA';
import "../static/css/history.css";

// Optional: load supplemental JS when running in browser
if (typeof window !== "undefined") {
	import("../static/js/history.js");
}

export default function HistoryPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [filters, setFilters] = useState({});
	const [attendanceData, setAttendanceData] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [statistics, setStatistics] = useState(null);
	const pageSize = 10;

	// Fetch data function
	const fetchData = async (page = currentPage) => {
		try {
			setLoading(true);
			setError(null);

			const options = {
				page,
				pageSize,
				sortBy: 'created_at',
				sortOrder: 'desc'
			};

			const result = await fetchAttendanceData(options, filters);
			
			if (result.success) {
				setAttendanceData(result.data);
				setTotalCount(result.count);
				setStatistics(getAttendanceStatistics(result.data));
			} else {
				// Handle case where we're using mock data
				if (result.error === 'Using mock data - database not configured') {
					setAttendanceData(result.data);
					setTotalCount(result.count);
					setStatistics(getAttendanceStatistics(result.data));
					setError('Using demo data - Connect to database for real data');
				} else {
					throw new Error(result.error);
				}
			}
		} catch (err) {
			console.error('Error in fetchData:', err);
			setError(err.message || 'Failed to fetch attendance data');
			// Fallback to mock data
			const mockData = generateMockAttendanceData(pageSize);
			setAttendanceData(mockData);
			setTotalCount(mockData.length);
			setStatistics(getAttendanceStatistics(mockData));
		} finally {
			setLoading(false);
		}
	};

	// Initial load and when filters change
	useEffect(() => {
		fetchData(1);
		setCurrentPage(1);
	}, [filters]);

	// When page changes
	useEffect(() => {
		if (currentPage !== 1) {
			fetchData(currentPage);
		}
	}, [currentPage]);

	// Filter handlers
	// Controls removed per request; keeping filters state for future extension.

	// Pagination
	const totalPages = Math.ceil(totalCount / pageSize);

	function gotoPage(p) {
		setCurrentPage(Math.min(Math.max(1, p), totalPages));
	}

	// Refresh function
	const handleRefresh = () => {
		fetchData(currentPage);
	};

	function renderStatus(status) {
		const cls =
			status === "Accepted"
				? "accepted"
				: status === "Rejected"
				? "rejected"
				: "pending";
		const icon =
			status === "Accepted"
				? (
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					)
				: status === "Rejected"
				? (
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					)
				: (
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="4" />
						</svg>
					);
		return (
			<span className={`badge ${cls}`}>
				<span className="icon" aria-hidden>{icon}</span>
				{status}
			</span>
		);
	}

	function PageNumbers() {
		const numbers = [];
		const maxShown = 5;
		let startNum = Math.max(1, currentPage - 2);
		let endNum = Math.min(totalPages, startNum + maxShown - 1);
		if (endNum - startNum + 1 < maxShown) {
			startNum = Math.max(1, endNum - maxShown + 1);
		}

		if (startNum > 1) {
			numbers.push(1);
			if (startNum > 2) numbers.push("ellipsis-start");
		}
		for (let n = startNum; n <= endNum; n++) numbers.push(n);
		if (endNum < totalPages) {
			if (endNum < totalPages - 1) numbers.push("ellipsis-end");
			numbers.push(totalPages);
		}

		return (
			<div className="pagination" role="navigation" aria-label="Pagination">
				<button className="page-btn" onClick={() => gotoPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
					‹
				</button>
				{numbers.map((n, i) =>
					typeof n === "number" ? (
						<button
							key={i}
							className={`page-btn ${currentPage === n ? "active" : ""}`}
							onClick={() => gotoPage(n)}
						>
							{n}
						</button>
					) : (
						<span key={i} className="page-btn" aria-hidden>
							…
						</span>
					)
				)}
				<button className="page-btn" onClick={() => gotoPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
					›
				</button>
			</div>
		);
	}

	return (
		<div className="history-container">
			{/* Removed standalone History header; page title comes from global Header */}
			
			{/* Controls and Statistics removed per request to move the table up */}
			
			{/* Loading State */}
			{loading && (
				<div className="loading-container">
					<div className="loading-spinner">
						<div className="spinner"></div>
						<p>Loading attendance data...</p>
					</div>
				</div>
			)}

			{/* Error State */}
			{error && !loading && (
				<div className="error-container">
					<div className="error-message">
						<h3>ℹ️ Notice</h3>
						<p>{error}</p>
						<button 
							className="retry-btn"
							onClick={handleRefresh}
						>
							Retry
						</button>
					</div>
				</div>
			)}

			{/* Data Table */}
			{!loading && (
				<div className="history-card">
					<div className="data-info">
						<p>Page {currentPage} of {totalPages}</p>
					</div>
					
					<div className="table-scroll">
						<table className="history-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Time</th>
									<th>Presence</th>
									<th>NIS</th>
									<th>NISN</th>
									<th>Name</th>
									<th>Class</th>
									<th>Status</th>
									<th>Information</th>
								</tr>
							</thead>
							<tbody>
								{attendanceData.length > 0 ? (
									attendanceData.map((row, idx) => (
										<tr key={row.id || idx}>
											<td>{row.date}</td>
											<td>{row.time}</td>
											<td className="presence">{row.presence}</td>
											<td>{row.nis}</td>
											<td>{row.nisn}</td>
											<td>{row.name}</td>
											<td>{row.className}</td>
											<td>{renderStatus(row.status)}</td>
											<td>{row.info}</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="9" className="no-data">
											No attendance data found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					
					{totalPages > 1 && (
						<div className="table-footer">
							<PageNumbers />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

