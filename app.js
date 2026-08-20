/* Study Planner - app.js
   Interface entièrement en français.
   Persistance via localStorage sous la clé "studyPlannerData".
*/

// -----------------------------
// Utilitaires
// -----------------------------
const uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,9)}`;

const today = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
};

// formattage
const formatDate = d => {
  const dt = new Date(d);
  return dt.toISOString().slice(0,10);
};
const formatDateReadable = d => {
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' });
};
const addDays = (d, n) => {
  const t = new Date(d);
  t.setDate(t.getDate()+n);
  return t;
};

// -----------------------------
// DONNÉES - modèle et persistance
// -----------------------------
const STORAGE_KEY = 'studyPlannerData_v1';
const defaultSubjects = [
  { id:'matiere_math', name:'Mathématiques', color:'#ffd0e0' },
  { id:'matiere_fr', name:'Français', color:'#e9d9ff' },
  { id:'matiere_hg', name:'Histoire', color:'#d6e8ff' },
  { id:'matiere_en', name:'Anglais', color:'#d9ffe6' }
];

let store = {
  subjects: [],
  classes: [],      // emploi du temps récurrent (jour, start, end, subjectId)
  events: [],       // calendrier : event {id, title, subjectId, type, date, startTime, endTime, priority, status, linkedId}
  tasks: [],        // planner tasks (devoirs & évaluations) with linked event
  lessons: [],      // lessons with optional 2-2-5-7 revisions
  revisions: [],    // explicit revision events (linked to lesson)
  photos: [],       // photos de cours {id, subjectId, name, dataUrl}
  notes: [],        // notes de cours {id, subjectId, title, content}
  evals: [],        // évaluations (pronostique + vraie note)
  settings: { weekStart: 'monday' }
};

function loadStore(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      store = JSON.parse(raw);
      // for older stores, ensure arrays exist
      store.subjects = store.subjects || defaultSubjects;
      store.classes = store.classes || [];
      store.events = store.events || [];
      store.tasks = store.tasks || [];
      store.lessons = store.lessons || [];
      store.revisions = store.revisions || [];
      store.photos = store.photos || [];
      store.notes = store.notes || [];
      store.evals = store.evals || [];
    }catch(e){
      console.error('Erreur chargement store',e);
      resetStore();
    }
  }else{
    resetStore();
  }
}
function saveStore(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  renderAll();
}
function resetStore(){
  store = { subjects: defaultSubjects.slice(), classes:[], events:[], tasks:[], lessons:[], revisions:[], photos:[], notes:[], evals:[], settings:{weekStart:'monday'} };
  saveStore();
}

// -----------------------------
// INITIALISATION UI
// -----------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  loadStore();
  initNav();
  initButtons();
  renderAll();
});

// Nav
function initNav(){
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');
  const dashboard = document.getElementById('dashboard');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const target = document.getElementById(tabId);

      if (!target) {
        console.error("Onglet introuvable :", tabId);
        return;
      }

      // Enlever "active" de tous les boutons
      navButtons.forEach(b => b.classList.remove('active'));

      // Activer le bouton cliqué
      btn.classList.add('active');

      // Cacher tous les onglets
      tabs.forEach(tab => {
        tab.classList.add('hidden');
      });

      // Afficher l'onglet choisi
      target.classList.remove('hidden');

      // Afficher le dashboard uniquement sur Calendrier
      if (dashboard) {
        dashboard.style.display =
          tabId === 'calendrier' ? '' : 'none';
      }
    });
  });

  // EXPORT
  document.getElementById('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(store, null, 2);
    const blob = new Blob([data], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'study-planner-export.json';
    a.click();

    URL.revokeObjectURL(url);
  });

  // IMPORT
  const importInput = document.getElementById('importFile');

  importInput.addEventListener('change', (e) => {
    const f = e.target.files[0];

    if (!f) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);

        store = data;
        saveStore();

        alert('Importation réussie');
      } catch (err) {
        alert('Fichier JSON invalide');
      }
    };

    reader.readAsText(f);
  });
}
// Buttons and modals
function initButtons(){
  document.getElementById('addTaskBtn').addEventListener('click', ()=> openTaskModal());
  document.getElementById('addLessonBtn').addEventListener('click', ()=> openLessonModal());
  document.getElementById('addEvalBtn').addEventListener('click', ()=> openEvalModal());
  document.getElementById('addEventFromCal').addEventListener('click', ()=> openEventModal());
  document.getElementById('prevWeek').addEventListener('click', ()=> changeWeek(-7));
  document.getElementById('nextWeek').addEventListener('click', ()=> changeWeek(7));
  document.getElementById('subjectFilter').addEventListener('change', ()=> renderCalendar());
}

// -----------------------------
// RENDERS
// -----------------------------
let currentWeekStart = startOfWeek(new Date());

function renderAll(){
  populateSubjectFilter();
  renderDashboard();
  renderCalendar();
  renderTasks();
  renderLessons();
  renderEvals();
  renderGradesChart();
}

function populateSubjectFilter(){
  const sel = document.getElementById('subjectFilter');
  sel.innerHTML = '<option value="all">Toutes les matières</option>';
  store.subjects.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.id; o.textContent = s.name;
    sel.appendChild(o);
  });
}

function startOfWeek(date){
  // semaine qui commence lundi
  const d = new Date(date);
  const day = d.getDay(); // 0 dim .. 1 lundi
  const diff = (day === 0) ? -6 : (1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate()+diff);
  monday.setHours(0,0,0,0);
  return monday;
}
function changeWeek(days){
  currentWeekStart = addDays(currentWeekStart, days);
  renderCalendar();
}

function weekLabel(){
  const a = currentWeekStart;
  const b = addDays(a,6);
  const opts = { day:'2-digit', month:'short' };
  return `${a.toLocaleDateString('fr-FR',opts)} — ${b.toLocaleDateString('fr-FR',opts)}`;
}

// Calendar render
function renderCalendar(){
  document.getElementById('weekLabel').textContent = weekLabel();
  const container = document.getElementById('weekCalendar');
  container.innerHTML = '';

  // time column
  const timesCol = document.createElement('div');
  timesCol.className='time-col';
  const slotHours = [...Array(14)].map((_,i)=> 7+i); // 7h - 20h
  timesCol.innerHTML = slotHours.map(h=>`<div class="time">${h}h</div>`).join('');
  container.appendChild(timesCol);

  const filter = document.getElementById('subjectFilter').value;

  // for each day mon->sun
  for(let d=0; d<7; d++){
    const day = addDays(currentWeekStart, d);
    const dayCol = document.createElement('div');
    dayCol.className='day-col';
    dayCol.dataset.date = formatDate(day);

    const header = document.createElement('div');
    header.className='day-header';
    const dayName = day.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' });
    header.innerHTML = `<div>${dayName}</div><div class="text-muted">${day.getDate()=== (new Date()).getDate() && day.getMonth()=== (new Date()).getMonth() ? 'Aujourd\'hui' : ''}</div>`;
    dayCol.appendChild(header);

    // Collect events for the date
    const dayEvents = store.events.filter(ev => ev.date === formatDate(day));
    // include revisions and class events from classes (recurring)
    const classEvents = store.classes
      .filter(cl => cl.jour === day.getDay()) // class stored with JS day number 0..6 (Sun..Sat)
      .map(cl => ({
        id: cl.id,
        title: cl.matiereName,
        subjectId: cl.subjectId,
        type:'Cours',
        date: formatDate(day),
        startTime: cl.start,
        endTime: cl.end,
        priority: null,
        status: 'scheduled',
        linkedId: cl.id,
        isClass:true
      }));
    const revisions = store.revisions.filter(r => r.date === formatDate(day));
    const all = [...classEvents, ...dayEvents, ...revisions];

    // filter by subject
    const shown = filter === 'all' ? all : all.filter(a => a.subjectId === filter);

    // render each event
    shown.forEach(ev=>{
      const slot = document.createElement('div');
      slot.className='slot small';
      // style by subject color or type
      const subj = store.subjects.find(s=>s.id===ev.subjectId);
      const bg = subj ? subj.color : '#ffe6f3';
      slot.style.background = bg;
      const typeBadge = `<span class="badge" style="background: rgba(0,0,0,0.08); color:#6b4956; font-weight:700; padding:4px 8px;border-radius:999px;font-size:12px">${ev.type || 'Événement'}</span>`;
      slot.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${ev.title}</strong>${typeBadge}</div>
                        <div class="meta">${ev.startTime ? ev.startTime+' • ' : ''}${ev.priority ? 'Priorité: '+ev.priority : ''}${ev.status ? ' • '+(ev.status==='done'?'Terminé': '') : ''}</div>`;

      slot.addEventListener('click', ()=> {
        // open event editor, prefer linked planner item
        openEventViewer(ev);
      });
      dayCol.appendChild(slot);
    });

    container.appendChild(dayCol);
  }

  // render dashboard mini info
  renderDashboardMini();
}

