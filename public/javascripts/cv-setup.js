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
let constraints = {
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
      ideal: 1920, // 7680
      max: 3840,
    },
    height: {
      min: 320,
      ideal: 1080, // 4320
      max: 2160
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
const canvasOutput = document.querySelector('#canvasOutput');
const ctx = canvasOutput.getContext('2d');

// let streaming = false;
// let streamOn = null;
let animeReq = null;
let stream = null;
let imageCapture;
let vc = null;

// In this case, We set width 320, and the height will be computed based on the input stream.
let width = 1080;
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

      let photoCapabilities = stream.getVideoTracks()[0].getCapabilities();
      if(photoCapabilities.zoom) {
        input.min = photoCapabilities.zoom.min; // photoCapabilities.width.min;
        input.max = photoCapabilities.zoom.max; // photoCapabilities.width.max;
        input.step = photoCapabilities.zoom.step; // photoCapabilities.imageWidth.step;
      }
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


// let contoursColor = [];
// for (let i = 0; i < 10000; i++) {
//   contoursColor.push([
//     Math.round(Math.random() * 255),
//     Math.round(Math.random() * 255),
//     Math.round(Math.random() * 255),
//     0,
//   ]);
// }


// function findContours(imgData) {
    
//     return src;
// }
function setFilters() {
  const filters = [
    { value: "gray", name: "灰度" },
    { value: "hsv", name: "HSV" },
    { value: "scharr", name: "Scharr" },
    { value: "calcHist", name: "直方图📊" },
    { value: "equalizeHist", name: "Equalize Histogram" },
    { value: "findContours", name: "卡片识别" },
    { value: "passThrough", name: "默认" },
  ];
  let d=document.createDocumentFragment();
  filters.forEach(it => {
    let opt = document.createElement('option');
    opt.setAttribute('value', it.value);
    if(it.value === 'passThrough') {
      opt.setAttribute('selected', 'selected');
    }
    opt.innerText = it.name;

    d.appendChild(opt);
  });
  let select = document.createElement('select');
  select.appendChild(d);
  select.addEventListener('change', (e) => {
    filter = e.target.value;
  });
  document.querySelector('.filter-type').appendChild(select);
}

async function processVideo() {
	if(!streaming) return;
  vc.read(src);
  let result, image;

  context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  image = context.getImageData(0, 0, video.videoWidth, video.videoHeight);

  switch (filter) {
    case "gray":
      // result = gray(src);
      result = await cvService.filter({payload: image, actionType: 'gray'});
      break;
    case "hsv":
      result = await cvService.filter({payload: image, actionType: 'hsv'});
      break;
    case "scharr":
      result = await cvService.filter({payload: image, actionType: 'scharr'});
      break;
    case "calcHist":
      result = await cvService.filter({payload: image, actionType: 'calcHist'});
      break;
    case "equalizeHist":
      result = await cvService.filter({payload: image, actionType: 'equalizeHist'});
      break;
    case 'processImage': 
      result = await cvService.imageProcessing(image);

      break;
		case 'findContours': 
      result = await cvService.findContours(image);

      // await (() => new Promise((resolve, reject) =>{
      //   setTimeout(resolve, 5000);
      // }))();

      break;
    case "passThrough":
    default:
      result = passThrough(src);
      cv.imshow("canvasOutput", result);
      animeReq = requestAnimationFrame(processVideo);
      return;
  }
  ctx.putImageData(result.data.payload, 0, 0, 0, 0, canvasOutput.width, canvasOutput.height);
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
  ctx.clearRect(0, 0, width, height);
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

cameraOptions.addEventListener("change", () => {
  stopCamera();
  let facingMode = cameraOptions.value;
  switch (facingMode) {
    case "user":
    case "environment":
      constraints = {
        ...constraints,
        video: {
          ...constraints.video,
          facingMode: {
            ...constraints.video.facingMode,
            ideal: facingMode,
          },
        },
      };
      delete constraints.video.deviceId;
      break;
    default:
      constraints = {
        ...constraints,
        video: {
          ...constraints.video,
          deviceId: {
            ...constraints.video.deviceId,
            ideal: facingMode,
          },
        },
      };
      delete constraints.video.facingMode;
      break;
  }
  // alert(JSON.stringify(constraints));
  startCamera();
});

input.oninput = async (event) => {
  if (stream) {
    try {
      const constraints = { advanced: [{ zoom: input.value }] };
      const [track] = stream.getVideoTracks();
      await track.applyConstraints(constraints);
    } catch (err) {
      console.error("applyConstraints() failed: ", err);
    }
  }
};

getCameraList(cameraOptions);

setFilters();
