/* Site-wide TOP / bottom buttons: fixed 180 ms; reduced motion is instant. */
(() => {
 let frame;
 const scroll = top => {
  if (frame) cancelAnimationFrame(frame);
  const start = window.scrollY;
  const end = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
   window.scrollTo({top:end, behavior:'instant'});
   frame = null;
   return;
  }
  let began;
  const step = now => {
   began ??= now;
   const progress = Math.min(1, (now - began) / 180);
   window.scrollTo({top:start + (end - start) * (1 - Math.pow(1 - progress, 3)), behavior:'instant'});
   frame = progress < 1 ? requestAnimationFrame(step) : null;
  };
  frame = requestAnimationFrame(step);
 };
 document.getElementById('scroll-bottom')?.addEventListener('click', () => scroll(document.documentElement.scrollHeight));
 document.getElementById('scroll-top')?.addEventListener('click', () => scroll(0));
})();
