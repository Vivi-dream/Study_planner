    /* =========================================================
   STUDY PLANNER - app.js
   Version: robust rewrite
   Interface en français
   Persistance via localStorage (clé: studyPlannerData_v1)
   Méthode de révision : 2,3,5,7
   ========================================================= */

/* ===========================
   UTILITAIRES
   =========================== */
const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d, n) => {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
};

const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

const formatDateReadable = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
};

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeText(v, fallback = '') {
  return v === undefined || v === null ? fallback : String(v);
}

/* ===========================
   DONNÉES / STORE
   =========================== */
const STORAGE_KEY = 'studyPlannerData_v1';

const defaultSubjects = [
  { id: 'matiere_math', name: 'Mathématiques', color: '#ffd0e0' },
  { id: 'matiere_fr', name: 'Français', color: '#e9d9ff' },
  { id: 'matiere_hg', name: 'Histoire', color: '#d6e8ff' },
  { id: 'matiere_en', name: 'Anglais', color: '#d9ffe6' }
];

let store = {
  subjects: [],
  classes: [],
  events: [],
  tasks: [],
  lessons: [],
  revisions: [],
  photos: [],
  notes: [],
  evals: [],
  settings: { weekStart: 'monday' }
};

/* ===========================
   LOAD / SAVE / RESET
   =========================== */
function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    resetStore();
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    // Merge parsed into default shaped store to preserve new fields
    store = Object.assign({}, store, parsed || {});

    // Validate arrays
    store.subjects = Array.isArray(store.subjects) ? store.subjects : defaultSubjects.slice();
    store.classes = Array.isArray(store.classes) ? store.classes : [];
    store.events = Array.isArray(store.events) ? store.events : [];
    store.tasks = Array.isArray(store.tasks) ? store.tasks : [];
    store.lessons = Array.isArray(store.lessons) ? store.lessons : [];
    store.revisions = Array.isArray(store.revisions) ? store.revisions : [];
    store.photos = Array.isArray(store.photos) ? store.photos : [];
    store.notes = Array.isArray(store.notes) ? store.notes : [];
    store.evals = Array.isArray(store.evals) ? store.evals : [];
    store.settings = store.settings && typeof store.settings === 'object' ? store.settings : { weekStart: 'monday' };

  } catch (err) {
    console.error('Erreur parsing store, reset to defaults:', err);
    // If corrupted, reset and persist defaults
    resetStore();
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du store:', err);
  }
  renderAll();
}

function resetStore() {
  store = {
    subjects: defaultSubjects.slice(),
    classes: [],
    events: [],
    tasks: [],
    lessons: [],
    revisions: [],
    photos: [],
    notes: [],
    evals: [],
    settings: { weekStart: 'monday' }
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Erreur lors de l\'initialisation du store:', err);
  }
  renderAll();
}

/* ===========================
   MODAL UTIL
   =========================== */
function openModal(contentHtml) {
  const modal = document.getElementById('modal');
  if (!modal) return;

  modal.innerHTML = `<div class="card">${contentHtml}</div>`;
  modal.classList.remove('hidden');

  // attach single click handler to close when clicking backdrop
  modal.onclick = (ev) => {
    if (ev.target === modal) closeModal();
  };
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.innerHTML = '';
  modal.onclick = null;
}

/* ===========================
   INITIALISATION
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  loadStore();
  initNav();
  initButtons();
  renderAll();
});

/* ===========================
   NAVIGATION & HEADER ACTIONS
   =========================== */
