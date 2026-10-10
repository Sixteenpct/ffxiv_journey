/* Independent catalogues: always-visible tables, shared native-select filters. */
(() => {
  // Redirect historical academy-section bookmarks to their independent pages.
  // Only the academy homepage redirects; a catalogue opened directly must stay put.
  if (document.body.classList.contains('page-academy')) {
    if (location.hash === '#content-learning') {
      location.replace('../content/#content-learning');
      return;
    }
    if (location.hash === '#lecture-index') {
      location.replace('lectures/#lecture-index');
      return;
    }
  }
  const bindFilter = (filterId, rowSelector, emptyId, key) => {
    const filter = document.querySelector(filterId);
    const rows = [...document.querySelectorAll(rowSelector)];
    const empty = document.querySelector(emptyId);
    if (!filter || !empty) return;

    // The job catalogue contains every job, even if its public lectures are pending.
    const options = new Set([...filter.options].map(option => option.value));
    for (const value of new Set(rows.map(row => row.dataset[key]).filter(Boolean))) {
      if (options.has(value)) continue;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      filter.append(option);
      options.add(value);
    }
    if (key === 'job') {
      const requested = new URLSearchParams(location.search).get('job');
      if (requested && options.has(requested)) filter.value = requested;
    }
    const applyFilter = () => {
      for (const row of rows) row.hidden = !!filter.value && row.dataset[key] !== filter.value;
      empty.hidden = rows.some(row => !row.hidden);
    };
    filter.addEventListener('change', () => {
      if (key === 'job') {
        const url = new URL(location.href);
        if (filter.value) url.searchParams.set('job', filter.value);
        else url.searchParams.delete('job');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
      applyFilter();
    });
    applyFilter();
  };
  bindFilter('#job-course-filter', '#job-course-rows tr[data-job]', '#job-course-empty', 'job');
  bindFilter('#content-version-filter', '#content-course-rows tr[data-version]', '#content-course-empty', 'version');
})();
