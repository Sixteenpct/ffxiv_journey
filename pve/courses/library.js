/* Static catalogues stay readable without JavaScript; filters share URL state. */
(() => {
  const normalise = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const configurations = [
    {rows:'#job-course-rows tr[data-job]', empty:'#job-course-empty', filters:{job:'#job-course-filter', sync:'#sync-course-filter'}},
    {rows:'#content-course-rows tr[data-version]', empty:'#content-course-empty', filters:{version:'#content-version-filter'}},
    {rows:'#journal-rows tr[data-track]', empty:'#journal-empty', filters:{track:'#journal-track-filter'}}
  ];
  for (const config of configurations) {
    const empty = document.querySelector(config.empty);
    if (!empty) continue;
    const rows = [...document.querySelectorAll(config.rows)];
    const search = document.querySelector('#library-search');
    const reset = document.querySelector('#library-reset');
    const count = document.querySelector('#library-result-count');
    const filters = Object.entries(config.filters).map(([key, selector]) => ({key, element:document.querySelector(selector)})).filter(item => item.element);
    for (const {key, element} of filters) {
      const options = new Set([...element.options].map(option => option.value));
      for (const value of new Set(rows.map(row => row.dataset[key]).filter(Boolean))) {
        if (options.has(value)) continue;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = key === 'sync' ? 'Lv.' + value : value;
        element.append(option);
      }
    }
    const haystacks = rows.map(row => normalise(row.textContent + ' ' + (row.dataset.search || '') + ' ' + [...row.querySelectorAll('a[aria-label]')].map(a => a.getAttribute('aria-label')).join(' ')));
    const apply = () => {
      const terms = normalise(search?.value || '').split(/\s+/).filter(Boolean);
      rows.forEach((row, index) => { row.hidden = filters.some(({key, element}) => element.value && row.dataset[key] !== element.value) || !terms.every(term => haystacks[index].includes(term)); });
      const visible = rows.filter(row => !row.hidden).length;
      empty.hidden = visible > 0;
      if (config.empty === '#job-course-empty') empty.querySelector('td').textContent = !terms.length && filters.every(({key, element}) => key === 'job' || !element.value) ? '此職業尚無開放講義。' : '沒有符合搜尋與篩選條件的講義。';
      if (count) count.textContent = `顯示 ${visible} / ${rows.length} 篇`;
      if (reset) reset.disabled = !search?.value && filters.every(({element}) => !element.value);
    };
    const readURL = () => {
      const params = new URLSearchParams(location.search);
      if (search) search.value = params.get('q') || '';
      for (const {key, element} of filters) {
        const value = params.get(key) || '';
        element.value = [...element.options].some(option => option.value === value) ? value : '';
      }
      apply();
    };
    const update = () => {
      const url = new URL(location.href);
      const values = [['q', search?.value.trim() || ''], ...filters.map(({key, element}) => [key, element.value])];
      for (const [key, value] of values) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      apply();
    };
    search?.addEventListener('input', update);
    search?.closest('form')?.addEventListener('submit', event => { event.preventDefault(); update(); });
    filters.forEach(({element}) => element.addEventListener('change', update));
    reset?.addEventListener('click', () => {
      if (search) search.value = '';
      filters.forEach(({element}) => { element.value = ''; });
      update();
      search?.focus();
    });
    addEventListener('popstate', readURL);
    readURL();
  }
})();
