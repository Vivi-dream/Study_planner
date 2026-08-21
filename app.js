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
            'Événement'
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
        todayDay
    );

  if (todayClassesEl) {

    todayClassesEl.innerHTML =
      classesToday.length
        ? classesToday
            .sort(
              (a, b) =>
                String(a.start)
                  .localeCompare(
                    String(b.start)
                  )
            )
            .map(c => {

              const subject =
                store.subjects.find(
                  s =>
                    s.id ===
                    c.subjectId
                );

              return `
                <div style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  padding:8px;
                  border-radius:10px;
                  background:
                    linear-gradient(
                      180deg,
                      rgba(255,255,255,0.6),
                      rgba(255,250,251,0.6)
                    );
                ">

                  <div>
                    <strong>
                      ${
                        subject
                          ? escapeHtml(
                              subject.name
                            )
                          : escapeHtml(
                              c.matiereName ||
                              ''
                            )
                      }
                    </strong>

                    <div class="text-muted">
                      ${escapeHtml(
                        c.start || ''
                      )}
                      -
                      ${escapeHtml(
                        c.end || ''
                      )}
                    </div>
                  </div>

                  <div style="
                    width:12px;
                    height:12px;
                    border-radius:4px;
                    background:
                      ${
                        subject
                          ? subject.color
                          : '#ffd0e0'
                      };
                  ">
                  </div>

                </div>
              `;
            })
            .join('')
        : `
          <div class="text-muted">
            Aucun cours aujourd'hui
          </div>
        `;
  }


  /* ÉCHÉANCES */

  const upcomingEl =
    left.querySelector(
      '#upcomingDeadlines'
    );

  const nowDate =
    formatDate(
      today()
    );

  const upcoming =
    store.tasks
      .filter(
        task =>
          task.status !== 'done' &&
          task.date >= nowDate
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(0, 5);

  if (upcomingEl) {

    upcomingEl.innerHTML =
      `
        <h4>
          Échéances à venir
        </h4>
      ` +

      (
        upcoming.length
          ? upcoming
              .map(task => {

                const subject =
                  store.subjects.find(
                    s =>
                      s.id ===
                      task.subjectId
                  );

                return `
                  <div style="
                    display:flex;
                    justify-content:space-between;
                    padding:8px;
                    border-radius:8px;
                    background:var(--muted);
                  ">

                    <div>
                      <strong>
                        ${escapeHtml(
                          task.title
                        )}
                      </strong>

                      <div class="text-muted">
                        ${
                          subject
                            ? escapeHtml(
                                subject.name
                              )
                            : 'Matière inconnue'
                        }

                        •

                        ${formatDateReadable(
                          task.date
                        )}
                      </div>
                    </div>

                    <div class="text-muted">
                      ${
                        task.priority
                          ? escapeHtml(
                              task.priority
                            )
                          : ''
                      }
                    </div>

                  </div>
                `;
              })
              .join('')
          : `
            <div class="text-muted">
              Aucune échéance prochaine
            </div>
          `
      );
  }


  const avgEl =
    document.getElementById(
      'avgGeneral'
    );

  if (avgEl) {

    const average =
      computeGeneralAverage();

    avgEl.textContent =
      isNaN(average)
        ? 'Aucune note'
        : `${average.toFixed(2)}/20`;
  }
}

function renderDashboardMini() {
  /* Réservé pour de futures statistiques. */
}


/* =========================================================
   TÂCHES
   ========================================================= */

function renderTasks() {

  const el =
    document.getElementById(
      'tasksList'
    );

  if (!el) {
    return;
  }

  el.innerHTML = '';


  if (store.tasks.length === 0) {

    el.innerHTML = `
      <div class="text-muted">
        Aucun devoir ni évaluation.
        Créez-en un !
      </div>
    `;

    return;
  }


  const sortedTasks =
    [...store.tasks].sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


  sortedTasks.forEach(task => {

    const item =
      document.createElement(
        'div'
      );

    item.className =
      'list-item';


    const subject =
      store.subjects.find(
        s =>
          s.id ===
          task.subjectId
      );


    item.innerHTML = `
      <div>

        <div style="font-weight:700">
          ${escapeHtml(
            task.title
          )}

          <span
            class="text-muted"
            style="font-weight:600">

            • ${escapeHtml(
              task.type || ''
            )}

          </span>
        </div>

        <div class="meta">

          ${
            subject
              ? escapeHtml(
                  subject.name
                )
              : ''
          }

          •

          ${formatDateReadable(
            task.date
          )}

          ${
            task.startTime
              ? ' • ' +
                escapeHtml(
                  task.startTime
                )
              : ''
          }

        </div>

      </div>


      <div style="
        display:flex;
        flex-direction:column;
        gap:6px;
        align-items:flex-end;
      ">

        <div style="
          display:flex;
          gap:6px;
        ">

          <button
            class="btn small"
            data-action="edit"
            data-id="${task.id}">
            Modifier
          </button>

          <button
            class="btn small btn-ghost"
            data-action="delete"
            data-id="${task.id}">
            Supprimer
          </button>

        </div>


        <label class="text-muted">

          <input
            type="checkbox"
            data-id="${task.id}"
            ${
              task.status === 'done'
                ? 'checked'
                : ''
            }>

          Terminé

        </label>

      </div>
    `;


    el.appendChild(item);
  });


  el.querySelectorAll(
    'button[data-action]'
  ).forEach(button => {

    button.addEventListener(
      'click',
      event => {

        const id =
          event.currentTarget.dataset.id;

        const action =
          event.currentTarget.dataset.action;


        if (action === 'edit') {
          openTaskModal(id);
        }


        if (action === 'delete') {

          if (
            confirm(
              'Supprimer cette tâche ?'
            )
          ) {
            deleteTask(id);
          }
        }
      }
    );
  });


  el.querySelectorAll(
    'input[type="checkbox"][data-id]'
  ).forEach(checkbox => {

    checkbox.addEventListener(
      'change',
      event => {

        const id =
          event.currentTarget.dataset.id;

        const task =
          store.tasks.find(
            t =>
              t.id === id
          );

        if (!task) {
          return;
        }

        task.status =
          event.currentTarget.checked
            ? 'done'
            : 'scheduled';

        syncTaskToEvent(task);

        saveStore();
      }
    );
  });
}


