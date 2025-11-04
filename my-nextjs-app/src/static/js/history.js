// Placeholder for History page specific JS utilities (optional)
// If you later move logic from React into vanilla JS (e.g., table sorting),
// you can put it here and keep the dynamic import in the component.

export function formatDate(date) {
	try {
		const d = new Date(date);
		return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
	} catch {
		return String(date);
	}
}

