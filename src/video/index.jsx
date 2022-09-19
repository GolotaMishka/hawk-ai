import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import "./video.css";

const Video = () => {
  const [areModelsLoaded, setModelsLoaded] = useState(false);
  const [isVideoCaptured, setVideoCaptured] = useState(false);
  const [scoreMeta, setScoreMeta] = useState(null);

  const videoRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = useRef();

  const captureVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
        setVideoCaptured(true);
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  useEffect(() => {
    const loadModels = () => {
      const MODEL_URL = "../../public/models";

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]).then(() => setModelsLoaded(true));
    };
    loadModels();
    captureVideo();
  }, []);

  const startDetection = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
          videoRef.current
        );
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );

        canvasRef.current
          .getContext("2d")
          .clearRect(0, 0, videoWidth, videoHeight);

        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);

        const video = videoRef.current;
        const detection = await faceapi
          .detectSingleFace(video)
          .withFaceLandmarks();

        const score = countAttention(detection);
        const scoreMeta = getScoreMeta(score);
        setScoreMeta(scoreMeta);
      }
    }, 500);
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        <button
          className="button"
          disabled={!areModelsLoaded || !isVideoCaptured}
          onClick={startDetection}
        >
          Start detection
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "10px",
        }}
      >
        <video
          ref={videoRef}
          height={videoHeight}
          width={videoWidth}
          autoPlay
          playsInline
          muted
          loop
        />
        <canvas ref={canvasRef} style={{ position: "absolute" }} />
      </div>
      {scoreMeta && (
        <div className="progress" style={{ backgroundColor: scoreMeta.color }}>
          <p>{scoreMeta.text}</p>
        </div>
      )}
    </div>
  );
};

export default Video;

function getScoreMeta(score) {
  if (score === 0) {
    return {
      text: "Face is not detected",
      color: "red",
    };
  } else if (score > 0 && score <= 1) {
    return {
      text: "Low attention",
      color: "orange",
    };
  } else if (score > 1 && score < 1.6) {
    return {
      text: "Normal attention",
      color: "yellow",
    };
  } else {
    return {
      text: "Good attention",
      color: "green",
    };
  }
}
function countAttention(detection) {
  if (!detection) {
    return 0;
  }
  const landmarks = detection.landmarks;

  const yaw = getYaw(landmarks);
  const roll = getRoll(landmarks);
  return yaw + roll;
}

function getYaw(landmarks) {
  const leftEye = Math.max(...landmarks.getLeftEye().map((point) => point._x));
  const rightEye = Math.min(
    ...landmarks.getRightEye().map((point) => point._x)
  );
  const nose = landmarks
    .getNose()
    .reduce((prev, current) => (prev._y > current._y ? prev : current));

  const middleNosePosition = (rightEye + leftEye) / 2;

  const diff = Math.abs(middleNosePosition - nose._x);
  if (diff < 4) {
    return 1;
  } else if (diff >= 4 && diff < 8) {
    return 0.8;
  } else if (diff >= 8 && diff < 13) {
    return 0.6;
  } else {
    return 0.3;
  }
}

function getRoll(landmarks) {
  const radians = (a1, a2, b1, b2) => Math.atan2(b2 - a2, b1 - a1);
  const gradusesPerRadian = 180 / Math.PI;

  if (!landmarks || !landmarks._positions || landmarks._positions.length !== 68)
    return 0;
  const positions = landmarks._positions;

  const graduses = Math.abs(
    radians(
      positions[36]._x,
      positions[36]._y,
      positions[45]._x,
      positions[45]._y
    ) * gradusesPerRadian
  );

  if (graduses < 10) {
    return 1;
  } else if (graduses >= 10 && graduses < 20) {
    return 0.8;
  } else if (graduses >= 20 && graduses < 30) {
    return 0.6;
  } else {
    return 0.3;
  }
}

function getPitch() {
  // try to do it based on mouth
  // i would ignore that property because if your head up or down, you face will not be detected
}

// NOTES

function calculateFaceAngle(mesh) {
  const radians = (a1, a2, b1, b2) => Math.atan2(b2 - a2, b1 - a1);
  const gradusesPerRadian = 180 / Math.PI;

  const angle = {};

  if (!mesh || !mesh._positions || mesh._positions.length !== 68) return angle;
  const pt = mesh._positions;

  angle.pitch = radians(
    pt[30]._x - pt[0]._x,
    pt[27]._y - pt[0]._y,
    pt[16]._x - pt[30]._x,
    pt[27]._y - pt[16]._y
  );

  return angle;
}
