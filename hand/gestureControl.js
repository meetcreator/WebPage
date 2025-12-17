// Hand Gesture Detection and Cube Control

let grabbed = false;
let targetX = 0;
let targetY = 0;
let stopUntil = 0; // timestamp until which motion is frozen
const STOP_DURATION = 400; // milliseconds to pause when open hand detected
// Debounce / smoothing counters
let pinchCount = 0;
let openCount = 0;
const PINCH_FRAMES = 2; // require this many consecutive frames for pinch
const OPEN_FRAMES = 3;  // require this many consecutive frames for open

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function onResultsWithVisualization(results) {
  onResults(results);
  drawHandDetection(results);
}

function onResults(results) {
  if (!results.multiHandLandmarks.length) return;

  const lm = results.multiHandLandmarks[0];

  const index = lm[8];      // Index finger tip
  const thumb = lm[4];      // Thumb tip
  const middle = lm[12];    // Middle finger tip
  const wrist = lm[0];      // Wrist

  // Normalize distances by an estimate of hand size (wrist to middle_mcp)
  const handSize = distance(wrist, lm[9]) || 0.001; // avoid division by zero

  // Pinch detection: check thumb-index / index-middle relative to hand size
  const indexThumbDist = distance(index, thumb);
  const indexMiddleDist = distance(index, middle);
  const pinchNow = (indexThumbDist < handSize * 0.35) || (indexMiddleDist < handSize * 0.38);

  if (pinchNow) pinchCount++; else pinchCount = 0;
  grabbed = pinchCount >= PINCH_FRAMES;

  // Detect open hand (stretched) using per-finger extension and debouncing
  const openNow = isHandOpen(lm, handSize);
  if (openNow) openCount++; else openCount = 0;
  const now = Date.now();
  if (openCount >= OPEN_FRAMES && now > stopUntil) {
    stopUntil = now + STOP_DURATION;
    // freeze targets to current rotation to create an immediate stop
    targetX = cube.rotation.x;
    targetY = cube.rotation.y;
    grabbed = false; // ensure we don't apply grab motion during stop
  }

  // If currently in freeze period, do not update motion targets or scale
  if (now < stopUntil) return;

  if (grabbed) {
    // Rotate based on index finger position
    targetY = (index.x - 0.5) * Math.PI * 2;
    targetX = (index.y - 0.5) * Math.PI * 2;

    // Pinch-based zoom: map thumb-index distance (normalized by handSize)
    const normalized = indexThumbDist / Math.max(0.0001, handSize);
    const minN = 0.12; // close
    const maxN = 0.6;  // far
    let t = (normalized - minN) / (maxN - minN);
    t = Math.max(0, Math.min(1, t));
    // scale 2 (zoomed in) -> 0.5 (zoomed out)
    targetScale = THREE.MathUtils.lerp(2, 0.5, t);
  }
}

function isHandOpen(landmarks) {
  // Consider the five fingertip landmarks: thumb(4), index(8), middle(12), ring(16), pinky(20)
  // We'll determine openness by counting extended fingers (index, middle, ring, pinky)
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  let extended = 0;
  for (let i = 0; i < tips.length; i++) {
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    // A finger is considered extended if the tip is noticeably farther from the wrist than the pip
    if (distance(tip, landmarks[0]) > distance(pip, landmarks[0]) * 1.05) extended++;
  }

  // Also check average adjacent fingertip spacing normalized to hand size for robustness
  let sumAdjacent = 0;
  for (let i = 0; i < tips.length - 1; i++) {
    sumAdjacent += distance(landmarks[tips[i]], landmarks[tips[i + 1]]);
  }
  const avgAdjacent = sumAdjacent / Math.max(1, tips.length - 1);

  // Use supplied handSize to normalize thresholds (handSize passed from caller)
  const handSize = arguments[1] || 0.001;

  // Open if 4 fingers are extended AND adjacent spacing is relatively large
  return extended >= 4 && avgAdjacent > handSize * 0.55;
}

function drawHandDetection(results) {
  const canvas = document.getElementById("output");
  const ctx = canvas.getContext("2d");
  
  // Draw video frame
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
  
  if (!results.multiHandLandmarks.length) {
    ctx.fillStyle = "rgba(255, 50, 50, 0.8)";
    ctx.font = "14px Arial";
    ctx.fillText("No hand detected", 10, 25);
    return;
  }
  
  const landmarks = results.multiHandLandmarks[0];
  
  // Draw landmarks
  landmarks.forEach((lm, i) => {
    const x = lm.x * canvas.width;
    const y = lm.y * canvas.height;
    
    ctx.fillStyle = "#00ff00";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw connections
  const handConnections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17], [4, 8], [8, 12], [12, 16], [16, 20]
  ];
  
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 1;
  handConnections.forEach(([start, end]) => {
    const startLm = landmarks[start];
    const endLm = landmarks[end];
    ctx.beginPath();
    ctx.moveTo(startLm.x * canvas.width, startLm.y * canvas.height);
    ctx.lineTo(endLm.x * canvas.width, endLm.y * canvas.height);
    ctx.stroke();
  });
  
  // Draw pinch indicator
  const pinchDist = distance(landmarks[8], landmarks[4]);
  ctx.fillStyle = grabbed ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";
  ctx.font = "12px Arial";
  ctx.fillText(grabbed ? "PINCHING" : "Open", 10, 25);
  
  // Display distance values for debugging
  const indexMiddleDist = distance(landmarks[8], landmarks[12]);
  ctx.fillStyle = "rgba(255, 255, 0, 0.8)";
  ctx.font = "10px Arial";
  ctx.fillText(`Thumb-Index: ${pinchDist.toFixed(3)}`, 10, 40);
  ctx.fillText(`Index-Middle: ${indexMiddleDist.toFixed(3)}`, 10, 52);
  
  // Show zoom state and target scale
  const zoomActive = pinchCount >= PINCH_FRAMES;
  ctx.fillStyle = zoomActive ? "rgba(0,200,255,0.9)" : "rgba(200,200,200,0.7)";
  ctx.font = "12px Arial";
  ctx.fillText(zoomActive ? `ZOOM (active)` : `ZOOM`, 10, 68);
  if (typeof targetScale !== 'undefined') {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "10px Arial";
    ctx.fillText(`Scale: ${targetScale.toFixed(2)}`, 10, 82);
  }
}
