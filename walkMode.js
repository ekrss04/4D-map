// ========== РЕЖИМ ПРОГУЛКИ ==========
let walkModeActive = false;
let walkCameraPosition = null;
let walkCameraHeading = 0;
const WALK_SPEED = 8;
const ROTATE_SPEED = 1.5;
let moveForward = false, moveBack = false, moveLeft = false, moveRight = false;
let rotateLeft = false, rotateRight = false;
let walkAnimationId = null;
let walkViewer = null;

// CSS для индикатора
const walkIndicatorStyles = `
    #walkIndicator {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-family: 'Noah', Arial, sans-serif;
        font-size: 11px;
        z-index: 1000;
        display: none;
        pointer-events: none;
        backdrop-filter: blur(4px);
        white-space: nowrap;
    }
    .walk-controls {
        position: absolute;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        display: none;
        gap: 10px;
        background: rgba(30,30,30,0.85);
        padding: 12px;
        border-radius: 12px;
        backdrop-filter: blur(4px);
    }
    .walk-btn {
        width: 50px;
        height: 50px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .walk-btn:active {
        background: rgba(66, 133, 244, 0.6);
        transform: scale(0.95);
    }
    .walk-btn-row {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
    }
`;

// Добавляем CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = walkIndicatorStyles;
document.head.appendChild(styleSheet);

// Создаём индикатор
const walkIndicator = document.createElement('div');
walkIndicator.id = 'walkIndicator';
walkIndicator.textContent = '🚶 Режим прогулки: W/A/S/D - движение, Q/E - поворот, ESC - выход';
document.body.appendChild(walkIndicator);

// Создаём экранные кнопки
const walkControls = document.createElement('div');
walkControls.className = 'walk-controls';
walkControls.innerHTML = `
    <div>
        <div class="walk-btn-row">
            <button class="walk-btn" data-action="forward">▲</button>
        </div>
        <div class="walk-btn-row">
            <button class="walk-btn" data-action="left">◀</button>
            <button class="walk-btn" data-action="back">▼</button>
            <button class="walk-btn" data-action="right">▶</button>
        </div>
        <div class="walk-btn-row">
            <button class="walk-btn" data-action="rotLeft">↺</button>
            <button class="walk-btn" data-action="rotRight">↻</button>
        </div>
    </div>
`;
document.body.appendChild(walkControls);

// Функция обновления позиции
function updateWalkPosition() {
    if (!walkModeActive || !walkViewer) return;
    
    const deltaTime = 1 / 60;
    let moved = false;
    let rotated = false;
    
    if (rotateLeft) {
        walkCameraHeading -= Cesium.Math.toRadians(ROTATE_SPEED);
        rotated = true;
    }
    if (rotateRight) {
        walkCameraHeading += Cesium.Math.toRadians(ROTATE_SPEED);
        rotated = true;
    }
    
    if (rotated) {
        walkViewer.camera.setView({
            orientation: { heading: walkCameraHeading, pitch: Cesium.Math.toRadians(-10), roll: 0 }
        });
    }
    
    if (moveForward || moveBack || moveLeft || moveRight) {
        const speed = WALK_SPEED * deltaTime;
        const direction = new Cesium.Cartesian3();
        const forward = walkViewer.camera.direction;
        const right = walkViewer.camera.right;
        
        if (moveForward) { direction.x += forward.x; direction.y += forward.y; direction.z += forward.z; }
        if (moveBack) { direction.x -= forward.x; direction.y -= forward.y; direction.z -= forward.z; }
        if (moveRight) { direction.x += right.x; direction.y += right.y; direction.z += right.z; }
        if (moveLeft) { direction.x -= right.x; direction.y -= right.y; direction.z -= right.z; }
        
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.y /= length;
            direction.z /= length;
        }
        
        let newPosition = Cesium.Cartesian3.add(walkCameraPosition, 
            new Cesium.Cartesian3(direction.x * speed, direction.y * speed, direction.z * speed), 
            new Cesium.Cartesian3());
        
        const cartographic = Cesium.Cartographic.fromCartesian(newPosition);
        const terrainHeight = walkViewer.scene.globe.getHeight(cartographic);
        
        if (terrainHeight !== undefined && !isNaN(terrainHeight)) {
            cartographic.height = terrainHeight + 1.7;
        } else {
            cartographic.height = 1.7;
        }
        
        newPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
        walkCameraPosition = newPosition;
        walkViewer.camera.setView({ destination: walkCameraPosition });
        moved = true;
    }
    
    walkAnimationId = requestAnimationFrame(updateWalkPosition);
}

// Запуск анимации
function startWalkAnimation() {
    if (walkAnimationId) cancelAnimationFrame(walkAnimationId);
    walkAnimationId = requestAnimationFrame(updateWalkPosition);
}

// Вход в режим прогулки
function startWalkMode(viewer) {
    if (walkModeActive) return;
    walkViewer = viewer;
    walkModeActive = true;
    
    const currentPosition = viewer.camera.position;
    const currentHeading = viewer.camera.heading;
    walkCameraPosition = currentPosition.clone();
    walkCameraHeading = currentHeading;
    
    viewer.scene.screenSpaceCameraController.enableTilt = false;
    viewer.scene.screenSpaceCameraController.enableLook = false;
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    viewer.scene.screenSpaceCameraController.enableTranslate = false;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    
    const cartographic = Cesium.Cartographic.fromCartesian(walkCameraPosition);
    cartographic.height = 1.7;
    const newPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
    viewer.camera.setView({
        destination: newPosition,
        orientation: { heading: walkCameraHeading, pitch: Cesium.Math.toRadians(-10), roll: 0 }
    });
    
    walkIndicator.style.display = 'block';
    walkControls.style.display = 'block';
    startWalkAnimation();
}

