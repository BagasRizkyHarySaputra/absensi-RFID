// Scrollbar reveal only while scrolling for elements with .kelas-list-scroll
(function(){
	if (typeof window === 'undefined') return;
	const timers = new WeakMap();

	function onScroll(el){
		el.classList.add('scrolling');
		// Clear previous timer
		const prev = timers.get(el);
		if (prev) clearTimeout(prev);
		// Remove class after a short idle period
		const t = setTimeout(() => {
			el.classList.remove('scrolling');
			timers.delete(el);
		}, 700);
		timers.set(el, t);
	}

	function attach(el){
		if (!el || el._kelasScrollBound) return;
		el.addEventListener('scroll', () => onScroll(el), { passive: true });
		el.addEventListener('wheel', () => onScroll(el), { passive: true });
		el.addEventListener('touchmove', () => onScroll(el), { passive: true });
		el._kelasScrollBound = true;
	}

	function init(){
		document.querySelectorAll('.kelas-list-scroll').forEach(attach);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