// Dashboard
function renderDashboard(){
  const dash = document.getElementById('dashboard');
  dash.innerHTML = '';
  // left: big card with today's classes and upcoming deadlines
  const left = document.createElement('div'); left.className='card';
  const todayDate = formatDate(today());
  left.innerHTML = `<h2>Aperçu</h2>
    <div class="text-muted">Aujourd'hui : ${new Date().toLocaleDateString('fr-FR',{ weekday:'long', day:'2-digit', month:'long' })}</div>
    <div id="todayClasses" style="margin-top:12px"></div>
    <div id="upcomingDeadlines" style="margin-top:12px"></div>`;
  dash.appendChild(left);

  // right: stats card
  const right = document.createElement('div'); right.className='card';
  right.innerHTML = `<h3>Récapitulatif</h3>
    <div style="display:flex;gap:8px;margin-top:10px">
      <div style="flex:1"><strong>${store.tasks.filter(t=>t.status!=='done').length}</strong><div class="text-muted">Tâches restantes</div></div>
      <div style="flex:1"><strong>${store.evals.length}</strong><div class="text-muted">Évaluations enregistrées</div></div>
      <div style="flex:1"><strong>${store.subjects.length}</strong><div class="text-muted">Matières</div></div>
    </div>
    <div style="margin-top:12px">
      <strong>Moyenne générale</strong>
      <div id="avgGeneral" class="text-muted">Calcul en bas de page</div>
    </div>`;
  dash.appendChild(right);

  // Fill today's classes and upcoming deadlines
  const todayClassesEl = left.querySelector('#todayClasses');
  const classesToday = store.classes.filter(c => c.jour === (new Date()).getDay());
  todayClassesEl.innerHTML = classesToday.length ? classesToday.map(c=>{
    const subj = store.subjects.find(s=>s.id===c.subjectId);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,250,251,0.6))">
      <div><strong>${subj ? subj.name : c.matiereName}</strong><div class="text-muted">${c.start} - ${c.end}</div></div>
      <div style="width:12px;height:12px;border-radius:4px;background:${subj ? subj.color : '#ffd0e0'}"></div>
    </div>`}).join('') : '<div class="text-muted">Aucun cours aujourd\'hui</div>';

  const upcomingEl = left.querySelector('#upcomingDeadlines');
  const upcoming = store.tasks.filter(t => t.status!=='done' && new Date(t.date) >= today()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,5);
  upcomingEl.innerHTML = `<h4>Échéances à venir</h4>` + (upcoming.length ? upcoming.map(u=>{
    const subj = store.subjects.find(s=>s.id===u.subjectId);
    return `<div style="display:flex;justify-content:space-between;padding:8px;border-radius:8px;background:var(--muted)">
      <div><strong>${u.title}</strong><div class="text-muted">${subj?subj.name:'Matière inconnue'} • ${formatDateReadable(u.date)}</div></div>
      <div class="text-muted">${u.priority || ''}</div>
    </div>`;
  }).join('') : '<div class="text-muted">Aucune échéance prochaine</div>');

  // avg general
  const avgEl = document.getElementById('avgGeneral');
  const avg = computeGeneralAverage();
  avgEl.textContent = isNaN(avg) ? 'Aucune note' : avg.toFixed(2);
}

function renderDashboardMini(){
  // small update in calendar area - upcoming deadlines count
  // Could be expanded
}

// Tasks render
function renderTasks(){
  const el = document.getElementById('tasksList');
  el.innerHTML = '';
  if(store.tasks.length===0) el.innerHTML='<div class="text-muted">Aucun devoir ni évaluation. Créez-en un !</div>';
  store.tasks.sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t=>{
    const item = document.createElement('div'); item.className='list-item';
    const subj = store.subjects.find(s=>s.id===t.subjectId);
    item.innerHTML = `<div>
        <div style="font-weight:700">${t.title} <span class="text-muted" style="font-weight:600">• ${t.type}</span></div>
        <div class="meta">${subj?subj.name:''} • ${formatDateReadable(t.date)} ${t.startTime?('• '+t.startTime):''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div style="display:flex;gap:6px">
          <button class="btn small" data-action="edit" data-id="${t.id}">Modifier</button>
          <button class="btn small btn-ghost" data-action="delete" data-id="${t.id}">Supprimer</button>
        </div>
        <label class="text-muted"><input type="checkbox" data-id="${t.id}" ${t.status==='done'?'checked':''}> Terminé</label>
      </div>`;
    el.appendChild(item);
  });

  // listeners
  el.querySelectorAll('button[data-action]').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      if(e.target.dataset.action==='edit') openTaskModal(id);
      else if(e.target.dataset.action==='delete') {
        if(confirm('Supprimer cette tâche ?')) {
          deleteTask(id);
        }
      }
    });
  });
  el.querySelectorAll('input[type=checkbox][data-id]').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const id = e.target.dataset.id;
      const t = store.tasks.find(x=>x.id===id);
      if(t){ t.status = e.target.checked ? 'done':'scheduled'; syncTaskToEvent(t); saveStore(); }
    });
  });
}

// Lessons render
function renderLessons(){
  const el = document.getElementById('lessonsList');
  el.innerHTML = '';
  if(store.lessons.length===0) el.innerHTML = '<div class="text-muted">Aucune leçon. Ajoutez une leçon et activez la méthode 2-2-5-7 si souhaité.</div>';
  store.lessons.sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(l=>{
    const item = document.createElement('div'); item.className='list-item';
    const subj = store.subjects.find(s=>s.id===l.subjectId);
    item.innerHTML = `<div>
        <div style="font-weight:700">${l.titre}</div>
        <div class="meta">${subj?subj.name:''} • ${formatDateReadable(l.date)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <div style="display:flex;gap:6px;">
          <button class="btn small" data-action="view" data-id="${l.id}">Voir</button>
          <button class="btn small" data-action="delete" data-id="${l.id}">Supprimer</button>
        </div>
      </div>`;
    el.appendChild(item);
  });

  el.querySelectorAll('button[data-action]').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      if(e.target.dataset.action==='view') openLessonViewer(id);
      if(e.target.dataset.action==='delete') {
        if(confirm('Supprimer la leçon et ses révisions ?')) {
          deleteLesson(id);
        }
      }
    });
  });
}

// Evals render
function renderEvals(){
  const el = document.getElementById('evalsList');
  el.innerHTML = '';
  if(store.evals.length===0) el.innerHTML = '<div class="text-muted">Aucune évaluation enregistrée.</div>';
  store.evals.sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(ev=>{
    const subj = store.subjects.find(s=>s.id===ev.subjectId);
    const item = document.createElement('div'); item.className='list-item';
    item.innerHTML = `<div>
      <div style="font-weight:700">${ev.nom}</div>
      <div class="meta">${subj?subj.name:''} • ${formatDateReadable(ev.date)} • Coef ${ev.coefficient || 1}</div>
      <div class="meta">Pronostic: <strong>${ev.pronostique ?? '-'}</strong> • Vraie note: <strong>${ev.vraie ?? '-'}</strong></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
      <div style="display:flex;gap:6px">
        <button class="btn small" data-action="edit" data-id="${ev.id}">Modifier</button>
        <button class="btn small btn-ghost" data-action="delete" data-id="${ev.id}">Supprimer</button>
      </div>
    </div>`;
    el.appendChild(item);
  });

  el.querySelectorAll('button[data-action]').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      if(e.target.dataset.action==='edit') openEvalModal(id);
      if(e.target.dataset.action==='delete') {
        if(confirm('Supprimer cette évaluation ?')) {
          store.evals = store.evals.filter(x=>x.id!==id);
          // remove linked events
          store.events = store.events.filter(ev=>ev.linkedId !== id);
          saveStore();
        }
      }
    });
  });
}

// Chart
let gradesChart=null;
function renderGradesChart(){
  const ctx = document.getElementById('gradesChart').getContext('2d');
  const labels = store.evals.map(e => formatDateReadable(e.date));
  const dataset = store.subjects.map(s=>{
    const vals = store.evals.filter(ev=>ev.subjectId===s.id && ev.vraie!=null).map(ev=>({x: formatDate(ev.date), y: Number(ev.vraie)}));
    return { label: s.name, data: vals, borderColor: s.color || '#ffd0e0', backgroundColor: s.color || '#ffd0e0', fill:false, tension:0.2 };
  });
  const allVals = store.evals.filter(ev=>ev.vraie!=null).map(ev => ({x: formatDate(ev.date), y: Number(ev.vraie)}));
  // destroy previous
  if(gradesChart) gradesChart.destroy();
  gradesChart = new Chart(ctx, {
    type:'line',
    data: { datasets: dataset },
    options: {
      parsing: false,
      plugins: { legend: { position:'top' } },
      scales: {
        x: { type:'time', time:{ unit:'day', tooltipFormat:'dd MMM' }, title:{display:true,text:'Date'} },
        y: { min:0, max:20, title:{display:true,text:'Note'} }
      }
    }
  });

  // summary
  const summ = document.getElementById('gradesSummary');
  summ.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><div><strong>Moyenne générale</strong><div class="text-muted">${computeGeneralAverage().toFixed(2)||'—'}</div></div>` +
    store.subjects.map(s=>`<div><strong>${s.name}</strong><div class="text-muted">${computeSubjectAverage(s.id) ? computeSubjectAverage(s.id).toFixed(2) : '—'}</div></div>`).join('') + '</div>';
}

// -----------------------------
// CRUD: Tasks / Events / Lessons / Revisions / Evals
// -----------------------------
function openModal(contentHtml){
  const modal = document.getElementById('modal');
  modal.innerHTML = `<div class="card">${contentHtml}</div>`;
  modal.classList.remove('hidden');
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
}
function closeModal(){ document.getElementById('modal').classList.add('hidden'); document.getElementById('modal').innerHTML=''; }

// Task modal (create or edit)
function openTaskModal(taskId=null){
  const task = taskId ? store.tasks.find(t=>t.id===taskId) : { id:uid('task'), subjectId:store.subjects[0]?.id || null, title:'', type:'Devoir', date:formatDate(addDays(new Date(),1)), startTime:'', priority:'Moyenne', timeEstimate:'30', status:'scheduled', notes:'' };
  const subjOptions = store.subjects.map(s=>`<option value="${s.id}" ${s.id===task.subjectId?'selected':''}>${s.name}</option>`).join('');
  const html = `
    <h3>${taskId ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
    <div style="display:grid;gap:8px">
      <label>Matière<select id="taskSubject" class="select">${subjOptions}</select></label>
      <label>Titre<input id="taskTitle" class="input" value="${escapeHtml(task.title)}"></label>
      <label>Type<select id="taskType" class="select">
        <option ${task.type==='Devoir'?'selected':''}>Devoir</option>
        <option ${task.type==='DM'?'selected':''}>DM</option>
        <option ${task.type==='Évaluation'?'selected':''}>Évaluation</option>
        <option ${task.type==='Contrôle'?'selected':''}>Contrôle</option>
        <option ${task.type==='Examen'?'selected':''}>Examen</option>
        <option ${task.type==='Projet'?'selected':''}>Projet</option>
      </select></label>
      <label>Date limite<input id="taskDate" type="date" class="input" value="${task.date}"></label>
      <label>Heure (optionnel)<input id="taskStartTime" class="input" placeholder="hh:mm" value="${task.startTime || ''}"></label>
      <label>Priorité<select id="taskPriority" class="select">
        <option ${task.priority==='Haute'?'selected':''}>Haute</option>
        <option ${task.priority==='Moyenne'?'selected':''}>Moyenne</option>
        <option ${task.priority==='Basse'?'selected':''}>Basse</option>
      </select></label>
      <label>Temps estimé (min)<input id="taskEstimate" class="input" value="${task.timeEstimate||30}"></label>
      <label>Notes (optionnel)<textarea id="taskNotes" rows=3 class="input">${escapeHtml(task.notes||'')}</textarea></label>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="cancel" class="btn small btn-ghost">Annuler</button>
        <button id="save" class="btn rose small">${taskId ? 'Enregistrer' : 'Créer'}</button>
      </div>
    </div>`;
  openModal(html);
  document.getElementById('cancel').addEventListener('click', closeModal);
  document.getElementById('save').addEventListener('click', ()=>{
    const t = {
      id: task.id,
      subjectId: document.getElementById('taskSubject').value,
      title: document.getElementById('taskTitle').value.trim(),
      type: document.getElementById('taskType').value,
      date: document.getElementById('taskDate').value,
      startTime: document.getElementById('taskStartTime').value,
      priority: document.getElementById('taskPriority').value,
      timeEstimate: document.getElementById('taskEstimate').value,
      status: task.status || 'scheduled',
      notes: document.getElementById('taskNotes').value
    };
    // if editing, replace, else push
    const exists = store.tasks.find(x=>x.id===t.id);
    if(exists){
      Object.assign(exists, t);
    }else{
      store.tasks.push(t);
    }
    // create or update calendar event (sync)
    syncTaskToEvent(t);
    saveStore();
    closeModal();
  });
}

// Event editor/viewer
function openEventModal(ev=null){
  // create ad-hoc event (not necessarily linked to task)
  const e = ev || { id: uid('event'), title:'', subjectId:store.subjects[0]?.id || null, type:'Activité', date:formatDate(new Date()), startTime:'', endTime:'', priority:'Moyenne', status:'scheduled' };
  const subjOptions = store.subjects.map(s=>`<option value="${s.id}" ${s.id===e.subjectId?'selected':''}>${s.name}</option>`).join('');
  const html = `<h3>Nouvel événement</h3>
    <div style="display:grid;gap:8px">
      <label>Matière<select id="evSubject" class="select">${subjOptions}</select></label>
      <label>Titre<input id="evTitle" class="input" value="${escapeHtml(e.title)}"></label>
      <label>Type<select id="evType" class="select"><option>Activité extrascolaire</option><option>Révision</option><option>Devoir</option><option>Évaluation</option></select></label>
      <label>Date<input id="evDate" type="date" class="input" value="${e.date}"></label>
      <label>Heure de début<input id="evStart" class="input" placeholder="hh:mm" value="${e.startTime}"></label>
      <label>Heure de fin<input id="evEnd" class="input" placeholder="hh:mm" value="${e.endTime}"></label>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="cancel" class="btn small btn-ghost">Annuler</button><button id="save" class="btn rose small">Sauvegarder</button></div>
    </div>`;
  openModal(html);
  document.getElementById('cancel').addEventListener('click', closeModal);
  document.getElementById('save').addEventListener('click', ()=>{
    const newEv = {
      id: e.id,
      title: document.getElementById('evTitle').value,
      subjectId: document.getElementById('evSubject').value,
      type: document.getElementById('evType').value,
      date: document.getElementById('evDate').value,
      startTime: document.getElementById('evStart').value,
      endTime: document.getElementById('evEnd').value,
      priority: 'Moyenne',
      status: 'scheduled',
      linkedId: null
    };
    // store
    const idx = store.events.findIndex(x=>x.id===newEv.id);
    if(idx>=0) store.events[idx] = newEv; else store.events.push(newEv);
    saveStore();
    closeModal();
  });
}

// Open an event viewer that can edit the linked planner item if present
function openEventViewer(ev){
  const isLinkedTask = ev.linkedId && store.tasks.find(t=>t.id===ev.linkedId);
  const isRevision = ev.type === 'Révision' || store.revisions.find(r=>r.id===ev.id);
  const subj = store.subjects.find(s=>s.id===ev.subjectId);
  const html = `<h3>Événement</h3>
    <div style="display:grid;gap:8px">
      <div><strong>${escapeHtml(ev.title)}</strong></div>
      <div class="meta">${subj?subj.name:''} • ${formatDateReadable(ev.date)} ${ev.startTime?('• '+ev.startTime):''}</div>
      <div class="text-muted">Type : ${ev.type}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="edit" class="btn small">Modifier</button>
        <button id="toggleDone" class="btn small btn-ghost">${ev.status==='done'?'Marquer non terminé':'Marquer terminé'}</button>
        <button id="delete" class="btn small btn-ghost">Supprimer</button>
      </div>
      ${isLinkedTask ? '<div class="text-muted">Cet événement est lié à une tâche du Planner.</div>' : ''}
    </div>`;
  openModal(html);
  document.getElementById('edit').addEventListener('click', ()=>{
    closeModal(); openEventModal(ev);
  });
  document.getElementById('toggleDone').addEventListener('click', ()=>{
    ev.status = ev.status==='done' ? 'scheduled' : 'done';
    // sync back to task if linked
    if(ev.linkedId){
      const t = store.tasks.find(t=>t.id===ev.linkedId);
      if(t) t.status = ev.status;
    }
    saveStore(); closeModal();
  });
  document.getElementById('delete').addEventListener('click', ()=>{
    if(confirm('Supprimer cet événement ?')){
      store.events = store.events.filter(x=>x.id!==ev.id);
      // if linked to task, remove linkedId or remove task optionally
      if(ev.linkedId){
        const tk = store.tasks.find(t=>t.id===ev.linkedId);
        if(tk) tk.linkedId = null;
      }
      saveStore(); closeModal();
    }
  });
}

// Sync task <-> event (create or update)
function syncTaskToEvent(task){
  // find event with linkedId
  let ev = store.events.find(e => e.linkedId === task.id);
  if(!ev){
    // create new event
    ev = {
      id: uid('ev'),
      title: `${task.type} — ${task.title}`,
      subjectId: task.subjectId,
      type: task.type,
      date: task.date,
      startTime: task.startTime || '',
      endTime: '',
      priority: task.priority || 'Moyenne',
      status: task.status || 'scheduled',
      linkedId: task.id
    };
    store.events.push(ev);
  }else{
    // update event
    ev.title = `${task.type} — ${task.title}`;
    ev.subjectId = task.subjectId;
    ev.type = task.type;
    ev.date = task.date;
    ev.startTime = task.startTime || '';
    ev.priority = task.priority || 'Moyenne';
    ev.status = task.status || 'scheduled';
  }
}

// delete task (and its event)
function deleteTask(id){
  store.tasks = store.tasks.filter(t=>t.id!==id);
  store.events = store.events.filter(e=>e.linkedId !== id);
  saveStore();
}

// Lessons and revisions
function openLessonModal(lessonId=null){
  const l = lessonId ? store.lessons.find(x=>x.id===lessonId) : { id:uid('lesson'), subjectId: store.subjects[0]?.id || null, chapitre:'', titre:'', date: formatDate(addDays(new Date(),1)), use2257:false };
  const subjOptions = store.subjects.map(s=>`<option value="${s.id}" ${s.id===l.subjectId?'selected':''}>${s.name}</option>`).join('');
  const html = `<h3>${lessonId ? 'Modifier la leçon' : 'Nouvelle leçon'}</h3>
    <div style="display:grid;gap:8px">
      <label>Matière<select id="lesSubject" class="select">${subjOptions}</select></label>
      <label>Chapitre<input id="lesChap" class="input" value="${escapeHtml(l.chapitre)}"></label>
      <label>Titre de la leçon<input id="lesTitle" class="input" value="${escapeHtml(l.titre)}"></label>
      <label>Date de la leçon<input id="lesDate" type="date" class="input" value="${l.date}"></label>
      <label><input id="use2257" type="checkbox" ${l.use2257?'checked':''}> Activer la méthode 2-2-5-7 (créera les 4 révisions automatiquement)</label>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="cancel" class="btn small btn-ghost">Annuler</button><button id="save" class="btn rose small">Enregistrer</button></div>
    </div>`;
  openModal(html);
  document.getElementById('cancel').addEventListener('click', closeModal);
  document.getElementById('save').addEventListener('click', ()=>{
    const lobj = {
      id: l.id,
      subjectId: document.getElementById('lesSubject').value,
      chapitre: document.getElementById('lesChap').value,
      titre: document.getElementById('lesTitle').value,
      date: document.getElementById('lesDate').value,
      use2257: document.getElementById('use2257').checked
    };
    const exists = store.lessons.find(x=>x.id===lobj.id);
    if(exists) Object.assign(exists, lobj); else store.lessons.push(lobj);

    // if use2257, create revisions automatically
    if(lobj.use2257){
      // compute J+2, J+3, J+5, J+7
      const d0 = new Date(lobj.date);
      const days = [2,3,5,7];
      days.forEach((n, idx)=>{
        const rd = formatDate(addDays(d0, n));
        // avoid duplicates: check existing revision for lesson+offset
        const existsRev = store.revisions.find(r=>r.lessonId===lobj.id && r.offset===n);
        if(!existsRev){
          const rev = {
            id: uid('rev'),
            lessonId: lobj.id,
            subjectId: lobj.subjectId,
            title: `Révision 2-2-5-7 — ${lobj.titre}`,
            date: rd,
            offset: n,
            status: 'scheduled'
          };
          store.revisions.push(rev);
        }
      });
    }
    saveStore();
    closeModal();
  });
}

function openLessonViewer(id){
  const l = store.lessons.find(x=>x.id===id);
  if(!l) return;
  const subj = store.subjects.find(s=>s.id===l.subjectId);
  const relatedRevs = store.revisions.filter(r=>r.lessonId===l.id).sort((a,b)=>a.offset-b.offset);
  const revHtml = relatedRevs.length ? relatedRevs.map(r=>`<div style="padding:8px;border-radius:8px;background:var(--muted);display:flex;justify-content:space-between;align-items:center">
      <div><strong>${r.title}</strong><div class="meta">${formatDateReadable(r.date)}</div></div>
      <div style="display:flex;gap:6px">
        <button class="btn small" data-action="mark" data-id="${r.id}">${r.status==='done'?'Annuler':'Terminé'}</button>
        <button class="btn small btn-ghost" data-action="edit" data-id="${r.id}">Modifier</button>
        <button class="btn small btn-ghost" data-action="delete" data-id="${r.id}">Suppr</button>
      </div>
    </div>`).join('') : '<div class="text-muted">Aucune révision planifiée</div>';

  const html = `<h3>${escapeHtml(l.titre)}</h3>
    <div style="display:grid;gap:8px">
      <div><strong>Matière :</strong> ${subj?subj.name:''}</div>
      <div><strong>Chapitre :</strong> ${escapeHtml(l.chapitre)}</div>
      <div><strong>Date :</strong> ${formatDateReadable(l.date)}</div>
      <h4>Révisions 2-2-5-7</h4>
      ${revHtml}
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button id="close" class="btn small btn-ghost">Fermer</button>
      </div>
    </div>`;
  openModal(html);
  document.getElementById('close').addEventListener('click', closeModal);
  // listeners for revision controls
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = e.target.dataset.id;
      const action = e.target.dataset.action;
      const rev = store.revisions.find(r=>r.id===id);
      if(!rev) return;
      if(action==='mark'){ rev.status = rev.status==='done' ? 'scheduled' : 'done'; saveStore(); closeModal(); openLessonViewer(l.id); }
      if(action==='edit'){ closeModal(); openRevisionEditModal(rev); }
      if(action==='delete'){ if(confirm('Supprimer cette révision ?')){ store.revisions = store.revisions.filter(x=>x.id!==id); saveStore(); closeModal(); openLessonViewer(l.id); } }
    });
  });
}

