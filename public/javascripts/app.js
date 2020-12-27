// this is not part of the polyfill
if (
  !("mediaDevices" in navigator) ||
  !("getUserMedia" in navigator.mediaDevices)
) {
  throw new Error("getUserMedia() not supported.");
}

const video = document.querySelector("video");
const constraints = {
  audio: false,
  video: {
    // width: {
    //   min: 1280,
    //   ideal: 1920,
    //   max: 2560,
    // },
    // height: {
    //   min: 720,
    //   ideal: 1080,
    //   max: 1440
    // },
    // facingMode: 'user'
    facingMode: {
      ideal: "environment",
    },
  },
};
const mediaStream = new MediaStream();
const canvas = document.querySelector("#canvas");
const context = canvas.getContext("2d");
const photo = document.querySelector("#photo");
const button = document.querySelector("button.foo-button");
const cameraButton = document.querySelector(".camera-button");
const cameraOptions = document.querySelector(".custom-select");

let streaming = false;
let streamOn = null;
let animeReq = null;

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices;
}

function step(timestamp) {

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  Cov && Cov();
  
  animeReq = window.requestAnimationFrame(step);
}

function startCamera(constraints) {
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      // video.src = URL.createObjectURL(stream);
      try {
        video.srcObject = stream;
      } catch (error) {
        video.src = window.URL.createObjectURL(stream);
      }
      video.play();

      requestAnimationFrame(step);

      return stream; // so chained promises can benefit
    })
    .catch((error) => {
      console.error("An error occurred: ", error);
    });
}

function clearphoto() {
  const context = canvas.getContext("2d");
  // context.fillStyle = "#AAA";
  // context.fillRect(0, 0, canvas.width, canvas.height);
	context.clearRect(0, 0, canvas.width, canvas.height);

  const ctx = document.querySelector('#canvasOutput').getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const data = canvas.toDataURL("image/webp");
  photo.setAttribute("src", data);
}

function dataURLtoBlob (dataURL) {
  let binary = atob(dataURL.split(',')[1]);
  let array = [];
  let i = 0;
  while (i < binary.length){
    array.push(binary.charCodeAt(i));
    i++;
  }
  return new Blob([ new Uint8Array(array) ], {type: 'image/webp'});
}

function takepicture() {
  const context = canvas.getContext("2d");
  if (video.videoWidth && video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/webp");
    photo.setAttribute("src", data);

    const file  = dataURLtoBlob(data);
    handleFiles(file);
    // Cov && Cov();
  } else {
    clearphoto();
  }
}


function handleFiles(file) {
    const uri = 'https://s1ar.cc/lookup';
    const xhr = new XMLHttpRequest();
    const fd = new FormData();

    xhr.open('POST', uri, true);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // console.log(xhr.responseText);
            const result = JSON.parse(xhr.responseText);
            let { distances } = result,
                str = '';
            if (distances && distances.length > 0) {
                distances.forEach((item, i) => {
                    if (i > 2) {
                        return;
                    }
                    alert(JSON.stringify(item));
                });
            } else {
                show(snackbar, '没有找到图片中的颜哦😯');
            }
        } else if (xhr.readyState === 4 && xhr.status !== 0) {
            show(snackbar, '没有找到图片中的颜哦😯');
        } else {
          show(snackbar, '出错惹');
        }
    };
    fd.append('image', file);
    xhr.send(fd);
}

function show(sb, messageInput) {
    // const data = {
    //     message: messageInput,
    //     timeout: 2750,
    //     actionText: '确定',
    //     actionHandler: () => {
    //         // console.log(data);
    //     }
    // };
    document.querySelector('.mdc-snackbar__label').textContent = messageInput;
    sb.open();
}

////////////////////////////////////////////////////////////////



const getCameraSelection = async () => {
  const devices = await getDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");
  const options = videoDevices.map((videoDevice) => {
    if(videoDevice.label === '') return '';
    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
  });
  return options;
};

const getCameraList = () => {
  getCameraSelection()
    .then((data) => {
      if(data.join('')==='') {
        cameraOptions.style.display = 'none';
      }else{
        cameraOptions.innerHTML = data.join("");
      }
    })
    .catch((error) => console.error(error));
};

const pauseStream = () => {
  video.pause();
  streamOn.getTracks().forEach((track) => {
    track.stop();
  });
	clearphoto();
  animeReq && window.cancelAnimationFrame(animeReq);
	video.srcObject = null;
  streamOn = null;
};




////////////////////////////////////////////////////////////////


video.addEventListener(
  "canplay",
  function (ev) {
    if (!streaming) {
      canvas.setAttribute("width", video.videoWidth);
      canvas.setAttribute("height", video.videoHeight);
      streaming = true;
    }
  },
  false
);

button.onclick = function () {
  const button = this;
  if (streamOn !== null) {
    // streamOn.stop();
    // URL.revokeObjectURL(video.src); // cleanin up
    pauseStream();
    button.textContent = "Start camera";
  } else {
    button.textContent = "Starting camera";
    startCamera(constraints).then((stream) => {
      streamOn = stream;
      button.textContent = "Stop camera";
    });
  }
};

cameraButton.addEventListener(
  "click",
  function (ev) {
    clearphoto();
    takepicture();
    ev.preventDefault();
  },
  false
);

cameraOptions.onchange = () => {
  const updatedConstraints = {
    ...constraints,
    deviceId: {
      exact: cameraOptions.value,
    },
  };

  startCamera(updatedConstraints);
};


////////////////////////////////////////////////////////////////



getCameraList();