function initNav() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');
  const dashboard = document.getElementById('dashboard');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset?.tab;
      if (!tabId) return;

      const target = document.getElementById(tabId);
      if (!target) {
        console.error('Onglet introuvable:', tabId);
        return;
      }

      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabs.forEach(tab => tab.classList.add('hidden'));
      target.classList.remove('hidden');

      if (dashboard) dashboard.style.display = tabId === 'calendrier' ? '' : 'none';
    });
  });

  // export
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    try {
      const data = JSON.stringify(store, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'study-planner-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur export:', err);
      alert('Impossible d\'exporter les données.');
    }
  });

  // import
  const importInput = document.getElementById('importFile');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (!parsed || typeof parsed !== 'object') throw new Error('Format invalide');
          // basic validation & assign
          store.subjects = Array.isArray(parsed.subjects) ? parsed.subjects : defaultSubjects.slice();
          store.classes = Array.isArray(parsed.classes) ? parsed.classes : [];
          store.events = Array.isArray(parsed.events) ? parsed.events : [];
          store.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
          store.lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];
          store.revisions = Array.isArray(parsed.revisions) ? parsed.revisions : [];
          store.photos = Array.isArray(parsed.photos) ? parsed.photos : [];
          store.notes = Array.isArray(parsed.notes) ? parsed.notes : [];
          store.evals = Array.isArray(parsed.evals) ? parsed.evals : [];
          store.settings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : { weekStart: 'monday' };

          localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
          renderAll();
          alert('Importation réussie !');
        } catch (err) {
          console.error('Import error:', err);
          alert('Fichier JSON invalide.');
        }
      };
      reader.readAsText(file);
      // clear input so same file can be reimported if needed
      importInput.value = '';
    });
  }
}

/* ===========================
   BOUTONS & ACTIONS
   =========================== */
function initButtons() {
  document.getElementById('addTaskBtn')?.addEventListener('click', () => openTaskModal());
  document.getElementById('addLessonBtn')?.addEventListener('click', () => openLessonModal());
  document.getElementById('addEvalBtn')?.addEventListener('click', () => openEvalModal());
  document.getElementById('addEventFromCal')?.addEventListener('click', () => openEventModal());
  document.getElementById('prevWeek')?.addEventListener('click', () => changeWeek(-7));
  document.getElementById('nextWeek')?.addEventListener('click', () => changeWeek(7));
  document.getElementById('subjectFilter')?.addEventListener('change', () => renderCalendar());

  // manage subjects button (if present)
  const manageBtn = document.getElementById('manageSubjectsBtn');
  if (manageBtn) manageBtn.addEventListener('click', () => manageSubjectsModal());
}

/* ===========================
   RENDU GLOBAL
   =========================== */
let currentWeekStart = startOfWeek(new Date());
let gradesChart = null;

function renderAll() {
  populateSubjectFilter();
  renderDashboard();
  renderCalendar();
  renderTasks();
  renderLessons();
  renderEvals();
  renderGradesChart();
}

/* ===========================
   FILTRE MATIÈRES
   =========================== */
function populateSubjectFilter() {
  const select = document.getElementById('subjectFilter');
  if (!select) return;
  select.innerHTML = '<option value="all">Toutes les matières</option>';
  (store.subjects || []).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name || 'Sans nom';
    select.appendChild(opt);
  });
}

/* ===========================
   CALENDRIER (simplifié & safe)
   =========================== */
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // monday start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function changeWeek(days) {
  currentWeekStart = addDays(currentWeekStart, days);
  renderCalendar();
}

function weekLabel() {
  const start = currentWeekStart;
  const end = addDays(start, 6);
  const options = { day: '2-digit', month: 'short' };
  return `${start.toLocaleDateString('fr-FR', options)} — ${end.toLocaleDateString('fr-FR', options)}`;
}