function openRevisionEditModal(rev){
  const subjOptions = store.subjects.map(s=>`<option value="${s.id}" ${s.id===rev.subjectId?'selected':''}>${s.name}</option>`).join('');
  const html = `<h3>Modifier la révision</h3><div style="display:grid;gap:8px">
    <label>Matière<select id="revSubject" class="select">${subjOptions}</select></label>
    <label>Titre<input id="revTitle" class="input" value="${escapeHtml(rev.title)}"></label>
    <label>Date<input id="revDate" type="date" class="input" value="${rev.date}"></label>
    <div style="display:flex;gap:8px;justify-content:flex-end"><button id="cancel" class="btn small btn-ghost">Annuler</button><button id="save" class="btn rose small">Enregistrer</button></div></div>`;
  openModal(html);
  document.getElementById('cancel').addEventListener('click', closeModal);
  document.getElementById('save').addEventListener('click', ()=>{
    rev.subjectId = document.getElementById('revSubject').value;
    rev.title = document.getElementById('revTitle').value;
    rev.date = document.getElementById('revDate').value;
    saveStore(); closeModal();
  });
}

function deleteLesson(id){
  store.lessons = store.lessons.filter(l=>l.id!==id);
  store.revisions = store.revisions.filter(r=>r.lessonId!==id);
  saveStore();
}

