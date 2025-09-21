// Grab elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Add Task function
function addTask() {
    const taskText = taskInput.value.trim(); // Remove extra spaces
    if(taskText === "") return; // Don't add empty tasks

    // Create list item
    const li = document.createElement('li');
    li.textContent = taskText;

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';

    // Delete task on click
    deleteBtn.addEventListener('click', () => {
        taskList.removeChild(li);
    });

    // Append delete button to li
    li.appendChild(deleteBtn);

    // Add li to the task list
    taskList.appendChild(li);

    // Clear input
    taskInput.value = '';
}

// Event listener for button
addTaskBtn.addEventListener('click', addTask);

// Optional: Press Enter to add task
taskInput.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') addTask();
});
