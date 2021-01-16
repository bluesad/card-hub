let dstC1 = null;
let dstC3 = null;
let dstC4 = null;

/**
 * With OpenCV we have to work the images as cv.Mat (matrices),
 * so the first thing we have to do is to transform the
 * ImageData to a type that openCV can recognize.
 */
function imageProcessing({ msg, payload }) {
  const img = cv.matFromImageData(payload);
  let result = new cv.Mat();

  // What this does is convert the image to a grey scale.
  cv.cvtColor(img, result, cv.COLOR_BGR2GRAY);
  postMessage({ msg, payload: imageDataFromMat(result) });
  // postMessage({ msg, payload: result })
}

function findContours({ msg, payload }) {
  let src = cv.matFromImageData(payload);
  let gray_src = new cv.Mat();
  cv.cvtColor(src, gray_src, cv.COLOR_RGB2GRAY, 0);
  let raw_edge = new cv.Mat();
  let edge = new cv.Mat();
  let ksize = new cv.Size(5, 5);
  cv.GaussianBlur(gray_src, gray_src, ksize, 0, 0, cv.BORDER_DEFAULT);

  // You can try more different parameters
  cv.Canny(gray_src, raw_edge, 100, 200);
  // let kernel_size = Math.ceil(Math.min(raw_edge.cols, raw_edge.rows)/144);
  let kernel_size = 5;
  let M = cv.Mat.ones(kernel_size, kernel_size, cv.CV_8U);
  // You can try more different parameters
  cv.morphologyEx(raw_edge, edge, cv.MORPH_CLOSE, M);
  let dst = cv.Mat.zeros(edge.rows, edge.cols, cv.CV_8UC3);
  cv.adaptiveThreshold(
    edge,
    edge,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    kernel_size,
    2
  );

  //        cv.threshold(edge, edge, 100, 200, cv.THRESH_BINARY);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let poly = new cv.MatVector();
  cv.findContours(
    edge,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  );

  // approximates each contour to polygon
  let maxContourArea = 0;
  let maxContourIndex = -1;
  for (let i = 0; i < contours.size(); ++i) {
    let tmp = new cv.Mat();
    let cnt = contours.get(i);
    if (cv.contourArea(cnt) > 10000) {
      if (cv.contourArea(cnt) > maxContourArea) {
        maxContourArea = cv.contourArea(cnt);
        maxContourIndex = i;
      }
      // You can try more different parameters
      let perimeter = cv.arcLength(cnt, true) * 0.005;
      if (perimeter < 8) {
        perimeter = 8;
      }
      cv.approxPolyDP(cnt, tmp, perimeter, true);
      poly.push_back(tmp);
    }
    cnt.delete();
    tmp.delete();
  }
  if (maxContourIndex >= 0) {
    let rotatedRect = cv.minAreaRect(contours.get(maxContourIndex));
    let vertices = cv.RotatedRect.points(rotatedRect);
    let contoursColor = new cv.Scalar(255, 255, 255, 100);
    let rectangleColor = new cv.Scalar(255, 0, 0, 222);
    cv.drawContours(
      src,
      contours,
      maxContourIndex,
      contoursColor,
      1,
      8,
      hierarchy,
      100
    );
    // draw rotatedRect
    for (let i = 0; i < 4; i++) {
      cv.line(
        src,
        vertices[i],
        vertices[(i + 1) % 4],
        rectangleColor,
        2,
        cv.LINE_AA,
        0
      );
    }

    let angle = rotatedRect.angle;
    let center = new cv.Point(src.cols / 2, src.rows / 2);

    M = cv.getRotationMatrix2D(center, angle, 1);
    let dsize = new cv.Size(src.rows * 2, src.cols * 2);
    cv.warpAffine(
      src,
      src,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );

    //try{
    //     let rect = new cv.Rect(rotatedRect.center.x/2, rotatedRect.center.y/2, rotatedRect.size.width, rotatedRect.size.height);
    //     src = src.roi(rect);
    //}catch(e){
    //    console.error(e, rotatedRect.center.x/2, rotatedRect.center.y/2, rotatedRect.size.width, rotatedRect.size.height);
    //}

    //    cv.drawContours(dst, poly, i, color, 1, 8, hierarchy, 0);
    // cv.imshow("canvasOutput", src);
  }

  postMessage({ msg, payload: imageDataFromMat(src) });
  src.delete();
  gray_src.delete();
  raw_edge.delete();
  edge.delete();
  M.delete();
  dst.delete();
  hierarchy.delete();
  contours.delete();
  poly.delete();
}


function gray(payload) {
  let src = cv.matFromImageData(payload);
  dstC1 = new cv.Mat(payload.height, payload.width, cv.CV_8UC1);
  // dstC3 = new cv.Mat(payload.height, payload.width, cv.CV_8UC3);
  
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY);
  postMessage({ msg: 'gray', payload: imageDataFromMat(dstC1) });
  dstC1.delete();
  src.delete();
  // return dstC1;
}

