document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const reminderInput = document.getElementById('reminder-input');
    const pomodoroInput = document.getElementById('pomodoro-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const themeToggle = document.getElementById('theme-toggle');
    const taskTemplate = document.getElementById('task-template');
    const petCompanion = document.getElementById('pet-companion');
    const petMessage = document.getElementById('pet-message');
    const catEyesIdle = document.querySelector('.cat-eyes-idle');
    const catEyesWorking = document.querySelector('.cat-eyes-working');
    const catEyesHappy = document.querySelector('.cat-eyes-happy');
    const catMouth = document.querySelector('.cat-mouth');
    const catMouthHappy = document.querySelector('.cat-mouth-happy');
    const alarmModal = document.getElementById('alarm-modal');
    const alarmTaskName = document.getElementById('alarm-task-name');
    const dismissAlarmBtn = document.getElementById('dismiss-alarm-btn');

    // Audio & Pet State
    let audioCtx = null;
    let petState = 'idle';
    let happyTimeout = null;
    let birdAlarmInterval = null;
    let titleFlashInterval = null;
    const originalTitle = document.title;

    // Events
    dismissAlarmBtn.addEventListener('click', () => {
        alarmModal.classList.add('hidden');
        if (birdAlarmInterval) clearInterval(birdAlarmInterval);
        birdAlarmInterval = null;
        if (titleFlashInterval) clearInterval(titleFlashInterval);
        titleFlashInterval = null;
        document.title = originalTitle;
        setPetState('idle');
    });

    // State
    let tasks = JSON.parse(localStorage.getItem('cute-tasks')) || [];
    let isDarkMode = localStorage.getItem('cute-theme') === 'dark';

    // Initialize Theme
    if (isDarkMode) {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        themeToggle.querySelector('.icon').textContent = '☀️';
    }

    // Initialize Tasks
    renderTasks();
    updateProgress();

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
            themeToggle.querySelector('.icon').textContent = '☀️';
            localStorage.setItem('cute-theme', 'dark');
        } else {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
            themeToggle.querySelector('.icon').textContent = '🌙';
            localStorage.setItem('cute-theme', 'light');
        }
    });

    // Functions
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTick() {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    function playDing() {
        if (!audioCtx) return;
        const notes = [440.00, 554.37, 659.25, 880.00]; // A4, C#5, E5, A5
        const now = audioCtx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const start = now + (i * 0.1);
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(0.15, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(start);
            osc.stop(start + 0.6);
        });
    }

    function playReminderChime() {
        if (!audioCtx) initAudio();
        if (!audioCtx) return;
        const notes = [659.25, 783.99, 880.00]; // E5, G5, A5
        const now = audioCtx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            const start = now + (i * 0.15);
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(0.2, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(start);
            osc.stop(start + 0.8);
        });
    }

    function playBirdAlarmSequence() {
        if (!audioCtx) initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
            const t = now + (i * 0.3);
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            
            osc.frequency.setValueAtTime(3200, t);
            osc.frequency.exponentialRampToValueAtTime(1500, t + 0.1);
            
            gainNode.gain.setValueAtTime(0, t);
            gainNode.gain.linearRampToValueAtTime(0.3, t + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    function triggerFullScreenAlarm(taskName) {
        if (!audioCtx) initAudio();
        alarmTaskName.textContent = taskName;
        alarmModal.classList.remove('hidden');
        setPetState('working', 'Wake up! Alarm! 🐦⏰');
        
        // Aggressively grab attention
        try { window.focus(); } catch(e) {}
        
        // Flash the browser tab title so user sees it from any tab
        if (titleFlashInterval) clearInterval(titleFlashInterval);
        let flashOn = true;
        titleFlashInterval = setInterval(() => {
            document.title = flashOn ? '⚠️ ALARM! ' + taskName : originalTitle;
            flashOn = !flashOn;
        }, 800);
        
        // Start repeating bird chirps
        playBirdAlarmSequence();
        if (birdAlarmInterval) clearInterval(birdAlarmInterval);
        birdAlarmInterval = setInterval(playBirdAlarmSequence, 1000);
    }

    function setPetState(state, message) {
        if (petState === 'happy' && state !== 'happy') return;
        
        petState = state;
        petCompanion.className = `pet-wrapper ${state}`;
        
        if (message) {
            petMessage.textContent = message;
            petCompanion.classList.add('active-msg');
            setTimeout(() => petCompanion.classList.remove('active-msg'), 3000);
        }
        
        if (!catEyesIdle) return; // Guard for initial render before DOM is ready
        
        catEyesIdle.classList.add('hidden');
        catEyesWorking.classList.add('hidden');
        catEyesHappy.classList.add('hidden');
        catMouth.classList.remove('hidden');
        catMouthHappy.classList.add('hidden');
        
        if (state === 'idle') {
            catEyesIdle.classList.remove('hidden');
            if (!message) petMessage.textContent = 'Zzz...';
        } else if (state === 'working') {
            catEyesWorking.classList.remove('hidden');
            if (!message) petMessage.textContent = 'Focusing...';
        } else if (state === 'happy') {
            catEyesHappy.classList.remove('hidden');
            catMouth.classList.add('hidden');
            catMouthHappy.classList.remove('hidden');
            if (!message) petMessage.textContent = 'Great job!! ✨';
            
            if (happyTimeout) clearTimeout(happyTimeout);
            happyTimeout = setTimeout(() => {
                petState = 'idle';
                updatePetFromTasks();
            }, 3000);
        }
    }

    function updatePetFromTasks() {
        if (petState === 'happy') return;
        const isAnyRunning = tasks.some(t => t.isRunning && !t.completed);
        if (isAnyRunning) {
            setPetState('working', 'You got this! 🐾');
        } else {
            setPetState('idle', 'Zzz...');
        }
    }

    function saveTasks() {
        localStorage.setItem('cute-tasks', JSON.stringify(tasks));
        updateProgress();
    }

    function addTask() {
        initAudio(); // warm up audio and require interaction
        const text = taskInput.value.trim();
        const reminderVal = reminderInput.value;
        const pomodoroVal = parseInt(pomodoroInput.value, 10);
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            elapsedTime: 0,
            isRunning: false,
            lastStarted: null,
            reminderTime: reminderVal || null,
            pomodoroMinutes: isNaN(pomodoroVal) ? null : pomodoroVal,
            pomodoroFinished: false,
            notified: false
        };

        tasks.push(newTask);
        saveTasks();
        
        if (reminderVal && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        
        // Add to DOM
        const taskEl = createTaskElement(newTask);
        taskList.appendChild(taskEl);
        
        // Clear input
        taskInput.value = '';
        reminderInput.value = '';
        pomodoroInput.value = '';
        checkEmptyState();
        
        // Scroll to bottom
        taskList.scrollTop = taskList.scrollHeight;
    }

    function createTaskElement(task) {
        const clone = taskTemplate.content.cloneNode(true);
        const li = clone.querySelector('.task-item');
        const checkbox = clone.querySelector('.task-checkbox');
        const textSpan = clone.querySelector('.task-text');
        const deleteBtn = clone.querySelector('.delete-btn');
        const timerBtn = clone.querySelector('.timer-btn');
        const timerDisplay = clone.querySelector('.timer-display');
        const playIcon = clone.querySelector('.play-icon');
        const pauseIcon = clone.querySelector('.pause-icon');
        const pomodoroDisplay = clone.querySelector('.pomodoro-display');
        const pomodoroText = clone.querySelector('.pomodoro-time-text');
        const reminderDisplay = clone.querySelector('.reminder-display');
        const reminderText = clone.querySelector('.reminder-time-text');

        li.dataset.id = task.id;
        textSpan.textContent = task.text;
        checkbox.checked = task.completed;
        
        if (task.pomodoroMinutes && !task.pomodoroFinished) {
            pomodoroDisplay.classList.remove('hidden');
            const totalMs = task.pomodoroMinutes * 60 * 1000;
            const remainingMs = Math.max(0, totalMs - task.elapsedTime);
            pomodoroText.textContent = formatTime(remainingMs);
            timerDisplay.classList.add('hidden');
        }
        
        if (task.reminderTime) {
            reminderDisplay.classList.remove('hidden');
            const date = new Date(task.reminderTime);
            reminderText.textContent = date.toLocaleString([], {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            if (task.notified && !task.completed) {
                reminderDisplay.classList.add('due');
            }
        }

        if (task.elapsedTime === undefined) {
            task.elapsedTime = 0;
            task.isRunning = false;
        }
        timerDisplay.textContent = formatTime(task.elapsedTime);
        if (task.isRunning) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }

        if (task.completed) {
            li.classList.add('completed');
        }

        // Checkbox event
        checkbox.addEventListener('change', () => {
            initAudio();
            task.completed = checkbox.checked;
            if (task.completed) {
                li.classList.add('completed');
                playDing();
                setPetState('happy', 'Yay! One task done! 🎉');
                if (task.isRunning) {
                    task.isRunning = false;
                    task.elapsedTime += (Date.now() - task.lastStarted);
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                    timerDisplay.textContent = formatTime(task.elapsedTime);
                }
            } else {
                li.classList.remove('completed');
            }
            saveTasks();
        });

        // Delete event
        deleteBtn.addEventListener('click', () => {
            li.classList.add('fade-out');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== task.id);
                li.remove();
                saveTasks();
                checkEmptyState();
                updatePetFromTasks();
            }, 300); // match transition duration
        });

        // Timer event
        timerBtn.addEventListener('click', () => {
            initAudio();
            if (task.completed) return;
            
            task.isRunning = !task.isRunning;
            if (task.isRunning) {
                task.lastStarted = Date.now();
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
            } else {
                if (task.lastStarted) {
                    task.elapsedTime += (Date.now() - task.lastStarted);
                }
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
            }
            saveTasks();
            updatePetFromTasks();
        });

        return li;
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            taskList.appendChild(createTaskElement(task));
        });
        checkEmptyState();
        updatePetFromTasks();
    }

    function checkEmptyState() {
        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            taskList.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            taskList.classList.remove('hidden');
        }
    }

    function updateProgress() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        
        progressText.textContent = `${completed}/${total} tasks done`;
        
        let percentage = 0;
        if (total > 0) {
            percentage = (completed / total) * 100;
        }
        
        progressFill.style.width = `${percentage}%`;
    }

    // Timer & Reminder Loop
    setInterval(() => {
        let needsSave = false;
        let isAnyRunning = false;
        const now = Date.now();
        tasks.forEach(task => {
            // Timer logic
            if (task.isRunning && !task.completed) {
                isAnyRunning = true;
                task.elapsedTime += (now - task.lastStarted);
                task.lastStarted = now;
                needsSave = true;
                
                const li = document.querySelector(`li[data-id="${task.id}"]`);
                if (li) {
                    if (task.pomodoroMinutes && !task.pomodoroFinished) {
                        const pText = li.querySelector('.pomodoro-time-text');
                        const totalMs = task.pomodoroMinutes * 60 * 1000;
                        const remainingMs = Math.max(0, totalMs - task.elapsedTime);
                        if (pText) pText.textContent = formatTime(remainingMs);
                        
                        if (remainingMs <= 0) {
                            task.isRunning = false;
                            task.pomodoroFinished = true;
                            const playIcon = li.querySelector('.play-icon');
                            const pauseIcon = li.querySelector('.pause-icon');
                            if(playIcon) playIcon.classList.remove('hidden');
                            if(pauseIcon) pauseIcon.classList.add('hidden');
                            
                            triggerFullScreenAlarm('Pomodoro Complete: ' + task.text);
                            
                            if (Notification.permission === 'granted') {
                                new Notification('⏰ Pomodoro Finished!', {
                                    body: task.text,
                                    requireInteraction: true
                                });
                            }
                        }
                    } else {
                        const display = li.querySelector('.timer-display');
                        if (display) display.textContent = formatTime(task.elapsedTime);
                    }
                }
            }
            
            // Reminder logic
            if (task.reminderTime && !task.completed && !task.notified) {
                const triggerTime = new Date(task.reminderTime).getTime();
                if (now >= triggerTime) {
                    task.notified = true;
                    needsSave = true;
                    
                    const li = document.querySelector(`li[data-id="${task.id}"]`);
                    if (li) {
                        const rDisplay = li.querySelector('.reminder-display');
                        if (rDisplay) rDisplay.classList.add('due');
                    }
                    
                    triggerFullScreenAlarm('Task Reminder: ' + task.text);
                    
                    if (Notification.permission === 'granted') {
                        new Notification('Cute To-Do Alarm 🐦⏰', {
                            body: task.text,
                            requireInteraction: true
                        });
                    }
                }
            }
        });
        
        if (isAnyRunning) {
            playTick();
        }
        
        if (needsSave) {
            localStorage.setItem('cute-tasks', JSON.stringify(tasks));
        }
    }, 1000);

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function formatTimeHuman(ms) {
        const totalMinutes = Math.floor(ms / 60000);
        if (totalMinutes < 1) return 'under 1m';
        if (totalMinutes < 60) return totalMinutes + 'm';
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h + 'h ' + m + 'm';
    }

    // Analytics
    const dayCompleteBtn = document.getElementById('day-complete-btn');
    const analyticsModal = document.getElementById('analytics-modal');
    const closeAnalytics = document.getElementById('close-analytics');
    const clearDayBtn = document.getElementById('clear-day-btn');

    dayCompleteBtn.addEventListener('click', showAnalytics);

    closeAnalytics.addEventListener('click', () => {
        analyticsModal.classList.add('hidden');
    });

    clearDayBtn.addEventListener('click', () => {
        if (confirm('Clear all tasks and start fresh? 🌅')) {
            tasks = [];
            saveTasks();
            renderTasks();
            analyticsModal.classList.add('hidden');
            setPetState('happy', 'See you tomorrow! 🌙');
        }
    });

    function showAnalytics() {
        playDing();

        const total = tasks.length;
        const completedTasks = tasks.filter(t => t.completed);
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedCount = completedTasks.length;
        const pendingCount = pendingTasks.length;

        // Productivity Score
        const score = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        document.getElementById('score-value').textContent = score + '%';
        document.getElementById('score-circle').style.background =
            `conic-gradient(var(--accent) ${score}%, var(--bg-color) ${score}%)`;

        // Stats
        document.getElementById('stat-completed').textContent = completedCount;
        document.getElementById('stat-pending').textContent = pendingCount;

        const totalTimeMs = tasks.reduce((sum, t) => sum + (t.elapsedTime || 0), 0);
        document.getElementById('stat-total-time').textContent = formatTimeHuman(totalTimeMs);

        // Longest Task
        const tasksWithTime = completedTasks.filter(t => t.elapsedTime > 0);
        const longestSection = document.getElementById('longest-task-section');
        const quickestSection = document.getElementById('quickest-task-section');

        if (tasksWithTime.length > 0) {
            const sorted = [...tasksWithTime].sort((a, b) => b.elapsedTime - a.elapsedTime);
            const longest = sorted[0];
            const quickest = sorted[sorted.length - 1];

            document.getElementById('longest-task-text').textContent =
                `"${longest.text}" — ${formatTimeHuman(longest.elapsedTime)}`;
            longestSection.classList.remove('hidden');

            document.getElementById('quickest-task-text').textContent =
                `"${quickest.text}" — ${formatTimeHuman(quickest.elapsedTime)}`;
            quickestSection.classList.remove('hidden');
        } else {
            longestSection.classList.add('hidden');
            quickestSection.classList.add('hidden');
        }

        // On-Time Tasks (completed before or at reminder time)
        const ontimeSection = document.getElementById('ontime-section');
        const tasksWithReminder = completedTasks.filter(t => t.reminderTime);
        if (tasksWithReminder.length > 0) {
            const onTime = tasksWithReminder.filter(t => !t.notified);
            document.getElementById('ontime-text').textContent =
                `${onTime.length} of ${tasksWithReminder.length} tasks finished before their deadline`;
            ontimeSection.classList.remove('hidden');
        } else {
            ontimeSection.classList.add('hidden');
        }

        // Pending List
        const pendingSection = document.getElementById('pending-list-section');
        const pendingList = document.getElementById('pending-list');
        pendingList.innerHTML = '';
        if (pendingCount > 0) {
            pendingTasks.forEach(t => {
                const li = document.createElement('li');
                li.textContent = t.text;
                pendingList.appendChild(li);
            });
            pendingSection.classList.remove('hidden');
        } else {
            pendingSection.classList.add('hidden');
        }

        // Show Modal
        analyticsModal.classList.remove('hidden');
        setPetState('happy', score >= 80 ? 'Amazing day!! 🏆' : score >= 50 ? 'Good effort! 💪' : 'Tomorrow is a new day! 🌱');
    }
});
