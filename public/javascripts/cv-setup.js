if (
  !("mediaDevices" in navigator) ||
  !("getUserMedia" in navigator.mediaDevices)
) {
  throw new Error("getUserMedia() not supported.");
}
const supports = navigator.mediaDevices.getSupportedConstraints();
if (!supports["facingMode"]) {
  throw new Error("Facing Mode Not supported!");
}

const video = document.querySelector("#webcam");
// const btnFront = document.querySelector("#btn-front");
// const btnBack = document.querySelector("#btn-back");
const constraints = {
  audio: false,
  video: {
    zoom: true,
    // optional: [
    //   { minWidth: 320 },
    //   { minWidth: 640 },
    //   { minWidth: 1024 },
    //   { minWidth: 1280 },
    //   { minWidth: 1920 },
    //   { minWidth: 2560 },
    //   { frameRate: 30 },
    //   { facingMode: "environment" }
    // ],
    width: {
      min: 640,
      ideal: 3840, // 1920,
      max: 7680,
    },
    height: {
      min: 320,
      ideal: 2160, // 1080,
      max: 4320,
    },
    // facingMode: 'user'
    frameRate: { ideal: 30, max: 120, min: 10 },
    facingMode: {
      ideal: "environment",
    },
  },
};
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d");
const photo = document.querySelector("#photo");
const startButton = document.querySelector("button.foo-button");
const cameraButton = document.querySelector(".camera-button");
const cameraOptions = document.querySelector(".custom-select");
const input = document.querySelector('input[type="range"]');

// let streaming = false;
// let streamOn = null;
let animeReq = null;
let stream = null;
let imageCapture;
let vc = null;

// In this case, We set width 320, and the height will be computed based on the input stream.
let width = 1280;
let height = 0;

// whether streaming video from the camera.
let streaming = false;

function startCamera() {
  if (streaming) return;
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(s) {
      stream = s;
      video.srcObject = s;
      video.play();
      startButton.querySelector(".material-icons").textContent = "videocam_off";
    })
    .catch(function(err) {
      console.log("An error occured! " + err);
    });

  video.addEventListener(
    "canplay",
    function(ev) {
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth / width);
        video.setAttribute("width", width);
        video.setAttribute("height", height);
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        document.querySelector('#canvasOutput').setAttribute("width", width);
        document.querySelector('#canvasOutput').setAttribute("height", height);

        streaming = true;
        try{
          vc = new cv.VideoCapture(video);
        }catch(e){
          console.error(e);
        }
      }
      startVideoProcessing();
    },
    false
  );
}
let filter;
let src = null;
let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

function startVideoProcessing() {
  if (!streaming) {
    console.warn("Please startup your webcam");
    return;
  }
  stopVideoProcessing();
  src = new cv.Mat(height, width, cv.CV_8UC4);
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  dstC3 = new cv.Mat(height, width, cv.CV_8UC3);
  dstC4 = new cv.Mat(height, width, cv.CV_8UC4);
  animeReq = requestAnimationFrame(processVideo);
}

function passThrough(src) {
  return src;
}

function gray(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  return dstC1;
}

function hsv(src) {
  cv.cvtColor(src, dstC3, cv.COLOR_RGBA2RGB);
  cv.cvtColor(dstC3, dstC3, cv.COLOR_RGB2HSV);
  return dstC3;
}

function scharr(src) {
  var mat = new cv.Mat(height, width, cv.CV_8UC1);
  cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
  cv.Scharr(mat, dstC1, cv.CV_8U, 1, 0, 1, 0, cv.BORDER_DEFAULT);
  mat.delete();
  return dstC1;
}

let contoursColor = [];
for (let i = 0; i < 10000; i++) {
  contoursColor.push([
    Math.round(Math.random() * 255),
    Math.round(Math.random() * 255),
    Math.round(Math.random() * 255),
    0,
  ]);
}

function calcHist(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  let srcVec = new cv.MatVector();
  srcVec.push_back(dstC1);
  let scale = 2;
  let channels = [0],
    histSize = [src.cols / scale],
    ranges = [0, 255];
  let hist = new cv.Mat(),
    mask = new cv.Mat(),
    color = new cv.Scalar(0xfb, 0xca, 0x04, 0xff);
  cv.calcHist(srcVec, channels, mask, hist, histSize, ranges);
  let result = cv.minMaxLoc(hist, mask);
  var max = result.maxVal;
  cv.cvtColor(dstC1, dstC4, cv.COLOR_GRAY2RGBA);
  // draw histogram on src
  for (var i = 0; i < histSize[0]; i++) {
    var binVal = (hist.data32F[i] * src.rows) / max;
    cv.rectangle(
      dstC4,
      { x: i * scale, y: src.rows - 1 },
      { x: (i + 1) * scale - 1, y: src.rows - binVal / 3 },
      color,
      cv.FILLED
    );
  }
  srcVec.delete();
  mask.delete();
  hist.delete();
  return dstC4;
}

