// Phase 1 & 2: State and Boot Logic
document.addEventListener('DOMContentLoaded', () => {
    
    const bootScreen = document.getElementById('boot-screen');
    const startBtn = document.getElementById('start-btn');
    const desktop = document.getElementById('desktop');
    const sysClock = document.getElementById('sys-clock');

    // System State
    let osState = {
        booted: false,
        openWindows: [],
        activeWindowId: null
    };

    // Boot Sequence
    startBtn.addEventListener('click', () => {
        // Optional: Play sound effect here
        
        // Remove animation from button
        startBtn.style.animation = 'none';
        startBtn.textContent = 'Booting...';

        // Simulate boot delay
        setTimeout(() => {
            bootScreen.classList.add('fade-out');
            
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                desktop.classList.remove('hidden');
                osState.booted = true;
                
                // Initialize desktop features
                updateClock();
                setInterval(updateClock, 1000);
                
            }, 500); // Wait for fade out
        }, 600); // Artificial loading time
    });

    // Desktop Clock Logic
    function updateClock() {
        if (!osState.booted) return;
        
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        const strTime = hours + ':' + minutes + ' ' + ampm;
        sysClock.textContent = strTime;
    }

});