/* =========================================================
   LEÇONS
   ========================================================= */

function renderLessons() {

  const el =
    document.getElementById(
      'lessonsList'
    );

  if (!el) {
    return;
  }

  el.innerHTML = '';


  if (store.lessons.length === 0) {

    el.innerHTML = `
      <div class="text-muted">
        Aucune leçon enregistrée.
      </div>
    `;

    return;
  }


  const sortedLessons =
    [...store.lessons].sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


  sortedLessons.forEach(lesson => {

    const item =
      document.createElement(
        'div'
      );

    item.className =
      'list-item';


    const subject =
      store.subjects.find(
        s =>
          s.id ===
          lesson.subjectId
      );


    const revisions =
      store.revisions.filter(
        r =>
          r.lessonId ===
          lesson.id
      );


    const completed =
      revisions.filter(
        r =>
          r.status === 'done'
      ).length;


    item.innerHTML = `
      <div>

        <div style="font-weight:700">
          ${escapeHtml(
            lesson.titre ||
            'Leçon sans titre'
          )}
        </div>

        <div class="meta">

          ${
            subject
              ? escapeHtml(
                  subject.name
                )
              : ''
          }

          •

          ${formatDateReadable(
            lesson.date
          )}

        </div>

        ${
          lesson.chapitre
            ? `
              <div class="meta">
                Chapitre :
                ${escapeHtml(
                  lesson.chapitre
                )}
              </div>
            `
            : ''
        }

        ${
          lesson.use2257
            ? `
              <div
                class="meta"
                style="margin-top:4px">

                🔁 Méthode
                <strong>
                  2,3,5,7
                </strong>

                ${
                  revisions.length
                    ? `•
                      ${completed}/${revisions.length}
                      révisions terminées`
                    : ''
                }

              </div>
            `
            : ''
        }

      </div>


      <div style="
        display:flex;
        gap:6px;
        align-items:center;
      ">

        <button
          class="btn small"
          data-action="view"
          data-id="${lesson.id}">
          Voir
        </button>

        <button
          class="btn small"
          data-action="edit"
          data-id="${lesson.id}">
          Modifier
        </button>

        <button
          class="btn small btn-ghost"
          data-action="delete"
          data-id="${lesson.id}">
          Supprimer
        </button>

      </div>
    `;


    el.appendChild(item);
  });


  el.querySelectorAll(
    'button[data-action]'
  ).forEach(button => {

    button.addEventListener(
      'click',
      event => {

        const id =
          event.currentTarget.dataset.id;

        const action =
          event.currentTarget.dataset.action;


        if (action === 'view') {
          openLessonViewer(id);
        }


        if (action === 'edit') {
          openLessonModal(id);
        }


        if (action === 'delete') {

          if (
            confirm(
              'Supprimer cette leçon et toutes ses révisions ?'
            )
          ) {
            deleteLesson(id);
          }
        }
      }
    );
  });
}


/* =========================================================
   GRAPHIQUE DES NOTES
   ========================================================= */

/*
   IMPORTANT :
   On n'utilise PAS d'axe "time".

   Cela évite l'erreur :
   "This method is not implemented:
   Check that a complete date adapter is provided."
*/