function renderCalendar() {
  const weekLabelEl = document.getElementById('weekLabel');
  const container = document.getElementById('weekCalendar');
  if (weekLabelEl) weekLabelEl.textContent = weekLabel();
  if (!container) return;
  container.innerHTML = '';

  // times column
  const timesCol = document.createElement('div');
  timesCol.className = 'time-col';
  const slotHours = [...Array(14)].map((_, i) => 7 + i);
  timesCol.innerHTML = slotHours.map(h => `<div class="time">${h}h</div>`).join('');
  container.appendChild(timesCol);

  const filterEl = document.getElementById('subjectFilter');
  const filter = filterEl ? filterEl.value : 'all';

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const day = addDays(currentWeekStart, dayIndex);
    const dateString = formatDate(day);
    const dayCol = document.createElement('div');
    dayCol.className = 'day-col';
    dayCol.dataset.date = dateString;

    // header
    const header = document.createElement('div');
    header.className = 'day-header';
    const now = new Date();
    const isToday = day.getDate() === now.getDate() && day.getMonth() === now.getMonth() && day.getFullYear() === now.getFullYear();
    const dayName = day.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
    header.innerHTML = `<div>${dayName}</div><div class="text-muted">${isToday ? "Aujourd'hui" : ''}</div>`;
    dayCol.appendChild(header);

    // gather events for this day
    const classEvents = (store.classes || [])
      .filter(c => Number(c.jour) === day.getDay())
      .map(c => ({
        id: c.id,
        title: c.matiereName || getSubjectName(c.subjectId),
        subjectId: c.subjectId,
        type: 'Cours',
        date: dateString,
        startTime: c.start || '',
        endTime: c.end || '',
        priority: null,
        status: 'scheduled',
        linkedId: c.id,
        isClass: true
      }));

    const dayEvents = (store.events || []).filter(ev => ev.date === dateString);
    const revisions = (store.revisions || []).filter(rv => rv.date === dateString).map(rv => ({
      id: rv.id,
      title: rv.title,
      subjectId: rv.subjectId,
      type: 'Révision',
      date: rv.date,
      startTime: rv.startTime || '',
      endTime: rv.endTime || '',
      priority: null,
      status: rv.status || 'scheduled',
      linkedId: rv.lessonId,
      isRevision: true
    }));

    const allEvents = [...classEvents, ...dayEvents, ...revisions];
    const shownEvents = filter === 'all' ? allEvents : allEvents.filter(e => e.subjectId === filter);

    shownEvents.forEach(event => {
      const slot = document.createElement('div');
      slot.className = 'slot small';
      const subj = (store.subjects || []).find(s => s.id === event.subjectId);
      const background = subj ? subj.color : '#ffe6f3';
      slot.style.background = background;

      const statusText = event.status === 'done' ? ' • Terminé' : '';
      const badge = `<span class="badge" style="background:rgba(0,0,0,0.08);color:#6b4956;font-weight:700;padding:4px 8px;border-radius:999px;font-size:12px;">${escapeHtml(event.type || 'Événement')}</span>`;

      slot.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:5px;">
          <strong>${escapeHtml(event.title)}</strong>
          ${badge}
        </div>
        <div class="meta">
          ${event.startTime ? escapeHtml(event.startTime) + ' • ' : ''}
          ${event.endTime ? escapeHtml(event.endTime) + ' • ' : ''}
          ${event.priority ? 'Priorité: ' + escapeHtml(event.priority) : ''}
          ${statusText}
        </div>
      `;

      slot.addEventListener('click', () => {
        if (event.isRevision) openRevisionViewer(event.id);
        else if (event.isClass) openClassViewer(event);
        else openEventViewer(event);
      });

      dayCol.appendChild(slot);
    });

    container.appendChild(dayCol);
  }

  renderDashboardMini();
}

/* ===========================
   DASHBOARD
   =========================== */
function renderDashboard() {
  const dash = document.getElementById('dashboard');
  if (!dash) return;
  dash.innerHTML = '';

  const left = document.createElement('div');
  left.className = 'card';
  left.innerHTML = `
    <h2>Aperçu</h2>
    <div class="text-muted">Aujourd'hui : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
    <div id="todayClasses" style="margin-top:12px"></div>
    <div id="upcomingDeadlines" style="margin-top:12px"></div>
  `;
  dash.appendChild(left);

  const right = document.createElement('div');
  right.className = 'card';
  right.innerHTML = `
    <h3>Récapitulatif</h3>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <div style="flex:1"><strong>${(store.tasks || []).filter(t => t.status !== 'done').length}</strong><div class="text-muted">Tâches restantes</div></div>
      <div style="flex:1"><strong>${(store.evals || []).length}</strong><div class="text-muted">Évaluations</div></div>
      <div style="flex:1"><strong>${(store.subjects || []).length}</strong><div class="text-muted">Matières</div></div>
    </div>
    <div style="margin-top:12px"><strong>Moyenne générale</strong><div id="avgGeneral" class="text-muted"></div></div>
  `;
  dash.appendChild(right);

  // today classes
  const todayClassesEl = left.querySelector('#todayClasses');
  const todayDay = new Date().getDay();
  const classesToday = (store.classes || []).filter(c => Number(c.jour) === todayDay);
  if (todayClassesEl) {
    if (classesToday.length === 0) {
      todayClassesEl.innerHTML = `<div class="text-muted">Aucun cours aujourd'hui</div>`;
    } else {
      todayClassesEl.innerHTML = classesToday
        .sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')))
        .map(c => {
          const subject = (store.subjects || []).find(s => s.id === c.subjectId);
          const color = subject ? subject.color : '#ffd0e0';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,250,251,0.6));">
              <div>
                <strong>${escapeHtml(subject ? subject.name : (c.matiereName || ''))}</strong>
                <div class="text-muted">${escapeHtml(c.start || '')} - ${escapeHtml(c.end || '')}</div>
              </div>
              <div style="width:12px;height:12px;border-radius:4px;background:${color};"></div>
            </div>
          `;
        })
        .join('');
    }
  }

  // upcoming deadlines
  const upcomingEl = left.querySelector('#upcomingDeadlines');
  const nowDate = formatDate(today());
  const upcoming = (store.tasks || []).filter(t => t.status !== 'done' && t.date >= nowDate).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
  if (upcomingEl) {
    upcomingEl.innerHTML = `<h4>Échéances à venir</h4>` + (upcoming.length ? upcoming.map(task => {
      const subject = (store.subjects || []).find(s => s.id === task.subjectId);
      return `<div style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;background:var(--muted);">
          <div>
            <strong>${escapeHtml(task.title)}</strong>
            <div class="text-muted">${subject ? escapeHtml(subject.name) : 'Matière inconnue'} • ${formatDateReadable(task.date)}</div>
          </div>
          <div class="text-muted">${task.priority ? escapeHtml(task.priority) : ''}</div>
        </div>`;
    }).join('') : `<div class="text-muted">Aucune échéance prochaine</div>`);
  }

  const avgEl = document.getElementById('avgGeneral');
  if (avgEl) {
    const average = computeGeneralAverage();
    avgEl.textContent = isNaN(average) ? 'Aucune note' : `${average.toFixed(2)}/20`;
  }
}

function renderDashboardMini() {
  // placeholder for small stats if needed
}

/* ===========================
   TÂCHES
   =========================== */
function renderTasks() {
  const el = document.getElementById('tasksList');
  if (!el) return;
  el.innerHTML = '';
  if ((store.tasks || []).length === 0) {
    el.innerHTML = `<div class="text-muted">Aucun devoir ni évaluation. Créez-en un !</div>`;
    return;
  }

  const sorted = [...store.tasks].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(task => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const subject = (store.subjects || []).find(s => s.id === task.subjectId);
    item.innerHTML = `
      <div>
        <div style="font-weight:700">
          ${escapeHtml(task.title)}
          <span class="text-muted" style="font-weight:600"> • ${escapeHtml(task.type || '')}</span>
        </div>
        <div class="meta">${subject ? escapeHtml(subject.name) : ''} • ${formatDateReadable(task.date)} ${task.startTime ? ' • ' + escapeHtml(task.startTime) : ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
        <div style="display:flex;gap:6px;">
          <button class="btn small" data-action="edit" data-id="${task.id}">Modifier</button>
          <button class="btn small btn-ghost" data-action="delete" data-id="${task.id}">Supprimer</button>
        </div>
        <label class="text-muted"><input type="checkbox" data-id="${task.id}" ${task.status === 'done' ? 'checked' : ''}> Terminé</label>
      </div>
    `;
    el.appendChild(item);
  });

  // attach action handlers
  el.querySelectorAll('button[data-action]').forEach(btn => {
    <h4>Ajouter une matière</h4>
    <div style="display:grid;gap:8px">
      <label>Nom <input id="newSubName" class="input" placeholder="Ex. Physique"></label>
      <label>Couleur <input id="newSubColor" type="color" value="#cfe8ff"></label>
      <div id="presetColors" style="display:flex;gap:8px;flex-wrap:wrap"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="addSubBtn" class="btn rose small">Ajouter</button>
        <button id="closeSubBtn" class="btn small btn-ghost">Fermer</button>
      </div>
    </div>
  `;
  openModal(html);

  // render presets
  const presetEl = document.getElementById('presetColors');
  if (presetEl) {
    presetEl.innerHTML = '';
    pastel.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.title = c;
      b.style.cssText = `width:28px;height:28px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);background:${c};cursor:pointer`;
      b.addEventListener('click', () => { const picker = document.getElementById('newSubColor'); if (picker) picker.value = c; });
      presetEl.appendChild(b);
    });
  }

  function renderSubjectsList() {
    const container = document.getElementById('subjectsList');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(store.subjects) || store.subjects.length === 0) {
      container.innerHTML = '<div class="text-muted">Aucune matière définie.</div>';
      return;
    }
    store.subjects.forEach(s => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      row.innerHTML = `
        <input class="input sub-name" data-id="${s.id}" value="${escapeHtml(s.name)}" style="flex:1" />
        <input type="color" class="sub-color" data-id="${s.id}" value="${escapeHtml(s.color || '#ffd0e0')}" />
        <button class="btn small" data-action="save" data-id="${s.id}">OK</button>
        <button class="btn small btn-ghost" data-action="delete" data-id="${s.id}">Suppr</button>
      `;
      container.appendChild(row);
    });
  }

  renderSubjectsList();

  // delegated actions
  document.getElementById('subjectsList')?.addEventListener('click', (e) => {
    const btn = e.target;
    const action = btn.dataset?.action;
    const id = btn.dataset?.id;
    if (!action || !id) return;

    if (action === 'save') {
      const nameEl = document.querySelector(`.sub-name[data-id="${id}"]`);
      const colorEl = document.querySelector(`.sub-color[data-id="${id}"]`);
      if (!nameEl) return;
      const name = nameEl.value.trim() || 'Sans nom';
      const color = colorEl ? colorEl.value : '#ffd0e0';
      const subj = (store.subjects || []).find(x => x.id === id);
      if (subj) { subj.name = name; subj.color = color; saveStore(); renderSubjectsList(); }
    }

    if (action === 'delete') {
      if (confirm('Supprimer cette matière ? Cela n\\'effacera pas les événements mais la matière sera retirée.')) {
        store.subjects = (store.subjects || []).filter(x => x.id !== id);
        (store.events || []).forEach(ev => { if (ev.subjectId === id) ev.subjectId = null; });
        (store.tasks || []).forEach(t => { if (t.subjectId === id) t.subjectId = null; });
        saveStore();
        renderSubjectsList();
      }
    }
  });

  document.getElementById('addSubBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newSubName')?.value.trim();
    const color = document.getElementById('newSubColor')?.value || '#cfe8ff';
    if (!name) { alert('Donne un nom à la matière.'); return; }
    const id = uid('matiere');
    store.subjects.push({ id, name, color });
    saveStore();
    document.getElementById('newSubName').value = '';
    renderSubjectsList();
  });

  document.getElementById('closeSubBtn')?.addEventListener('click', closeModal);
}

/* ===========================
   FIN DU FICHIER
   =========================== */
/* FIN DU FICHIER */
