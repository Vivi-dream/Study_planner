/* =========================================================
   STUDY PLANNER - app.js
   Interface entièrement en français
   Persistance via localStorage
   Méthode de révision : 2,3,5,7
   ========================================================= */


/* =========================================================
   UTILITAIRES
   ========================================================= */

const uid = (prefix = 'id') => {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (d) => {
  const dt = new Date(d);

  if (isNaN(dt.getTime())) {
    return '';
  }

  return dt.toISOString().slice(0, 10);
};

const formatDateReadable = (d) => {
  const dt = new Date(d);

  if (isNaN(dt.getTime())) {
    return '';
  }

  return dt.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
};

const addDays = (d, n) => {
  const t = new Date(d);
  t.setDate(t.getDate() + n);
  return t;
};

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* =========================================================
   DONNÉES
   ========================================================= */

const STORAGE_KEY = 'studyPlannerData_v1';

const defaultSubjects = [
  {
    id: 'matiere_math',
    name: 'Mathématiques',
    color: '#ffd0e0'
  },
  {
    id: 'matiere_fr',
    name: 'Français',
    color: '#e9d9ff'
  },
  {
    id: 'matiere_hg',
    name: 'Histoire',
    color: '#d6e8ff'
  },
  {
    id: 'matiere_en',
    name: 'Anglais',
    color: '#d9ffe6'
  }
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
  settings: {
    weekStart: 'monday'
  }
};


/* =========================================================
   CHARGEMENT / SAUVEGARDE
   ========================================================= */

function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw) {
    try {
      store = JSON.parse(raw);

      store.subjects = Array.isArray(store.subjects)
        ? store.subjects
        : defaultSubjects.slice();

      store.classes = Array.isArray(store.classes)
        ? store.classes
        : [];

      store.events = Array.isArray(store.events)
        ? store.events
        : [];

      store.tasks = Array.isArray(store.tasks)
        ? store.tasks
        : [];

      store.lessons = Array.isArray(store.lessons)
        ? store.lessons
        : [];

      store.revisions = Array.isArray(store.revisions)
        ? store.revisions
        : [];

      store.photos = Array.isArray(store.photos)
        ? store.photos
        : [];

      store.notes = Array.isArray(store.notes)
        ? store.notes
        : [];

      store.evals = Array.isArray(store.evals)
        ? store.evals
        : [];

      store.settings = store.settings || {
        weekStart: 'monday'
      };

    } catch (e) {
      console.error('Erreur lors du chargement des données :', e);

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
        settings: {
          weekStart: 'monday'
        }
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(store)
      );
    }
  } else {
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
      settings: {
        weekStart: 'monday'
      }
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(store)
    );
  }
}

function saveStore() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store)
  );

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
    settings: {
      weekStart: 'monday'
    }
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store)
  );

  renderAll();
}


/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  loadStore();
  initNav();
  initButtons();
  renderAll();
});


/* =========================================================
   NAVIGATION
   ========================================================= */

function initNav() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');
  const dashboard = document.getElementById('dashboard');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      const tabId = btn.dataset.tab;
      const target = document.getElementById(tabId);

      if (!target) {
        console.error('Onglet introuvable :', tabId);
        return;
      }

      navButtons.forEach(b => {
        b.classList.remove('active');
      });

      btn.classList.add('active');

      tabs.forEach(tab => {
        tab.classList.add('hidden');
      });

      target.classList.remove('hidden');

      if (dashboard) {
        dashboard.style.display =
          tabId === 'calendrier'
            ? ''
            : 'none';
      }
    });
  });


  /* EXPORT */

  const exportBtn = document.getElementById('exportBtn');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {

      const data = JSON.stringify(
        store,
        null,
        2
      );

      const blob = new Blob(
        [data],
        {
          type: 'application/json'
        }
      );

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;
      a.download = 'study-planner-export.json';

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    });
  }


  /* IMPORT */

  const importInput =
    document.getElementById('importFile');

  if (importInput) {

    importInput.addEventListener(
      'change',
      (e) => {

        const file = e.target.files[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {

          try {

            const data =
              JSON.parse(event.target.result);

            if (!data || typeof data !== 'object') {
              throw new Error('Format invalide');
            }

            store = {
              subjects: Array.isArray(data.subjects)
                ? data.subjects
                : defaultSubjects.slice(),

              classes: Array.isArray(data.classes)
                ? data.classes
                : [],

              events: Array.isArray(data.events)
                ? data.events
                : [],

              tasks: Array.isArray(data.tasks)
                ? data.tasks
                : [],

              lessons: Array.isArray(data.lessons)
                ? data.lessons
                : [],

              revisions: Array.isArray(data.revisions)
                ? data.revisions
                : [],

              photos: Array.isArray(data.photos)
                ? data.photos
                : [],

              notes: Array.isArray(data.notes)
                ? data.notes
                : [],

              evals: Array.isArray(data.evals)
                ? data.evals
                : [],

              settings: data.settings || {
                weekStart: 'monday'
              }
            };

            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(store)
            );

            renderAll();

            alert('Importation réussie !');

          } catch (err) {

            console.error(err);

            alert(
              'Fichier JSON invalide.'
            );
          }
        };

        reader.readAsText(file);
      }
    );
  }
}


