const STORAGE_KEY = 'taskflow_tasks';
let tasks = [];
let currentFilter = 'all';
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTasks(); renderDateHeader(); renderTasks(); bindEvents();
});

function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

function loadTasks() {
  const s = localStorage.getItem(STORAGE_KEY);
  tasks = s ? JSON.parse(s) : getSampleTasks();
}

function getSampleTasks() {
  return [
    { id:uid(), title:'Set up project repository', desc:'Initialize Git repo, add README',
      priority:'high', status:'done', due:'', createdAt:Date.now() },
    { id:uid(), title:'Design database schema', desc:'Plan tables for users and tasks',
      priority:'high', status:'inprogress', due:'', createdAt:Date.now() },
    { id:uid(), title:'Build REST API endpoints', desc:'CRUD for tasks',
      priority:'medium', status:'todo', due:'', createdAt:Date.now() },
    { id:uid(), title:'Write unit tests', desc:'Cover all logic with Jest',
      priority:'low', status:'todo', due:'', createdAt:Date.now() },
  ];
}

function renderTasks() {
  const board = document.getElementById('taskBoard');
  const emptyMsg = document.getElementById('emptyMsg');
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = tasks.filter(t => {
    const mf = currentFilter === 'all' || t.status === currentFilter;
    const ms = t.title.toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q);
    return mf && ms;
  });
  board.innerHTML = '';
  if (filtered.length === 0) { emptyMsg.classList.add('visible'); return; }
  emptyMsg.classList.remove('visible');
  const order = {high:0,medium:1,low:2};
  filtered.sort((a,b) => order[a.priority] - order[b.priority]);
  filtered.forEach(t => board.appendChild(createCard(t)));
  updateStats();
}

function createCard(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority}`;
  const isDone = task.status === 'done';
  const bc = {todo:'badge-todo',inprogress:'badge-inprogress',done:'badge-done'}[task.status];
  const bl = {todo:'To-Do',inprogress:'In Progress',done:'Done'}[task.status];
  let dueHTML = '';
  if (task.due) {
    const over = !isDone && new Date(task.due) < new Date();
    dueHTML = `<span class="due-date ${over?'overdue':''}">📅 ${formatDate(task.due)}</span>`;
  }
  card.innerHTML = `
    <div class="task-header">
      <span class="task-title ${isDone?'done-text':''}">${escapeHTML(task.title)}</span>
      <div class="task-actions">
        <button class="icon-btn edit-btn">✏️</button>
        <button class="icon-btn delete delete-btn">🗑️</button>
      </div>
    </div>
    ${task.desc ? `<p class="task-desc">${escapeHTML(task.desc)}</p>` : ''}
    <div class="task-meta">
      <span class="badge ${bc}">${bl}</span>${dueHTML}
    </div>`;
  card.querySelector('.edit-btn').addEventListener('click', () => openEdit(task.id));
  card.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
  return card;
}

function renderDateHeader() {
  document.getElementById('date-display').textContent =
    new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

function updateStats() {
  document.getElementById('stat-total').textContent = tasks.length;
  document.getElementById('stat-done').textContent = tasks.filter(t=>t.status==='done').length;
  document.getElementById('stat-pending').textContent = tasks.filter(t=>t.status!=='done').length;
}

function addTask(data) { tasks.unshift({id:uid(),createdAt:Date.now(),...data}); saveTasks(); renderTasks(); }
function updateTask(id,data) { tasks=tasks.map(t=>t.id===id?{...t,...data}:t); saveTasks(); renderTasks(); }
function deleteTask(id) { if(!confirm('Delete?'))return; tasks=tasks.filter(t=>t.id!==id); saveTasks(); renderTasks(); }

function openModal(mode='add', task=null) {
  document.getElementById('modalTitle').textContent = mode==='edit'?'Edit Task':'New Task';
  document.getElementById('taskTitle').value = task?.title||'';
  document.getElementById('taskDesc').value = task?.desc||'';
  document.getElementById('taskPriority').value = task?.priority||'medium';
  document.getElementById('taskStatus').value = task?.status||'todo';
  document.getElementById('taskDue').value = task?.due||'';
  editingId = task?.id||null;
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('taskTitle').focus();
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); editingId=null; }
function openEdit(id) { const t=tasks.find(t=>t.id===id); if(t) openModal('edit',t); }

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { alert('Title required!'); return; }
  const data = {
    title, desc:document.getElementById('taskDesc').value.trim(),
    priority:document.getElementById('taskPriority').value,
    status:document.getElementById('taskStatus').value,
    due:document.getElementById('taskDue').value
  };
  editingId ? updateTask(editingId,data) : addTask(data);
  closeModal();
}

function bindEvents() {
  document.getElementById('openModal').addEventListener('click', ()=>openModal('add'));
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('saveTask').addEventListener('click', saveTask);
  document.getElementById('modalOverlay').addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(); });
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); currentFilter=btn.dataset.filter; renderTasks();
  }));
  document.getElementById('searchInput').addEventListener('input', renderTasks);
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape') closeModal();
    if(e.key==='Enter' && document.getElementById('modalOverlay').classList.contains('active')) saveTask();
  });
}

function uid() { return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }
function escapeHTML(s) { const d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
function formatDate(ds) { const d=new Date(ds+'T00:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
