/* Desktop: two open tables. Mobile: two independent native disclosures. */
(() => {
  const tracks = [...document.querySelectorAll('.page-course-library .library-track')];
  const desktop = window.matchMedia('(min-width:900px)');
  const applyLayout = () => {
    for (const track of tracks) {
      const summary = track.querySelector('summary');
      track.open = desktop.matches;
      summary.tabIndex = desktop.matches ? -1 : 0;
      if (desktop.matches) summary.setAttribute('aria-disabled', 'true');
      else summary.removeAttribute('aria-disabled');
    }
  };
  for (const track of tracks) {
    track.querySelector('summary').addEventListener('click', event => {
      if (desktop.matches) event.preventDefault();
    });
  }
  applyLayout();
  desktop.addEventListener('change', applyLayout);
})();
