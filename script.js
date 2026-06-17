// Slides deck data and system
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const slideItems = document.querySelectorAll('.slide-item');
const progressBarFill = document.querySelector('.nav-progress-bar-fill');
const slideCounterText = document.querySelector('.nav-slide-counter');
const sidebar = document.querySelector('.sidebar');
let autoplayInterval = null;
let isAutoplayActive = false;
const AUTOPLAY_DELAY = 6000; // 6s per slide

// Initialize presentation slides
function showSlide(index) {
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    
    currentSlideIndex = index;
    
    // Toggle active slide
    slides.forEach((slide, i) => {
        if (i === index) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    // Sync sidebar selection
    slideItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });

    // Update progress bar
    const progressPercent = ((index + 1) / slides.length) * 100;
    progressBarFill.style.width = `${progressPercent}%`;
    slideCounterText.textContent = `${index + 1} / ${slides.length}`;

    // Pause/Resume canvas animations based on active slide
    handleSlideVisuals(index);
}

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        showSlide(currentSlideIndex + 1);
    } else if (isAutoplayActive) {
        showSlide(0); // Loop back
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        showSlide(currentSlideIndex - 1);
    }
}

// Sidebar toggle
function toggleSidebar() {
    sidebar.classList.toggle('hidden');
}

// Fullscreen toggle
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error enabling fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Autoplay Toggle
function toggleAutoplay() {
    const autoplayBtn = document.getElementById('autoplay-btn');
    if (isAutoplayActive) {
        clearInterval(autoplayInterval);
        isAutoplayActive = false;
        autoplayBtn.classList.remove('active');
        autoplayBtn.innerHTML = '▶ Autoplay';
    } else {
        isAutoplayActive = true;
        autoplayBtn.classList.add('active');
        autoplayBtn.innerHTML = '⏸ Pause';
        autoplayInterval = setInterval(nextSlide, AUTOPLAY_DELAY);
    }
}

// Key bindings
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
    }
});

// Sidebar item click binding
slideItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        showSlide(index);
    });
});

// Tab view controller for C# codes
function setupCodeTabs() {
    const containers = document.querySelectorAll('.code-viewer');
    containers.forEach(container => {
        const tabs = container.querySelectorAll('.code-tab');
        const snippets = container.querySelectorAll('.code-snippet');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-target');
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                snippets.forEach(snip => {
                    if (snip.id === targetId) {
                        snip.style.display = 'block';
                    } else {
                        snip.style.display = 'none';
                    }
                });
            });
        });
    });
}

// Handle trigger points for simulators
function handleSlideVisuals(slideIdx) {
    // Slide index 5 = BFS Pathfinder Simulator
    if (slideIdx === 5) {
        startBfsSimulation();
    } else {
        stopBfsSimulation();
    }

    // Slide index 8 = Camera/Screen Shake Simulation
    if (slideIdx === 8) {
        initCameraSim();
    } else {
        stopCameraSim();
    }
}

// ==========================================
// INTERACTIVE SIMULATION 1: BFS Pathfinder
// ==========================================
let bfsCanvas, bfsCtx;
let bfsGridSize = 14;
let bfsCellPixelSize = 0;
let bfsObstacles = new Set();
let npcPosition = { x: 2, y: 2 };
let npcOrigin = { x: 2, y: 2 };
let npcTarget = { x: 11, y: 10 };
let bfsPath = [];
let bfsPathIndex = 0;
let bfsExplored = [];
let simInterval = null;
let npcInterpolated = { x: 2, y: 2 };
let lerpSpeed = 0.08;

function initBfsGrid() {
    bfsCanvas = document.getElementById('bfs-canvas');
    if (!bfsCanvas) return;
    bfsCtx = bfsCanvas.getContext('2d');
    
    // Scale canvas pixels
    resizeBfsCanvas();
    window.addEventListener('resize', resizeBfsCanvas);
    
    // Pre-populate school lockers / corridor obstacle outline
    bfsObstacles.clear();
    // Wall structures mimicking school hallways
    for (let x = 0; x < bfsGridSize; x++) {
        if (x !== 3 && x !== 10) {
            bfsObstacles.add(`${x},4`); // horizontal hallway wall
            bfsObstacles.add(`${x},9`); // horizontal hallway wall
        }
    }
    
    npcPosition = { x: 2, y: 2 };
    npcOrigin = { x: 2, y: 2 };
    npcTarget = { x: 11, y: 11 };
    npcInterpolated = { x: 2, y: 2 };
    bfsPath = [];
    bfsExplored = [];
    
    calculateBfsPath();
}