function hsv(payload) {
  let src = cv.matFromImageData(payload);
  dstC3 = new cv.Mat(payload.height, payload.width, cv.CV_8UC3);

  cv.cvtColor(src, dstC3, cv.COLOR_RGBA2RGB);
  cv.cvtColor(dstC3, dstC3, cv.COLOR_RGB2HSV);
  // return dstC3;
  postMessage({ msg: 'hsv', payload: imageDataFromMat(dstC3) });
  dstC3.delete();
  src.delete();
}

function scharr(payload) {
  let src = cv.matFromImageData(payload);
  let mat = new cv.Mat(payload.height, payload.width, cv.CV_8UC1);
  dstC1 = new cv.Mat(payload.height, payload.width, cv.CV_8UC1);
  cv.cvtColor(src, mat, cv.COLOR_RGB2GRAY, 0);
  cv.Scharr(mat, dstC1, cv.CV_8U, 1, 0, 1, 0, cv.BORDER_DEFAULT);
  mat.delete();
  // return dstC1;
  postMessage({ msg: 'scharr', payload: imageDataFromMat(dstC1) });
  dstC1.delete();
}


function calcHist(payload) {
  let src = cv.matFromImageData(payload);
  dstC1 = new cv.Mat(payload.height, payload.width, cv.CV_8UC1);
  dstC4 = new cv.Mat(payload.height, payload.width, cv.CV_8UC4);

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
  let max = result.maxVal;
  cv.cvtColor(dstC1, dstC4, cv.COLOR_GRAY2RGBA);
  // draw histogram on src
  for (let i = 0; i < histSize[0]; i++) {
    let binVal = (hist.data32F[i] * src.rows) / max;
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
  // return dstC4;
  postMessage({ msg: 'calcHist', payload: imageDataFromMat(dstC4) });
  dstC4.delete();
  dstC1.delete();
  src.delete();
}

function equalizeHist(payload) {
  let src = cv.matFromImageData(payload);
  dstC1 = new cv.Mat(payload.height, payload.width, cv.CV_8UC1);
  cv.cvtColor(src, dstC1, cv.COLOR_RGBA2GRAY, 0);
  cv.equalizeHist(dstC1, dstC1);
  // return dstC1;
  postMessage({ msg: 'equalizeHist', payload: imageDataFromMat(dstC1) });
  dstC1.delete();
  src.delete();
}

/**
 * This function is to convert again from cv.Mat to ImageData
 */
function imageDataFromMat(mat) {
  // convert the mat type to cv.CV_8U
  const img = new cv.Mat();
  const depth = mat.type() % 8;
  const scale =
    depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
  const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
  mat.convertTo(img, cv.CV_8U, scale, shift);

  // convert the img type to cv.CV_8UC4
  switch (img.type()) {
    case cv.CV_8UC1:
      cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
      break;
    case cv.CV_8UC3:
      cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
      break;
    case cv.CV_8UC4:
      break;
    default:
      throw new Error(
        "Bad number of channels (Source image must have 1, 3 or 4 channels)"
      );
  }
  const clampedArray = new ImageData(
    new Uint8ClampedArray(img.data),
    img.cols,
    img.rows
  );
  img.delete();
  return clampedArray;
}

/**
 *  Here we will check from time to time if we can access the OpenCV
 *  functions. We will return in a callback if it has been resolved
 *  well (true) or if there has been a timeout (false).
 */
function waitForOpencv(
  callbackFn,
  waitTimeMs = 1000 * 30 * 20,
  stepTimeMs = 100
) {
  if (cv.Mat) callbackFn(true);

  let timeSpentMs = 0;
  const interval = setInterval(() => {
    const limitReached = timeSpentMs > waitTimeMs;
    if (cv.Mat || limitReached) {
      clearInterval(interval);
      return callbackFn(!limitReached);
    } else {
      timeSpentMs += stepTimeMs;
    }
  }, stepTimeMs);
}

/**
 * This exists to capture all the events that are thrown out of the worker
 * into the worker. Without this, there would be no communication possible
 * with our project.
 */
onmessage = function(e) {
  switch (e.data.msg) {
    case "load": {
      // Import Webassembly script
      // self.importScripts('./opencv_3_4_custom_O3.js')
      self.importScripts("./opencv_custom.js");
      waitForOpencv((success) => {
        if (success) postMessage({ msg: e.data.msg });
        else throw new Error("Error on loading OpenCV");
      });
      break;
    }
    case "imageProcessing":
      return imageProcessing(e.data);
    case "findContours":
      return findContours(e.data);
    case 'gray':
    case "hsv":
    case "scharr":
    case "calcHist":
    case "equalizeHist":
      return eval(e.data.msg)(e.data.payload);
    default:
      break;
  }
};
