/* =========================================================
   STUDY PLANNER
   Interface française
   ========================================================= */

const STORAGE_KEY = 'studyPlannerData_v1';

/* =========================================================
   UTILITAIRES
   ========================================================= */

const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function formatDateReadable(date) {
  if (!date) return '';

  const d = new Date(date + 'T00:00:00');

  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function addDays(date, number) {
  const d = new Date(date);
  d.setDate(d.getDate() + number);
  return d;
}

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
   MATIÈRES PAR DÉFAUT
   ========================================================= */

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

/* =========================================================
   DONNÉES
   ========================================================= */

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

function normalizeStore() {
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
}

function loadStore() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return;
  }

  try {
    store = JSON.parse(raw);
    normalizeStore();
  } catch (error) {
    console.error('Erreur de chargement des données :', error);

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
  }
}

function saveStore() {
  normalizeStore();

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

  navButtons.forEach(button => {

    button.addEventListener('click', () => {

      const tabId = button.dataset.tab;

      const target =
        document.getElementById(tabId);

      if (!target) {
        console.error(
          'Onglet introuvable :',
          tabId
        );
        return;
      }

      navButtons.forEach(btn =>
        btn.classList.remove('active')
      );

      button.classList.add('active');

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

  /* EXPORT */

  const exportBtn =
    document.getElementById('exportBtn');

  if (exportBtn) {

    exportBtn.addEventListener('click', () => {

      const data =
        JSON.stringify(store, null, 2);

      const blob =
        new Blob([data], {
          type: 'application/json'
        });

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;
      link.download =
        'study-planner-export.json';

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);
    });
  }

  /* IMPORT */

  const importInput =
    document.getElementById('importFile');

  if (importInput) {

    importInput.addEventListener(
      'change',
      event => {

        const file =
          event.target.files[0];

        if (!file) return;

        const reader =
          new FileReader();

        reader.onload = e => {

          try {

            const imported =
              JSON.parse(e.target.result);

            store = imported;

            normalizeStore();

            saveStore();

            alert(
              'Importation réussie !'
            );

          } catch (error) {

            console.error(error);

            alert(
              'Le fichier JSON est invalide.'
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

  /* MATIÈRES */

  const manageSubjectsBtn =
    document.getElementById(
      'manageSubjectsBtn'
    );

  if (manageSubjectsBtn) {

    manageSubjectsBtn.addEventListener(
      'click',
      () => openSubjectsModal()
    );
  }

  /* CALENDRIER */

  const previous =
    document.getElementById('prevWeek');

  if (previous) {
    previous.addEventListener(
      'click',
      () => changeWeek(-7)
    );
  }

  const next =
    document.getElementById('nextWeek');

  if (next) {
    next.addEventListener(
      'click',
      () => changeWeek(7)
    );
  }

  const filter =
    document.getElementById(
      'subjectFilter'
    );

  if (filter) {
    filter.addEventListener(
      'change',
      () => renderCalendar()
    );
  }
}

/* =========================================================
   RENDU GLOBAL
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
   FILTRE MATIÈRES
   ========================================================= */

function populateSubjectFilter() {

  const select =
    document.getElementById(
      'subjectFilter'
    );

  if (!select) return;

  const currentValue =
    select.value || 'all';

  select.innerHTML = '';

  const allOption =
    document.createElement('option');

  allOption.value = 'all';
  allOption.textContent =
    'Toutes les matières';

  select.appendChild(allOption);

  store.subjects.forEach(subject => {

    const option =
      document.createElement('option');

    option.value = subject.id;
    option.textContent =
      subject.name;

    select.appendChild(option);
  });

  if (
    [...select.options]
      .some(o => o.value === currentValue)
  ) {
    select.value = currentValue;
  }
}

/* =========================================================
   GESTION DES MATIÈRES
   ========================================================= */

function openSubjectsModal() {

  const subjectsHtml =
    store.subjects.length
      ? store.subjects.map(subject => `
        <div
          class="list-item"
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
          "
        >

          <div
            style="
              display:flex;
              align-items:center;
              gap:10px;
            "
          >

            <div
              style="
                width:18px;
                height:18px;
                border-radius:50%;
                background:${escapeHtml(subject.color)};
                border:1px solid rgba(0,0,0,.1);
              "
            ></div>

            <strong>
              ${escapeHtml(subject.name)}
            </strong>

          </div>

          <div
            style="
              display:flex;
              gap:6px;
            "
          >

            <button
              class="btn small"
              data-subject-edit="${subject.id}"
            >
              Modifier
            </button>

            <button
              class="btn small btn-ghost"
              data-subject-delete="${subject.id}"
            >
              Supprimer
            </button>

          </div>

        </div>
      `).join('')
      : `
        <div class="text-muted">
          Aucune matière.
        </div>
      `;

  const html = `

    <h3>📚 Mes matières</h3>

    <p class="text-muted">
      Ajoute, modifie ou supprime tes matières.
      Chaque matière possède sa propre couleur.
    </p>

    <div
      id="subjectsManagerList"
      style="
        display:grid;
        gap:8px;
        margin:15px 0;
      "
    >
      ${subjectsHtml}
    </div>

    <hr style="border:none;border-top:1px solid #eee">

    <h4>➕ Ajouter une matière</h4>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <label>
        Nom de la matière
        <input
          id="newSubjectName"
          class="input"
          placeholder="Ex : Physique-Chimie"
        >
      </label>

      <label>
        Couleur
        <input
          id="newSubjectColor"
          type="color"
          value="#ffd0e0"
          style="
            width:70px;
            height:40px;
            border:none;
            background:none;
          "
        >
      </label>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="closeSubjects"
          class="btn small btn-ghost"
        >
          Fermer
        </button>

        <button
          id="createSubject"
          class="btn rose small"
        >
          Ajouter
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById('closeSubjects')
    .addEventListener(
      'click',
      closeModal
    );

  document
    .getElementById('createSubject')
    .addEventListener(
      'click',
      () => {

        const name =
          document
            .getElementById(
              'newSubjectName'
            )
            .value
            .trim();

        const color =
          document
            .getElementById(
              'newSubjectColor'
            )
            .value;

        if (!name) {

          alert(
            'Entre le nom de la matière.'
          );

          return;
        }

        const alreadyExists =
          store.subjects.some(
            subject =>
              subject.name
                .toLowerCase() ===
              name.toLowerCase()
          );

        if (alreadyExists) {

          alert(
            'Cette matière existe déjà.'
          );

          return;
        }

        store.subjects.push({
          id: uid('matiere'),
          name,
          color
        });

        saveStore();

        closeModal();

        openSubjectsModal();
      }
    );

  /* MODIFIER */

  document
    .querySelectorAll(
      '[data-subject-edit]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.subjectEdit;

          closeModal();

          openEditSubjectModal(id);
        }
      );
    });

  /* SUPPRIMER */

  document
    .querySelectorAll(
      '[data-subject-delete]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            button.dataset.subjectDelete;

          deleteSubject(id);
        }
      );
    });
}

function openEditSubjectModal(id) {

  const subject =
    store.subjects.find(
      s => s.id === id
    );

  if (!subject) return;

  const html = `

    <h3>✏️ Modifier la matière</h3>

    <div
      style="
        display:grid;
        gap:10px;
      "
    >

      <label>
        Nom
        <input
          id="editSubjectName"
          class="input"
          value="${escapeHtml(subject.name)}"
        >
      </label>

      <label>
        Couleur
        <input
          id="editSubjectColor"
          type="color"
          value="${escapeHtml(subject.color)}"
          style="
            width:70px;
            height:40px;
            border:none;
            background:none;
          "
        >
      </label>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="cancelSubjectEdit"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="saveSubjectEdit"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById(
      'cancelSubjectEdit'
    )
    .addEventListener(
      'click',
      () => {

        closeModal();
        openSubjectsModal();

      }
    );

  document
    .getElementById(
      'saveSubjectEdit'
    )
    .addEventListener(
      'click',
      () => {

        const name =
          document
            .getElementById(
              'editSubjectName'
            )
            .value
            .trim();

        const color =
          document
            .getElementById(
              'editSubjectColor'
            )
            .value;

        if (!name) {

          alert(
            'Le nom ne peut pas être vide.'
          );

          return;
        }

        subject.name = name;
        subject.color = color;

        saveStore();

        closeModal();

        openSubjectsModal();
      }
    );
}

function deleteSubject(id) {

  const subject =
    store.subjects.find(
      s => s.id === id
    );

  if (!subject) return;

  const used =
    store.tasks.some(
      t => t.subjectId === id
    ) ||
    store.lessons.some(
      l => l.subjectId === id
    ) ||
    store.evals.some(
      e => e.subjectId === id
    ) ||
    store.events.some(
      e => e.subjectId === id
    );

  let message =
    `Supprimer la matière "${subject.name}" ?`;

  if (used) {

    message +=
      '\n\nAttention : cette matière est utilisée par des éléments de ton planner. Ils conserveront leur référence mais la matière ne sera plus disponible dans la liste.';
  }

  if (!confirm(message)) return;

  store.subjects =
    store.subjects.filter(
      s => s.id !== id
    );

  saveStore();

  closeModal();

  openSubjectsModal();
}

/* =========================================================
   CALENDRIER
   ========================================================= */

let currentWeekStart =
  startOfWeek(new Date());

function startOfWeek(date) {

  const d = new Date(date);

  const day = d.getDay();

  const diff =
    day === 0
      ? -6
      : 1 - day;

  d.setDate(
    d.getDate() + diff
  );

  d.setHours(
    0, 0, 0, 0
  );

  return d;
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

  const label =
    document.getElementById(
      'weekLabel'
    );

  const container =
    document.getElementById(
      'weekCalendar'
    );

  if (!label || !container)
    return;

  label.textContent =
    weekLabel();

  container.innerHTML = '';

  const timesColumn =
    document.createElement('div');

  timesColumn.className =
    'time-col';

  const hours =
    [...Array(14)].map(
      (_, i) => 7 + i
    );

  timesColumn.innerHTML =
    hours
      .map(
        h =>
          `<div class="time">${h}h</div>`
      )
      .join('');

  container.appendChild(
    timesColumn
  );

  const filter =
    document.getElementById(
      'subjectFilter'
    )?.value || 'all';

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

    const dayColumn =
      document.createElement(
        'div'
      );

    dayColumn.className =
      'day-col';

    dayColumn.dataset.date =
      formatDate(day);

    const header =
      document.createElement(
        'div'
      );

    header.className =
      'day-header';

    const isToday =
      formatDate(day) ===
      formatDate(new Date());

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

    dayColumn.appendChild(
      header
    );

    const dateString =
      formatDate(day);

    const dayEvents =
      store.events.filter(
        event =>
          event.date ===
          dateString
      );

    const recurringClasses =
      store.classes
        .filter(
          item =>
            item.jour ===
            day.getDay()
        )
        .map(item => ({
          id: item.id,
          title:
            item.matiereName ||
            getSubjectName(
              item.subjectId
            ),
          subjectId:
            item.subjectId,
          type: 'Cours',
          date: dateString,
          startTime: item.start,
          endTime: item.end,
          status: 'scheduled',
          isClass: true
        }));

    const revisions =
      store.revisions
        .filter(
          revision =>
            revision.date ===
            dateString
        )
        .map(revision => ({
          ...revision,
          type: 'Révision'
        }));

    let allEvents = [
      ...recurringClasses,
      ...dayEvents,
      ...revisions
    ];

    if (filter !== 'all') {

      allEvents =
        allEvents.filter(
          event =>
            event.subjectId ===
            filter
        );
    }

    allEvents.forEach(event => {

      const slot =
        document.createElement(
          'div'
        );

      slot.className =
        'slot small';

      const subject =
        store.subjects.find(
          s =>
            s.id ===
            event.subjectId
        );

      slot.style.background =
        subject?.color ||
        '#ffe6f3';

      slot.innerHTML = `

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:5px;
            align-items:center;
          "
        >

          <strong>
            ${escapeHtml(
              event.title ||
              'Événement'
            )}
          </strong>

          <span
            class="badge"
            style="
              background:rgba(0,0,0,.08);
              color:#6b4956;
              padding:4px 8px;
              border-radius:999px;
              font-size:11px;
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
              ? event.startTime
              : ''
          }

          ${
            event.status === 'done'
              ? ' • Terminé'
              : ''
          }
        </div>
      `;

      slot.addEventListener(
        'click',
        () =>
          openEventViewer(
            event
          )
      );

      dayColumn.appendChild(
        slot
      );
    });

    container.appendChild(
      dayColumn
    );
  }
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

  const todayString =
    formatDate(today());

  const left =
    document.createElement(
      'div'
    );

  left.className = 'card';

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

  const right =
    document.createElement(
      'div'
    );

  right.className = 'card';

  const average =
    computeGeneralAverage();

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
          ${
            store.tasks.filter(
              task =>
                task.status !==
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
        class="text-muted"
      >
        ${
          Number.isNaN(average)
            ? 'Aucune note'
            : average.toFixed(2)
        }
      </div>

    </div>
  `;

  dashboard.appendChild(
    right
  );

  const todayClasses =
    store.classes.filter(
      item =>
        item.jour ===
        new Date().getDay()
    );

  const classesContainer =
    left.querySelector(
      '#todayClasses'
    );

  classesContainer.innerHTML =
    todayClasses.length
      ? todayClasses.map(
          item => {

            const subject =
              store.subjects.find(
                s =>
                  s.id ===
                  item.subjectId
              );

            return `
              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  padding:8px;
                  margin-top:6px;
                  border-radius:10px;
                  background:rgba(255,255,255,.7);
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
                            item.matiereName ||
                            'Cours'
                          )
                    }
                  </strong>

                  <div class="text-muted">
                    ${item.start || ''} -
                    ${item.end || ''}
                  </div>

                </div>

                <div
                  style="
                    width:12px;
                    height:12px;
                    border-radius:4px;
                    background:${
                      subject?.color ||
                      '#ffd0e0'
                    };
                  "
                ></div>

              </div>
            `;
          }
        ).join('')
      : `
        <div class="text-muted">
          Aucun cours aujourd'hui.
        </div>
      `;

  const upcoming =
    store.tasks
      .filter(
        task =>
          task.status !== 'done' &&
          task.date >= todayString
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(0, 5);

  const upcomingContainer =
    left.querySelector(
      '#upcomingDeadlines'
    );

  upcomingContainer.innerHTML = `
    <h4>
      Échéances à venir
    </h4>

    ${
      upcoming.length
        ? upcoming.map(
            task => `

              <div
                style="
                  padding:8px;
                  margin-top:6px;
                  border-radius:8px;
                  background:var(--muted);
                "
              >

                <strong>
                  ${escapeHtml(
                    task.title
                  )}
                </strong>

                <div class="text-muted">
                  ${escapeHtml(
                    getSubjectName(
                      task.subjectId
                    )
                  )}
                  •
                  ${formatDateReadable(
                    task.date
                  )}
                </div>

              </div>
            `
          ).join('')
        : `
          <div class="text-muted">
            Aucune échéance prochaine.
          </div>
        `
    }
  `;
}

/* =========================================================
   TÂCHES
   ========================================================= */

function renderTasks() {

  const container =
    document.getElementById(
      'tasksList'
    );

  if (!container) return;

  container.innerHTML = '';

  if (!store.tasks.length) {

    container.innerHTML = `
      <div class="text-muted">
        Aucun devoir ni évaluation.
      </div>
    `;

    return;
  }

  const sorted =
    [...store.tasks].sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    );

  sorted.forEach(task => {

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

        <div
          style="font-weight:700"
        >
          ${escapeHtml(
            task.title
          )}

          <span
            class="text-muted"
          >
            •
            ${escapeHtml(
              task.type
            )}
          </span>
        </div>

        <div class="meta">
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
            data-task-edit="${task.id}"
          >
            Modifier
          </button>

          <button
            class="btn small btn-ghost"
            data-task-delete="${task.id}"
          >
            Supprimer
          </button>

        </div>

        <label class="text-muted">

          <input
            type="checkbox"
            data-task-done="${task.id}"
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

    container.appendChild(
      item
    );
  });

  container
    .querySelectorAll(
      '[data-task-edit]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          openTaskModal(
            button.dataset.taskEdit
          )
      );
    });

  container
    .querySelectorAll(
      '[data-task-delete]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          if (
            confirm(
              'Supprimer cette tâche ?'
            )
          ) {

            deleteTask(
              button.dataset.taskDelete
            );
          }
        }
      );
    });

  container
    .querySelectorAll(
      '[data-task-done]'
    )
    .forEach(input => {

      input.addEventListener(
        'change',
        () => {

          const task =
            store.tasks.find(
              t =>
                t.id ===
                input.dataset.taskDone
            );

          if (!task) return;

          task.status =
            input.checked
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

function openModal(content) {

  const modal =
    document.getElementById(
      'modal'
    );

  if (!modal) return;

  modal.innerHTML = `
    <div class="card">
      ${content}
    </div>
  `;

  modal.classList.remove(
    'hidden'
  );

  modal.onclick = event => {

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
   TÂCHE : MODALE
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
      id: uid('task'),
      subjectId:
        store.subjects[0]?.id ||
        null,
      title: '',
      type: 'Devoir',
      date: formatDate(
        addDays(
          new Date(),
          1
        )
      ),
      startTime: '',
      priority: 'Moyenne',
      timeEstimate: 30,
      status: 'scheduled',
      notes: ''
    };

  const subjectOptions =
    store.subjects.map(
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
    ).join('');

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
          ].map(
            type =>
              `
              <option
                ${
                  task.type === type
                    ? 'selected'
                    : ''
                }
              >
                ${type}
              </option>
              `
          ).join('')}

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
        Heure

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
          ].map(
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
          ).join('')}

        </select>
      </label>

      <label>
        Temps estimé (minutes)

        <input
          id="taskEstimate"
          class="input"
          type="number"
          value="${task.timeEstimate || 30}"
        >
      </label>

      <label>
        Notes

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
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="taskCancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="taskSave"
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
    .getElementById(
      'taskCancel'
    )
    .onclick = closeModal;

  document
    .getElementById(
      'taskSave'
    )
    .onclick = () => {

      const updated = {

        id: task.id,

        subjectId:
          document.getElementById(
            'taskSubject'
          ).value,

        title:
          document.getElementById(
            'taskTitle'
          ).value.trim(),

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
          Number(
            document.getElementById(
              'taskEstimate'
            ).value
          ) || 30,

        status:
          task.status ||
          'scheduled',

        notes:
          document.getElementById(
            'taskNotes'
          ).value
      };

      if (!updated.title) {

        alert(
          'Donne un titre à la tâche.'
        );

        return;
      }

      const index =
        store.tasks.findIndex(
          item =>
            item.id ===
            updated.id
        );

      if (index >= 0) {

        store.tasks[index] =
          updated;

      } else {

        store.tasks.push(
          updated
        );
      }

      syncTaskToEvent(
        updated
      );

      saveStore();

      closeModal();
    };
}

/* =========================================================
   SYNCHRONISATION TÂCHE → CALENDRIER
   ========================================================= */

function syncTaskToEvent(task) {

  let event =
    store.events.find(
      item =>
        item.linkedId ===
        task.id
    );

  if (!event) {

    event = {

      id: uid('event'),

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
   SUPPRESSION TÂCHE
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
   ÉVÉNEMENTS
   ========================================================= */

function openEventModal(eventData = null) {

  const event =
    eventData || {

      id: uid('event'),

      title: '',

      subjectId:
        store.subjects[0]?.id ||
        null,

      type:
        'Activité',

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

      linkedId: null
    };

  const subjectOptions =
    store.subjects.map(
      subject =>
        `
        <option
          value="${subject.id}"
          ${
            subject.id ===
            event.subjectId
              ? 'selected'
              : ''
          }
        >
          ${escapeHtml(
            subject.name
          )}
        </option>
        `
    ).join('');

  const html = `

    <h3>
      ${
        eventData
          ? 'Modifier l’événement'
          : 'Nouvel événement'
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
          id="eventSubject"
          class="select"
        >
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
          )}"
        >
      </label>

      <label>
        Type

        <select
          id="eventType"
          class="select"
        >

          ${[
            'Activité',
            'Activité extrascolaire',
            'Révision',
            'Devoir',
            'Évaluation'
          ].map(
            type =>
              `
              <option
                ${
                  event.type ===
                  type
                    ? 'selected'
                    : ''
                }
              >
                ${type}
              </option>
              `
          ).join('')}

        </select>
      </label>

      <label>
        Date

        <input
          id="eventDate"
          type="date"
          class="input"
          value="${event.date}"
        >
      </label>

      <label>
        Heure de début

        <input
          id="eventStart"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            event.startTime || ''
          )}"
        >
      </label>

      <label>
        Heure de fin

        <input
          id="eventEnd"
          class="input"
          placeholder="hh:mm"
          value="${escapeHtml(
            event.endTime || ''
          )}"
        >
      </label>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="eventCancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="eventSave"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById(
      'eventCancel'
    )
    .onclick = closeModal;

  document
    .getElementById(
      'eventSave'
    )
    .onclick = () => {

      event.subjectId =
        document.getElementById(
          'eventSubject'
        ).value;

      event.title =
        document.getElementById(
          'eventTitle'
        ).value.trim();

      event.type =
        document.getElementById(
          'eventType'
        ).value;

      event.date =
        document.getElementById(
          'eventDate'
        ).value;

      event.startTime =
        document.getElementById(
          'eventStart'
        ).value;

      event.endTime =
        document.getElementById(
          'eventEnd'
        ).value;

      const index =
        store.events.findIndex(
          item =>
            item.id ===
            event.id
        );

      if (index >= 0) {

        store.events[index] =
          event;

      } else {

        store.events.push(
          event
        );
      }

      saveStore();

      closeModal();
    };
}

/* =========================================================
   VISIONNEUSE ÉVÉNEMENT
   ========================================================= */

function openEventViewer(event) {

  const subject =
    store.subjects.find(
      s =>
        s.id ===
        event.subjectId
    );

  const linkedTask =
    event.linkedId
      ? store.tasks.find(
          task =>
            task.id ===
            event.linkedId
        )
      : null;

  const html = `

    <h3>
      ${escapeHtml(
        event.title ||
        'Événement'
      )}
    </h3>

    <div
      style="
        display:grid;
        gap:8px;
      "
    >

      <div>
        <strong>
          Matière :
        </strong>

        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : '—'
        }
      </div>

      <div>
        <strong>
          Date :
        </strong>

        ${formatDateReadable(
          event.date
        )}
      </div>

      <div>
        <strong>
          Type :
        </strong>

        ${escapeHtml(
          event.type ||
          'Événement'
        )}
      </div>

      ${
        event.startTime
          ? `
            <div>
              <strong>
                Heure :
              </strong>

              ${escapeHtml(
                event.startTime
              )}
            </div>
          `
          : ''
      }

      ${
        linkedTask
          ? `
            <div class="text-muted">
              Cet événement est lié à une tâche.
            </div>
          `
          : ''
      }

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="editEvent"
          class="btn small"
        >
          Modifier
        </button>

        <button
          id="toggleEvent"
          class="btn small btn-ghost"
        >
          ${
            event.status === 'done'
              ? 'Marquer non terminé'
              : 'Marquer terminé'
          }
        </button>

        <button
          id="deleteEvent"
          class="btn small btn-ghost"
        >
          Supprimer
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById(
      'editEvent'
    )
    .onclick = () => {

      closeModal();

      openEventModal(
        event
      );
    };

  document
    .getElementById(
      'toggleEvent'
    )
    .onclick = () => {

      event.status =
        event.status === 'done'
          ? 'scheduled'
          : 'done';

      if (linkedTask) {

        linkedTask.status =
          event.status;
      }

      saveStore();

      closeModal();
    };

  document
    .getElementById(
      'deleteEvent'
    )
    .onclick = () => {

      if (
        !confirm(
          'Supprimer cet événement ?'
        )
      ) {
        return;
      }

      store.events =
        store.events.filter(
          item =>
            item.id !==
            event.id
        );

      saveStore();

      closeModal();
    };
}

/* =========================================================
   LEÇONS
   ========================================================= */

function renderLessons() {

  const container =
    document.getElementById(
      'lessonsList'
    );

  if (!container) return;

  container.innerHTML = '';

  if (!store.lessons.length) {

    container.innerHTML = `
      <div class="text-muted">
        Aucune leçon enregistrée.
      </div>
    `;

    return;
  }

  store.lessons.forEach(
    lesson => {

      const subject =
        store.subjects.find(
          s =>
            s.id ===
            lesson.subjectId
        );

      const item =
        document.createElement(
          'div'
        );

      item.className =
        'list-item';

      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              lesson.titre ||
              'Leçon'
            )}
          </strong>

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

        </div>

        <div
          style="
            display:flex;
            gap:6px;
          "
        >

          <button
            class="btn small"
            data-lesson-view="${lesson.id}"
          >
            Voir
          </button>

          <button
            class="btn small"
            data-lesson-edit="${lesson.id}"
          >
            Modifier
          </button>

          <button
            class="btn small btn-ghost"
            data-lesson-delete="${lesson.id}"
          >
            Supprimer
          </button>

        </div>
      `;

      container.appendChild(
        item
      );
    }
  );

  container
    .querySelectorAll(
      '[data-lesson-view]'
    )
    .forEach(button => {

      button.onclick = () =>
        openLessonViewer(
          button.dataset.lessonView
        );
    });

  container
    .querySelectorAll(
      '[data-lesson-edit]'
    )
    .forEach(button => {

      button.onclick = () =>
        openLessonModal(
          button.dataset.lessonEdit
        );
    });

  container
    .querySelectorAll(
      '[data-lesson-delete]'
    )
    .forEach(button => {

      button.onclick = () => {

        if (
          confirm(
            'Supprimer cette leçon et ses révisions ?'
          )
        ) {

          deleteLesson(
            button.dataset.lessonDelete
          );
        }
      };
    });
}

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
    store.subjects.map(
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
    ).join('');

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
          id="lessonSubject"
          class="select"
        >
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
          )}"
        >
      </label>

      <label>
        Titre de la leçon

        <input
          id="lessonTitle"
          class="input"
          value="${escapeHtml(
            lesson.titre
          )}"
        >
      </label>

      <label>
        Date de la leçon

        <input
          id="lessonDate"
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

        Activer la
        <strong>
          méthode 2,3,5,7
        </strong>

      </label>

      <div class="text-muted">
        Les révisions seront créées automatiquement à
        J+2, J+3, J+5 et J+7.
      </div>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="lessonCancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="lessonSave"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById(
      'lessonCancel'
    )
    .onclick = closeModal;

  document
    .getElementById(
      'lessonSave'
    )
    .onclick = () => {

      const updated = {

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
          document.getElementById(
            'lessonTitle'
          ).value.trim(),

        date:
          document.getElementById(
            'lessonDate'
          ).value,

        use2257:
          document.getElementById(
            'use2257'
          ).checked
      };

      const index =
        store.lessons.findIndex(
          item =>
            item.id ===
            updated.id
        );

      if (index >= 0) {

        store.lessons[index] =
          updated;

      } else {

        store.lessons.push(
          updated
        );
      }

      if (
        updated.use2257
      ) {

        create2257Revisions(
          updated
        );

      } else {

        store.revisions =
          store.revisions.filter(
            revision =>
              revision.lessonId !==
              updated.id
          );
      }

      saveStore();

      closeModal();
    };
}