// Evals
function openEvalModal(evalId=null){
  const e = evalId ? store.evals.find(x=>x.id===evalId) : { id: uid('eval'), subjectId: store.subjects[0]?.id || null, nom:'', date:formatDate(addDays(new Date(),3)), pronostique:null, vraie:null, coefficient:1 };
  const subjOptions = store.subjects.map(s=>`<option value="${s.id}" ${s.id===e.subjectId?'selected':''}>${s.name}</option>`).join('');
  const html = `<h3>${evalId ? 'Modifier évaluation' : 'Nouvelle évaluation'}</h3>
    <div style="display:grid;gap:8px">
      <label>Matière<select id="evSubject" class="select">${subjOptions}</select></label>
      <label>Nom<input id="evName" class="input" value="${escapeHtml(e.nom)}"></label>
      <label>Date<input id="evDate" type="date" class="input" value="${e.date}"></label>
      <label>Note pronostiquée<input id="evPron" class="input" value="${e.pronostique ?? ''}"></label>
      <label>Vraie note (après éval)<input id="evReal" class="input" value="${e.vraie ?? ''}"></label>
      <label>Coefficient<input id="evCoef" class="input" value="${e.coefficient ?? 1}"></label>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="cancel" class="btn small btn-ghost">Annuler</button><button id="save" class="btn rose small">Enregistrer</button></div>
    </div>`;
  openModal(html);
  document.getElementById('cancel').addEventListener('click', closeModal);
  document.getElementById('save').addEventListener('click', ()=>{
    e.subjectId = document.getElementById('evSubject').value;
    e.nom = document.getElementById('evName').value;
    e.date = document.getElementById('evDate').value;
    e.pronostique = document.getElementById('evPron').value ? Number(document.getElementById('evPron').value) : null;
    e.vraie = document.getElementById('evReal').value ? Number(document.getElementById('evReal').value) : null;
    e.coefficient = document.getElementById('evCoef').value ? Number(document.getElementById('evCoef').value) : 1;

    // store
    const exists = store.evals.find(x=>x.id===e.id);
    if(exists) Object.assign(exists,e); else store.evals.push(e);

    // also create calendar event for the evaluation date
    const linkedEvent = {
      id: uid('ev'),
      title: `Évaluation — ${e.nom}`,
      subjectId: e.subjectId,
      type: 'Évaluation',
      date: e.date,
      startTime: '',
      endTime: '',
      priority: 'Haute',
      status: 'scheduled',
      linkedId: e.id
    };
    // avoid duplicate: remove existing event for same linkedId
    store.events = store.events.filter(ev2 => ev2.linkedId !== e.id);
    store.events.push(linkedEvent);

    saveStore();
    closeModal();
  });
}

