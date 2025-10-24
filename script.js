(() => {
  const THEME_KEY = 'todo_theme_v2';
  const TASKS_KEY = 'todo_tasks_v2';

  const body = document.body;
  const themeButtons = Array.from(document.querySelectorAll('#themeToggle'));
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));

  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(newTheme);
      try { btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 220 }); } catch(e){}
    });
  });

  const currentPage = (location.pathname.split('/').pop() || 'index.html');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');

    link.addEventListener('click', (e) => {
      const target = link.getAttribute('href');
      if (!target || target === currentPage) return;
      e.preventDefault();

      localStorage.setItem(THEME_KEY, body.classList.contains('dark') ? 'dark' : 'light');

      body.classList.remove('page--fade-in');
      body.classList.add('page--fade-out');

      setTimeout(() => location.href = target, 300);
    });
  });

  function applyTheme(name) {
    if (name === 'dark') body.classList.add('dark');
    else body.classList.remove('dark');
    localStorage.setItem(THEME_KEY, name);
  }

  const taskListEl = document.getElementById('taskList');
  if (!taskListEl) return;
  const taskTitleEl = document.getElementById('taskTitle');
  const taskDescEl = document.getElementById('taskDesc');
  const taskSubsEl = document.getElementById('taskSubs');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const filterSelect = document.getElementById('filterSelect');
  const taskCounter = document.getElementById('taskCounter');
  const clearCompletedBtn = document.getElementById('clearCompleted');

  let tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    updateCounter();
  }

  function updateCounter() {
    if (!taskCounter) return;
    taskCounter.textContent = `Задач: ${tasks.length}`;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function createTaskElement(task, idx) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.done) li.classList.add('done');
    li.dataset.id = task.id;

    const markBtn = document.createElement('button');
    markBtn.className = 'mark-btn';
    markBtn.textContent = '–';
    markBtn.title = task.done ? 'Отметить как невыполненное' : 'Отметить выполненным';
    markBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      tasks[idx].done = !tasks[idx].done;
      saveTasks();
      renderTasks();
    });

    const card = document.createElement('div');
    card.className = 'task-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;
    titleEl.tabIndex = 0;
    titleEl.style.cursor = 'pointer';
    titleEl.addEventListener('click', () => startInlineEdit(idx, li));

    const detailsEl = document.createElement('div');
    detailsEl.className = 'task-details';
    detailsEl.textContent = task.details || '';

    const subsEl = document.createElement('div');
    subsEl.className = 'subtasks';
    if (task.subtasks && task.subtasks.length) {
      task.subtasks.forEach((sub, sIdx) => {
        const subWrap = document.createElement('label');
        subWrap.className = 'subtask';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = !!sub.done;
        chk.addEventListener('change', () => {
          tasks[idx].subtasks[sIdx].done = chk.checked;
          const allDone = tasks[idx].subtasks.every(s => s.done);
          if (allDone) tasks[idx].done = true;
          saveTasks();
          renderTasks();
        });

        const span = document.createElement('span');
        span.textContent = sub.text;
        if (sub.done) span.style.textDecoration = 'line-through';

        subWrap.append(chk, span);
        subsEl.appendChild(subWrap);
      });
    }

    const controls = document.createElement('div');
    controls.className = 'task-controls';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Редактировать';
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(idx, li); });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.title = 'Удалить';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('Удалить задачу?')) return;
      tasks.splice(idx, 1);
      saveTasks();
      renderTasks();
    });

    controls.append(editBtn, delBtn);

    card.append(titleEl);
    if (task.details) card.append(detailsEl);
    if (subsEl.childElementCount) card.append(subsEl);

    li.append(markBtn, card, controls);
    return li;
  }

  function renderTasks() {
    taskListEl.innerHTML = '';
    const filter = filterSelect ? filterSelect.value : 'all';
    tasks.forEach((t, i) => {
      if (filter === 'active' && t.done) return;
      if (filter === 'done' && !t.done) return;
      const el = createTaskElement(t, i);
      taskListEl.appendChild(el);
    });
    updateCounter();
  }

  function startInlineEdit(idx, listItem) {
    const task = tasks[idx];
    const card = listItem.querySelector('.task-card');
    card.innerHTML = '';

    const ttl = document.createElement('input');
    ttl.className = 'input';
    ttl.value = task.title;

    const det = document.createElement('textarea');
    det.className = 'textarea';
    det.rows = 2;
    det.value = task.details || '';

    const subsInput = document.createElement('input');
    subsInput.className = 'input';
    subsInput.value = task.subtasks && task.subtasks.length ? task.subtasks.map(s=>s.text).join(', ') : '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn--primary';
    saveBtn.textContent = 'Сохранить';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn--muted';
    cancelBtn.textContent = 'Отмена';

    const btnRow = document.createElement('div');
    btnRow.style.display='flex';
    btnRow.style.gap='8px';
    btnRow.style.marginTop='8px';
    btnRow.append(saveBtn, cancelBtn);

    card.append(ttl, det, subsInput, btnRow);

    saveBtn.addEventListener('click', () => {
      const newTitle = ttl.value.trim();
      if (!newTitle) { alert('Название не может быть пустым'); return; }
      const newDet = det.value.trim();
      const newSubs = subsInput.value.trim();
      const subtasks = newSubs ? newSubs.split(',').map(s => ({ text: s.trim(), done:false })) : [];
      tasks[idx].title = newTitle;
      tasks[idx].details = newDet;
      tasks[idx].subtasks = subtasks;
      saveTasks();
      renderTasks();
    });

    cancelBtn.addEventListener('click', () => renderTasks());
  }

  function addTaskFromForm() {
    const title = taskTitleEl.value.trim();
    if (!title) { alert('Введите название задачи'); taskTitleEl.focus(); return; }
    const details = taskDescEl.value.trim();
    const subsText = taskSubsEl.value.trim();
    const subtasks = subsText ? subsText.split(',').map(s => ({ text: s.trim(), done:false })).filter(s=>s.text) : [];
    const newTask = { id: uid(), title, details, subtasks, done:false, createdAt: Date.now() };
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskTitleEl.value = '';
    taskDescEl.value = '';
    taskSubsEl.value = '';
    try { addTaskBtn.animate([{ transform:'scale(1)' }, { transform:'scale(1.04)' }, { transform:'scale(1)'}], { duration: 180 }); } catch(e){}
  }

  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', () => {
      if (!confirm('Удалить все выполненные задачи?')) return;
      tasks = tasks.filter(t => !t.done);
      saveTasks();
      renderTasks();
    });
  }

  if (filterSelect) filterSelect.addEventListener('change', renderTasks);
  addTaskBtn.addEventListener('click', addTaskFromForm);
  taskTitleEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTaskFromForm(); });

  renderTasks();

})();