/* =========================================================
   MÉTHODE 2,3,5,7
   ========================================================= */

function create2257Revisions(
  lesson
) {

  const intervals = [
    2,
    3,
    5,
    7
  ];

  intervals.forEach(
    offset => {

      const date =
        formatDate(
          addDays(
            new Date(
              lesson.date +
              'T00:00:00'
            ),
            offset
          )
        );

      const existing =
        store.revisions.find(
          revision =>
            revision.lessonId ===
              lesson.id &&
            revision.offset ===
              offset
        );

      if (existing) {

        existing.subjectId =
          lesson.subjectId;

        existing.title =
          `Révision ${offset === 2 ? 'J+2' :
            offset === 3 ? 'J+3' :
            offset === 5 ? 'J+5' :
            'J+7'} — ${
              lesson.titre
            }`;

        existing.date =
          date;

      } else {

        store.revisions.push({

          id: uid('revision'),

          lessonId:
            lesson.id,

          subjectId:
            lesson.subjectId,

          title:
            `Révision ${offset === 2 ? 'J+2' :
              offset === 3 ? 'J+3' :
              offset === 5 ? 'J+5' :
              'J+7'} — ${
                lesson.titre
              }`,

          date,

          offset,

          status:
            'scheduled'
        });
      }
    }
  );
}