function resizeBfsCanvas() {
    if (!bfsCanvas) return;
    const parent = bfsCanvas.parentElement;
    bfsCanvas.width = parent.clientWidth;
    bfsCanvas.height = parent.clientHeight;
    bfsCellPixelSize = Math.min(bfsCanvas.width / bfsGridSize, bfsCanvas.height / bfsGridSize);
}

function calculateBfsPath() {
    bfsPath = [];
    bfsExplored = [];
    bfsPathIndex = 0;
    
    const start = { ...npcPosition };
    const goal = { ...npcTarget };
    
    const queue = [start];
    const previous = {};
    const startKey = `${start.x},${start.y}`;
    previous[startKey] = startKey;
    
    const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];
    
    let pathFound = false;
    
    while (queue.length > 0) {
        const current = queue.shift();
        bfsExplored.push(current);
        
        if (current.x === goal.x && current.y === goal.y) {
            pathFound = true;
            break;
        }
        
        for (let i = 0; i < dirs.length; i++) {
            const next = { x: current.x + dirs[i].x, y: current.y + dirs[i].y };
            
            // Boundary checks
            if (next.x < 0 || next.x >= bfsGridSize || next.y < 0 || next.y >= bfsGridSize) continue;
            
            const nextKey = `${next.x},${next.y}`;
            if (bfsObstacles.has(nextKey)) continue;
            
            if (!(nextKey in previous)) {
                previous[nextKey] = current;
                queue.push(next);
            }
        }
    }
    
    const goalKey = `${goal.x},${goal.y}`;
    if (!(goalKey in previous)) {
        // No path
        return;
    }
    
    const cells = [];
    let step = goal;
    const stepKey = `${step.x},${step.y}`;
    
    while (step.x !== start.x || step.y !== start.y) {
        cells.push(step);
        const parent = previous[`${step.x},${step.y}`];
        if (!parent || (parent.x === step.x && parent.y === step.y)) break;
        step = parent;
    }
    
    cells.reverse();
    bfsPath = cells;
}

function rerollBfsTarget() {
    npcOrigin = { ...npcPosition };
    
    // Find valid random target position on grid
    let attempts = 0;
    while (attempts < 100) {
        const rx = Math.floor(Math.random() * bfsGridSize);
        const ry = Math.floor(Math.random() * bfsGridSize);
        const key = `${rx},${ry}`;
        if (!bfsObstacles.has(key) && (rx !== npcPosition.x || ry !== npcPosition.y)) {
            npcTarget = { x: rx, y: ry };
            break;
        }
        attempts++;
    }
    
    calculateBfsPath();
}

