/* =========================================================
   STUDY PLANNER - app.js
   Interface française
   Persistance : localStorage
   Méthode de révision : 2,3,5,7
   ========================================================= */


/* =========================================================
   UTILITAIRES
   ========================================================= */

const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

const formatDateReadable = (d) => {
  const dt = new Date(d);

  if (isNaN(dt.getTime())) return '';

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
  if (value === null || value === undefined) return '';

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

function createDefaultStore() {
  return {
    subjects: defaultSubjects.map(s => ({ ...s })),
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
}

function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    store = createDefaultStore();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(store)
    );
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    store = {
      subjects: Array.isArray(parsed.subjects)
        ? parsed.subjects
        : defaultSubjects.map(s => ({ ...s })),

      classes: Array.isArray(parsed.classes)
        ? parsed.classes
        : [],

      events: Array.isArray(parsed.events)
        ? parsed.events
        : [],

      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : [],

      lessons: Array.isArray(parsed.lessons)
        ? parsed.lessons
        : [],

      revisions: Array.isArray(parsed.revisions)
        ? parsed.revisions
        : [],

      photos: Array.isArray(parsed.photos)
        ? parsed.photos
        : [],

      notes: Array.isArray(parsed.notes)
        ? parsed.notes
        : [],

      evals: Array.isArray(parsed.evals)
        ? parsed.evals
        : [],

      settings: parsed.settings || {
        weekStart: 'monday'
      }
    };

  } catch (error) {
    console.error(
      'Erreur lors du chargement des données :',
      error
    );

    store = createDefaultStore();
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
  store = createDefaultStore();

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

  const navButtons =
    document.querySelectorAll('.nav-btn');

  const tabs =
    document.querySelectorAll('.tab-content');

  const dashboard =
    document.getElementById('dashboard');

  navButtons.forEach(btn => {

    btn.addEventListener('click', () => {

      const tabId = btn.dataset.tab;

      const target =
        document.getElementById(tabId);

      if (!target) {
        console.error(
          'Onglet introuvable :',
          tabId
        );
        return;
      }

      navButtons.forEach(b =>
        b.classList.remove('active')
      );

      btn.classList.add('active');

      tabs.forEach(tab =>
        tab.classList.add('hidden')
      );

      target.classList.remove('hidden');

      if (dashboard) {
        dashboard.style.display =
          tabId === 'calendrier'
            ? ''
            : 'none';
      }
    });

  });


  /* =========================
     EXPORT
     ========================= */

  const exportBtn =
    document.getElementById('exportBtn');

  if (exportBtn) {

    exportBtn.addEventListener(
      'click',
      () => {

        const data =
          JSON.stringify(
            store,
            null,
            2
          );

        const blob =
          new Blob(
            [data],
            {
              type: 'application/json'
            }
          );

        const url =
          URL.createObjectURL(blob);

        const a =
          document.createElement('a');

        a.href = url;

        a.download =
          'study-planner-export.json';

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);
      }
    );
  }


  /* =========================
     IMPORT
     ========================= */

  const importInput =
    document.getElementById('importFile');

  if (importInput) {

    importInput.addEventListener(
      'change',
      (e) => {

        const file =
          e.target.files[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload =
          (event) => {

            try {

              const data =
                JSON.parse(
                  event.target.result
                );

              store = {
                ...createDefaultStore(),
                ...data
              };

              saveStore();

              alert(
                'Importation réussie !'
              );

            } catch (error) {

              console.error(error);

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
   RENDER GLOBAL
   ========================================================= */

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
   MATIÈRES
   ========================================================= */

function populateSubjectFilter() {

  const select =
    document.getElementById(
      'subjectFilter'
    );

  if (!select) return;

  select.innerHTML =
    '<option value="all">Toutes les matières</option>';

  store.subjects.forEach(subject => {

    const option =
      document.createElement('option');

    option.value =
      subject.id;

    option.textContent =
      subject.name;

    select.appendChild(option);
  });
}


/* =========================================================
   CALENDRIER
   ========================================================= */

let currentWeekStart =
  startOfWeek(new Date());

function startOfWeek(date) {

  const d =
    new Date(date);

  const day =
    d.getDay();

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


/* =========================================================
   RENDU DU CALENDRIER
   ========================================================= */

function renderCalendar() {

  const weekLabelEl =
    document.getElementById(
      'weekLabel'
    );

  const container =
    document.getElementById(
      'weekCalendar'
    );

  if (!container) return;

  if (weekLabelEl) {
    weekLabelEl.textContent =
      weekLabel();
  }

  container.innerHTML = '';


  /* =========================
     COLONNE DES HEURES
     ========================= */

  const timesCol =
    document.createElement('div');

  timesCol.className =
    'time-col';

  const slotHours =
    Array.from(
      { length: 14 },
      (_, i) => 7 + i
    );

  timesCol.innerHTML =
    slotHours
      .map(hour =>
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


  /* =========================
     7 JOURS
     ========================= */

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

    const dayDate =
      formatDate(day);

    const dayCol =
      document.createElement('div');

    dayCol.className =
      'day-col';

    dayCol.dataset.date =
      dayDate;


    /* HEADER */

    const header =
      document.createElement('div');

    header.className =
      'day-header';

    const isToday =
      dayDate === formatDate(
        new Date()
      );

    header.innerHTML = `
      <div>
        ${day.toLocaleDateString(
          'fr-FR',
          {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
          }
        )}
      </div>

      <div class="text-muted">
        ${isToday ? "Aujourd'hui" : ''}
      </div>
    `;

    dayCol.appendChild(
      header
    );


    /* =========================
       COURS RÉCURRENTS
       ========================= */

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
            getSubjectName(
              c.subjectId
            ),

          subjectId:
            c.subjectId,

          type:
            'Cours',

          date:
            dayDate,

          startTime:
            c.start || '',

          endTime:
            c.end || '',

          priority:
            null,

          status:
            'scheduled',

          linkedId:
            c.id,

          isClass:
            true
        }));


    /* =========================
       ÉVÉNEMENTS
       ========================= */

    const dayEvents =
      store.events.filter(
        event =>
          event.date ===
          dayDate
      );


    /* =========================
       RÉVISIONS
       ========================= */

    const revisions =
      store.revisions
        .filter(
          revision =>
            revision.date ===
            dayDate
        )
        .map(revision => ({

          ...revision,

          type:
            'Révision'
        }));


    const allEvents = [
      ...classEvents,
      ...dayEvents,
      ...revisions
    ];


    const shown =
      filter === 'all'
        ? allEvents
        : allEvents.filter(
            event =>
              event.subjectId ===
              filter
          );


    /* =========================
       AFFICHAGE
       ========================= */

    shown.forEach(event => {

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


      const statusText =
        event.status === 'done'
          ? ' • Terminé'
          : '';


      slot.innerHTML = `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:6px;
        ">

          <strong>
            ${escapeHtml(
              event.title ||
              'Événement'
            )}
          </strong>

          <span
            class="badge"
            style="
              background:rgba(0,0,0,0.08);
              color:#6b4956;
              font-weight:700;
              padding:4px 8px;
              border-radius:999px;
              font-size:12px;
            "
          >
            ${escapeHtml(
              event.type ||
              'Événement'
            )}
          </span>

        </div>

        <div class="meta">
          ${
            event.startTime
              ? escapeHtml(
                  event.startTime
                )
              : ''
          }

          ${
            event.priority
              ? ' • Priorité : ' +
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
        () =>
          openEventViewer(
            event
          )
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

  const dashboard =
    document.getElementById(
      'dashboard'
    );

  if (!dashboard) return;

  dashboard.innerHTML = '';


  /* =========================
     CARTE GAUCHE
     ========================= */

  const left =
    document.createElement('div');

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
      style="margin-top:12px"
    ></div>

    <div
      id="upcomingDeadlines"
      style="margin-top:12px"
    ></div>
  `;

  dashboard.appendChild(
    left
  );


  /* =========================
     CARTE DROITE
     ========================= */

  const right =
    document.createElement('div');

  right.className =
    'card';

  const remainingTasks =
    store.tasks.filter(
      task =>
        task.status !== 'done'
    ).length;

  right.innerHTML = `
    <h3>Récapitulatif</h3>

    <div
      style="
        display:flex;
        gap:8px;
        margin-top:10px;
      "
    >

      <div style="flex:1">
        <strong>
          ${remainingTasks}
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
        class="text-muted"
      ></div>

    </div>
  `;

  dashboard.appendChild(
    right
  );


  /* =========================
     COURS DU JOUR
     ========================= */

  const todayClasses =
    store.classes.filter(
      c =>
        Number(c.jour) ===
        new Date().getDay()
    );

  const todayClassesEl =
    left.querySelector(
      '#todayClasses'
    );

  if (todayClassesEl) {

    todayClassesEl.innerHTML =
      todayClasses.length

        ? todayClasses
            .map(c => {

              const subject =
                store.subjects.find(
                  s =>
                    s.id ===
                    c.subjectId
                );

              return `
                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:8px;
                    border-radius:10px;
                    background:
                      linear-gradient(
                        180deg,
                        rgba(
                          255,
                          255,
                          255,
                          0.6
                        ),
                        rgba(
                          255,
                          250,
                          251,
                          0.6
                        )
                      );
                  "
                >

                  <div>

                    <strong>
                      ${
                        subject
                          ? escapeHtml(
                              subject.name
                            )
                          : escapeHtml(
                              c.matiereName ||
                              'Cours'
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

                  <div
                    style="
                      width:12px;
                      height:12px;
                      border-radius:4px;
                      background:
                        ${
                          subject
                            ? subject.color
                            : '#ffd0e0'
                        };
                    "
                  ></div>

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


  /* =========================
     ÉCHÉANCES
     ========================= */

  const upcomingEl =
    left.querySelector(
      '#upcomingDeadlines'
    );

  const upcoming =
    store.tasks
      .filter(
        task =>
          task.status !== 'done' &&
          task.date &&
          new Date(task.date) >=
            today()
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
                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      padding:8px;
                      border-radius:8px;
                      background:var(--muted);
                    "
                  >

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
                      ${escapeHtml(
                        task.priority ||
                        ''
                      )}
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


  /* =========================
     MOYENNE
     ========================= */

  const average =
    computeGeneralAverage();

  const avgEl =
    document.getElementById(
      'avgGeneral'
    );

  if (avgEl) {

    avgEl.textContent =
      isNaN(average)
        ? 'Aucune note'
        : `${average.toFixed(2)}/20`;
  }
}

function renderDashboardMini() {
  // Réservé pour de futures statistiques.
}


/* =========================================================
   TÂCHES
   ========================================================= */

function renderTasks() {

  const element =
    document.getElementById(
      'tasksList'
    );

  if (!element) return;

  element.innerHTML = '';


  if (store.tasks.length === 0) {

    element.innerHTML = `
      <div class="text-muted">
        Aucun devoir ni évaluation.
        Créez-en un !
      </div>
    `;

    return;
  }


  const tasks =
    [...store.tasks]
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  tasks.forEach(task => {

    const item =
      document.createElement('div');

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
            style="font-weight:600"
          >
            •
            ${escapeHtml(
              task.type ||
              'Tâche'
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


      <div
        style="
          display:flex;
          flex-direction:column;
          gap:6px;
          align-items:flex-end;
        "
      >

        <div
          style="
            display:flex;
            gap:6px;
          "
        >

          <button
            class="btn small"
            data-action="edit"
            data-id="${task.id}"
          >
            Modifier
          </button>

          <button
            class="btn small btn-ghost"
            data-action="delete"
            data-id="${task.id}"
          >
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
            }
          >

          Terminé

        </label>

      </div>
    `;

    element.appendChild(
      item
    );
  });


  /* BOUTONS */

  element
    .querySelectorAll(
      'button[data-action]'
    )
    .forEach(button => {

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


  /* CHECKBOX */

  element
    .querySelectorAll(
      'input[type="checkbox"][data-id]'
    )
    .forEach(checkbox => {

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

          if (!task) return;

          task.status =
            event.currentTarget.checked
              ? 'done'
              : 'scheduled';

          syncTaskToEvent(
            task
          );

          saveStore();
        }
      );
    });
}


/* =========================================================
   MODALE
   ========================================================= */

function openModal(contentHtml) {

  const modal =
    document.getElementById(
      'modal'
    );

  if (!modal) {
    console.error(
      'Élément #modal introuvable.'
    );
    return;
  }

  modal.innerHTML =
    `<div class="card">${contentHtml}</div>`;

  modal.classList.remove(
    'hidden'
  );


  modal.onclick =
    event => {

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

  if (!modal) return;

  modal.classList.add(
    'hidden'
  );

  modal.innerHTML = '';
}


/* =========================================================
   MODALE TÂCHE
   ========================================================= */

function openTaskModal(taskId = null) {

  const existing =
    taskId
      ? store.tasks.find(
          task =>
            task.id ===
            taskId
        )
      : null;


  const task =
    existing || {

      id:
        uid('task'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      title:
        '',

      type:
        'Devoir',

      date:
        formatDate(
          addDays(
            new Date(),
            1
          )
        ),

      startTime:
        '',

      priority:
        'Moyenne',

      timeEstimate:
        '30',

      status:
        'scheduled',

      notes:
        ''
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
            }
          >
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

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Matière

        <select
          id="taskSubject"
          class="select"
        >
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
          )}"
        >

      </label>


      <label>
        Type

        <select
          id="taskType"
          class="select"
        >

          ${[
            'Devoir',
            'DM',
            'Évaluation',
            'Contrôle',
            'Examen',
            'Projet'
          ]
            .map(
              type =>
                `
                <option
                  ${
                    task.type ===
                    type
                      ? 'selected'
                      : ''
                  }
                >
                  ${type}
                </option>
              `
            )
            .join('')}

        </select>

      </label>


      <label>
        Date limite

        <input
          id="taskDate"
          type="date"
          class="input"
          value="${task.date}"
        >

      </label>


      <label>
        Heure (optionnel)

        <input
          id="taskStartTime"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            task.startTime || ''
          )}"
        >

      </label>


      <label>
        Priorité

        <select
          id="taskPriority"
          class="select"
        >

          ${[
            'Haute',
            'Moyenne',
            'Basse'
          ]
            .map(
              priority =>
                `
                <option
                  ${
                    task.priority ===
                    priority
                      ? 'selected'
                      : ''
                  }
                >
                  ${priority}
                </option>
              `
            )
            .join('')}

        </select>

      </label>


      <label>
        Temps estimé (min)

        <input
          id="taskEstimate"
          class="input"
          value="${escapeHtml(
            task.timeEstimate ||
            '30'
          )}"
        >

      </label>


      <label>
        Notes (optionnel)

        <textarea
          id="taskNotes"
          rows="3"
          class="input"
        >${escapeHtml(
          task.notes || ''
        )}</textarea>

      </label>


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="cancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="save"
          class="btn rose small"
        >
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
    .getElementById('cancel')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('save')
    ?.addEventListener(
      'click',
      () => {

        const title =
          document
            .getElementById(
              'taskTitle'
            )
            .value
            .trim();


        if (!title) {

          alert(
            'Veuillez entrer un titre.'
          );

          return;
        }


        const updatedTask = {

          id:
            task.id,

          subjectId:
            document
              .getElementById(
                'taskSubject'
              )
              .value,

          title:

            title,

          type:
            document
              .getElementById(
                'taskType'
              )
              .value,

          date:
            document
              .getElementById(
                'taskDate'
              )
              .value,

          startTime:
            document
              .getElementById(
                'taskStartTime'
              )
              .value,

          priority:
            document
              .getElementById(
                'taskPriority'
              )
              .value,

          timeEstimate:
            document
              .getElementById(
                'taskEstimate'
              )
              .value,

          status:
            task.status ||
            'scheduled',

          notes:
            document
              .getElementById(
                'taskNotes'
              )
              .value
        };


        const existingTask =
          store.tasks.find(
            t =>
              t.id ===
              updatedTask.id
          );


        if (existingTask) {

          Object.assign(
            existingTask,
            updatedTask
          );

        } else {

          store.tasks.push(
            updatedTask
          );
        }


        syncTaskToEvent(
          updatedTask
        );

        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   SYNCHRONISATION TÂCHE / CALENDRIER
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

      id:
        uid('event'),

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

      endTime:
        '',

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
   SUPPRIMER TÂCHE
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
   ÉVÉNEMENT
   ========================================================= */

function openEventModal(event = null) {

  const e =
    event || {

      id:
        uid('event'),

      title:
        '',

      subjectId:
        store.subjects[0]?.id ||
        null,

      type:
        'Activité extrascolaire',

      date:
        formatDate(
          new Date()
        ),

      startTime:
        '',

      endTime:
        '',

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
              e.subjectId
                ? 'selected'
                : ''
            }
          >
            ${escapeHtml(
              subject.name
            )}
          </option>
        `
      )
      .join('');


  const html = `

    <h3>
      ${event
        ? 'Modifier événement'
        : 'Nouvel événement'}
    </h3>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Matière

        <select
          id="evSubject"
          class="select"
        >
          ${subjectOptions}
        </select>
      </label>


      <label>
        Titre

        <input
          id="evTitle"
          class="input"
          value="${escapeHtml(
            e.title
          )}"
        >
      </label>


      <label>
        Type

        <select
          id="evType"
          class="select"
        >

          ${[
            'Activité extrascolaire',
            'Révision',
            'Devoir',
            'Évaluation'
          ]
            .map(
              type =>
                `
                <option
                  ${
                    e.type ===
                    type
                      ? 'selected'
                      : ''
                  }
                >
                  ${type}
                </option>
              `
            )
            .join('')}

        </select>

      </label>


      <label>
        Date

        <input
          id="evDate"
          type="date"
          class="input"
          value="${e.date}"
        >
      </label>


      <label>
        Heure de début

        <input
          id="evStart"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            e.startTime ||
            ''
          )}"
        >
      </label>


      <label>
        Heure de fin

        <input
          id="evEnd"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            e.endTime ||
            ''
          )}"
        >
      </label>


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="cancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="save"
          class="btn rose small"
        >
          Sauvegarder
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancel')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('save')
    ?.addEventListener(
      'click',
      () => {

        const newEvent = {

          id:
            e.id,

          title:
            document
              .getElementById(
                'evTitle'
              )
              .value
              .trim(),

          subjectId:
            document
              .getElementById(
                'evSubject'
              )
              .value,

          type:
            document
              .getElementById(
                'evType'
              )
              .value,

          date:
            document
              .getElementById(
                'evDate'
              )
              .value,

          startTime:
            document
              .getElementById(
                'evStart'
              )
              .value,

          endTime:
            document
              .getElementById(
                'evEnd'
              )
              .value,

          priority:
            e.priority ||
            'Moyenne',

          status:
            e.status ||
            'scheduled',

          linkedId:
            e.linkedId ||
            null
        };


        const index =
          store.events.findIndex(
            x =>
              x.id ===
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
   VISUALISATION ÉVÉNEMENT
   ========================================================= */

function openEventViewer(event) {

  const linkedTask =
    event.linkedId
      ? store.tasks.find(
          task =>
            task.id ===
            event.linkedId
        )
      : null;


  const subject =
    store.subjects.find(
      s =>
        s.id ===
        event.subjectId
    );


  const html = `

    <h3>
      Événement
    </h3>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <div>
        <strong>
          ${escapeHtml(
            event.title ||
            'Événement'
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
          event.date
        )}

        ${
          event.startTime
            ? ' • ' +
              escapeHtml(
                event.startTime
              )
            : ''
        }

      </div>


      <div class="text-muted">
        Type :
        ${escapeHtml(
          event.type ||
          'Événement'
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


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="edit"
          class="btn small"
        >
          Modifier
        </button>

        <button
          id="toggleDone"
          class="btn small btn-ghost"
        >
          ${
            event.status === 'done'
              ? 'Marquer non terminé'
              : 'Marquer terminé'
          }
        </button>

        <button
          id="delete"
          class="btn small btn-ghost"
        >
          Supprimer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('edit')
    ?.addEventListener(
      'click',
      () => {

        closeModal();

        openEventModal(
          event
        );
      }
    );


  document
    .getElementById('toggleDone')
    ?.addEventListener(
      'click',
      () => {

        event.status =
          event.status === 'done'
            ? 'scheduled'
            : 'done';


        if (event.linkedId) {

          const task =
            store.tasks.find(
              t =>
                t.id ===
                event.linkedId
            );

          if (task) {

            task.status =
              event.status;
          }
        }


        saveStore();

        closeModal();
      }
    );


  document
    .getElementById('delete')
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
            e =>
              e.id !==
              event.id
          );


        if (event.linkedId) {

          const task =
            store.tasks.find(
              t =>
                t.id ===
                event.linkedId
            );

          if (task) {
            task.linkedId =
              null;
          }
        }


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   LEÇONS
   ========================================================= */

function renderLessons() {

  const element =
    document.getElementById(
      'lessonsList'
    );

  if (!element) return;

  element.innerHTML = '';


  if (store.lessons.length === 0) {

    element.innerHTML = `
      <div class="text-muted">
        Aucune leçon enregistrée.
      </div>
    `;

    return;
  }


  const lessons =
    [...store.lessons]
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  lessons.forEach(lesson => {

    const subject =
      store.subjects.find(
        s =>
          s.id ===
          lesson.subjectId
      );


    const revisions =
      store.revisions.filter(
        revision =>
          revision.lessonId ===
          lesson.id
      );


    const item =
      document.createElement('div');

    item.className =
      'list-item';


    item.innerHTML = `

      <div>

        <div
          style="
            font-weight:700;
          "
        >
          ${escapeHtml(
            lesson.titre ||
            'Leçon'
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

          ${escapeHtml(
            lesson.chapitre ||
            'Sans chapitre'
          )}

          •

          ${formatDateReadable(
            lesson.date
          )}

        </div>

        ${
          lesson.use2257
            ? `
              <div
                class="meta"
                style="
                  margin-top:4px;
                "
              >
                🌸 Méthode 2,3,5,7 activée
                (${revisions.length}/4 révisions)
              </div>
            `
            : ''
        }

      </div>


      <div
        style="
          display:flex;
          gap:6px;
        "
      >

        <button
          class="btn small"
          data-action="view"
          data-id="${lesson.id}"
        >
          Voir
        </button>

        <button
          class="btn small"
          data-action="edit"
          data-id="${lesson.id}"
        >
          Modifier
        </button>

        <button
          class="btn small btn-ghost"
          data-action="delete"
          data-id="${lesson.id}"
        >
          Supprimer
        </button>

      </div>
    `;


    element.appendChild(
      item
    );
  });


  element
    .querySelectorAll(
      'button[data-action]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          const id =
            event.currentTarget.dataset.id;

          const action =
            event.currentTarget.dataset.action;


          if (
            action === 'view'
          ) {
            openLessonViewer(id);
          }


          if (
            action === 'edit'
          ) {
            openLessonModal(id);
          }


          if (
            action === 'delete'
          ) {

            if (
              confirm(
                'Supprimer cette leçon et ses révisions ?'
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
   CRÉER / MODIFIER LEÇON
   ========================================================= */

function openLessonModal(
  lessonId = null
) {

  const existing =
    lessonId
      ? store.lessons.find(
          lesson =>
            lesson.id ===
            lessonId
        )
      : null;


  const lesson =
    existing || {

      id:
        uid('lesson'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      chapitre:
        '',

      titre:
        '',

      date:
        formatDate(
          addDays(
            new Date(),
            1
          )
        ),

      use2257:
        false
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
            }
          >
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

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Matière

        <select
          id="lesSubject"
          class="select"
        >
          ${subjectOptions}
        </select>
      </label>


      <label>
        Chapitre

        <input
          id="lesChap"
          class="input"
          value="${escapeHtml(
            lesson.chapitre
          )}"
        >
      </label>


      <label>
        Titre de la leçon

        <input
          id="lesTitle"
          class="input"
          value="${escapeHtml(
            lesson.titre
          )}"
        >
      </label>


      <label>
        Date de la leçon

        <input
          id="lesDate"
          type="date"
          class="input"
          value="${lesson.date}"
        >
      </label>


      <label>

        <input
          id="use2257"
          type="checkbox"
          ${
            lesson.use2257
              ? 'checked'
              : ''
          }
        >

        Activer la méthode
        <strong>2,3,5,7</strong>

        <div
          class="text-muted"
          style="
            margin-left:24px;
            margin-top:4px;
          "
        >
          Révisions automatiques :
          J+2 • J+3 • J+5 • J+7
        </div>

      </label>


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="cancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="save"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancel')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('save')
    ?.addEventListener(
      'click',
      () => {

        const title =
          document
            .getElementById(
              'lesTitle'
            )
            .value
            .trim();


        if (!title) {

          alert(
            'Veuillez entrer un titre de leçon.'
          );

          return;
        }


        const updatedLesson = {

          id:
            lesson.id,

          subjectId:
            document
              .getElementById(
                'lesSubject'
              )
              .value,

          chapitre:
            document
              .getElementById(
                'lesChap'
              )
              .value
              .trim(),

          titre:
            title,

          date:
            document
              .getElementById(
                'lesDate'
              )
              .value,

          use2257:
            document
              .getElementById(
                'use2257'
              )
              .checked
        };


        const existingLesson =
          store.lessons.find(
            l =>
              l.id ===
              updatedLesson.id
          );


        if (existingLesson) {

          Object.assign(
            existingLesson,
            updatedLesson
          );

        } else {

          store.lessons.push(
            updatedLesson
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
          updatedLesson.use2257
        ) {

          const revisionDays =
            [2, 3, 5, 7];

          revisionDays.forEach(
            offset => {

              const revisionDate =
                formatDate(
                  addDays(
                    new Date(
                      updatedLesson.date
                    ),
                    offset
                  )
                );


              const existingRevision =
                store.revisions.find(
                  revision =>
                    revision.lessonId ===
                      updatedLesson.id &&
                    revision.offset ===
                      offset
                );


              if (
                existingRevision
              ) {

                existingRevision.date =
                  revisionDate;

                existingRevision.subjectId =
                  updatedLesson.subjectId;

                existingRevision.title =
                  `Révision 2,3,5,7 — ${updatedLesson.titre}`;

              } else {

                store.revisions.push({

                  id:
                    uid('revision'),

                  lessonId:
                    updatedLesson.id,

                  subjectId:
                    updatedLesson.subjectId,

                  title:
                    `Révision 2,3,5,7 — ${updatedLesson.titre}`,

                  date:
                    revisionDate,

                  offset:
                    offset,

                  status:
                    'scheduled'
                });
              }
            }
          );

        } else {

          /*
            Si la méthode est désactivée,
            supprimer les anciennes révisions
            automatiques de cette leçon.
          */

          store.revisions =
            store.revisions.filter(
              revision =>
                revision.lessonId !==
                updatedLesson.id
            );
        }


        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   VISUALISATION LEÇON
   ========================================================= */

function openLessonViewer(id) {

  const lesson =
    store.lessons.find(
      l =>
        l.id === id
    );

  if (!lesson) return;


  const subject =
    store.subjects.find(
      s =>
        s.id ===
        lesson.subjectId
    );


  const revisions =
    store.revisions
      .filter(
        revision =>
          revision.lessonId ===
          lesson.id
      )
      .sort(
        (a, b) =>
          a.offset -
          b.offset
      );


  const revisionHtml =
    revisions.length

      ? revisions
          .map(
            revision =>
              `
              <div
                style="
                  padding:8px;
                  border-radius:8px;
                  background:var(--muted);
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:8px;
                "
              >

                <div>

                  <strong>
                    J+${revision.offset}
                  </strong>

                  <div class="meta">
                    ${formatDateReadable(
                      revision.date
                    )}
                  </div>

                  <div class="text-muted">
                    ${
                      revision.status ===
                      'done'
                        ? '✓ Révision terminée'
                        : 'À réviser'
                    }
                  </div>

                </div>


                <div
                  style="
                    display:flex;
                    gap:6px;
                  "
                >

                  <button
                    class="btn small"
                    data-action="mark"
                    data-id="${revision.id}"
                  >
                    ${
                      revision.status ===
                      'done'
                        ? 'Annuler'
                        : 'Terminé'
                    }
                  </button>

                  <button
                    class="btn small btn-ghost"
                    data-action="edit"
                    data-id="${revision.id}"
                  >
                    Modifier
                  </button>

                  <button
                    class="btn small btn-ghost"
                    data-action="delete"
                    data-id="${revision.id}"
                  >
                    Suppr.
                  </button>

                </div>

              </div>
            `
          )
          .join('')

      : `
        <div class="text-muted">
          Aucune révision planifiée.
        </div>
      `;


  const html = `

    <h3>
      ${escapeHtml(
        lesson.titre
      )}
    </h3>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <div>
        <strong>Matière :</strong>
        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : ''
        }
      </div>


      <div>
        <strong>Chapitre :</strong>
        ${escapeHtml(
          lesson.chapitre ||
          '—'
        )}
      </div>


      <div>
        <strong>Date :</strong>
        ${formatDateReadable(
          lesson.date
        )}
      </div>


      <h4>
        Méthode 2,3,5,7
      </h4>

      ${
        lesson.use2257
          ? revisionHtml
          : `
            <div class="text-muted">
              La méthode 2,3,5,7 n'est pas activée.
            </div>
          `
      }


      <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-top:8px;
        "
      >

        <button
          id="close"
          class="btn small btn-ghost"
        >
          Fermer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('close')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .querySelectorAll(
      '#modal [data-action]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          const revisionId =
            event.currentTarget.dataset.id;

          const action =
            event.currentTarget.dataset.action;


          const revision =
            store.revisions.find(
              r =>
                r.id ===
                revisionId
            );

          if (!revision) return;


          if (
            action === 'mark'
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
          }


          if (
            action === 'edit'
          ) {

            closeModal();

            openRevisionEditModal(
              revision
            );
          }


          if (
            action === 'delete'
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
   MODIFIER RÉVISION
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
            }
          >
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

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Matière

        <select
          id="revSubject"
          class="select"
        >
          ${subjectOptions}
        </select>
      </label>


      <label>
        Titre

        <input
          id="revTitle"
          class="input"
          value="${escapeHtml(
            revision.title
          )}"
        >
      </label>


      <label>
        Date

        <input
          id="revDate"
          type="date"
          class="input"
          value="${revision.date}"
        >
      </label>


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="cancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="save"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancel')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('save')
    ?.addEventListener(
      'click',
      () => {

        revision.subjectId =
          document
            .getElementById(
              'revSubject'
            )
            .value;

        revision.title =
          document
            .getElementById(
              'revTitle'
            )
            .value;

        revision.date =
          document
            .getElementById(
              'revDate'
            )
            .value;

        saveStore();

        closeModal();
      }
    );
}


/* =========================================================
   SUPPRIMER LEÇON
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
        revision.lessonId !== id
    );

  saveStore();
}


/* =========================================================
   ÉVALUATIONS
   ========================================================= */

function renderEvals() {

  const element =
    document.getElementById(
      'evalsList'
    );

  if (!element) return;

  element.innerHTML = '';


  if (store.evals.length === 0) {

    element.innerHTML = `
      <div class="text-muted">
        Aucune évaluation enregistrée.
      </div>
    `;

    return;
  }


  const evaluations =
    [...store.evals]
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  evaluations.forEach(evaluation => {

    const subject =
      store.subjects.find(
        s =>
          s.id ===
          evaluation.subjectId
      );


    const item =
      document.createElement('div');

    item.className =
      'list-item';


    item.innerHTML = `

      <div>

        <div
          style="
            font-weight:700;
          "
        >
          ${escapeHtml(
            evaluation.nom
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
            evaluation.coefficient ||
            1
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


      <div
        style="
          display:flex;
          gap:6px;
        "
      >

        <button
          class="btn small"
          data-action="edit"
          data-id="${evaluation.id}"
        >
          Modifier
        </button>

        <button
          class="btn small btn-ghost"
          data-action="delete"
          data-id="${evaluation.id}"
        >
          Supprimer
        </button>

      </div>
    `;


    element.appendChild(
      item
    );
  });


  element
    .querySelectorAll(
      'button[data-action]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        event => {

          const id =
            event.currentTarget.dataset.id;

          const action =
            event.currentTarget.dataset.action;


          if (
            action === 'edit'
          ) {

            openEvalModal(id);
          }


          if (
            action === 'delete'
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
    existing || {

      id:
        uid('eval'),

      subjectId:
        store.subjects[0]?.id ||
        null,

      nom:
        '',

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
            }
          >
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
          ? 'Modifier évaluation'
          : 'Nouvelle évaluation'
      }
    </h3>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Matière

        <select
          id="evalSubject"
          class="select"
        >
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
          )}"
        >
      </label>


      <label>
        Date

        <input
          id="evalDate"
          type="date"
          class="input"
          value="${evaluation.date}"
        >
      </label>


      <label>
        Note pronostiquée

        <input
          id="evalPron"
          type="number"
          min="0"
          max="20"
          step="0.25"
          class="input"
          value="${
            evaluation.pronostique ??
            ''
          }"
        >
      </label>


      <label>
        Vraie note

        <input
          id="evalReal"
          type="number"
          min="0"
          max="20"
          step="0.25"
          class="input"
          value="${
            evaluation.vraie ??
            ''
          }"
        >
      </label>


      <label>
        Coefficient

        <input
          id="evalCoef"
          type="number"
          min="0.1"
          step="0.1"
          class="input"
          value="${
            evaluation.coefficient ||
            1
          }"
        >
      </label>


      <div
        style="
          display:flex;
          gap:8px;
          justify-content:flex-end;
        "
      >

        <button
          id="cancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="save"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;


  openModal(html);


  document
    .getElementById('cancel')
    ?.addEventListener(
      'click',
      closeModal
    );


  document
    .getElementById('save')
    ?.addEventListener(
      'click',
      () => {

        const name =
          document
            .getElementById(
              'evalName'
            )
            .value
            .trim();


        if (!name) {

          alert(
            'Veuillez entrer le nom de l’évaluation.'
          );

          return;
        }


        evaluation.subjectId =
          document
            .getElementById(
              'evalSubject'
            )
            .value;

        evaluation.nom =
          name;

        evaluation.date =
          document
            .getElementById(
              'evalDate'
            )
            .value;


        const pron =
          document
            .getElementById(
              'evalPron'
            )
            .value;

        evaluation.pronostique =
          pron === ''
            ? null
            : Number(pron);


        const real =
          document
            .getElementById(
              'evalReal'
            )
            .value;

        evaluation.vraie =
          real === ''
            ? null
            : Number(real);


        const coef =
          document
            .getElementById(
              'evalCoef'
            )
            .value;

        evaluation.coefficient =
          coef === ''
            ? 1
            : Number(coef);


        const existingEvaluation =
          store.evals.find(
            e =>
              e.id ===
              evaluation.id
          );


        if (
          existingEvaluation
        ) {

          Object.assign(
            existingEvaluation,
            evaluation
          );

        } else {

          store.evals.push(
            evaluation
          );
        }


        /*
          Événement calendrier
          lié à l'évaluation
        */

        store.events =
          store.events.filter(
            event =>
              event.linkedId !==
              evaluation.id
          );


        store.events.push({

          id:
            uid('event'),

          title:
            `Évaluation — ${evaluation.nom}`,

          subjectId:
            evaluation.subjectId,

          type:
            'Évaluation',

          date:
            evaluation.date,

          startTime:
            '',

          endTime:
            '',

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
   CALCUL DES MOYENNES
   ========================================================= */

function computeSubjectAverage(
  subjectId
) {

  const list =
    store.evals.filter(
      evaluation =>
        evaluation.subjectId ==
          subjectId &&
        evaluation.vraie != null &&
        !isNaN(
          Number(
            evaluation.vraie
          )
        )
    );


  if (
    list.length === 0
  ) {
    return NaN;
  }


  let totalPoints = 0;

  let totalCoefficient = 0;


  list.forEach(
    evaluation => {

      const note =
        Number(
          evaluation.vraie
        );

      const coefficient =
        Number(
          evaluation.coefficient ??
          evaluation.coef
        ) || 1;


      totalPoints +=
        note *
        coefficient;

      totalCoefficient +=
        coefficient;
    }
  );


  if (
    totalCoefficient === 0
  ) {
    return NaN;
  }


  return (
    totalPoints /
    totalCoefficient
  );
}


function computeGeneralAverage() {

  const list =
    store.evals.filter(
      evaluation =>
        evaluation.vraie != null &&
        !isNaN(
          Number(
            evaluation.vraie
          )
        )
    );


  if (
    list.length === 0
  ) {
    return NaN;
  }


  let totalPoints = 0;

  let totalCoefficient = 0;


  list.forEach(
    evaluation => {

      const note =
        Number(
          evaluation.vraie
        );

      const coefficient =
        Number(
          evaluation.coefficient ??
          evaluation.coef
        ) || 1;


      totalPoints +=
        note *
        coefficient;

      totalCoefficient +=
        coefficient;
    }
  );


  if (
    totalCoefficient === 0
  ) {
    return NaN;
  }


  return (
    totalPoints /
    totalCoefficient
  );
}


/* =========================================================
   GRAPHIQUE DES NOTES
   =========================================================

   IMPORTANT :
   On n'utilise PAS l'échelle "time".
   Cela évite l'erreur :

   "This method is not implemented:
   Check that a complete date adapter is provided."

   ========================================================= */

let gradesChart = null;

function renderGradesChart() {

  const canvas =
    document.getElementById(
      'gradesChart'
    );

  if (!canvas) {
    return;
  }


  /*
    Si Chart.js n'est pas chargé,
    on ne fait rien.
  */

  if (
    typeof Chart ===
    'undefined'
  ) {

    console.warn(
      'Chart.js n’est pas chargé.'
    );

    return;
  }


  const ctx =
    canvas.getContext(
      '2d'
    );


  /*
    Détruire le graphique
    précédent
  */

  if (gradesChart) {

    gradesChart.destroy();

    gradesChart = null;
  }


  /*
    Récupérer les évaluations
    possédant une vraie note
  */

  const evaluations =
    store.evals
      .filter(
        evaluation =>
          evaluation.vraie != null &&
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


  const labels =
    evaluations.map(
      evaluation =>
        formatDateReadable(
          evaluation.date
        )
    );


  const values =
    evaluations.map(
      evaluation =>
        Number(
          evaluation.vraie
        )
    );


  /*
    Création du graphique
  */

  gradesChart =
    new Chart(
      ctx,
      {

        type:
          'line',

        data: {

          labels:
            labels,

          datasets: [

            {

              label:
                'Mes notes',

              data:
                values,

              borderColor:
                '#ff7fbf',

              backgroundColor:
                '#ffd0e0',

              borderWidth:
                3,

              pointRadius:
                5,

              pointHoverRadius:
                7,

              fill:
                false,

              tension:
                0.25
            }

          ]
        },


        options: {

          responsive:
            true,


          maintainAspectRatio:
            false,


          plugins: {

            legend: {

              position:
                'top'
            }

          },


          scales: {

            x: {

              title: {

                display:
                  true,

                text:
                  'Évaluation'
              }

            },


            y: {

              min:
                0,

              max:
                20,

              ticks: {

                stepSize:
                  2
              },

              title: {

                display:
                  true,

                text:
                  'Note / 20'
              }

            }

          }

        }

      }
    );


  /*
    Résumé des moyennes
  */

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

    <div
      style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      "
    >

      <div>

        <strong>
          Moyenne générale
        </strong>

        <div class="text-muted">

          ${
            isNaN(general)
              ? '—'
              : general.toFixed(2) +
                '/20'
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
   OUTILS
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
    : 'Matière inconnue';
}


/* =========================================================
   FIN DU FICHIER
   ========================================================= */
