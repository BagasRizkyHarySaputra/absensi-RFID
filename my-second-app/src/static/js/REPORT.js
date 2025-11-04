// Reports page hooks (optional interactions / telemetry)
(function () {
	if (typeof document !== 'undefined') {
		const root = document.querySelector('.report-page');
		if (root) {
			// Simple hook to show this script is loaded
			root.setAttribute('data-report-init', '1');
			// Example: log class filter clicks
			root.addEventListener('click', (e) => {
				const btn = e.target.closest('.class-chip');
				if (btn) {
					console.log('[reports] class selected:', btn.textContent.trim());
				}
			});
		}
	}
})();

