(() => {
  'use strict';

  const SELECTOR = 'li.activity.modtype_assign';
  const MARK = 'aules-pend';
  const CONCURRENCY = 4;          // peticiones simultáneas a Aules
  const REFRESH_MIN_MS = 30000;   // al volver a la pestaña, refrescar como mucho cada 30 s

  // Filas de la tabla "Sumario de calificaciones" de la tarea (castellano / valenciano / inglés).
  const RE_NEEDS = /calificar|qualificar|qualificaci|needs? grading/i;
  const RE_SUBMITTED = /enviad|entregad|enviat|tram[eè]s|lliurat|submitted/i;

  // /semipresencial/course/view.php -> /semipresencial
  const base = location.pathname.replace(/\/course\/.*$/, '');
  const assignUrl = (id, action) =>
    `${location.origin}${base}/mod/assign/view.php?id=${id}${action ? `&action=${action}` : ''}`;

  const cache = new Map();   // cmid -> {needs, submitted} | null (sin datos: alumno, tarea sin entregas...)
  const inflight = new Set();
  let lastFetch = 0;

  const cmidOf = li => li.dataset.id || (li.id.match(/^module-(\d+)$/) || [])[1];

  function parseSummary(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = {};
    for (const tr of doc.querySelectorAll('table.generaltable tr')) {
      const th = tr.querySelector('th');
      const td = tr.querySelector('td');
      if (!th || !td) continue;
      const num = parseInt(td.textContent.trim(), 10);
      if (Number.isNaN(num)) continue;
      const label = th.textContent.trim();
      if (out.needs === undefined && RE_NEEDS.test(label)) out.needs = num;
      else if (out.submitted === undefined && RE_SUBMITTED.test(label)) out.submitted = num;
    }
    return out.needs === undefined ? null : out;
  }

  function datesContainer(li) {
    let dates = li.querySelector('[data-region="activity-dates"]');
    if (dates) return dates;
    // La tarea no muestra fechas: creamos el hueco en la misma zona de la tarjeta.
    const grid = li.querySelector('.activity-grid') || li.querySelector('.activity-item');
    if (!grid) return null;
    dates = document.createElement('div');
    dates.className = 'activity-dates aules-pend-dates';
    grid.append(dates);
    return dates;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildLine(id, data) {
    const line = el('div', `date-item ${MARK}`);
    const link = el('a');
    link.href = assignUrl(id, 'grading');
    link.title = 'Ver todas las entregas';
    line.append(link);

    if (!data) {
      // Cargando
      line.classList.add('aules-pend--loading');
      link.append(el('span', 'date-item-label', 'Pendientes de corregir:'), ' …');
    } else if (data.needs > 0) {
      // Falta alguna por corregir: 🔴
      line.classList.add('aules-pend--warn');
      link.append('🔴 ', el('span', 'date-item-label', 'Pendientes de corregir:'), ' ', el('strong', '', String(data.needs)));
      const sub = data.submitted;
      if (sub !== undefined) link.append(` de ${sub} ${sub === 1 ? 'entrega' : 'entregas'}`);
    } else {
      // No falta ninguna: check verde
      line.classList.add('aules-pend--ok');
      const check = el('span', 'aules-pend-check', '✓');
      check.setAttribute('aria-hidden', 'true');
      link.append(check, ' ', data.submitted === 0 ? 'Sin entregas' : 'Todo corregido');
    }
    return line;
  }

  function render(li, id, data, loading = false) {
    li.querySelector(`.${MARK}`)?.remove();
    if (!data && !loading) return;
    const dates = datesContainer(li);
    if (dates) dates.append(buildLine(id, loading ? null : data));
  }

  function renderId(id) {
    for (const li of document.querySelectorAll(SELECTOR)) {
      if (cmidOf(li) === id) render(li, id, cache.get(id));
    }
  }

  async function load(id) {
    try {
      const res = await fetch(assignUrl(id), { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      cache.set(id, parseSummary(await res.text()));
    } catch (err) {
      console.warn('[Aules pendientes] No se pudo leer la tarea', id, err);
      if (!cache.has(id)) cache.set(id, null);
    } finally {
      inflight.delete(id);
    }
    renderId(id);
  }

  async function runQueue(ids) {
    const queue = [...ids];
    const worker = async () => {
      while (queue.length) await load(queue.shift());
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  }

  function scan(refresh = false) {
    const toFetch = new Set();
    for (const li of document.querySelectorAll(SELECTOR)) {
      const id = cmidOf(li);
      if (!id) continue;
      if (cache.has(id)) {
        // Moodle vuelve a pintar la tarjeta al editar: reponemos el dato sin pedirlo otra vez.
        if (!li.querySelector(`.${MARK}`) && cache.get(id)) render(li, id, cache.get(id));
        if (refresh) toFetch.add(id);
      } else {
        if (!li.querySelector(`.${MARK}`)) render(li, id, null, true);
        toFetch.add(id);
      }
    }
    const ids = [...toFetch].filter(id => !inflight.has(id));
    if (!ids.length) return;
    ids.forEach(id => inflight.add(id));
    lastFetch = Date.now();
    runQueue(ids);
  }

  let pending = 0;
  new MutationObserver(() => {
    clearTimeout(pending);
    pending = setTimeout(() => scan(), 250);
  }).observe(document.body, { childList: true, subtree: true });

  // Al volver de corregir en otra pestaña, actualizar los números.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastFetch > REFRESH_MIN_MS) scan(true);
  });

  scan();
})();