function renderGradesChart() {

  const canvas =
    document.getElementById(
      'gradesChart'
    );

  if (!canvas) {
    return;
  }


  if (
    typeof Chart ===
    'undefined'
  ) {

    console.error(
      'Chart.js n’est pas chargé.'
    );

    return;
  }


  const ctx =
    canvas.getContext('2d');


  if (gradesChart) {

    try {
      gradesChart.destroy();
    } catch (e) {
      console.warn(
        'Impossible de détruire le graphique précédent.',
        e
      );
    }

    gradesChart = null;
  }


  const validEvals =
    store.evals
      .filter(
        evaluation =>
          evaluation.vraie !== null &&
          evaluation.vraie !== undefined &&
          evaluation.vraie !== '' &&
          !isNaN(
            Number(
              evaluation.vraie
            )
          )
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  /*
    Chaque évaluation correspond
    à un index sur l'axe X.

    Ainsi Chart.js n'a besoin
    d'aucun adaptateur de date.
  */

  const labels =
    validEvals.map(
      evaluation =>
        formatDateReadable(
          evaluation.date
        )
    );


  const datasets =
    store.subjects
      .map(subject => {

        const data =
          validEvals.map(
            evaluation => {

              if (
                evaluation.subjectId ===
                subject.id
              ) {

                return Number(
                  evaluation.vraie
                );
              }

              return null;
            }
          );


        return {
          label: subject.name,
          data: data,
          borderColor:
            subject.color ||
            '#ff7fbf',
          backgroundColor:
            subject.color ||
            '#ffd0e0',
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.25,
          spanGaps: true
        };
      });


  /*
    S'il n'y a aucune matière,
    on ne crée pas de graphique.
  */

  if (
    store.subjects.length === 0
  ) {

    const summary =
      document.getElementById(
        'gradesSummary'
      );

    if (summary) {
      summary.innerHTML =
        '<div class="text-muted">Aucune matière.</div>';
    }

    return;
  }


  gradesChart =
    new Chart(
      ctx,
      {
        type: 'line',

        data: {
          labels: labels,
          datasets: datasets
        },

        options: {

          responsive: true,

          maintainAspectRatio: true,

          plugins: {

            legend: {
              position: 'top'
            }

          },

          scales: {

            x: {

              title: {
                display: true,
                text: 'Date'
              }

            },

            y: {

              min: 0,
              max: 20,

              ticks: {
                stepSize: 2
              },

              title: {
                display: true,
                text: 'Note /20'
              }

            }

          }

        }
      }
    );


  /* RÉSUMÉ DES MOYENNES */

  const summary =
    document.getElementById(
      'gradesSummary'
    );

  if (!summary) {
    return;
  }


  const general =
    computeGeneralAverage();


  let html = `
    <div style="
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    ">

      <div>
        <strong>
          Moyenne générale
        </strong>

        <div class="text-muted">
          ${
            isNaN(general)
              ? '—'
              : general.toFixed(2) + '/20'
          }
        </div>
      </div>
  `;


  store.subjects.forEach(
    subject => {

      const average =
        computeSubjectAverage(
          subject.id
        );


      html += `
        <div>

          <strong>
            ${escapeHtml(
              subject.name
            )}
          </strong>

          <div class="text-muted">
            ${
              isNaN(average)
                ? '—'
                : average.toFixed(2) +
                  '/20'
            }
          </div>

        </div>
      `;
    }
  );


  html += `
    </div>
  `;


  summary.innerHTML =
    html;
}


/* =========================================================
   MODALES
   ========================================================= */

function openModal(contentHtml) {

  const modal =
    document.getElementById(
      'modal'
    );

  if (!modal) {
    return;
  }


  modal.innerHTML = `
    <div class="card">
      ${contentHtml}
    </div>
  `;


  modal.classList.remove(
    'hidden'
  );


  /*
    On remplace l'ancien
    listener au lieu d'en ajouter
    un nouveau à chaque ouverture.
  */

  modal.onclick =
    (event) => {

      if (
        event.target ===
        modal
      ) {
        closeModal();
      }
    };
}


function closeModal() {

  const modal =
    document.getElementById(
      'modal'
    );

  if (!modal) {
    return;
  }

  modal.classList.add(
    'hidden'
  );

  modal.innerHTML =
    '';

  modal.onclick =
    null;
}


/* =========================================================
   MODALE TÂCHE
   ========================================================= */

function openTaskModal(taskId = null) {

  const existingTask =
    taskId
      ? store.tasks.find(
          task =>
            task.id ===
            taskId
        )
      : null;


  const task =
    existingTask ||
    {
      id: uid('task'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      title: '',

      type: 'Devoir',

      date:
        formatDate(
          addDays(
            new Date(),
            1
          )
        ),

      startTime: '',

      priority: 'Moyenne',

      timeEstimate: '30',

      status: 'scheduled',

      notes: ''
    };


  const subjectOptions =
    store.subjects
      .map(
        subject =>
          `
            <option
              value="${subject.id}"
              ${
                subject.id ===
                task.subjectId
                  ? 'selected'
                  : ''
              }>
              ${escapeHtml(
                subject.name
              )}
            </option>
          `
      )
      .join('');


  const html = `
    <h3>
      ${
        taskId
          ? 'Modifier la tâche'
          : 'Nouvelle tâche'
      }
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <label>
        Matière

        <select
          id="taskSubject"
          class="select">

          ${subjectOptions}

        </select>
      </label>


      <label>
        Titre

        <input
          id="taskTitle"
          class="input"
          value="${escapeHtml(
            task.title
          )}">
      </label>


      <label>
        Type

        <select
          id="taskType"
          class="select">

          <option ${
            task.type === 'Devoir'
              ? 'selected'
              : ''
          }>
            Devoir
          </option>

          <option ${
            task.type === 'DM'
              ? 'selected'
              : ''
          }>
            DM
          </option>

          <option ${
            task.type === 'Évaluation'
              ? 'selected'
              : ''
          }>
            Évaluation
          </option>

          <option ${
            task.type === 'Contrôle'
              ? 'selected'
              : ''
          }>
            Contrôle
          </option>

          <option ${
            task.type === 'Examen'
              ? 'selected'
              : ''
          }>
            Examen
          </option>

          <option ${
            task.type === 'Projet'
              ? 'selected'
              : ''
          }>
            Projet
          </option>

        </select>
      </label>


      <label>
        Date limite

        <input
          id="taskDate"
          type="date"
          class="input"
          value="${task.date}">
      </label>


      <label>
        Heure (optionnel)

        <input
          id="taskStartTime"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            task.startTime || ''
          )}">
      </label>


      <label>
        Priorité

        <select
          id="taskPriority"
          class="select">

          <option ${
            task.priority === 'Haute'
              ? 'selected'
              : ''
          }>
            Haute
          </option>

          <option ${
            task.priority === 'Moyenne'
              ? 'selected'
              : ''
          }>
            Moyenne
          </option>

          <option ${
            task.priority === 'Basse'
              ? 'selected'
              : ''
          }>
            Basse
          </option>

        </select>
      </label>


      <label>
        Temps estimé (min)

        <input
          id="taskEstimate"
          class="input"
          type="number"
          min="1"
          value="${escapeHtml(
            task.timeEstimate ||
            '30'
          )}">
      </label>


      <label>
        Notes (optionnel)

        <textarea
          id="taskNotes"
          rows="3"
          class="input">${escapeHtml(
            task.notes || ''
          )}</textarea>
      </label>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
      ">

        <button
          id="cancelTask"
          class="btn small btn-ghost">
          Annuler
        </button>

        <button
          id="saveTask"
          class="btn rose small">
          ${
            taskId
              ? 'Enregistrer'
              : 'Créer'
          }
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancelTask')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('saveTask')
    ?.addEventListener(
      'click',
      () => {

        const title =
          document.getElementById(
            'taskTitle'
          ).value.trim();


        if (!title) {

          alert(
            'Veuillez entrer un titre.'
          );

          return;
        }


        const newTask = {

          id: task.id,

          subjectId:
            document.getElementById(
              'taskSubject'
            ).value,

          title: title,

          type:
            document.getElementById(
              'taskType'
            ).value,

          date:
            document.getElementById(
              'taskDate'
            ).value,

          startTime:
            document.getElementById(
              'taskStartTime'
            ).value,

          priority:
            document.getElementById(
              'taskPriority'
            ).value,

          timeEstimate:
            document.getElementById(
              'taskEstimate'
            ).value,

          status:
            task.status ||
            'scheduled',

          notes:
            document.getElementById(
              'taskNotes'
            ).value
        };


        const index =
          store.tasks.findIndex(
            t =>
              t.id ===
              newTask.id
          );


        if (index >= 0) {

          store.tasks[index] =
            newTask;

        } else {

          store.tasks.push(
            newTask
          );
        }


        syncTaskToEvent(
          newTask
        );


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   MODALE ÉVÉNEMENT
   ========================================================= */

function openEventModal(ev = null) {

  const event =
    ev ||
    {
      id: uid('event'),

      title: '',

      subjectId:
        store.subjects[0]?.id ||
        null,

      type:
        'Activité extrascolaire',

      date:
        formatDate(
          new Date()
        ),

      startTime: '',

      endTime: '',

      priority:
        'Moyenne',

      status:
        'scheduled',

      linkedId:
        null
    };


  const subjectOptions =
    store.subjects
      .map(
        subject =>
          `
            <option
              value="${subject.id}"
              ${
                subject.id ===
                event.subjectId
                  ? 'selected'
                  : ''
              }>
              ${escapeHtml(
                subject.name
              )}
            </option>
          `
      )
      .join('');


  const html = `
    <h3>
      ${
        ev
          ? 'Modifier l’événement'
          : 'Nouvel événement'
      }
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <label>
        Matière

        <select
          id="eventSubject"
          class="select">

          ${subjectOptions}

        </select>
      </label>


      <label>
        Titre

        <input
          id="eventTitle"
          class="input"
          value="${escapeHtml(
            event.title
          )}">
      </label>


      <label>
        Type

        <select
          id="eventType"
          class="select">

          <option ${
            event.type ===
            'Activité extrascolaire'
              ? 'selected'
              : ''
          }>
            Activité extrascolaire
          </option>

          <option ${
            event.type ===
            'Révision'
              ? 'selected'
              : ''
          }>
            Révision
          </option>

          <option ${
            event.type ===
            'Devoir'
              ? 'selected'
              : ''
          }>
            Devoir
          </option>

          <option ${
            event.type ===
            'Évaluation'
              ? 'selected'
              : ''
          }>
            Évaluation
          </option>

        </select>
      </label>


      <label>
        Date

        <input
          id="eventDate"
          type="date"
          class="input"
          value="${event.date}">
      </label>


      <label>
        Heure de début

        <input
          id="eventStart"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            event.startTime ||
            ''
          )}">
      </label>


      <label>
        Heure de fin

        <input
          id="eventEnd"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            event.endTime ||
            ''
          )}">
      </label>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
      ">

        <button
          id="cancelEvent"
          class="btn small btn-ghost">
          Annuler
        </button>

        <button
          id="saveEvent"
          class="btn rose small">
          Sauvegarder
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancelEvent')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('saveEvent')
    ?.addEventListener(
      'click',
      () => {

        const title =
          document.getElementById(
            'eventTitle'
          ).value.trim();


        if (!title) {

          alert(
            'Veuillez entrer un titre.'
          );

          return;
        }


        const newEvent = {

          id: event.id,

          title: title,

          subjectId:
            document.getElementById(
              'eventSubject'
            ).value,

          type:
            document.getElementById(
              'eventType'
            ).value,

          date:
            document.getElementById(
              'eventDate'
            ).value,

          startTime:
            document.getElementById(
              'eventStart'
            ).value,

          endTime:
            document.getElementById(
              'eventEnd'
            ).value,

          priority:
            event.priority ||
            'Moyenne',

          status:
            event.status ||
            'scheduled',

          linkedId:
            event.linkedId ||
            null
        };


        const index =
          store.events.findIndex(
            e =>
              e.id ===
              newEvent.id
          );


        if (index >= 0) {

          store.events[index] =
            newEvent;

        } else {

          store.events.push(
            newEvent
          );
        }


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   AFFICHAGE D'UN ÉVÉNEMENT
   ========================================================= */

function openEventViewer(ev) {

  const linkedTask =
    ev.linkedId
      ? store.tasks.find(
          task =>
            task.id ===
            ev.linkedId
        )
      : null;


  const linkedEval =
    ev.linkedId
      ? store.evals.find(
          evaluation =>
            evaluation.id ===
            ev.linkedId
        )
      : null;


  const subject =
    store.subjects.find(
      s =>
        s.id ===
        ev.subjectId
    );


  const html = `
    <h3>
      Événement
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <div>
        <strong>
          ${escapeHtml(
            ev.title
          )}
        </strong>
      </div>

      <div class="meta">

        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : ''
        }

        •

        ${formatDateReadable(
          ev.date
        )}

        ${
          ev.startTime
            ? ' • ' +
              escapeHtml(
                ev.startTime
              )
            : ''
        }

      </div>

      <div class="text-muted">
        Type :
        ${escapeHtml(
          ev.type || ''
        )}
      </div>

      ${
        linkedTask
          ? `
            <div class="text-muted">
              Cet événement est lié
              à une tâche du Planner.
            </div>
          `
          : ''
      }

      ${
        linkedEval
          ? `
            <div class="text-muted">
              Cet événement est lié
              à une évaluation.
            </div>
          `
          : ''
      }


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
        flex-wrap:wrap;
      ">

        <button
          id="editEvent"
          class="btn small">
          Modifier
        </button>

        ${
          !ev.isClass
            ? `
              <button
                id="toggleEventDone"
                class="btn small btn-ghost">

                ${
                  ev.status === 'done'
                    ? 'Marquer non terminé'
                    : 'Marquer terminé'
                }

              </button>
            `
            : ''
        }

        ${
          !ev.isClass
            ? `
              <button
                id="deleteEvent"
                class="btn small btn-ghost">
                Supprimer
              </button>
            `
            : ''
        }

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('editEvent')
    ?.addEventListener(
      'click',
      () => {

        closeModal();

        if (linkedTask) {
          openTaskModal(
            linkedTask.id
          );
        } else if (linkedEval) {
          openEvalModal(
            linkedEval.id
          );
        } else {
          openEventModal(
            ev
          );
        }
      }
    );


  document
    .getElementById(
      'toggleEventDone'
    )
    ?.addEventListener(
      'click',
      () => {

        ev.status =
          ev.status === 'done'
            ? 'scheduled'
            : 'done';


        if (linkedTask) {

          linkedTask.status =
            ev.status;
        }


        if (
          linkedEval &&
          ev.status === 'done'
        ) {
          /* Rien à modifier dans l'évaluation. */
        }


        saveStore();

        closeModal();
      }
    );


  document
    .getElementById(
      'deleteEvent'
    )
    ?.addEventListener(
      'click',
      () => {

        if (
          !confirm(
            'Supprimer cet événement ?'
          )
        ) {
          return;
        }


        store.events =
          store.events.filter(
            event =>
              event.id !==
              ev.id
          );


        if (linkedTask) {
          linkedTask.linkedId =
            null;
        }


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   SYNCHRONISATION TÂCHE → CALENDRIER
   ========================================================= */

function syncTaskToEvent(task) {

  let event =
    store.events.find(
      e =>
        e.linkedId ===
        task.id
    );


  if (!event) {

    event = {

      id: uid('ev'),

      title:
        `${task.type} — ${task.title}`,

      subjectId:
        task.subjectId,

      type:
        task.type,

      date:
        task.date,

      startTime:
        task.startTime || '',

      endTime: '',

      priority:
        task.priority ||
        'Moyenne',

      status:
        task.status ||
        'scheduled',

      linkedId:
        task.id
    };


    store.events.push(
      event
    );

  } else {

    event.title =
      `${task.type} — ${task.title}`;

    event.subjectId =
      task.subjectId;

    event.type =
      task.type;

    event.date =
      task.date;

    event.startTime =
      task.startTime || '';

    event.priority =
      task.priority ||
      'Moyenne';

    event.status =
      task.status ||
      'scheduled';
  }
}


/* =========================================================
   SUPPRIMER UNE TÂCHE
   ========================================================= */

function deleteTask(id) {

  store.tasks =
    store.tasks.filter(
      task =>
        task.id !== id
    );


  store.events =
    store.events.filter(
      event =>
        event.linkedId !== id
    );


  saveStore();
}


/* =========================================================
   LEÇONS
   ========================================================= */

function openLessonModal(
  lessonId = null
) {

  const existingLesson =
    lessonId
      ? store.lessons.find(
          lesson =>
            lesson.id ===
            lessonId
        )
      : null;


  const lesson =
    existingLesson ||
    {
      id: uid('lesson'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      chapitre: '',

      titre: '',

      date:
        formatDate(
          addDays(
            new Date(),
            1
          )
        ),

      use2257: false
    };


  const subjectOptions =
    store.subjects
      .map(
        subject =>
          `
            <option
              value="${subject.id}"
              ${
                subject.id ===
                lesson.subjectId
                  ? 'selected'
                  : ''
              }>
              ${escapeHtml(
                subject.name
              )}
            </option>
          `
      )
      .join('');


  const html = `
    <h3>
      ${
        lessonId
          ? 'Modifier la leçon'
          : 'Nouvelle leçon'
      }
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <label>
        Matière

        <select
          id="lessonSubject"
          class="select">

          ${subjectOptions}

        </select>
      </label>


      <label>
        Chapitre

        <input
          id="lessonChapter"
          class="input"
          value="${escapeHtml(
            lesson.chapitre
          )}">
      </label>


      <label>
        Titre de la leçon

        <input
          id="lessonTitle"
          class="input"
          value="${escapeHtml(
            lesson.titre
          )}">
      </label>


      <label>
        Date de la leçon

        <input
          id="lessonDate"
          type="date"
          class="input"
          value="${lesson.date}">
      </label>


      <label>

        <input
          id="use2257"
          type="checkbox"
          ${
            lesson.use2257
              ? 'checked'
              : ''
          }>

        Activer la méthode
        <strong>2,3,5,7</strong>

        <div
          class="text-muted"
          style="margin-top:4px">

          Révisions automatiques :
          J+2, J+3, J+5 et J+7.

        </div>

      </label>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
      ">

        <button
          id="cancelLesson"
          class="btn small btn-ghost">
          Annuler
        </button>

        <button
          id="saveLesson"
          class="btn rose small">
          Enregistrer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'cancelLesson'
    )
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById(
      'saveLesson'
    )
    ?.addEventListener(
      'click',
      () => {

        const title =
          document.getElementById(
            'lessonTitle'
          ).value.trim();


        if (!title) {

          alert(
            'Veuillez entrer un titre de leçon.'
          );

          return;
        }


        const lessonObject = {

          id: lesson.id,

          subjectId:
            document.getElementById(
              'lessonSubject'
            ).value,

          chapitre:
            document.getElementById(
              'lessonChapter'
            ).value.trim(),

          titre:
            title,

          date:
            document.getElementById(
              'lessonDate'
            ).value,

          use2257:
            document.getElementById(
              'use2257'
            ).checked
        };


        const existing =
          store.lessons.find(
            item =>
              item.id ===
              lessonObject.id
          );


        if (existing) {

          Object.assign(
            existing,
            lessonObject
          );

        } else {

          store.lessons.push(
            lessonObject
          );
        }


        /*
          MÉTHODE 2,3,5,7

          J+2
          J+3
          J+5
          J+7
        */

        if (
          lessonObject.use2257
        ) {

          const revisionDays =
            [2, 3, 5, 7];


          revisionDays.forEach(
            offset => {

              const revisionDate =
                formatDate(
                  addDays(
                    new Date(
                      lessonObject.date
                    ),
                    offset
                  )
                );


              const alreadyExists =
                store.revisions.find(
                  revision =>
                    revision.lessonId ===
                      lessonObject.id &&
                    Number(
                      revision.offset
                    ) === offset
                );


              if (
                alreadyExists
              ) {

                /*
                  On met à jour la date
                  si la date de la leçon
                  a changé.
                */

                alreadyExists.date =
                  revisionDate;

                alreadyExists.subjectId =
                  lessonObject.subjectId;

              } else {

                store.revisions.push({

                  id:
                    uid('rev'),

                  lessonId:
                    lessonObject.id,

                  subjectId:
                    lessonObject.subjectId,

                  title:
                    `Révision ${offset} — ${lessonObject.titre}`,

                  date:
                    revisionDate,

                  offset:
                    offset,

                  status:
                    'scheduled',

                  startTime: '',

                  endTime: ''
                });
              }
            }
          );

        } else {

          /*
            Si l'utilisateur désactive
            la méthode 2,3,5,7,
            les anciennes révisions
            automatiques sont supprimées.
          */

          store.revisions =
            store.revisions.filter(
              revision =>
                revision.lessonId !==
                lessonObject.id
            );
        }


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   AFFICHAGE D'UNE LEÇON
   ========================================================= */

function openLessonViewer(id) {

  const lesson =
    store.lessons.find(
      l =>
        l.id === id
    );

  if (!lesson) {
    return;
  }


  const subject =
    store.subjects.find(
      s =>
        s.id ===
        lesson.subjectId
    );


  const revisions =
    store.revisions
      .filter(
        r =>
          r.lessonId ===
          lesson.id
      )
      .sort(
        (a, b) =>
          Number(a.offset) -
          Number(b.offset)
      );


  let revisionsHtml = '';


  if (
    revisions.length === 0
  ) {

    revisionsHtml = `
      <div class="text-muted">
        Aucune révision planifiée.
      </div>
    `;

  } else {

    revisionsHtml =
      revisions
        .map(
          revision =>
            `
              <div style="
                padding:8px;
                border-radius:8px;
                background:var(--muted);
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:8px;
              ">

                <div>

                  <strong>
                    J+${revision.offset}
                  </strong>

                  <div>
                    ${escapeHtml(
                      revision.title
                    )}
                  </div>

                  <div class="meta">

                    ${formatDateReadable(
                      revision.date
                    )}

                    •

                    ${
                      revision.status ===
                      'done'
                        ? 'Terminée'
                        : 'À faire'
                    }

                  </div>

                </div>


                <div style="
                  display:flex;
                  gap:6px;
                  flex-wrap:wrap;
                ">

                  <button
                    class="btn small"
                    data-revision-action="toggle"
                    data-id="${revision.id}">

                    ${
                      revision.status ===
                      'done'
                        ? 'Annuler'
                        : 'Terminé'
                    }

                  </button>

                  <button
                    class="btn small btn-ghost"
                    data-revision-action="edit"
                    data-id="${revision.id}">

                    Modifier

                  </button>

                  <button
                    class="btn small btn-ghost"
                    data-revision-action="delete"
                    data-id="${revision.id}">

                    Suppr.

                  </button>

                </div>

              </div>
            `
        )
        .join('');
  }


  const html = `
    <h3>
      ${escapeHtml(
        lesson.titre
      )}
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <div>
        <strong>
          Matière :
        </strong>

        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : ''
        }
      </div>


      <div>
        <strong>
          Chapitre :
        </strong>

        ${
          lesson.chapitre
            ? escapeHtml(
                lesson.chapitre
              )
            : '—'
        }
      </div>


      <div>
        <strong>
          Date :
        </strong>

        ${formatDateReadable(
          lesson.date
        )}
      </div>


      ${
        lesson.use2257
          ? `
            <div>
              <strong>
                Méthode :
              </strong>

              2,3,5,7

              <div class="text-muted">
                J+2 • J+3 • J+5 • J+7
              </div>
            </div>
          `
          : ''
      }


      <h4>
        Révisions
      </h4>

      <div style="
        display:grid;
        gap:8px;
      ">

        ${revisionsHtml}

      </div>


      <div style="
        display:flex;
        justify-content:flex-end;
      ">

        <button
          id="closeLessonViewer"
          class="btn small btn-ghost">

          Fermer

        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'closeLessonViewer'
    )
    ?.addEventListener(
      'click',
      closeModal
    );


  document.querySelectorAll(
    '[data-revision-action]'
  ).forEach(button => {

    button.addEventListener(
      'click',
      event => {

        const revisionId =
          event.currentTarget.dataset.id;

        const action =
          event.currentTarget.dataset
            .revisionAction;


        const revision =
          store.revisions.find(
            r =>
              r.id ===
              revisionId
          );


        if (!revision) {
          return;
        }


        if (
          action ===
          'toggle'
        ) {

          revision.status =
            revision.status ===
            'done'
              ? 'scheduled'
              : 'done';

          saveStore();

          closeModal();

          openLessonViewer(
            lesson.id
          );

          return;
        }


        if (
          action ===
          'edit'
        ) {

          closeModal();

          openRevisionEditModal(
            revision
          );

          return;
        }


        if (
          action ===
          'delete'
        ) {

          if (
            confirm(
              'Supprimer cette révision ?'
            )
          ) {

            store.revisions =
              store.revisions.filter(
                r =>
                  r.id !==
                  revisionId
              );

            saveStore();

            closeModal();

            openLessonViewer(
              lesson.id
            );
          }
        }
      }
    );
  });
}


/* =========================================================
   MODIFICATION D'UNE RÉVISION
   ========================================================= */

function openRevisionEditModal(
  revision
) {

  const subjectOptions =
    store.subjects
      .map(
        subject =>
          `
            <option
              value="${subject.id}"
              ${
                subject.id ===
                revision.subjectId
                  ? 'selected'
                  : ''
              }>

              ${escapeHtml(
                subject.name
              )}

            </option>
          `
      )
      .join('');


  const html = `
    <h3>
      Modifier la révision
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <label>
        Matière

        <select
          id="revisionSubject"
          class="select">

          ${subjectOptions}

        </select>
      </label>


      <label>
        Titre

        <input
          id="revisionTitle"
          class="input"
          value="${escapeHtml(
            revision.title
          )}">
      </label>


      <label>
        Date

        <input
          id="revisionDate"
          type="date"
          class="input"
          value="${revision.date}">
      </label>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
      ">

        <button
          id="cancelRevision"
          class="btn small btn-ghost">

          Annuler

        </button>

        <button
          id="saveRevision"
          class="btn rose small">

          Enregistrer

        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'cancelRevision'
    )
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById(
      'saveRevision'
    )
    ?.addEventListener(
      'click',
      () => {

        revision.subjectId =
          document.getElementById(
            'revisionSubject'
          ).value;


        revision.title =
          document.getElementById(
            'revisionTitle'
          ).value.trim();


        revision.date =
          document.getElementById(
            'revisionDate'
          ).value;


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   AFFICHAGE D'UNE RÉVISION DU CALENDRIER
   ========================================================= */

function openRevisionViewer(
  revisionId
) {

  const revision =
    store.revisions.find(
      r =>
        r.id ===
        revisionId
    );

  if (!revision) {
    return;
  }


  const lesson =
    store.lessons.find(
      l =>
        l.id ===
        revision.lessonId
    );


  const subject =
    store.subjects.find(
      s =>
        s.id ===
        revision.subjectId
    );


  const html = `
    <h3>
      Révision J+${revision.offset}
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <div>
        <strong>
          ${escapeHtml(
            revision.title
          )}
        </strong>
      </div>


      <div class="meta">

        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : ''
        }

        •

        ${formatDateReadable(
          revision.date
        )}

      </div>


      ${
        lesson
          ? `
            <div class="text-muted">
              Leçon :
              ${escapeHtml(
                lesson.titre
              )}
            </div>
          `
          : ''
      }


      <div>
        Statut :

        <strong>
          ${
            revision.status ===
            'done'
              ? 'Terminée'
              : 'À faire'
          }
        </strong>
      </div>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
        flex-wrap:wrap;
      ">

        <button
          id="toggleRevision"
          class="btn small">

          ${
            revision.status ===
            'done'
              ? 'Marquer à faire'
              : 'Terminer'
          }

        </button>


        <button
          id="editRevision"
          class="btn small">

          Modifier

        </button>


        <button
          id="deleteRevision"
          class="btn small btn-ghost">

          Supprimer

        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'toggleRevision'
    )
    ?.addEventListener(
      'click',
      () => {

        revision.status =
          revision.status ===
          'done'
            ? 'scheduled'
            : 'done';

        saveStore();

        closeModal();
      }
    );


  document
    .getElementById(
      'editRevision'
    )
    ?.addEventListener(
      'click',
      () => {

        closeModal();

        openRevisionEditModal(
          revision
        );
      }
    );


  document
    .getElementById(
      'deleteRevision'
    )
    ?.addEventListener(
      'click',
      () => {

        if (
          confirm(
            'Supprimer cette révision ?'
          )
        ) {

          store.revisions =
            store.revisions.filter(
              r =>
                r.id !==
                revision.id
            );

          saveStore();

          closeModal();
        }
      }
    );
}


/* =========================================================
   SUPPRIMER UNE LEÇON
   ========================================================= */

function deleteLesson(id) {

  store.lessons =
    store.lessons.filter(
      lesson =>
        lesson.id !== id
    );


  store.revisions =
    store.revisions.filter(
      revision =>
        revision.lessonId !==
        id
    );


  saveStore();
}


/* =========================================================
   COURS RÉCURRENTS
   ========================================================= */

function openClassViewer(event) {

  const subject =
    store.subjects.find(
      s =>
        s.id ===
        event.subjectId
    );


  const html = `
    <h3>
      Cours
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <div>
        <strong>
          ${
            subject
              ? escapeHtml(
                  subject.name
                )
              : escapeHtml(
                  event.title ||
                  ''
                )
          }
        </strong>
      </div>


      <div class="meta">

        ${escapeHtml(
          event.startTime ||
          ''
        )}

        -

        ${escapeHtml(
          event.endTime ||
          ''
        )}

      </div>


      <div class="text-muted">
        Cours récurrent de l'emploi
        du temps.
      </div>


      <div style="
        display:flex;
        justify-content:flex-end;
      ">

        <button
          id="closeClass"
          class="btn small btn-ghost">

          Fermer

        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'closeClass'
    )
    ?.addEventListener(
      'click',
      closeModal
    );
}


/* =========================================================
   ÉVALUATIONS
   ========================================================= */

function renderEvals() {

  const el =
    document.getElementById(
      'evalsList'
    );

  if (!el) {
    return;
  }

  el.innerHTML = '';


  if (
    store.evals.length === 0
  ) {

    el.innerHTML = `
      <div class="text-muted">
        Aucune évaluation enregistrée.
      </div>
    `;

    return;
  }


  const evaluations =
    [...store.evals].sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );


  evaluations.forEach(
    evaluation => {

      const subject =
        store.subjects.find(
          s =>
            s.id ===
            evaluation.subjectId
        );


      const item =
        document.createElement(
          'div'
        );

      item.className =
        'list-item';


      item.innerHTML = `
        <div>

          <div style="
            font-weight:700;
          ">

            ${escapeHtml(
              evaluation.nom ||
              'Évaluation'
            )}

          </div>


          <div class="meta">

            ${
              subject
                ? escapeHtml(
                    subject.name
                  )
                : ''
            }

            •

            ${formatDateReadable(
              evaluation.date
            )}

            •

            Coef
            ${
              Number(
                evaluation.coefficient
              ) || 1
            }

          </div>


          <div class="meta">

            Pronostic :
            <strong>
              ${
                evaluation.pronostique ??
                '-'
              }
            </strong>

            •

            Vraie note :
            <strong>
              ${
                evaluation.vraie ??
                '-'
              }
            </strong>

          </div>

        </div>


        <div style="
          display:flex;
          gap:6px;
          align-items:center;
        ">

          <button
            class="btn small"
            data-action="edit"
            data-id="${evaluation.id}">

            Modifier

          </button>


          <button
            class="btn small btn-ghost"
            data-action="delete"
            data-id="${evaluation.id}">

            Supprimer

          </button>

        </div>
      `;


      el.appendChild(item);
    }
  );


  el.querySelectorAll(
    'button[data-action]'
  ).forEach(button => {

    button.addEventListener(
      'click',
      event => {

        const id =
          event.currentTarget.dataset.id;

        const action =
          event.currentTarget.dataset.action;


        if (
          action ===
          'edit'
        ) {

          openEvalModal(id);

          return;
        }


        if (
          action ===
          'delete'
        ) {

          if (
            confirm(
              'Supprimer cette évaluation ?'
            )
          ) {

            store.evals =
              store.evals.filter(
                evaluation =>
                  evaluation.id !==
                  id
              );


            store.events =
              store.events.filter(
                event =>
                  event.linkedId !==
                  id
              );


            saveStore();
          }
        }
      }
    );
  });
}


