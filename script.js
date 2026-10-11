/* ==========================================================
   Class Routine – logic
   Edit the DATA section below to change the routine.
   ========================================================== */
(() => {
  'use strict';

  /* ---------------- DATA ---------------- */

  // Time slots in minutes from midnight (index 0..6)
  const SLOTS = [
    { s: 540, e: 590 },  // 9:00  – 9:50
    { s: 600, e: 650 },  // 10:00 – 10:50
    { s: 660, e: 710 },  // 11:00 – 11:50
    { s: 720, e: 770 },  // 12:00 – 12:50
    { s: 770, e: 820 },  // 12:50 – 1:40  (lunch)
    { s: 825, e: 865 },  // 1:45  – 2:25
    { s: 870, e: 910 }   // 2:30  – 3:10
  ];
  const LUNCH = 4;

  const SUBJECTS = {
    dip:   { name: 'Digital Image Processing',   color: '#7b5cfa' },
    oc:    { name: 'Optical Communication',      color: '#f2a100' },
    dm:    { name: 'Data Mining',                color: '#12b5a6' },
    cyber: { name: 'Cryptography and Cyber Law', color: '#ec4f86' }
  };

  // slot = first slot index, span = number of periods, lab = true for lab classes
  const DAYS = [
    { name: 'Saturday',  short: 'Sat', classes: [] },
    { name: 'Sunday',    short: 'Sun', classes: [
      { sub: 'dip',   slot: 1, span: 1 },
      { sub: 'dip',   slot: 2, span: 2, lab: true },
      { sub: 'cyber', slot: 6, span: 1 }
    ]},
    { name: 'Monday',    short: 'Mon', classes: [
      { sub: 'oc',    slot: 0, span: 1 },
      { sub: 'dip',   slot: 1, span: 1 },
      { sub: 'dm',    slot: 3, span: 1 },
      { sub: 'dm',    slot: 5, span: 2, lab: true }
    ]},
    { name: 'Tuesday',   short: 'Tue', classes: [
      { sub: 'oc',    slot: 0, span: 2 },
      { sub: 'dip',   slot: 2, span: 1 },
      { sub: 'dm',    slot: 3, span: 1 },
      { sub: 'oc',    slot: 5, span: 2, lab: true }
    ]},
    { name: 'Wednesday', short: 'Wed', classes: [
      { sub: 'cyber', slot: 1, span: 2 },
      { sub: 'dm',    slot: 3, span: 1 }
    ]}
  ];

  /* ---------------- HELPERS ---------------- */

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const ap = (m) => (m >= 720 ? 'PM' : 'AM');
  const t12 = (m) => `${Math.floor(m / 60) % 12 || 12}:${pad(m % 60)}`;
  const full = (m) => `${t12(m)} ${ap(m)}`;
  const range = (a, b) => `${t12(a)}${ap(a) !== ap(b) ? ' ' + ap(a) : ''} – ${t12(b)} ${ap(b)}`;

  // JS getDay(): Sun=0 … Sat=6  →  our index: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4 (Thu/Fri = null)
  const todayIdx = (d) => ({ 6: 0, 0: 1, 1: 2, 2: 3, 3: 4 })[d.getDay()] ?? null;
  const nowMinutes = (d) => d.getHours() * 60 + d.getMinutes();

  const subName = (c) => SUBJECTS[c.sub].name + (c.lab ? ' Lab' : '');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function classesOf(i) {
    return DAYS[i].classes
      .map((c) => ({ ...c, start: SLOTS[c.slot].s, end: SLOTS[c.slot + c.span - 1].e }))
      .sort((a, b) => a.start - b.start);
  }

  // Classes + lunch + free blocks, in time order
  function buildItems(i) {
    const occ = new Array(SLOTS.length).fill(false);
    const items = classesOf(i).map((c) => {
      for (let k = c.slot; k < c.slot + c.span; k++) occ[k] = true;
      return { type: 'class', ...c };
    });
    occ[LUNCH] = true;
    for (let k = 0; k < SLOTS.length; ) {
      if (occ[k]) { k++; continue; }
      let j = k;
      while (j + 1 < SLOTS.length && !occ[j + 1]) j++;
      items.push({ type: 'free', start: SLOTS[k].s, end: SLOTS[j].e });
      k = j + 1;
    }
    items.push({ type: 'lunch', start: SLOTS[LUNCH].s, end: SLOTS[LUNCH].e });
    return items.sort((a, b) => a.start - b.start);
  }

  function findNext(t, nowMin) {
    for (let d = t === null ? 0 : t; d < DAYS.length; d++) {
      for (const c of classesOf(d)) {
        if (d !== t || c.start > nowMin) return { d, c };
      }
    }
    for (let d = 0; d <= (t ?? -1); d++) {          // wrap to next week
      const list = classesOf(d);
      if (list.length) return { d, c: list[0] };
    }
    return null;
  }

  function nextText(next, t) {
    if (!next) return '';
    const day = next.d === t ? 'today' : (t !== null && next.d === t + 1) ? 'tomorrow' : DAYS[next.d].name;
    return `Next: ${subName(next.c)}, ${day} at ${full(next.c.start)}`;
  }

  function countdown(mins) {
    if (mins < 60) return [String(mins), 'min to go'];
    const h = Math.floor(mins / 60), m = mins % 60;
    return [m ? `${h}h ${m}m` : `${h}h`, 'to go'];
  }

  /* ---------------- STATE ---------------- */

  let selected = 0;            // 0-4 = day, 5 = week view
  const WEEK = 5;

  /* ---------------- "NOW" CARD ---------------- */

  function renderNow() {
    const d = new Date();
    const nowMin = nowMinutes(d);
    const t = todayIdx(d);
    const next = findNext(t, nowMin);

    let tag = 'Today', title = '', meta = '', big = '', small = '', pct = 0, color = '#ffffff', live = false;

    if (t === null) {
      tag = 'Weekend'; title = 'No classes today'; meta = nextText(next, t);
    } else {
      const list = classesOf(t);
      const cur = list.find((c) => nowMin >= c.start && nowMin < c.end);

      if (cur) {
        live = true; tag = 'Happening now'; title = subName(cur);
        meta = `Until ${full(cur.end)}`;
        big = String(cur.end - nowMin); small = 'min left';
        pct = (nowMin - cur.start) / (cur.end - cur.start);
        color = SUBJECTS[cur.sub].color;
      } else if (nowMin >= SLOTS[LUNCH].s && nowMin < SLOTS[LUNCH].e && list.length) {
        tag = 'Lunch break'; title = 'Time to eat';
        meta = nextText(next, t);
        big = String(SLOTS[LUNCH].e - nowMin); small = 'min left';
        pct = (nowMin - SLOTS[LUNCH].s) / (SLOTS[LUNCH].e - SLOTS[LUNCH].s);
      } else if (next && next.d === t) {
        tag = 'Up next'; title = subName(next.c);
        meta = range(next.c.start, next.c.end);
        [big, small] = countdown(next.c.start - nowMin);
        color = SUBJECTS[next.c.sub].color;
      } else if (!list.length) {
        tag = 'Today'; title = 'No classes today'; meta = nextText(next, t);
      } else {
        tag = 'Done for today'; title = 'All classes finished'; meta = nextText(next, t);
      }
    }

    if (!big && next) {
      big = DAYS[next.d].short; small = full(next.c.start);
      color = SUBJECTS[next.c.sub].color;
    }

    const R = 36, C = 2 * Math.PI * R;
    $('nowCard').innerHTML = `
      <div class="now__text">
        <span class="now__tag">${live ? '<span class="live"></span>' : ''}${tag}</span>
        <h2>${title}</h2>
        <p>${meta}</p>
      </div>
      <div class="ring" aria-hidden="true">
        <svg viewBox="0 0 88 88" width="88" height="88">
          <circle class="ring__track" cx="44" cy="44" r="${R}" fill="none" stroke-width="7"/>
          <circle class="ring__bar" cx="44" cy="44" r="${R}" fill="none" stroke-width="7" stroke-linecap="round"
                  stroke="${color}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(2)}"/>
        </svg>
        <div class="ring__center">
          <span class="ring__big">${big}</span>
          <span class="ring__small">${small}</span>
        </div>
      </div>`;

    $('todayLabel').textContent = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* ---------------- TABS ---------------- */

  function renderTabs() {
    const t = todayIdx(new Date());
    const dayTabs = DAYS.map((day, i) => {
      const dots = day.classes.length
        ? classesOf(i).map((c) => `<i style="--c:${SUBJECTS[c.sub].color}"></i>`).join('')
        : '<span class="none"></span>';
      return `
        <button class="tab${i === t ? ' is-today' : ''}" role="tab" type="button" data-i="${i}"
                aria-selected="${i === selected}" aria-label="${day.name}">
          <span class="tab__lbl">${day.short}</span>
          <span class="dots">${dots}</span>
        </button>`;
    }).join('');

    $('tabs').innerHTML = dayTabs + `
      <button class="tab" role="tab" type="button" data-i="${WEEK}" aria-selected="${selected === WEEK}">
        <span class="tab__lbl">Week</span>
        <span class="dots"><span class="none"></span></span>
      </button>`;
  }

  /* ---------------- DAY VIEW ---------------- */

  function renderDay(animate) {
    const i = selected;
    const day = DAYS[i];
    const d = new Date();
    const nowMin = nowMinutes(d);
    const isToday = i === todayIdx(d);
    const list = classesOf(i);
    const periods = list.reduce((n, c) => n + c.span, 0);

    $('dayHead').innerHTML = `
      <div>
        <h2>${day.name}</h2>
        <p>${list.length ? `${plural(list.length, 'class')}, ${plural(periods, 'period')}` : 'No classes scheduled'}</p>
      </div>
      ${isToday ? '<span class="badge-today">Today</span>' : ''}`;

    const tl = $('timeline');

    if (!list.length) {
      tl.innerHTML = `
        <li class="empty">
          <div class="empty__icon">🌴</div>
          <h3>No classes on ${day.name}</h3>
          <p>Pick another day above to see its classes.</p>
        </li>`;
    } else {
      tl.innerHTML = buildItems(i).map((it) => {
        const time = `<div class="row__time"><b>${t12(it.start)}</b><small>${ap(it.start)}</small></div>`;
        const rail = '<div class="row__rail"><i></i></div>';
        const going = isToday && nowMin >= it.start && nowMin < it.end;

        if (it.type === 'lunch') {
          return `
            <li class="row row--lunch${going ? ' is-now' : ''}">
              ${time}${rail}
              <div class="card">
                <span class="lunch__icon" aria-hidden="true">🍽️</span>
                <div><strong>Lunch break</strong><span>${range(it.start, it.end)}</span></div>
              </div>
            </li>`;
        }

        if (it.type === 'free') {
          return `
            <li class="row row--free">
              ${time}${rail}
              <div class="card"><strong>Free period</strong><span>${range(it.start, it.end)}</span></div>
            </li>`;
        }

        const s = SUBJECTS[it.sub];
        const done = isToday && nowMin >= it.end;
        const pct = going ? Math.round(((nowMin - it.start) / (it.end - it.start)) * 100) : 0;
        return `
          <li class="row row--class${going ? ' is-now' : ''}${done ? ' is-done' : ''}" style="--c:${s.color}">
            ${time}${rail}
            <article class="card">
              <h3>${s.name}</h3>
              <div class="card__foot">
                <span class="chip${it.lab ? ' chip--lab' : ''}">${it.lab ? 'Lab' : 'Theory'}</span>
                <span class="chip">${plural(it.span, 'period')}</span>
                <span class="card__end">Ends ${full(it.end)}</span>
              </div>
              ${going ? `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--p:${pct}%"><i></i></div>` : ''}
            </article>
          </li>`;
      }).join('');
    }

    if (animate) {
      tl.classList.remove('swap');
      void tl.offsetWidth;            // restart the animation
      tl.classList.add('swap');
    }
  }

  /* ---------------- WEEK VIEW ---------------- */

  function renderWeek() {
    const t = todayIdx(new Date());

    const head = '<thead><tr><th class="corner">Day</th>' + SLOTS.map((s, k) =>
      k === LUNCH
        ? `<th>Lunch<span>${range(s.s, s.e)}</span></th>`
        : `<th>${t12(s.s)}<span>to ${t12(s.e)}</span></th>`
    ).join('') + '</tr></thead>';

    const body = DAYS.map((day, i) => {
      const byStart = {};
      classesOf(i).forEach((c) => { byStart[c.slot] = c; });

      let cells = '';
      for (let k = 0; k < SLOTS.length; k++) {
        if (k === LUNCH) {
          if (i === 0) cells += `<td class="lunch-cell" rowspan="${DAYS.length}">Lunch<br>Break</td>`;
          continue;
        }
        const c = byStart[k];
        if (c) {
          cells += `<td class="cell" colspan="${c.span}" style="--c:${SUBJECTS[c.sub].color}">${SUBJECTS[c.sub].name}${c.lab ? '<small>LAB</small>' : ''}</td>`;
          k += c.span - 1;
        } else {
          cells += '<td></td>';
        }
      }
      return `<tr class="${i === t ? 'is-today' : ''}"><th class="dayh" scope="row">${day.short}</th>${cells}</tr>`;
    }).join('');

    $('weekTable').innerHTML = head + '<tbody>' + body + '</tbody>';
  }

  /* ---------------- ACTIONS ---------------- */

  function select(i, animate = true) {
    selected = Math.max(0, Math.min(WEEK, i));
    renderTabs();
    const week = selected === WEEK;
    $('dayView').hidden = week;
    $('weekView').hidden = !week;
    if (week) renderWeek(); else renderDay(animate);

    const active = document.querySelector('.tab[aria-selected="true"]');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  $('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (btn) select(Number(btn.dataset.i));
  });

  $('tabs').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') select(selected + 1);
    if (e.key === 'ArrowLeft') select(selected - 1);
  });

  // Swipe left / right to change day
  let sx = 0, sy = 0;
  const main = document.querySelector('main');
  main.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  main.addEventListener('touchend', (e) => {
    if (selected === WEEK) return;                       // week table scrolls sideways instead
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 45) select(selected + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Theme toggle
  $('themeBtn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('routine-theme', next); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#171b63' : '#2b2fcf');
  });

  // Keep the live status fresh
  function tick() {
    renderNow();
    if (selected !== WEEK) renderDay(false);
    else renderWeek();
  }
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

  /* ---------------- START ---------------- */

  renderNow();
  select(todayIdx(new Date()) ?? 0, false);
})();