function drawBfsSimulation() {
    if (!bfsCtx) return;
    
    bfsCtx.clearRect(0, 0, bfsCanvas.width, bfsCanvas.height);
    
    // Center alignment offsets
    const xOffset = (bfsCanvas.width - (bfsGridSize * bfsCellPixelSize)) / 2;
    const yOffset = (bfsCanvas.height - (bfsGridSize * bfsCellPixelSize)) / 2;
    
    // Draw cells grid
    for (let x = 0; x < bfsGridSize; x++) {
        for (let y = 0; y < bfsGridSize; y++) {
            const px = xOffset + x * bfsCellPixelSize;
            const py = yOffset + y * bfsCellPixelSize;
            const key = `${x},${y}`;
            
            // Base tile
            bfsCtx.fillStyle = '#101423';
            bfsCtx.fillRect(px + 1, py + 1, bfsCellPixelSize - 2, bfsCellPixelSize - 2);
            
            // Lockers / Walls
            if (bfsObstacles.has(key)) {
                bfsCtx.fillStyle = '#2c3349';
                bfsCtx.fillRect(px + 1, py + 1, bfsCellPixelSize - 2, bfsCellPixelSize - 2);
                // Draw decorative lock line
                bfsCtx.fillStyle = '#ef4444';
                bfsCtx.fillRect(px + 2, py + (bfsCellPixelSize / 2) - 1, bfsCellPixelSize - 4, 2);
            }
            
            // Explored cells visualization
            const isExplored = bfsExplored.some(c => c.x === x && c.y === y);
            if (isExplored && !bfsObstacles.has(key)) {
                bfsCtx.fillStyle = 'rgba(139, 92, 246, 0.08)';
                bfsCtx.fillRect(px + 1, py + 1, bfsCellPixelSize - 2, bfsCellPixelSize - 2);
            }
        }
    }
    
    // Draw BFS Path
    if (bfsPath.length > 0) {
        bfsCtx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
        bfsCtx.lineWidth = bfsCellPixelSize * 0.15;
        bfsCtx.lineCap = 'round';
        bfsCtx.lineJoin = 'round';
        
        bfsCtx.beginPath();
        const startPx = xOffset + npcPosition.x * bfsCellPixelSize + bfsCellPixelSize/2;
        const startPy = yOffset + npcPosition.y * bfsCellPixelSize + bfsCellPixelSize/2;
        bfsCtx.moveTo(startPx, startPy);
        
        bfsPath.forEach(pt => {
            const px = xOffset + pt.x * bfsCellPixelSize + bfsCellPixelSize/2;
            const py = yOffset + pt.y * bfsCellPixelSize + bfsCellPixelSize/2;
            bfsCtx.lineTo(px, py);
        });
        bfsCtx.stroke();
    }
    
    // Draw Target Destination
    const targetPx = xOffset + npcTarget.x * bfsCellPixelSize + bfsCellPixelSize/2;
    const targetPy = yOffset + npcTarget.y * bfsCellPixelSize + bfsCellPixelSize/2;
    bfsCtx.fillStyle = '#ef4444';
    bfsCtx.shadowColor = '#ef4444';
    bfsCtx.shadowBlur = 10;
    bfsCtx.beginPath();
    bfsCtx.arc(targetPx, targetPy, bfsCellPixelSize * 0.25, 0, Math.PI * 2);
    bfsCtx.fill();
    bfsCtx.shadowBlur = 0; // Reset shadow
    
    // Draw NPC (Player) LERPed position
    const npcPx = xOffset + npcInterpolated.x * bfsCellPixelSize + bfsCellPixelSize/2;
    const npcPy = yOffset + npcInterpolated.y * bfsCellPixelSize + bfsCellPixelSize/2;
    bfsCtx.fillStyle = '#00f2fe';
    bfsCtx.shadowColor = '#00f2fe';
    bfsCtx.shadowBlur = 12;
    bfsCtx.beginPath();
    bfsCtx.arc(npcPx, npcPy, bfsCellPixelSize * 0.32, 0, Math.PI * 2);
    bfsCtx.fill();
    bfsCtx.shadowBlur = 0; // Reset shadow
    
    // HUD status
    const statusText = document.getElementById('bfs-status');
    if (statusText) {
        statusText.textContent = `NPC Position: (${npcPosition.x}, ${npcPosition.y}) | Target: (${npcTarget.x}, ${npcTarget.y}) | Path Nodes: ${bfsPath.length}`;
    }
}

function updateBfsSimulation() {
    // Lerp interpolated position to actual waypoint
    let currentWaypoint = npcPosition;
    if (bfsPath.length > 0 && bfsPathIndex < bfsPath.length) {
        currentWaypoint = bfsPath[bfsPathIndex];
    }
    
    npcInterpolated.x += (currentWaypoint.x - npcInterpolated.x) * lerpSpeed;
    npcInterpolated.y += (currentWaypoint.y - npcInterpolated.y) * lerpSpeed;
    
    // Check arrival (close to waypoint)
    const distSq = Math.pow(npcInterpolated.x - currentWaypoint.x, 2) + Math.pow(npcInterpolated.y - currentWaypoint.y, 2);
    if (distSq < 0.02) {
        npcPosition = currentWaypoint;
        if (bfsPath.length > 0 && bfsPathIndex < bfsPath.length) {
            bfsPathIndex++;
        }
        
        // Pick new target if arrived
        if (bfsPathIndex >= bfsPath.length) {
            rerollBfsTarget();
        }
    }
    
    drawBfsSimulation();
}

function startBfsSimulation() {
    initBfsGrid();
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(updateBfsSimulation, 30);
}

function stopBfsSimulation() {
    if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
    }
}

// ==========================================
// INTERACTIVE SIMULATION 2: Camera Shake & FOV
// ==========================================
let cameraSimSpeed = 5.0; // matching startSpeed (5f) in Unity script
let cameraHearts = 3;
const minSpeed = 5.0;
const maxSpeed = 13.0;
let fovFovValue = 60.0;
let simulatedShakeStrength = 0;
let simulatedShakeTimer = 0;
const shakeFrequency = 35;
let animationFrameId = null;