/* =========================================================
   BOUTONS
   ========================================================= */

function initButtons() {

  const addTaskBtn =
    document.getElementById('addTaskBtn');

  if (addTaskBtn) {
    addTaskBtn.addEventListener(
      'click',
      () => openTaskModal()
    );
  }


  const addLessonBtn =
    document.getElementById('addLessonBtn');

  if (addLessonBtn) {
    addLessonBtn.addEventListener(
      'click',
      () => openLessonModal()
    );
  }


  const addEvalBtn =
    document.getElementById('addEvalBtn');

  if (addEvalBtn) {
    addEvalBtn.addEventListener(
      'click',
      () => openEvalModal()
    );
  }


  const addEventBtn =
    document.getElementById('addEventFromCal');

  if (addEventBtn) {
    addEventBtn.addEventListener(
      'click',
      () => openEventModal()
    );
  }


  const prevWeek =
    document.getElementById('prevWeek');

  if (prevWeek) {
    prevWeek.addEventListener(
      'click',
      () => changeWeek(-7)
    );
  }


  const nextWeek =
    document.getElementById('nextWeek');

  if (nextWeek) {
    nextWeek.addEventListener(
      'click',
      () => changeWeek(7)
    );
  }


  const subjectFilter =
    document.getElementById('subjectFilter');

  if (subjectFilter) {
    subjectFilter.addEventListener(
      'change',
      () => renderCalendar()
    );
  }

  // manage subjects button (open modal)
  const manageSubjectsBtn = document.getElementById('manageSubjectsBtn');
  if (manageSubjectsBtn) {
    manageSubjectsBtn.addEventListener('click', () => manageSubjectsModal());
  }
}


/* =========================================================
   RENDU GLOBAL
   ========================================================= */

let currentWeekStart =
  startOfWeek(new Date());

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


/* =========================================================
   FILTRE MATIÈRES
   ========================================================= */

function populateSubjectFilter() {

  const select =
    document.getElementById('subjectFilter');

  if (!select) {
    return;
  }

  select.innerHTML =
    '<option value="all">Toutes les matières</option>';

  store.subjects.forEach(subject => {

    const option =
      document.createElement('option');

    option.value = subject.id;
    option.textContent = subject.name;

    select.appendChild(option);
  });
}


/* =========================================================
   CALENDRIER
   ========================================================= */

function startOfWeek(date) {

  const d = new Date(date);

  const day = d.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  const monday =
    new Date(d);

  monday.setDate(
    d.getDate() + diff
  );

  monday.setHours(
    0,
    0,
    0,
    0
  );

  return monday;
}

function changeWeek(days) {

  currentWeekStart =
    addDays(
      currentWeekStart,
      days
    );

  renderCalendar();
}

function weekLabel() {

  const start =
    currentWeekStart;

  const end =
    addDays(
      start,
      6
    );

  const options = {
    day: '2-digit',
    month: 'short'
  };

  return `${start.toLocaleDateString(
    'fr-FR',
    options
  )} — ${end.toLocaleDateString(
    'fr-FR',
    options
  )}`;
}


