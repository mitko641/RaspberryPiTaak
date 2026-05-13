const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const movementText = document.getElementById('movement_text');

let previousIndexTip = null;

function detectMovement(currentTip, previousTip) {
  const deltaX = currentTip.x - previousTip.x;
  const deltaY = currentTip.y - previousTip.y;
  const threshold = 0.02;

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return 'Stil';
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'Naar links' : 'Naar rechts';
  }

  return deltaY > 0 ? 'Naar beneden' : 'Naar boven';
}

function getFingerVector(landmarks, tipIndex, pipIndex) {
  return {
    dx: landmarks[tipIndex].x - landmarks[pipIndex].x,
    dy: landmarks[tipIndex].y - landmarks[pipIndex].y
  };
}

function isFingerUp(landmarks, tipIndex, pipIndex) {
  const {dx, dy} = getFingerVector(landmarks, tipIndex, pipIndex);
  return Math.abs(dy) > Math.abs(dx) && dy < -0.02;
}

function isFingerDown(landmarks, tipIndex, pipIndex) {
  const {dx, dy} = getFingerVector(landmarks, tipIndex, pipIndex);
  return Math.abs(dy) > Math.abs(dx) && dy > 0.02;
}

function isFingerLeft(landmarks, tipIndex, pipIndex) {
  const {dx, dy} = getFingerVector(landmarks, tipIndex, pipIndex);
  return Math.abs(dx) > Math.abs(dy) && dx < -0.02;
}

function isFingerRight(landmarks, tipIndex, pipIndex) {
  const {dx, dy} = getFingerVector(landmarks, tipIndex, pipIndex);
  return Math.abs(dx) > Math.abs(dy) && dx > 0.02;
}

function isThumbUp(landmarks, handLabel) {
  return isFingerUp(landmarks, 4, 3);
}

function isThumbLeft(landmarks, handLabel) {
  return isFingerLeft(landmarks, 4, 3);
}

function isThumbRight(landmarks, handLabel) {
  return isFingerRight(landmarks, 4, 3);
}

function isThumbDown(landmarks, handLabel) {
  return isFingerDown(landmarks, 4, 3);
}

function isIndexLeft(landmarks, handLabel) {
  return isFingerLeft(landmarks, 8, 6);
}

function isIndexRight(landmarks, handLabel) {
  return isFingerRight(landmarks, 8, 6);
}

function isMiddleLeft(landmarks, handLabel) {
  return isFingerLeft(landmarks, 12, 10);
}

function isMiddleRight(landmarks, handLabel) {
  return isFingerRight(landmarks, 12, 10);
}

function isRingLeft(landmarks, handLabel) {
  return isFingerLeft(landmarks, 16, 14);
}

function isRingRight(landmarks, handLabel) {
  return isFingerRight(landmarks, 16, 14);
}

function isPinkyLeft(landmarks, handLabel) {
  return isFingerLeft(landmarks, 20, 18);
}

function isPinkyRight(landmarks, handLabel) {
  return isFingerRight(landmarks, 20, 18);
}

