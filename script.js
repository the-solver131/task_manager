// Grab elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const aiTaskBtn = document.getElementById('aiTaskBtn');
const taskList = document.getElementById('taskList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// ----------------------
// Storage Helpers
// ----------------------
function getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ----------------------
// Task Functions
// ----------------------
function createTaskElement(taskText, completed=false) {
    const li = document.createElement('li');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = completed;

    // Task text
    const span = document.createElement('span');
    span.textContent = taskText;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'edit-btn';
    editBtn.addEventListener('click', () => {
        const newText = prompt("Edit task:", span.textContent);
        if(newText !== null && newText.trim() !== "") {
            span.textContent = newText.trim();
            updateStorage();
        }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
        li.remove();
        updateStorage();
        updateProgress();
    });

    // Events
    checkbox.addEventListener('change', () => {
        updateStorage();
        updateProgress();
    });

    // Append
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
}

function addTask(taskText, completed=false) {
    if(taskText.trim() === "") return;
    const li = createTaskElement(taskText, completed);
    taskList.appendChild(li);
    updateStorage();
    updateProgress();
}

// ----------------------
// Progress + Storage
// ----------------------
function updateStorage() {
    const tasks = [];
    taskList.querySelectorAll('li').forEach(li => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const span = li.querySelector('span');
        tasks.push({
            text: span.textContent,
            completed: checkbox.checked
        });
    });
    saveTasks(tasks);
}

function updateProgress() {
    const tasks = taskList.querySelectorAll('li');
    const total = tasks.length;
    let completed = 0;

    tasks.forEach(task => {
        const checkbox = task.querySelector('input[type="checkbox"]');
        if(checkbox && checkbox.checked) completed++;
    });

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = percent + "%";
    progressText.textContent = `${percent}% Completed`;
}

function loadTasks() {
    const tasks = getTasks();
    tasks.forEach(task => addTask(task.text, task.completed));
}

// ----------------------
// AI Suggestion (Mock)
// ----------------------
function suggestTask() {
    // Mock: in real life, replace with fetch() to OpenAI/HuggingFace API
    const fakeTasks = [
        "Review yesterday’s notes",
        "Do 20 minutes of coding practice",
        "Read 5 pages of a book",
        "Take a 10-minute walk",
        "Organize your study desk"
    ];
    const randomTask = fakeTasks[Math.floor(Math.random() * fakeTasks.length)];
    addTask(randomTask);
}

// ----------------------
// Event Listeners
// ----------------------
addTaskBtn.addEventListener('click', () => {
    addTask(taskInput.value);
    taskInput.value = '';
});

taskInput.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') {
        addTask(taskInput.value);
        taskInput.value = '';
    }
});

aiTaskBtn.addEventListener('click', suggestTask);

// ----------------------
// Init
// ----------------------
loadTasks();