function initCameraSim() {
    cameraHearts = 3;
    cameraSimSpeed = 5.0;
    document.getElementById('sim-speed-val').textContent = cameraSimSpeed.toFixed(1);
    document.getElementById('sim-speed-slider').value = cameraSimSpeed;
    
    updateHeartsUI();
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    loopCameraSim();
}

function updateHeartsUI() {
    const hearts = document.querySelectorAll('.camera-hearts .heart-icon');
    hearts.forEach((heart, i) => {
        if (i < cameraHearts) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function triggerObstacleHit() {
    if (cameraHearts <= 0) {
        // Reset if already dead
        cameraHearts = 3;
        cameraSimSpeed = 5.0;
        document.getElementById('sim-speed-slider').value = cameraSimSpeed;
        updateHeartsUI();
        return;
    }
    
    cameraHearts--;
    updateHeartsUI();
    
    // Trigger screen shake (simulated Perlin Noise)
    simulatedShakeStrength = cameraHearts <= 0 ? 1.2 : 0.75;
    simulatedShakeTimer = 0.45; // 0.45s shake duration like Unity HitObstacle()
    
    // Slowdown Player speed
    cameraSimSpeed = Math.max(minSpeed, cameraSimSpeed - 2.0); // hitSpeedLoss = 2.0f
    document.getElementById('sim-speed-slider').value = cameraSimSpeed;
    document.getElementById('sim-speed-val').textContent = cameraSimSpeed.toFixed(1);
    
    if (cameraHearts <= 0) {
        // Death state
        setTimeout(() => {
            alert("플레이어 사망! (체력 0 도달) 코루틴 게임 오버 연출 재생.");
            initCameraSim();
        }, 600);
    }
}

function loopCameraSim() {
    const time = Date.now() * 0.001;
    
    // Handle slider speed update
    const slider = document.getElementById('sim-speed-slider');
    if (slider) {
        cameraSimSpeed = parseFloat(slider.value);
        document.getElementById('sim-speed-val').textContent = cameraSimSpeed.toFixed(1);
    }
    
    // 1. Calculate simulated FOV based on speed (Mathf.InverseLerp in Unity script)
    const speed01 = (cameraSimSpeed - minSpeed) / (maxSpeed - minSpeed);
    const targetFov = 60.0 + speed01 * 12.0; // normalFov = 60, fastFov = 72
    
    fovFovValue += (targetFov - fovFovValue) * 0.1; // Smooth LERP FOV zoom
    
    const elementsBox = document.getElementById('camera-elements');
    if (elementsBox) {
        // Scale width/perspective of 3D scene elements to represent FOV changes
        const fovScaleFactor = fovFovValue / 60.0;
        elementsBox.style.transform = `perspective(300px) rotateX(40deg) scale(${1.1 * fovScaleFactor})`;
    }
    
    // Render current FOV on HUD
    const fovValEl = document.getElementById('sim-fov-val');
    if (fovValEl) fovValEl.textContent = Math.round(fovFovValue);
    
    // Speed lines speed lines visual control
    const speedLines = document.getElementById('speed-lines');
    if (speedLines) {
        speedLines.style.opacity = speed01 * 0.8;
    }
    
    // 2. Shake screen using simulated Perlin noise (sine wave approximation)
    const screenContent = document.getElementById('camera-screen-content');
    if (screenContent) {
        if (simulatedShakeTimer > 0) {
            simulatedShakeTimer -= 0.016; // 60fps frame rate approximation
            const power = simulatedShakeStrength * (simulatedShakeTimer / 0.45);
            
            // Approximation of Perlin noise using multiple high frequency sine waves
            const shakeX = Math.sin(time * shakeFrequency) * power * 15;
            const shakeY = Math.cos(time * shakeFrequency * 1.3) * power * 15;
            
            screenContent.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
            screenContent.style.transform = 'translate(0, 0)';
        }
    }
    
    animationFrameId = requestAnimationFrame(loopCameraSim);
}

function stopCameraSim() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    showSlide(0);
    setupCodeTabs();
    
    // Bind buttons
    document.getElementById('prev-btn').addEventListener('click', prevSlide);
    document.getElementById('next-btn').addEventListener('click', nextSlide);
    document.getElementById('sidebar-toggle-btn').addEventListener('click', toggleSidebar);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    document.getElementById('autoplay-btn').addEventListener('click', toggleAutoplay);
});
