// Hand Detection Setup using MediaPipe Hands - Optimized for Speed

const video = document.getElementById("video");
const canvasElement = document.getElementById("output");
const canvasCtx = canvasElement.getContext("2d");

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,  // Lite model for speed
  minDetectionConfidence: 0.5,  // Lower for faster detection
  minTrackingConfidence: 0.5
});

hands.onResults(onResultsWithVisualization);

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 320,  // Reduced resolution for speed
  height: 240
});

canvasElement.width = 320;
canvasElement.height = 240;

camera.start();