/* =========================================================
   MODALE ÉVALUATION
   ========================================================= */

function openEvalModal(
  evalId = null
) {

  const existing =
    evalId
      ? store.evals.find(
          evaluation =>
            evaluation.id ===
            evalId
        )
      : null;


  const evaluation =
    existing ||
    {
      id: uid('eval'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      nom: '',

      date:
        formatDate(
          addDays(
            new Date(),
            3
          )
        ),

      pronostique:
        null,

      vraie:
        null,

      coefficient:
        1
    };


  const subjectOptions =
    store.subjects
      .map(
        subject =>
          `
            <option
              value="${subject.id}"
              ${
                subject.id ===
                evaluation.subjectId
                  ? 'selected'
                  : ''
              }>

              ${escapeHtml(
                subject.name
              )}

            </option>
          `
      )
      .join('');


  const html = `
    <h3>
      ${
        evalId
          ? 'Modifier l’évaluation'
          : 'Nouvelle évaluation'
      }
    </h3>

    <div style="
      display:grid;
      gap:8px;
    ">

      <label>
        Matière

        <select
          id="evalSubject"
          class="select">

          ${subjectOptions}

        </select>
      </label>


      <label>
        Nom

        <input
          id="evalName"
          class="input"
          value="${escapeHtml(
            evaluation.nom
          )}">
      </label>


      <label>
        Date

        <input
          id="evalDate"
          type="date"
          class="input"
          value="${evaluation.date}">
      </label>


      <label>
        Note pronostiquée

        <input
          id="evalPronostic"
          class="input"
          type="number"
          min="0"
          max="20"
          step="0.25"
          value="${
            evaluation.pronostique ??
            ''
          }">
      </label>


      <label>
        Vraie note

        <input
          id="evalReal"
          class="input"
          type="number"
          min="0"
          max="20"
          step="0.25"
          value="${
            evaluation.vraie ??
            ''
          }">
      </label>


      <label>
        Coefficient

        <input
          id="evalCoefficient"
          class="input"
          type="number"
          min="0.1"
          step="0.1"
          value="${
            evaluation.coefficient ??
            1
          }">
      </label>


      <div style="
        display:flex;
        gap:8px;
        justify-content:flex-end;
      ">

        <button
          id="cancelEval"
          class="btn small btn-ghost">

          Annuler

        </button>


        <button
          id="saveEval"
          class="btn rose small">

          Enregistrer

        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById(
      'cancelEval'
    )
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById(
      'saveEval'
    )
    ?.addEventListener(
      'click',
      () => {

        const name =
          document.getElementById(
            'evalName'
          ).value.trim();


        if (!name) {

          alert(
            'Veuillez entrer le nom de l’évaluation.'
          );

          return;
        }


        const pronosticValue =
          document.getElementById(
            'evalPronostic'
          ).value;


        const realValue =
          document.getElementById(
            'evalReal'
          ).value;


        const coefficientValue =
          document.getElementById(
            'evalCoefficient'
          ).value;


        evaluation.subjectId =
          document.getElementById(
            'evalSubject'
          ).value;


        evaluation.nom =
          name;


        evaluation.date =
          document.getElementById(
            'evalDate'
          ).value;


        evaluation.pronostique =
          pronosticValue !== ''
            ? Number(
                pronosticValue
              )
            : null;


        evaluation.vraie =
          realValue !== ''
            ? Number(
                realValue
              )
            : null;


        evaluation.coefficient =
          coefficientValue !== ''
            ? Number(
                coefficientValue
              )
            : 1;


        const index =
          store.evals.findIndex(
            e =>
              e.id ===
              evaluation.id
          );


        if (index >= 0) {

          store.evals[index] =
            evaluation;

        } else {

          store.evals.push(
            evaluation
          );
        }


        /*
          ÉVÉNEMENT CALENDRIER
          LIÉ À L'ÉVALUATION
        */

        store.events =
          store.events.filter(
            event =>
              event.linkedId !==
              evaluation.id
          );


        store.events.push({

          id: uid('ev'),

          title:
            `Évaluation — ${evaluation.nom}`,

          subjectId:
            evaluation.subjectId,

          type:
            'Évaluation',

          date:
            evaluation.date,

          startTime: '',

          endTime: '',

          priority:
            'Haute',

          status:
            'scheduled',

          linkedId:
            evaluation.id
        });


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   MOYENNES
   ========================================================= */

function computeSubjectAverage(
  subjectId
) {

  const evaluations =
    store.evals.filter(
      evaluation =>
        evaluation.subjectId ==
          subjectId &&
        evaluation.vraie !==
          null &&
        evaluation.vraie !==
          undefined &&
        evaluation.vraie !==
          ''
    );


  if (
    evaluations.length ===
    0
  ) {
    return NaN;
  }


  let totalPoints =
    0;

  let totalCoefficient =
    0;


  evaluations.forEach(
    evaluation => {

      const value =
        Number(
          evaluation.vraie
        );


      const coefficient =
        Number(
          evaluation.coefficient ??
          evaluation.coef
        ) || 1;


      if (
        !isNaN(value)
      ) {

        totalPoints +=
          value *
          coefficient;

        totalCoefficient +=
          coefficient;
      }
    }
  );


  if (
    totalCoefficient ===
    0
  ) {
    return NaN;
  }


  return (
    totalPoints /
    totalCoefficient
  );
}


function computeGeneralAverage() {

  const evaluations =
    store.evals.filter(
      evaluation =>
        evaluation.vraie !==
          null &&
        evaluation.vraie !==
          undefined &&
        evaluation.vraie !==
          ''
    );


  if (
    evaluations.length ===
    0
  ) {
    return NaN;
  }


  let totalPoints =
    0;

  let totalCoefficient =
    0;


  evaluations.forEach(
    evaluation => {

      const value =
        Number(
          evaluation.vraie
        );


      const coefficient =
        Number(
          evaluation.coefficient ??
          evaluation.coef
        ) || 1;


      if (
        !isNaN(value)
      ) {

        totalPoints +=
          value *
          coefficient;

        totalCoefficient +=
          coefficient;
      }
    }
  );


  if (
    totalCoefficient ===
    0
  ) {
    return NaN;
  }


  return (
    totalPoints /
    totalCoefficient
  );
}


/* =========================================================
   UTILITAIRE MATIÈRE
   ========================================================= */

function getSubjectName(
  subjectId
) {

  const subject =
    store.subjects.find(
      s =>
        s.id ===
        subjectId
    );


  return subject
    ? subject.name
    : '';
}


/* =========================================================
   FIN DU FICHIER
   ========================================================= */