// Выход из режима прогулки
function stopWalkMode() {
    if (!walkModeActive) return;
    walkModeActive = false;
    
    if (walkViewer) {
        walkViewer.scene.screenSpaceCameraController.enableTilt = true;
        walkViewer.scene.screenSpaceCameraController.enableLook = true;
        walkViewer.scene.screenSpaceCameraController.enableRotate = true;
        walkViewer.scene.screenSpaceCameraController.enableTranslate = true;
        walkViewer.scene.screenSpaceCameraController.enableZoom = true;
    }
    
    if (walkAnimationId) {
        cancelAnimationFrame(walkAnimationId);
        walkAnimationId = null;
    }
    
    moveForward = moveBack = moveLeft = moveRight = rotateLeft = rotateRight = false;
    walkIndicator.style.display = 'none';
    walkControls.style.display = 'none';
}

// Обработчики клавиатуры
function walkHandleKeyDown(e) {
    if (!walkModeActive) return;
    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W': moveForward = true; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': moveBack = true; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': moveLeft = true; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': moveRight = true; e.preventDefault(); break;
        case 'q': case 'Q': rotateLeft = true; e.preventDefault(); break;
        case 'e': case 'E': rotateRight = true; e.preventDefault(); break;
        case 'Escape': stopWalkMode(); if (window.updateWalkButtonUI) window.updateWalkButtonUI(false); break;
    }
}

function walkHandleKeyUp(e) {
    if (!walkModeActive) return;
    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W': moveForward = false; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': moveBack = false; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': moveLeft = false; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': moveRight = false; e.preventDefault(); break;
        case 'q': case 'Q': rotateLeft = false; e.preventDefault(); break;
        case 'e': case 'E': rotateRight = false; e.preventDefault(); break;
    }
}

// Обработчики экранных кнопок
function setupWalkControls(viewer) {
    const forwardBtn = document.querySelector('[data-action="forward"]');
    const backBtn = document.querySelector('[data-action="back"]');
    const leftBtn = document.querySelector('[data-action="left"]');
    const rightBtn = document.querySelector('[data-action="right"]');
    const rotLeftBtn = document.querySelector('[data-action="rotLeft"]');
    const rotRightBtn = document.querySelector('[data-action="rotRight"]');
    
    const startMove = (action) => {
        if (!walkModeActive) return;
        switch(action) {
            case 'forward': moveForward = true; break;
            case 'back': moveBack = true; break;
            case 'left': moveLeft = true; break;
            case 'right': moveRight = true; break;
            case 'rotLeft': rotateLeft = true; break;
            case 'rotRight': rotateRight = true; break;
        }
    };
    
    const stopMove = (action) => {
        switch(action) {
            case 'forward': moveForward = false; break;
            case 'back': moveBack = false; break;
            case 'left': moveLeft = false; break;
            case 'right': moveRight = false; break;
            case 'rotLeft': rotateLeft = false; break;
            case 'rotRight': rotateRight = false; break;
        }
    };
    
    const buttons = [
        { btn: forwardBtn, action: 'forward' },
        { btn: backBtn, action: 'back' },
        { btn: leftBtn, action: 'left' },
        { btn: rightBtn, action: 'right' },
        { btn: rotLeftBtn, action: 'rotLeft' },
        { btn: rotRightBtn, action: 'rotRight' }
    ];
    
    buttons.forEach(({ btn, action }) => {
        if (!btn) return;
        btn.addEventListener('mousedown', () => startMove(action));
        btn.addEventListener('mouseup', () => stopMove(action));
        btn.addEventListener('mouseleave', () => stopMove(action));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startMove(action); });
        btn.addEventListener('touchend', () => stopMove(action));
    });
}

// Функция для обновления UI кнопки Walk
window.updateWalkButtonUI = function(isActive) {
    const btnWalk = document.getElementById('btnWalk');
    if (btnWalk) {
        if (isActive) {
            btnWalk.style.backgroundColor = 'rgba(66, 133, 244, 0.5)';
            btnWalk.style.boxShadow = '0 0 15px rgba(66, 133, 244, 0.8)';
        } else {
            btnWalk.style.backgroundColor = 'rgba(30, 30, 30, 0.85)';
            btnWalk.style.boxShadow = 'none';
        }
    }
};

// Инициализация режима прогулки
function initWalkMode(viewer) {
    document.addEventListener('keydown', walkHandleKeyDown);
    document.addEventListener('keyup', walkHandleKeyUp);
    setupWalkControls(viewer);
    
    const btnWalk = document.getElementById('btnWalk');
    if (btnWalk) {
        btnWalk.onclick = () => {
            if (!walkModeActive) {
                startWalkMode(viewer);
                window.updateWalkButtonUI(true);
            } else {
                stopWalkMode();
                window.updateWalkButtonUI(false);
            }
        };
    }
}

// Экспортируем функцию для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initWalkMode, startWalkMode, stopWalkMode };
}
