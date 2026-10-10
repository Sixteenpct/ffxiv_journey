(() => {
 const scroll = (top) => window.scrollTo({top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 document.getElementById('scroll-bottom')?.addEventListener('click', () => scroll(document.documentElement.scrollHeight));
 document.getElementById('scroll-top')?.addEventListener('click', () => scroll(0));
})();
