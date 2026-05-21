const canvas = document.getElementById('stage');
const controls = document.getElementById('controls');

// =========================
// 커서 상태 관리
// =========================
function setDefaultCursor() {
  canvas.style.cursor = 'default';
}

function setGrabCursor() {
  canvas.style.cursor = 'grab';
}

function setZoomCursor(deltaY = -1) {
  canvas.style.cursor =
    deltaY < 0 ? 'zoom-in' : 'zoom-out';
}

// 초기 커서
setDefaultCursor();

// =========================
// world 생성
// =========================
const world = document.createElement('div');

world.style.position = 'absolute';
world.style.top = '0';
world.style.left = '0';
world.style.transformOrigin = '0 0';

// world를 뒤 레이어로
world.style.zIndex = '0';

canvas.appendChild(world);

// =========================
// 우측 상단 UI
// =========================
const topRightUI = document.createElement('div');

topRightUI.style.position = 'fixed';
topRightUI.style.top = '20px';
topRightUI.style.right = '20px';

topRightUI.style.display = 'flex';

// 🔥 가로 정렬
topRightUI.style.flexDirection = 'row';

topRightUI.style.gap = '8px';

topRightUI.style.zIndex = '99999';

document.body.appendChild(topRightUI);

// =========================
// 상태 변수
// =========================
let currentX = window.innerWidth / 2;
let currentY = window.innerHeight / 2;

// SPACE 기준 시작 Y
let baseRowY = window.innerHeight / 2;

// 마지막 이미지 위치
let lastImageX = currentX;
let lastImageY = currentY;

let currentLayer = 0;

let isFlipped = false;
let isEnterRotated = false;

const DEFAULT_SCALE = 3;

let scale = DEFAULT_SCALE;
let targetScale = DEFAULT_SCALE;

let cameraX = 0;
let cameraY = 0;

let targetCameraX = 0;
let targetCameraY = 0;

let isDragging = false;

let lastMouseX = 0;
let lastMouseY = 0;

// =========================
// 한글 버튼 목록
// =========================
const koreanChars = [
  '가','결','계','내','된','드','들','로','미','부',
  '상','세','스','연','의','이','지','체','키','패',
  '포','호'
];

// =========================
// 이미지 매핑
// =========================
const charToImage = {
  '내': '../img/nae.png',
  '부': '../img/bu.png',
  '로': '../img/ro.png',
  '상': '../img/sang.png',
  '호': '../img/ho.png',
  '연': '../img/yeon.png',
  '결': '../img/gyeol.png',
  '된': '../img/doen.png',
  '세': '../img/se.png',
  '포': '../img/po.png',
  '들': '../img/deul.png',
  '의': '../img/ui.png',
  '체': '../img/che.png',
  '계': '../img/gye.png',
  '가': '../img/ga.png',
  '이': '../img/i.png',
  '미': '../img/mi.png',
  '스': '../img/su.png',
  '패': '../img/pae.png',
  '키': '../img/ki.png',
  '지': '../img/ji.png',
  '드': '../img/d.png',
};

// =========================
// 글자별 Y 이동값
// =========================
const charOffsetY = {
  '내': -200,
  '부': -130,
  '로': -125,
  '상': -200,
  '호': -125,
  '연': -130,
  '결': -130,
  '된': -115,
  '세': -200,
  '포': -125,
  '들': -212,
  '의': -200,
  '체': -200,
  '계': -133,
  '가': -200,
  '이': -197,
  '미': -198,
  '스': -212,
  '패': -200,
  '키': -200,
  '지': -197,
  '드': -212
};

// =========================
// 이동 설정
// =========================
const STEP_Y = -120;

const SPACE_X = -240;
const SPACE_Y = 120;

const ENTER_X = 480;

// =========================
// 초기화 함수
// =========================
function resetAll() {

  // 이미지 제거
  world.innerHTML = '';

  // 위치 초기화
  currentX = window.innerWidth / 2;
  currentY = window.innerHeight / 2;

  // 기준 Y 초기화
  baseRowY = window.innerHeight / 2;

  // 마지막 이미지 위치 초기화
  lastImageX = currentX;
  lastImageY = currentY;

  // 상태 초기화
  currentLayer = 0;

  isFlipped = false;
  isEnterRotated = false;

  // 줌 초기화
  scale = DEFAULT_SCALE;
  targetScale = DEFAULT_SCALE;

  // 카메라 초기화
  cameraX = 0;
  cameraY = 0;

  targetCameraX = 0;
  targetCameraY = 0;

  resetZoomAndCenter(currentX, currentY);

  setDefaultCursor();
}

// =========================
// 줌 리셋 + 중앙 정렬
// =========================
function resetZoomAndCenter(x, y) {

  if (isDragging) return;

  targetScale = DEFAULT_SCALE;

  targetCameraX =
    window.innerWidth / 2 - x * targetScale;

  targetCameraY =
    window.innerHeight / 10 - y * targetScale;
}

