function loadImageToCanvas(url, cavansId) {
  let canvas = document.getElementById(cavansId);
  let ctx = canvas.getContext("2d");
  let img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  };
  img.src = url;
}
let inputSourceElement = document.getElementById("sourceInput");
const canvasInputId = "canvasInput";
inputSourceElement.addEventListener(
  "change",
  (e) => {
    let files = e.target.files;
    if (files.length > 0) {
      let imgUrl = URL.createObjectURL(files[0]);
      loadImageToCanvas(imgUrl, canvasInputId);
    }
  },
  false
);

const btnEle = document.getElementById("start-extract-button");
btnEle.onclick = function () {
  this.disabled = true;
  try {
    let sourceMat = cv.imread("canvasInput");
    itemExtract(sourceMat, "canvasOutput");
  } catch (error) {
    console.error(error);
  }
  this.disabled = false;
};

document.getElementById("download-button").onclick = function () {
  this.href = document.getElementById("canvasOutput").toDataURL("image/png");
  this.download = "result.png";
};
