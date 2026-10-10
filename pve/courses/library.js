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