function openLessonViewer(
  id
) {

  const lesson =
    store.lessons.find(
      item =>
        item.id === id
    );

  if (!lesson) return;

  const subject =
    store.subjects.find(
      item =>
        item.id ===
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
      ? revisions.map(
          revision => `

            <div
              style="
                padding:8px;
                margin-top:6px;
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
                  ${escapeHtml(
                    revision.title
                  )}
                </strong>

                <div class="meta">
                  ${formatDateReadable(
                    revision.date
                  )}
                </div>

              </div>

              <div>

                <button
                  class="btn small"
                  data-revision-toggle="${revision.id}"
                >
                  ${
                    revision.status ===
                    'done'
                      ? 'Annuler'
                      : 'Terminé'
                  }
                </button>

              </div>

            </div>
          `
        ).join('')
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
        <strong>
          Matière :
        </strong>

        ${
          subject
            ? escapeHtml(
                subject.name
              )
            : '—'
        }
      </div>

      <div>
        <strong>
          Chapitre :
        </strong>

        ${
          escapeHtml(
            lesson.chapitre ||
            '—'
          )
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

      <h4>
        🔄 Méthode 2,3,5,7
      </h4>

      ${revisionHtml}

      <div
        style="
          display:flex;
          justify-content:flex-end;
          margin-top:8px;
        "
      >

        <button
          id="closeLessonViewer"
          class="btn small btn-ghost"
        >
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
    .onclick = closeModal;

  document
    .querySelectorAll(
      '[data-revision-toggle]'
    )
    .forEach(button => {

      button.onclick = () => {

        const revision =
          store.revisions.find(
            item =>
              item.id ===
              button.dataset
                .revisionToggle
          );

        if (!revision)
          return;

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
      };
    });
}

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

  const container =
    document.getElementById(
      'evalsList'
    );

  if (!container) return;

  container.innerHTML = '';

  if (!store.evals.length) {

    container.innerHTML = `
      <div class="text-muted">
        Aucune évaluation enregistrée.
      </div>
    `;

    return;
  }

  store.evals.forEach(
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

          <strong>
            ${escapeHtml(
              evaluation.nom
            )}
          </strong>

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

            • Coef
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
            data-eval-edit="${evaluation.id}"
          >
            Modifier
          </button>

          <button
            class="btn small btn-ghost"
            data-eval-delete="${evaluation.id}"
          >
            Supprimer
          </button>

        </div>
      `;

      container.appendChild(
        item
      );
    }
  );

  container
    .querySelectorAll(
      '[data-eval-edit]'
    )
    .forEach(button => {

      button.onclick = () =>
        openEvalModal(
          button.dataset.evalEdit
        );
    });

  container
    .querySelectorAll(
      '[data-eval-delete]'
    )
    .forEach(button => {

      button.onclick = () => {

        if (
          !confirm(
            'Supprimer cette évaluation ?'
          )
        ) {
          return;
        }

        const id =
          button.dataset.evalDelete;

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
      };
    });
}

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

      pronostique: null,

      vraie: null,

      coefficient: 1
    };

  const subjectOptions =
    store.subjects.map(
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
    ).join('');

  const html = `

    <h3>
      ${
        evalId
          ? 'Modifier l’évaluation'
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
          id="evalPrediction"
          class="input"
          type="number"
          min="0"
          max="20"
          step="0.25"
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
          class="input"
          type="number"
          min="0"
          max="20"
          step="0.25"
          value="${
            evaluation.vraie ??
            ''
          }"
        >
      </label>

      <label>
        Coefficient

        <input
          id="evalCoefficient"
          class="input"
          type="number"
          min="1"
          step="1"
          value="${
            evaluation.coefficient ||
            1
          }"
        >
      </label>

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:8px;
        "
      >

        <button
          id="evalCancel"
          class="btn small btn-ghost"
        >
          Annuler
        </button>

        <button
          id="evalSave"
          class="btn rose small"
        >
          Enregistrer
        </button>

      </div>

    </div>
  `;

  openModal(html);

  document
    .getElementById(
      'evalCancel'
    )
    .onclick = closeModal;

  document
    .getElementById(
      'evalSave'
    )
    .onclick = () => {

      evaluation.subjectId =
        document.getElementById(
          'evalSubject'
        ).value;

      evaluation.nom =
        document.getElementById(
          'evalName'
        ).value.trim();

      evaluation.date =
        document.getElementById(
          'evalDate'
        ).value;

      const prediction =
        document.getElementById(
          'evalPrediction'
        ).value;

      const real =
        document.getElementById(
          'evalReal'
        ).value;

      const coefficient =
        document.getElementById(
          'evalCoefficient'
        ).value;

      evaluation.pronostique =
        prediction === ''
          ? null
          : Number(
              prediction
            );

      evaluation.vraie =
        real === ''
          ? null
          : Number(real);

      evaluation.coefficient =
        coefficient === ''
          ? 1
          : Number(
              coefficient
            );

      const index =
        store.evals.findIndex(
          item =>
            item.id ===
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

      store.events =
        store.events.filter(
          event =>
            event.linkedId !==
            evaluation.id
        );

      store.events.push({

        id: uid('event'),

        title:
          `Évaluation — ${
            evaluation.nom
          }`,

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
    };
}

/* =========================================================
   GRAPHIQUE DES NOTES
   ========================================================= */

let gradesChart = null;

function renderGradesChart() {

  const canvas =
    document.getElementById(
      'gradesChart'
    );

  if (!canvas) return;

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

  if (gradesChart) {

    gradesChart.destroy();

    gradesChart = null;
  }

  const datasets =
    store.subjects.map(
      subject => {

        const values =
          store.evals
            .filter(
              evaluation =>
                evaluation.subjectId ===
                  subject.id &&
                evaluation.vraie !==
                  null &&
                evaluation.vraie !==
                  undefined
            )
            .sort(
              (a, b) =>
                new Date(a.date) -
                new Date(b.date)
            )
            .map(
              evaluation => ({
                x: evaluation.date,
                y: Number(
                  evaluation.vraie
                )
              })
            );

        return {

          label:
            subject.name,

          data:
            values,

          borderColor:
            subject.color,

          backgroundColor:
            subject.color,

          tension:
            0.25,

          fill:
            false,

          pointRadius:
            5
        };
      }
    );

  gradesChart =
    new Chart(
      ctx,
      {
        type: 'line',

        data: {
          datasets
        },

        options: {

          responsive: true,

          plugins: {

            legend: {
              position:
                'top'
            }

          },

          scales: {

            x: {

              type:
                'category',

              title: {
                display: true,
                text:
                  'Évaluations'
              }

            },

            y: {

              min: 0,

              max: 20,

              title: {
                display: true,
                text:
                  'Note / 20'
              }

            }

          }
        }
      }
    );

  const summary =
    document.getElementById(
      'gradesSummary'
    );

  if (!summary)
    return;

  const general =
    computeGeneralAverage();

  summary.innerHTML = `

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
            Number.isNaN(
              general
            )
              ? '—'
              : general.toFixed(
                  2
                )
          }
        </div>

      </div>

      ${store.subjects.map(
        subject => {

          const average =
            computeSubjectAverage(
              subject.id
            );

          return `

            <div>

              <strong>
                ${escapeHtml(
                  subject.name
                )}
              </strong>

              <div class="text-muted">
                ${
                  Number.isNaN(
                    average
                  )
                    ? '—'
                    : average.toFixed(
                        2
                      )
                }
              </div>

            </div>
          `;
        }
      ).join('')}

    </div>
  `;
}

/* =========================================================
   CALCUL DES MOYENNES
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
          undefined
    );

  if (!evaluations.length)
    return NaN;

  let points = 0;
  let coefficients = 0;

  evaluations.forEach(
    evaluation => {

      const note =
        Number(
          evaluation.vraie
        );

      const coefficient =
        Number(
          evaluation.coefficient ||
          evaluation.coef ||
          1
        );

      if (
        !Number.isNaN(note)
      ) {

        points +=
          note *
          coefficient;

        coefficients +=
          coefficient;
      }
    }
  );

  if (
    coefficients === 0
  )
    return NaN;

  return (
    points /
    coefficients
  );
}

function computeGeneralAverage() {

  const evaluations =
    store.evals.filter(
      evaluation =>
        evaluation.vraie !==
          null &&
        evaluation.vraie !==
          undefined
    );

  if (!evaluations.length)
    return NaN;

  let points = 0;

  let coefficients = 0;

  evaluations.forEach(
    evaluation => {

      const note =
        Number(
          evaluation.vraie
        );

      const coefficient =
        Number(
          evaluation.coefficient ||
          evaluation.coef ||
          1
        );

      if (
        !Number.isNaN(note)
      ) {

        points +=
          note *
          coefficient;

        coefficients +=
          coefficient;
      }
    }
  );

  if (
    coefficients === 0
  )
    return NaN;

  return (
    points /
    coefficients
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
      item =>
        item.id ===
        subjectId
    );

  return subject
    ? subject.name
    : 'Matière inconnue';
}

/* =========================================================
   FIN
   ========================================================= */
