// this is not part of the polyfill
const startApp = () => {
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
        max: 4320
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
  let stream;
  let imageCapture;

  async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  }

  function startCamera(constraints) {
    return navigator.mediaDevices
      .getUserMedia(constraints)
      .then((rawStream) => {
        // video.src = URL.createObjectURL(stream);
        try {
          video.src = window.URL.createObjectURL(rawStream);
        } catch (error) {
          video.srcObject = rawStream;
        }
        video.play();
        document.querySelector('#demo-absolute-fab').disabled = false;

        window.requestAnimationFrame(step);

        return rawStream; // so chained promises can benefit
      })
      .catch((error) => {
        console.error("An error occurred: ", error);
        alert(error);
      });
  }

  function clearphoto() {
    const context = canvas.getContext("2d");
    const ctx = document.querySelector("#canvasOutput").getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    photo.removeAttribute("src");
  }

  function dataURLtoBlob(dataURL) {
    let binary = atob(dataURL.split(",")[1]);
    let array = [];
    let i = 0;
    while (i < binary.length) {
      array.push(binary.charCodeAt(i));
      i++;
    }
    return new Blob([new Uint8Array(array)], { type: "image/webp" });
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
    (
      document.querySelector(".mdc-snackbar__label") || {}
    ).textContent = messageInput;
    sb.open();
  }

  ////////////////////////////////////////////////////////////////

  const getCameraSelection = async () => {
    const devices = await getDevices();
    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    const options = videoDevices.map((videoDevice) => {
      if (videoDevice.label === "") return "";
      return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
    });
    options.unshift(`<option value="user">前置</option>`);
    options.unshift(`<option value="environment">后置</option>`);
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

  const pauseStream = () => {
    video.pause();
    document.querySelector('#demo-absolute-fab').disabled = false;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    clearphoto();
    animeReq && window.cancelAnimationFrame(animeReq);
    video.srcObject = null;
    video.src = null;
    stream = null;
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    document.querySelector("#canvasOutput").removeAttribute("width");
    document.querySelector("#canvasOutput").removeAttribute("height");
  };

  const capture = async (facingMode) => {
    let updatedConstraints;
    switch (facingMode) {
      case "user":
      case "environment":
        updatedConstraints = {
          ...constraints,
          video: {
            ...constraints.video,
            facingMode: {
              ...constraints.video.facingMode,
              ideal: facingMode,
            },
          },
        };
        break;
      default:
        updatedConstraints = {
          ...constraints,
          video: {
            ...constraints.video,
            deviceId: {
              ...constraints.video.deviceId,
              ideal: facingMode,
            },
          },
        };
        break;
    }
    // constraints.video.facingMode.ideal = facingMode;
    pauseStream();
    startCamera(updatedConstraints)
      .then((rawStream) => {
        stream = rawStream;
        startButton.querySelector(".material-icons").textContent =
          "videocam_off";

        const track = rawStream.getVideoTracks()[0];
        imageCapture = new ImageCapture(track);

        return imageCapture.getPhotoCapabilities();
      })
      .then((photoCapabilities) => {
        // const settings = imageCapture.track.getSettings();

        input.min = photoCapabilities.imageWidth.min;
        input.max = photoCapabilities.imageWidth.max;
        input.step = photoCapabilities.imageWidth.step;

        return imageCapture.getPhotoSettings();
      })
      .then((photoSettings) => {
        input.value = photoSettings.imageWidth;
      })
      .catch((error) => console.error("Argh!", error.name || error));
  };


  ////////////////////////////////////////////////////////////////


  video.addEventListener(
    "canplay",
    function(ev) {
      canvas.setAttribute("width", video.videoWidth);
      canvas.setAttribute("height", video.videoHeight);
      document.querySelector('#canvasOutput').setAttribute("width", video.videoWidth);
      document.querySelector('#canvasOutput').setAttribute("height", video.videoHeight);
    },
    false
  );

  startButton.addEventListener("click", () => {
    if (stream) {
      // stream.stop();
      // URL.revokeObjectURL(video.src); // cleanin up
      pauseStream();
      startButton.querySelector('.material-icons').textContent = "videocam";
    } else {
      startButton.querySelector('.material-icons').textContent = "...";
      capture("environment");
    }
  });

  cameraButton.addEventListener("click", onTakePhotoButtonClick, false);

  // btnBack.addEventListener("click", () => {
  //   capture("environment");
  // });

  // btnFront.addEventListener("click", () => {
  //   capture("user");
  // });

  cameraOptions.addEventListener("change", () => {
    capture(cameraOptions.value);
    // const updatedConstraints = {
    //   ...constraints,
    //   video: {
    //     deviceId: {
    //       exact: cameraOptions.value,
    //     },
    //   },
    // };

    // if(streamOn){
    //   const frIdeal = 35;
    //   let track = streamOn.getVideoTracks()[0]; // getTracks
    //   let constrs = track.getConstraints();
    //   let frCap = track.getCapabilities().frameRate;
    //   if (frCap && "min" in frCap && "max" in frCap) {
    //     constrs.frameRate = Math.max(frCap.min, Math.min(frCap.max, frIdeal));
    //     constrs.deviceId = constrs.deviceId || {};
    //     constrs.deviceId.exact = cameraOptions.value;
    //     track.applyConstraints(constrs);
    //   }
    // }

    // startCamera(updatedConstraints);
  });


  ////////////////////////////////////////////////////////////////



  getCameraList(cameraOptions);




  ////////////////////////////////////////////////////////////////

  function step(timestamp) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // onTakePhotoButtonClick();
    // Cov && Cov();

    animeReq = window.requestAnimationFrame(step);
  }

  function takepicture() {
    const context = canvas.getContext("2d");
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const data = canvas.toDataURL("image/webp");
      photo.setAttribute("src", data);

      const file = dataURLtoBlob(data);
      handleFiles(file);
    } else {
      clearphoto();
    }
  }

  function handleFiles(file) {
    const uri = "https://s1ar.cc/lookup";
    const xhr = new XMLHttpRequest();
    const fd = new FormData();

    xhr.open("POST", uri, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // console.log(xhr.responseText);
        const result = JSON.parse(xhr.responseText);
        let { distances } = result,
          str = "";
        if (distances && distances.length > 0) {
          distances.forEach((item, i) => {
            if (i > 2) {
              return;
            }
            alert(JSON.stringify(item));
          });
        } else {
          show(snackbar, "没有找到图片中的颜哦😯");
        }
      } else if (xhr.readyState === 4 && xhr.status !== 0) {
        show(snackbar, "没有找到图片中的颜哦😯");
      } else {
        show(snackbar, "出错惹");
      }
    };
    fd.append("image", file);
    xhr.send(fd);
  }

  function onTakePhotoButtonClick() {
    if (video.videoWidth && video.videoHeight && imageCapture) {
      imageCapture
        .takePhoto({ imageWidth: input.max })
        .then((blob) => createImageBitmap(blob))
        .then((imageBitmap) => {
          drawCanvas(imageBitmap);
          console.log(
            `Photo size is ${imageBitmap.width}x${imageBitmap.height}`
          );
          return imageBitmap;
        })
        // .then(() => {
        //   const data = canvas.toDataURL("image/webp");
        //   const file = dataURLtoBlob(data);
        //   handleFiles(file);
        // })
        .catch((error) => console.error(error));
    }
  }

  function drawCanvas(img) {
    let c = document.querySelector('#canvasOutput');
    let ctx = c.getContext('2d');
    c.width = getComputedStyle(c).width.split("px")[0];
    c.height = getComputedStyle(c).height.split("px")[0];
    let ratio = Math.min(c.width / img.width, c.height / img.height);
    let x = (c.width - img.width * ratio) / 2;
    let y = (c.height - img.height * ratio) / 2;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      x,
      y,
      img.width * ratio,
      img.height * ratio
    );
  }

};


startApp();
