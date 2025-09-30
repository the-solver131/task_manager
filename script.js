/* TaskFlow - Vanilla JS Task Manager with localStorage */

// Storage keys
const STORAGE_KEY = "taskflow_tasks";
const STREAK_KEY = "taskflow_streak";

// App state
let tasks = loadTasksFromStorage();
let streakHistory = loadStreakHistory();
let viewMode = "list";
let statusFilter = "all";
let priorityFilter = "all";
let sortBy = "created";
let editingId = null;

// DOM elements
const tasksContainer = document.getElementById("tasksContainer");
const btnAdd = document.getElementById("btnAdd");
const viewList = document.getElementById("viewList");
const viewGrid = document.getElementById("viewGrid");
const sortSelect = document.getElementById("sortSelect");
const filterBtns = document.querySelectorAll(".filter-btn");
const prioBtns = document.querySelectorAll(".prio-btn");

// Stats elements
const statTotal = document.getElementById("statTotal");
const statCompleted = document.getElementById("statCompleted");
const statPending = document.getElementById("statPending");

// Progress elements
const todayPercent = document.getElementById("todayPercent");
const todayBar = document.getElementById("todayBar");
const todayCount = document.getElementById("todayCount");
const weeklyPercent = document.getElementById("weeklyPercent");
const weeklyBar = document.getElementById("weeklyBar");
const weeklyCount = document.getElementById("weeklyCount");
const streakDays = document.getElementById("streakDays");
const focusTime = document.getElementById("focusTime");

// Modal elements
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDue = document.getElementById("taskDue");
const taskEstimate = document.getElementById("taskEstimate");
const taskPriority = document.getElementById("taskPriority");
const cancelBtn = document.getElementById("cancelBtn");

// Storage functions
function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasksToStorage(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadStreakHistory() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStreakHistory(history) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(history));
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function toDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}

// Task CRUD operations
function createTask(taskData) {
  const task = {
    id: generateId(),
    title: taskData.title.trim(),
    dueDate: taskData.dueDate || null,
    estimateMins: parseInt(taskData.estimateMins) || 0,
    priority: taskData.priority || 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  tasks.unshift(task);
  saveAndRender();
}

function updateTask(id, updates) {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, ...updates } : task
  );
  saveAndRender();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveAndRender();
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const completed = !task.completed;
  const updates = {
    completed,
    completedAt: completed ? new Date().toISOString() : null
  };

  updateTask(id, updates);
  updateStreakFromTasks();
}

