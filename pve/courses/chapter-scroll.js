(() => {
  const navigation = document.querySelector('.sidebar');
  if (!navigation) return;
  let frame;
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    const start = window.scrollY;
    const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const end = Math.max(0, Math.min(start + target.getBoundingClientRect().top - offset,
      document.documentElement.scrollHeight - window.innerHeight));
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: end, behavior: 'instant' });
      frame = null;
      return;
    }
    let began;
    const step = now => {
      began ??= now;
      const progress = Math.min(1, (now - began) / 180);
      window.scrollTo({ top: start + (end - start) * (1 - Math.pow(1 - progress, 3)), behavior: 'instant' });
      frame = progress < 1 ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  });
})();