function detectGesture(landmarks, handLabel) {
  const thumbUp = isThumbUp(landmarks, handLabel);
  const thumbLeft = isThumbLeft(landmarks, handLabel);
  const thumbRight = isThumbRight(landmarks, handLabel);
  const thumbDown = isThumbDown(landmarks, handLabel);
  const indexUp = isFingerUp(landmarks, 8, 6);
  const indexLeft = isIndexLeft(landmarks, handLabel);
  const indexRight = isIndexRight(landmarks, handLabel);
  const middleUp = isFingerUp(landmarks, 12, 10);
  const middleLeft = isMiddleLeft(landmarks, handLabel);
  const middleRight = isMiddleRight(landmarks, handLabel);
  const ringUp = isFingerUp(landmarks, 16, 14);
  const ringLeft = isRingLeft(landmarks, handLabel);
  const ringRight = isRingRight(landmarks, handLabel);
  const pinkyUp = isFingerUp(landmarks, 20, 18);
  const pinkyLeft = isPinkyLeft(landmarks, handLabel);
  const pinkyRight = isPinkyRight(landmarks, handLabel);
  const allFingersUp = thumbUp && indexUp && middleUp && ringUp && pinkyUp;
  const allFingersDown = !thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp;

  if (handLabel === 'Right') {
    // Thumb up gestures
    if (!thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) {
      return 'Boven';
    }

    if (!thumbUp && !indexUp && middleUp && !ringUp && !pinkyUp) {
      return 'Fuck you!!';
    }

    if (!thumbUp && !indexUp && !middleUp && ringUp && !pinkyUp) {
      return 'Privilgie kerem!';
    }

    if (!thumbUp && !indexUp && !middleUp && !ringUp && pinkyUp) {
      return 'Little dick';
    }

    // Thumb left gestures
    if (thumbLeft && !indexUp && !middleUp && !ringUp && !pinkyUp) {
      return 'ik';
    }

    if (!thumbLeft && indexLeft && !middleUp && !ringUp && !pinkyUp) {
      return 'jij';
    }

    if (!thumbLeft && !indexLeft && middleLeft && !ringUp && !pinkyUp) {
      return 'zij';
    }

    if (thumbLeft && !indexUp && !middleUp && ringUp && !pinkyUp) {
      return 'wij';
    }

    if (thumbLeft && !indexUp && !middleUp && !ringUp && pinkyLeft) {
      return 'jullie';
    }

    // Thumb right gestures
    if (thumbRight && !indexRight && !middleRight && !ringUp && !pinkyUp) {
      return 'Dood';
    }

    // Thumb down gestures
    if (!thumbDown && indexRight && !middleUp && !ringUp && !pinkyUp) {
      return 'Wil';
    }

    if (!thumbDown && !indexUp && middleRight && !ringUp && !pinkyUp) {
      return 'heb';
    }

    if (!thumbDown && !indexUp && !middleRight && ringRight && !pinkyUp) {
      return 'Geef';
    }

    if (!thumbDown && !indexUp && !middleRight && !ringRight && pinkyRight) {
      return 'Doe';
    }
  }

  if (allFingersUp) {
    return 'hallo';
  }

  if (allFingersDown) {
    return 'Protesten';
  }

  return null;
}

function onResults(results) {
  // Clear the canvas for the next frame
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    const detectedWords = [];

    for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
      // Draw the connections (lines) and landmarks (dots)
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
      
      const indexTip = landmarks[8];
      const handLabel = results.multiHandedness?.[index]?.label || 'Right';
      const gesture = detectGesture(landmarks, handLabel);

      if (gesture) {
        detectedWords.push(gesture);
      } else if (previousIndexTip && detectedWords.length === 0) {
        const movement = detectMovement(indexTip, previousIndexTip);
        movementText.textContent = `Beweging: ${movement}`;
      }

      previousIndexTip = { x: indexTip.x, y: indexTip.y };
    }

    if (detectedWords.length > 0) {
      const orderedWords = [
        ...detectedWords.filter((word) => word !== 'hallo'),
        ...detectedWords.filter((word) => word === 'hallo')
      ];
      movementText.textContent = orderedWords.join(' ');
    }
  } else {
    movementText.textContent = 'Geen hand gevonden';
    previousIndexTip = null;
  }
  canvasCtx.restore();
}

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

async function startCamera() {
  if (window.location.protocol === 'file:') {
    movementText.textContent = 'Gebruik een lokale server (http) om de webcam te starten.';
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    movementText.textContent = 'Webcam niet ondersteund in deze browser.';
    return;
  }

  videoElement.muted = true;
  videoElement.playsInline = true;

  try {
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      },
      width: 640,
      height: 480
    });

    await camera.start();
    movementText.textContent = 'Camera gestart';
  } catch (error) {
    console.error('Camera start failed:', error);

    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      movementText.textContent = 'Webcamtoegang geweigerd: sta de camera toe.';
      return;
    }

    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      movementText.textContent = `Requested device not found: ${error?.message || error.name}. Probeer de fallback-camera.`;
    } else {
      movementText.textContent = `Camera start mislukte: ${error?.name || 'Onbekende fout'}${error?.message ? ` - ${error.message}` : ''}`;
    }

    await startFallbackCamera();
  }
}

async function startFallbackCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    videoElement.srcObject = stream;
    await videoElement.play();
    movementText.textContent = 'Camera fallback gestart';
    requestAnimationFrame(sendVideoFrame);
  } catch (error) {
    console.error('Fallback camera start failed:', error);

    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      movementText.textContent = 'Webcamtoegang geweigerd: sta de camera toe.';
    } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      movementText.textContent = 'Requested device not found';
    } else {
      movementText.textContent = `Fallback start mislukte: ${error?.name || 'Onbekende fout'}`;
    }
  }
}

async function sendVideoFrame() {
  if (videoElement.readyState >= 2) {
    await hands.send({image: videoElement});
  }
  requestAnimationFrame(sendVideoFrame);
}

startCamera();