// Filtering and sorting
function getVisibleTasks() {
  let filtered = [...tasks];

  // Apply status filter
  if (statusFilter === "active") {
    filtered = filtered.filter(task => !task.completed);
  } else if (statusFilter === "completed") {
    filtered = filtered.filter(task => task.completed);
  }

  // Apply priority filter
  if (priorityFilter !== "all") {
    filtered = filtered.filter(task => task.priority === priorityFilter);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default: // created
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return filtered;
}

// Progress calculations
function calcTodayProgress() {
  const today = toDateKey();
  const todayTasks = tasks.filter(task => 
    toDateKey(new Date(task.createdAt)) === today
  );
  const total = todayTasks.length;
  const completed = todayTasks.filter(task => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

function calcWeeklyProgress() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekTasks = tasks.filter(task => 
    new Date(task.createdAt) >= weekAgo
  );
  const total = weekTasks.length;
  const completed = weekTasks.filter(task => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

function computeStreak() {
  if (streakHistory.length === 0) return 0;
  
  const sortedHistory = [...new Set(streakHistory)].sort().reverse();
  let streak = 0;
  
  let currentDate = new Date();
  
  for (let i = 0; i < 365; i++) {
    const dateKey = toDateKey(currentDate);
    if (sortedHistory.includes(dateKey)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function calcFocusTime() {
  const totalMins = tasks
    .filter(task => !task.completed)
    .reduce((sum, task) => sum + (task.estimateMins || 0), 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function updateStreakFromTasks() {
  const completedDates = tasks
    .filter(task => task.completed && task.completedAt)
    .map(task => toDateKey(new Date(task.completedAt)));
  
  streakHistory = [...new Set([...streakHistory, ...completedDates])];
  saveStreakHistory(streakHistory);
}

// Rendering functions
function renderStats() {
  statTotal.textContent = tasks.length;
  statCompleted.textContent = tasks.filter(task => task.completed).length;
  statPending.textContent = tasks.filter(task => !task.completed).length;
}

function renderProgress() {
  // Today's progress
  const today = calcTodayProgress();
  todayPercent.textContent = `${today.percent}%`;
  todayBar.style.width = `${today.percent}%`;
  todayCount.textContent = `${today.completed} of ${today.total} tasks completed`;

  // Weekly progress
  const weekly = calcWeeklyProgress();
  weeklyPercent.textContent = `${weekly.percent}%`;
  weeklyBar.style.width = `${weekly.percent}%`;
  weeklyCount.textContent = `${weekly.completed} of ${weekly.total} tasks completed`;

  // Streak
  streakDays.textContent = computeStreak();

  // Focus time
  focusTime.textContent = calcFocusTime();
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  
  // Update container class based on view mode
  tasksContainer.className = viewMode === "grid" ? "tasks-grid" : "tasks-list";
  
  // Clear container
  tasksContainer.innerHTML = '';

  if (visibleTasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="icon">📋</div>
      <h3>No tasks yet</h3>
      <p>Get started by creating your first task</p>
      <button class="primary" onclick="openAddModal()">+ Create Task</button>
    `;
    tasksContainer.appendChild(emptyState);
    return;
  }

  visibleTasks.forEach(task => {
    const taskEl = createTaskElement(task);
    tasksContainer.appendChild(taskEl);
  });
}

function createTaskElement(task) {
  const taskEl = document.createElement('div');
  taskEl.className = `task ${task.completed ? 'completed' : ''}`;

  taskEl.innerHTML = `
    <div class="left">
      <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} 
             onchange="toggleComplete('${task.id}')">
      <div>
        <div class="title">${escapeHtml(task.title)}</div>
        <div class="meta">
          ${task.dueDate ? `Due: ${formatDate(task.dueDate)}` : ''}
          ${task.estimateMins ? ` • ${task.estimateMins}m` : ''}
        </div>
      </div>
      <div class="badge ${task.priority}">${task.priority}</div>
    </div>
    <div class="actions">
      <button class="icon-btn" onclick="openEditModal('${task.id}')" title="Edit">✏️</button>
      <button class="icon-btn delete" onclick="confirmDelete('${task.id}')" title="Delete">🗑️</button>
    </div>
  `;

  return taskEl;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function saveAndRender() {
  saveTasksToStorage(tasks);
  renderStats();
  renderProgress();
  renderTasks();
}

// Modal functions
function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Add Task";
  taskForm.reset();
  taskPriority.value = "medium";
  modal.classList.remove("hidden");
  taskTitle.focus();
}

function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  editingId = taskId;
  modalTitle.textContent = "Edit Task";
  taskTitle.value = task.title;
  taskDue.value = task.dueDate || "";
  taskEstimate.value = task.estimateMins || "";
  taskPriority.value = task.priority;
  modal.classList.remove("hidden");
  taskTitle.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  editingId = null;
}

function confirmDelete(taskId) {
  if (confirm("Are you sure you want to delete this task?")) {
    deleteTask(taskId);
  }
}

// Event listeners
btnAdd.addEventListener('click', openAddModal);
cancelBtn.addEventListener('click', closeModal);

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = {
    title: taskTitle.value,
    dueDate: taskDue.value,
    estimateMins: taskEstimate.value,
    priority: taskPriority.value
  };

  if (editingId) {
    updateTask(editingId, formData);
  } else {
    createTask(formData);
  }
  
  closeModal();
});

// View toggle
viewList.addEventListener('click', () => {
  viewMode = "list";
  viewList.classList.add('active');
  viewGrid.classList.remove('active');
  renderTasks();
});

viewGrid.addEventListener('click', () => {
  viewMode = "grid";
  viewGrid.classList.add('active');
  viewList.classList.remove('active');
  renderTasks();
});

// Sort select
sortSelect.addEventListener('change', (e) => {
  sortBy = e.target.value;
  renderTasks();
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    statusFilter = btn.dataset.filter;
    renderTasks();
  });
});

prioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    prioBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    priorityFilter = btn.dataset.prio;
    renderTasks();
  });
});

// Close modal on outside click
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openAddModal();
  }
});

// Initialize app
function init() {
  updateStreakFromTasks();
  saveAndRender();
}

// Start the app
init();

// Make functions available globally for inline event handlers
window.toggleComplete = toggleComplete;
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.openAddModal = openAddModal;