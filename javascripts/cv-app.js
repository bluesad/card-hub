function Cov() {
    let src = cv.imread('canvas');
    cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
    let edge = new cv.Mat();
    // You can try more different parameters
    cv.Canny(src, edge, 50, 100, 3, false);

    let dst = cv.Mat.zeros(edge.rows, edge.cols, cv.CV_8UC3);
    cv.cvtColor(edge, edge, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(edge, edge, 100, 200, cv.THRESH_BINARY);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let poly = new cv.MatVector();
    cv.findContours(edge, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // approximates each contour to polygon
    for (let i = 0; i < contours.size(); ++i) {
        let tmp = new cv.Mat();
        let cnt = contours.get(i);
        // You can try more different parameters
        cv.approxPolyDP(cnt, tmp, 3, true);
        poly.push_back(tmp);
        cnt.delete(); tmp.delete();
    }
    // draw contours with random Scalar
    for (let i = 0; i < contours.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
            Math.round(Math.random() * 255));
        cv.drawContours(dst, poly, i, color, 1, 8, hierarchy, 0);
    }
    cv.imshow('canvasOutput', dst);
    src.delete(); edge.delete(); dst.delete(); hierarchy.delete(); contours.delete(); poly.delete();
}