// -----------------------------
// Calculs de notes / Moyennes
// -----------------------------

function computeSubjectAverage(subjectId) {
  const list = store.evals.filter(
    e => e.subjectId == subjectId && e.vraie != null
  );

  if (list.length === 0) return NaN;

  // Somme des coefficients
  const totalCoef = list.reduce((sum, e) => {
    const coef = Number(e.coef ?? e.coefficient) || 1;
    return sum + coef;
  }, 0);

  // Somme pondérée des notes
  const weightedSum = list.reduce((sum, e) => {
    const note = Number(e.vraie);
    const coef = Number(e.coef ?? e.coefficient) || 1;

    if (isNaN(note)) return sum;

    return sum + note * coef;
  }, 0);

  return weightedSum / totalCoef;
}


function computeGeneralAverage() {
  const list = store.evals.filter(
    e => e.vraie != null
  );

  if (list.length === 0) return NaN;

  let totalPoints = 0;
  let totalCoef = 0;

  list.forEach(e => {
    const note = Number(e.vraie);
    const coef = Number(e.coef ?? e.coefficient) || 1;

    if (!isNaN(note)) {
      totalPoints += note * coef;
      totalCoef += coef;
    }
  });

  if (totalCoef === 0) return NaN;

  return totalPoints / totalCoef;
}


// -----------------------------
// Sécurité HTML
// -----------------------------

function escapeHtml(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
