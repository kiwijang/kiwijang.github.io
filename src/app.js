(() => {
  const theme = document.querySelector('#theme');
  try { if (localStorage.getItem('theme') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch {}
  theme?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
  });
  let filter = 'all';
  const search = document.querySelector('#search');
  const update = () => {
    let visible = 0;
    document.querySelectorAll('.card').forEach(card => {
      const match = (filter === 'all' || card.dataset.tags.split('|').includes(filter)) && card.dataset.search.includes((search?.value || '').trim().toLowerCase());
      card.hidden = !match;
      if (match) visible++;
    });
    const empty = document.querySelector('#empty');
    if (empty) empty.hidden = visible !== 0;
  };
  search?.addEventListener('input', update);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    update();
  }));
})();

/* Track the current article section without changing the URL while scrolling. */
(() => {
  const links = [...document.querySelectorAll('[data-toc-link]')];
  if (!links.length) return;
  const sections = links.map(link => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(section => section.heading);
  if (!sections.length) return;
  let pending = false;
  let current;
  function update() {
    pending = false;
    let active = sections[0];
    for (const section of sections) {
      if (section.heading.getBoundingClientRect().top <= 110) active = section;
      else break;
    }
    if (active === current) return;
    current = active;
    sections.forEach(section => {
      section.link.classList.toggle('active', section === active);
      if (section === active) section.link.setAttribute('aria-current', 'location');
      else section.link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule);
  document.querySelectorAll('.prose img').forEach(img => img.addEventListener('load', schedule));
  update();
})();
