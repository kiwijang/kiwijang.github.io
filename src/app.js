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
  const yearGroups = [...document.querySelectorAll('.year-group')];
  let savedYearState = null;
  const update = () => {
    const filtering = filter !== 'all' || Boolean(search?.value.trim());
    if (filtering && savedYearState === null) {
      savedYearState = new Map(yearGroups.map(group => [group, group.open]));
    }
    let visible = 0;
    document.querySelectorAll('.card').forEach(card => {
      const match = (filter === 'all' || card.dataset.tags.split('|').includes(filter)) && card.dataset.search.includes((search?.value || '').trim().toLowerCase());
      card.hidden = !match;
      if (match) visible++;
    });
    document.querySelectorAll('.year-group').forEach(group => {
      const count = group.querySelectorAll('.card:not([hidden])').length;
      group.hidden = count === 0;
      if (filtering && count > 0) group.open = true;
      else if (!filtering && savedYearState !== null) group.open = savedYearState.get(group);
      const label = group.querySelector('[data-year-count]');
      if (label) label.textContent = String(count);
    });
    if (!filtering) savedYearState = null;
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

/* Shared article markup keeps filters and year disclosures in sync in both views. */
(() => {
  const panel = document.querySelector('#post-views');
  const tabs = [...document.querySelectorAll('.view-tabs [role="tab"]')];
  if (!panel || !tabs.length) return;
  function select(view, save = true) {
    const selected = tabs.find(tab => tab.dataset.view === view) || tabs[0];
    panel.dataset.view = selected.dataset.view;
    panel.setAttribute('aria-labelledby', selected.id);
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (save) {
      try { localStorage.setItem('post-view', selected.dataset.view); } catch {}
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.view));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.view);
      tabs[next].focus();
    });
  });
  let saved;
  try { saved = localStorage.getItem('post-view'); } catch {}
  select(saved || 'cards', false);
})();

/* Load the locally hosted renderer only on pages containing diagrams. */
(async () => {
  const nodes = [...document.querySelectorAll('.prose pre.mermaid')];
  if (!nodes.length) return;
  const sources = nodes.map(node => node.textContent);
  const appScript = document.querySelector('script[src$="app.js"]');
  try {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('vendor/mermaid.min.js', appScript.src).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    await document.fonts.ready;
    let requested = 0;
    let running = false;
    async function render() {
      requested++;
      if (running) return;
      running = true;
      try {
        let rendered;
        do {
          rendered = requested;
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default',
            fontFamily: 'Segoe UI, Microsoft JhengHei, sans-serif',
            flowchart: { useMaxWidth: true, htmlLabels: false },
          });
          for (const [index, node] of nodes.entries()) {
            try {
              const { svg, bindFunctions } = await mermaid.render(`article-diagram-${index}`, sources[index]);
              node.innerHTML = svg;
              node.classList.add('rendered');
              node.removeAttribute('data-error');
              bindFunctions?.(node);
            } catch (error) {
              node.textContent = sources[index];
              node.classList.remove('rendered');
              node.dataset.error = 'true';
              document.getElementById(`darticle-diagram-${index}`)?.remove();
              console.warn('Unable to render Mermaid diagram', error);
            }
          }
          window.dispatchEvent(new Event('resize'));
        } while (rendered !== requested);
      } finally { running = false; }
    }
    new MutationObserver(render).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    });
    await render();
  } catch (error) {
    // Keep the original escaped source readable if the renderer cannot load.
    console.warn('Unable to load Mermaid', error);
  }
})();