// =========================
// 이미지 생성
// =========================
function createImage(char) {

  const src = charToImage[char];

  if (!src) return;

  resetZoomAndCenter(currentX, currentY);

  const img = document.createElement('img');

  img.src = src;

  img.style.position = 'absolute';

  // 이미지 클릭 방지
  img.style.pointerEvents = 'none';

  let transform = 'translateX(-50%)';

  if (isFlipped) {
    transform += ' scaleX(-1)';
  }

  img.style.left = currentX + 'px';
  img.style.top = currentY + 'px';

  img.style.transform = transform;

  img.style.height = '300px';
  img.style.width = 'auto';

  img.style.zIndex = currentLayer;

  world.appendChild(img);

  // 마지막 위치 저장
  lastImageX = currentX;
  lastImageY = currentY;

  // 다음 글자 위치 이동
  const offsetY =
    charOffsetY[char] ?? STEP_Y;

  currentY += offsetY;
}

// =========================
// 하단 버튼 생성
// =========================
function createButton(text, className, onClick) {

  const btn = document.createElement('button');

  btn.innerText = text;
  btn.className = className;

  btn.onclick = onClick;

  controls.appendChild(btn);
}

// =========================
// 우측 상단 버튼 생성
// =========================
function createTopButton(text, onClick) {

  const btn = document.createElement('button');

  btn.innerText = text;

  btn.className = 'korean-btn';

  btn.onclick = onClick;

  topRightUI.appendChild(btn);
}

// =========================
// 한글 버튼 생성
// =========================
koreanChars.forEach(char => {

  createButton(
    char,
    'korean-btn',
    () => createImage(char)
  );

});

// =========================
// SPACE
// =========================
createButton('　', 'space-btn', () => {

  // X 이동
  if (isEnterRotated) {

    currentX += Math.abs(SPACE_X);

  } else {

    currentX += SPACE_X;

  }

  // 항상 일정하게 위로 이동
  baseRowY -= SPACE_Y;

  // 시작 위치 고정
  currentY = baseRowY;

  currentLayer--;

  resetZoomAndCenter(currentX, currentY);

});

// =========================
// ENTER
// =========================
createButton('↵', 'enter-btn', () => {

  if (isEnterRotated) {

    currentX -= ENTER_X;

  } else {

    currentX += ENTER_X;

  }

  // ENTER 이후 SPACE 기준 동기화
  baseRowY = currentY;

  currentLayer--;

  isFlipped = !isFlipped;
  isEnterRotated = !isEnterRotated;

  resetZoomAndCenter(currentX, currentY);

});

// =========================
// CLEAR
// =========================
createButton('Clear', 'reset-btn', () => {

  resetAll();

});

// =========================
// LAST 버튼
// =========================
createTopButton('Focus', () => {

  resetZoomAndCenter(lastImageX, lastImageY);

});

// =========================
// 줌
// =========================
canvas.addEventListener('wheel', (e) => {

  e.preventDefault();

  // 돋보기 커서
  setZoomCursor(e.deltaY);

  clearTimeout(canvas.wheelCursorTimeout);

  canvas.wheelCursorTimeout = setTimeout(() => {

    if (isDragging) {
      setGrabCursor();
    } else {
      setDefaultCursor();
    }

  }, 120);

  const mouseX = e.clientX;
  const mouseY = e.clientY;

  const zoomFactor = -e.deltaY * 0.01;

  const newScale = Math.min(
    Math.max(0.2, targetScale + zoomFactor),
    50
  );

  const worldX =
    (mouseX - targetCameraX) / targetScale;

  const worldY =
    (mouseY - targetCameraY) / targetScale;

  targetScale = newScale;

  targetCameraX =
    mouseX - worldX * targetScale;

  targetCameraY =
    mouseY - worldY * targetScale;

});

// =========================
// 애니메이션
// =========================
function animate() {

  scale +=
    (targetScale - scale) * 0.05;

  cameraX +=
    (targetCameraX - cameraX) * 0.05;

  cameraY +=
    (targetCameraY - cameraY) * 0.05;

  updateTransform();

  requestAnimationFrame(animate);
}

animate();

// =========================
// 드래그 시작
// =========================
canvas.addEventListener('mousedown', (e) => {

  isDragging = true;

  // grab 커서
  setGrabCursor();

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

});

// =========================
// 드래그 이동
// =========================
window.addEventListener('mousemove', (e) => {

  if (!isDragging) return;

  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;

  targetCameraX += dx;
  targetCameraY += dy;

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

});

// =========================
// 드래그 종료
// =========================
window.addEventListener('mouseup', () => {

  isDragging = false;

  // 기본 포인터 복귀
  setDefaultCursor();

});

// =========================
// 캔버스 진입 시 커서 유지
// =========================
canvas.addEventListener('mouseenter', () => {

  if (isDragging) {
    setGrabCursor();
  } else {
    setDefaultCursor();
  }

});

// =========================
// 캔버스 이탈
// =========================
canvas.addEventListener('mouseleave', () => {

  if (!isDragging) {
    setDefaultCursor();
  }

});

// =========================
// transform 적용
// =========================
function updateTransform() {

  world.style.transform =
    `translate(${cameraX}px, ${cameraY}px) scale(${scale})`;

}

// =========================
// 초기 위치
// =========================
window.onload = () => {

  resetZoomAndCenter(currentX, currentY);

  updateTransform();

  setDefaultCursor();

};