import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import "./video.css";

const Video = () => {
  const [areModelsLoaded, setModelsLoaded] = useState(false);
  const [isVideoCaptured, setVideoCaptured] = useState(false);

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
        console.log(detections);

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

        // _______________ DETECTION ___________________
        const video = videoRef.current;
        const detection = await faceapi
          .detectSingleFace(video)
          .withFaceLandmarks();

        // const detection = await faceapi
        //   .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        //   .withFaceLandmarks()
        //   .withFaceDescriptor()
        //   .withFaceExpressions();

        const landmarks = detection.landmarks;

        // getAngle(landmarks);

        const result = calculateFaceAngle(landmarks);
        console.log(result);
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
        <video ref={videoRef} height={videoHeight} width={videoWidth} />
        <canvas ref={canvasRef} style={{ position: "absolute" }} />
      </div>
    </div>
  );
};

export default Video;

function calculateFaceAngle(mesh) {
  const radians = (a1, a2, b1, b2) => Math.atan2(b2 - a2, b1 - a1);
  const gradusesPerRadian = 180 / Math.PI;

  const angle = {};

  if (!mesh || !mesh._positions || mesh._positions.length !== 68) return angle;
  const pt = mesh._positions;

  // roll is face lean left/right
  // comparing x,y of outside corners of leftEye and rightEye
  angle.roll =
    radians(pt[36]._x, pt[36]._y, pt[45]._x, pt[45]._y) * gradusesPerRadian;

  // pitch is face move up/down
  // comparing size of the box around the face with top and bottom of detected landmarks
  // silly hack, but this gives us face compression on y-axis
  // e.g., tilting head up hides the forehead that doesn't have any landmarks so ratio drops
  // value is normalized to range, but is not in actual radians
  // angle.pitch = radians(
  //   pt[30]._x - pt[0]._x,
  //   pt[27]._y - pt[0]._y,
  //   pt[16]._x - pt[30]._x,
  //   pt[27]._y - pt[16]._y
  // );

  // yaw is face turn left/right
  // comparing x distance of bottom of nose to left and right edge of face
  //       and y distance of top    of nose to left and right edge of face
  // precision is lacking since coordinates are not precise enough
  // const bottom = pt.reduce(
  //   (prev, cur) => (prev < cur._y ? prev : cur._y),
  //   +Infinity
  // );
  // const top = pt.reduce(
  //   (prev, cur) => (prev > cur._y ? prev : cur._y),
  //   -Infinity
  // );
  // angle.yaw = 10 * (mesh._imgDims._height / (top - bottom) / 1.45 - 1);

  return angle;
}

// pitch: up-down: looks like it's impossible to define properly it in the 2D
// yaw: left-right: from -1 to -2
// roll: diagonal: ok

// _______________________________________

function getAngle(landmarks) {
  var right_eye = getMeanPosition(landmarks.getRightEye());
  var left_eye = getMeanPosition(landmarks.getLeftEye());
  var nose = getMeanPosition(landmarks.getNose());
  // var mouth = getMeanPosition(landmarks.getMouth());
  // var jaw = getTop(landmarks.getJawOutline());

  // var rx = (jaw - mouth) / detections["_box"]["_height"];
  var ry = (left_eye[0] + (right_eye[0] - left_eye[0]) / 2 - nose[0]) / 640;

  var face_val = ry.toFixed(2);

  if (face_val < -0.06) {
    //user moving in left direction
    console.log("_____LEFT _______");
  } else if (face_val >= 0.07) {
    //user moving in right direction
    console.log("_____RIGHT _______");
  } else {
    //user face in facing front side of webcam
    console.log("_____FRONT_______");
  }
}

function getMeanPosition(l) {
  return l
    .map((a) => [a.x, a.y])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
    .map((a) => a / l.length);
}

function getTop(l) {
  return l.map((a) => a.y).reduce((a, b) => Math.min(a, b));
}