function renderCalendar() {

  const weekLabelEl =
    document.getElementById('weekLabel');

  const container =
    document.getElementById('weekCalendar');

  if (!container) {
    return;
  }

  if (weekLabelEl) {
    weekLabelEl.textContent =
      weekLabel();
  }

  container.innerHTML = '';


  /* COLONNE DES HEURES */

  const timesCol =
    document.createElement('div');

  timesCol.className =
    'time-col';

  const slotHours =
    [...Array(14)].map(
      (_, i) => 7 + i
    );

  timesCol.innerHTML =
    slotHours
      .map(
        hour =>
          `<div class="time">${hour}h</div>`
      )
      .join('');

  container.appendChild(
    timesCol
  );


  const filterEl =
    document.getElementById(
      'subjectFilter'
    );

  const filter =
    filterEl
      ? filterEl.value
      : 'all';


  /* 7 JOURS */

  for (
    let dayIndex = 0;
    dayIndex < 7;
    dayIndex++
  ) {

    const day =
      addDays(
        currentWeekStart,
        dayIndex
      );

    const dateString =
      formatDate(day);

    const dayCol =
      document.createElement('div');

    dayCol.className =
      'day-col';

    dayCol.dataset.date =
      dateString;


    /* EN-TÊTE */

    const header =
      document.createElement('div');

    header.className =
      'day-header';

    const now =
      new Date();

    const isToday =
      day.getDate() === now.getDate() &&
      day.getMonth() === now.getMonth() &&
      day.getFullYear() === now.getFullYear();

    const dayName =
      day.toLocaleDateString(
        'fr-FR',
        {
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        }
      );

    header.innerHTML = `
      <div>${dayName}</div>
      <div class="text-muted">
        ${isToday ? "Aujourd'hui" : ''}
      </div>
    `;

    dayCol.appendChild(header);


    /* COURS RÉCURRENTS */

    const classEvents =
      store.classes
        .filter(
          c =>
            Number(c.jour) ===
            day.getDay()
        )
        .map(c => ({
          id: c.id,
          title:
            c.matiereName ||
            getSubjectName(c.subjectId),

          subjectId:
            c.subjectId,

          type: 'Cours',

          date:
            dateString,

          startTime:
            c.start || '',

          endTime:
            c.end || '',

          priority: null,

          status: 'scheduled',

          linkedId:
            c.id,

          isClass: true
        }));


    /* ÉVÉNEMENTS */

    const dayEvents =
      store.events.filter(
        event =>
          event.date ===
          dateString
      );


    /* RÉVISIONS */

    const revisions =
      store.revisions
        .filter(
          revision =>
            revision.date ===
            dateString
        )
        .map(revision => ({
          id: revision.id,

          title:
            revision.title,

          subjectId:
            revision.subjectId,

          type:
            'Révision',

          date:
            revision.date,

          startTime:
            revision.startTime || '',

          endTime:
            revision.endTime || '',

          priority:
            null,

          status:
            revision.status || 'scheduled',

          linkedId:
            revision.lessonId,

          isRevision:
            true
        }));


    const allEvents = [
      ...classEvents,
      ...dayEvents,
      ...revisions
    ];


    const shownEvents =
      filter === 'all'
        ? allEvents
        : allEvents.filter(
            event =>
              event.subjectId ===
              filter
          );


    /* AFFICHAGE */

    shownEvents.forEach(event => {

      const slot =
        document.createElement('div');

      slot.className =
        'slot small';

      const subject =
        store.subjects.find(
          s =>
            s.id ===
            event.subjectId
        );

      const background =
        subject
          ? subject.color
          : '#ffe6f3';

      slot.style.background =
        background;

      let statusText = '';

      if (event.status === 'done') {
        statusText =
          ' • Terminé';
      }

      const badge =
        `<span class="badge"
          style="
            background:rgba(0,0,0,0.08);
            color:#6b4956;
            font-weight:700;
            padding:4px 8px;
            border-radius:999px;
            font-size:12px;
          ">
          ${escapeHtml(
            event.type ||
            'Évènement'
          )}
        </span>`;

      slot.innerHTML = `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:5px;
        ">
          <strong>
            ${escapeHtml(
              event.title
            )}
          </strong>

          ${badge}
        </div>

        <div class="meta">
          ${
            event.startTime
              ? escapeHtml(
                  event.startTime
                ) + ' • '
              : ''
          }

          ${
            event.endTime
              ? escapeHtml(
                  event.endTime
                ) + ' • '
              : ''
          }

          ${
            event.priority
              ? 'Priorité: ' +
                escapeHtml(
                  event.priority
                )
              : ''
          }

          ${statusText}
        </div>
      `;


      slot.addEventListener(
        'click',
        () => {

          if (event.isRevision) {
            openRevisionViewer(
              event.id
            );
          } else if (event.isClass) {
            openClassViewer(
              event
            );
          } else {
            openEventViewer(
              event
            );
          }
        }
      );


      dayCol.appendChild(
        slot
      );
    });


    container.appendChild(
      dayCol
    );
  }

  renderDashboardMini();
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

  const dash =
    document.getElementById(
      'dashboard'
    );

  if (!dash) {
    return;
  }

  dash.innerHTML = '';


  const left =
    document.createElement(
      'div'
    );

  left.className =
    'card';

  left.innerHTML = `
    <h2>Aperçu</h2>

    <div class="text-muted">
      Aujourd'hui :
      ${new Date().toLocaleDateString(
        'fr-FR',
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long'
        }
      )}
    </div>

    <div
      id="todayClasses"
      style="margin-top:12px">
    </div>

    <div
      id="upcomingDeadlines"
      style="margin-top:12px">
    </div>
  `;

  dash.appendChild(left);


  const right =
    document.createElement(
      'div'
    );

  right.className =
    'card';

  right.innerHTML = `
    <h3>Récapitulatif</h3>

    <div style="
      display:flex;
      gap:8px;
      margin-top:10px;
    ">

      <div style="flex:1">
        <strong>
          ${
            store.tasks.filter(
              t =>
                t.status !==
                'done'
            ).length
          }
        </strong>

        <div class="text-muted">
          Tâches restantes
        </div>
      </div>

      <div style="flex:1">
        <strong>
          ${store.evals.length}
        </strong>

        <div class="text-muted">
          Évaluations
        </div>
      </div>

      <div style="flex:1">
        <strong>
          ${store.subjects.length}
        </strong>

        <div class="text-muted">
          Matières
        </div>
      </div>

    </div>

    <div style="margin-top:12px">
      <strong>
        Moyenne générale
      </strong>

      <div
        id="avgGeneral"
        class="text-muted">
      </div>
    </div>
  `;

  dash.appendChild(right);


  /* COURS DU JOUR */

  const todayClassesEl =
    left.querySelector(
      '#todayClasses'
    );

  const todayDay =
    new Date().getDay();

  const classesToday =
    store.classes.filter(
      c =>
        Number(c.jour) ===
