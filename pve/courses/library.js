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

  const bindFilter = (filterId, rowSelector, emptyId, key) => {
    const filter = document.querySelector(filterId);
    const rows = [...document.querySelectorAll(rowSelector)];
    const empty = document.querySelector(emptyId);
    if (!filter || !empty) return;
    for (const value of new Set(rows.map(row => row.dataset[key]))) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      filter.append(option);
    }
    const applyFilter = () => {
      for (const row of rows) row.hidden = !!filter.value && row.dataset[key] !== filter.value;
      empty.hidden = rows.some(row => !row.hidden);
    };
    filter.addEventListener('change', applyFilter);
    applyFilter();
  };
  bindFilter('#job-course-filter', '#job-course-rows tr[data-job]', '#job-course-empty', 'job');
  bindFilter('#content-version-filter', '#content-course-rows tr[data-version]', '#content-course-empty', 'version');
})();
