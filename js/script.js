// Phase 1, 2 & 4: State, Boot Logic, and Window Manager
document.addEventListener('DOMContentLoaded', () => {
    
    const bootScreen = document.getElementById('boot-screen');
    const startBtn = document.getElementById('start-btn');
    const desktop = document.getElementById('desktop');
    const sysClock = document.getElementById('sys-clock');
    const taskbarWindows = document.getElementById('taskbar-windows');
    const desktopIcons = document.querySelectorAll('.desktop-icon');

    // System State
    let osState = {
        booted: false,
        windows: {},
        activeZIndex: 1000
    };

    // --- Boot Sequence ---
    startBtn.addEventListener('click', () => {
        startBtn.style.animation = 'none';
        startBtn.textContent = 'Booting...';

        setTimeout(() => {
            bootScreen.classList.add('fade-out');
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                desktop.classList.remove('hidden');
                osState.booted = true;
                
                updateClock();
                setInterval(updateClock, 1000);
            }, 500);
        }, 600);
    });

    function updateClock() {
        if (!osState.booted) return;
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        minutes = minutes < 10 ? '0' + minutes : minutes;
        sysClock.textContent = hours + ':' + minutes + ' ' + ampm;
    }

    // --- Window Manager Data ---
    const windowContents = {
        'projects': {
            title: 'Projects.exe',
            content: '<h2>My Games</h2><p>Here will be a list of my amazing games and projects.</p><p>Currently loading data...</p>'
        },
        'about': {
            title: 'AboutMe.txt',
            content: '<h2>Faiber Piedrahita</h2><p>Gameplay Programmer & Game Developer.</p><p>I love building cozy and interactive experiences.</p>'
        }
    };

    // --- Window Manager Logic ---
    function openWindow(id) {
        // If window exists and is minimized, restore it
        if (osState.windows[id]) {
            const winEl = osState.windows[id].element;
            const tabEl = osState.windows[id].tab;
            if (winEl.classList.contains('hidden')) {
                winEl.classList.remove('hidden');
            }
            focusWindow(id);
            return;
        }

        // Create new window
        const data = windowContents[id];
        if (!data) return;

        // Window Element
        const winEl = document.createElement('div');
        winEl.className = 'window active';
        winEl.id = `win-${id}`;
        // Random slight offset for new windows to prevent exact overlap
        const offset = Object.keys(osState.windows).length * 20;
        winEl.style.top = `${50 + offset}px`;
        winEl.style.left = `${100 + offset}px`;

        winEl.innerHTML = `
            <div class="window-header">
                <span class="window-title">${data.title}</span>
                <div class="window-controls">
                    <button class="win-btn min"></button>
                    <button class="win-btn max"></button>
                    <button class="win-btn close"></button>
                </div>
            </div>
            <div class="window-content">${data.content}</div>
        `;

        desktop.appendChild(winEl);

        // Taskbar Tab
        const tabEl = document.createElement('button');
        tabEl.className = 'taskbar-tab active';
        tabEl.textContent = data.title;
        taskbarWindows.appendChild(tabEl);

        // Store reference
        osState.windows[id] = { element: winEl, tab: tabEl, isMaximized: false };

        // Events
        setupWindowEvents(id, winEl, tabEl);
        focusWindow(id);
    }

    function setupWindowEvents(id, winEl, tabEl) {
        const header = winEl.querySelector('.window-header');
        const closeBtn = winEl.querySelector('.win-btn.close');
        const minBtn = winEl.querySelector('.win-btn.min');
        const maxBtn = winEl.querySelector('.win-btn.max');

        // Focus on click anywhere on window
        winEl.addEventListener('mousedown', () => focusWindow(id));
        
        // Taskbar tab click
        tabEl.addEventListener('click', () => {
            if (winEl.classList.contains('hidden')) {
                // Restore if minimized
                winEl.classList.remove('hidden');
                focusWindow(id);
            } else if (winEl.classList.contains('active')) {
                // Minimize if currently active
                winEl.classList.add('hidden');
                tabEl.classList.remove('active');
            } else {
                // Focus if open but inactive
                focusWindow(id);
            }
        });

        // Window Controls
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            winEl.remove();
            tabEl.remove();
            delete osState.windows[id];
        });

        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            winEl.classList.add('hidden');
            tabEl.classList.remove('active');
        });

        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const winData = osState.windows[id];
            winData.isMaximized = !winData.isMaximized;
            if (winData.isMaximized) {
                winEl.classList.add('maximized');
            } else {
                winEl.classList.remove('maximized');
            }
        });

        // Draggable Logic
        let isDragging = false;
        let startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (osState.windows[id].isMaximized) return; // don't drag if maximized
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = winEl.offsetLeft;
            initialY = winEl.offsetTop;
            focusWindow(id);
            
            // Add listeners to document to track fast mouse movements
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            winEl.style.left = `${initialX + dx}px`;
            winEl.style.top = `${initialY + dy}px`;
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    function focusWindow(id) {
        osState.activeZIndex++;
        
        // Remove active class from all
        Object.values(osState.windows).forEach(win => {
            win.element.classList.remove('active');
            win.tab.classList.remove('active');
        });

        // Set clicked to active and bring to front
        const win = osState.windows[id];
        if (win) {
            win.element.style.zIndex = osState.activeZIndex;
            win.element.classList.add('active');
            win.tab.classList.add('active');
        }
    }

    // --- Desktop Icon Events ---
    desktopIcons.forEach(icon => {
        // Both single and double click work to make it accessible
        icon.addEventListener('click', () => {
             const windowId = icon.getAttribute('data-window');
             openWindow(windowId);
        });
    });
});