function equalizeHist(src) {
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY, 0);
  cv.equalizeHist(dstC1, dstC1);
  return dstC1;
}

function findContours(src) {
    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    // cv.threshold(src, src, 100, 200, cv.THRESH_BINARY);
    // let contours = new cv.MatVector();
    // let hierarchy = new cv.Mat();
    // let poly = new cv.MatVector();
    // cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // // approximates each contour to polygon
    // for (let i = 0; i < contours.size(); ++i) {
    //     let tmp = new cv.Mat();
    //     let cnt = contours.get(i);
    //     // You can try more different parameters
    //     cv.approxPolyDP(cnt, tmp, 3, true);
    //     poly.push_back(tmp);
    //     cnt.delete(); tmp.delete();
    // }
    // // draw contours with random Scalar
    // for (let i = 0; i < contours.size(); ++i) {
    //     let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
    //         Math.round(Math.random() * 255));
    //     cv.drawContours(dstC3, poly, i, color, 1, 8, hierarchy, 0);
    // }
		// contours.delete(); hierarchy.delete(); poly.delete();
    return src;
}

async function processVideo() {
	if(!streaming) return;
  vc.read(src);
  let result;
  switch (filter) {
    case "passThrough":
      result = passThrough(src);
      break;
    case "gray":
      result = gray(src);
      break;
    case "hsv":
      result = hsv(src);
      break;
    case "scharr":
      result = scharr(src);
      break;
    case "calcHist":
      result = calcHist(src);
      break;
    case "equalizeHist":
      result = equalizeHist(src);
      break;
    case 'processImage': 
      const canvasOutput = document.querySelector('#canvasOutput');
      const ctx = canvasOutput.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const image = context.getImageData(0, 0, video.videoWidth, video.videoHeight);
      result = await cvService.imageProcessing(image);
      ctx.putImageData(result.data.payload, 0, 0, 0, 0, canvasOutput.width, canvasOutput.height);
      animeReq = requestAnimationFrame(processVideo);
      return;
		case 'findContours': result = findContours(src);
			break;
    default:
      result = passThrough(src);
  }
  cv.imshow("canvasOutput", result);
  animeReq = requestAnimationFrame(processVideo);
}

function stopVideoProcessing() {
  if (src != null && !src.isDeleted()) src.delete();
  if (dstC1 != null && !dstC1.isDeleted()) dstC1.delete();
  if (dstC3 != null && !dstC3.isDeleted()) dstC3.delete();
  if (dstC4 != null && !dstC4.isDeleted()) dstC4.delete();
}

function stopCamera() {
  if (!streaming) return;
  animeReq && window.cancelAnimationFrame(animeReq);
  stopVideoProcessing();
  document
    .getElementById("canvasOutput")
    .getContext("2d")
    .clearRect(0, 0, width, height);
  context.clearRect(0, 0, width, height);
  video.pause();
  video.srcObject = null;
  stream.getVideoTracks()[0].stop();
  streaming = false;
}

startButton.addEventListener("click", () => {
  if (streaming) {
    // stream.stop();
    // URL.revokeObjectURL(video.src); // cleanin up
    stopCamera();
    startButton.querySelector(".material-icons").textContent = "videocam";
  } else {
    startButton.querySelector(".material-icons").textContent = "...";
    startCamera();
  }
});

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices;
}

const getCameraSelection = async () => {
  const devices = await getDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");
  const options = videoDevices.map((videoDevice) => {
    if (videoDevice.label === "") return "";
    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
  });
  options.unshift(`<option value="user">Front Camera</option>`);
  options.unshift(`<option value="environment">Rear Camera</option>`);
  return options;
};

const getCameraList = (cameraOptions) => {
  getCameraSelection()
    .then((data) => {
      if (!cameraOptions) {
        return;
      }
      if (data.join("") === "") {
        cameraOptions.style.display = "none";
      } else {
        cameraOptions.innerHTML = data.join("");
      }
    })
    .catch((error) => console.error(error));
};

cameraOptions.addEventListener("change", () => {});

getCameraList(cameraOptions);
