function Cov() {
    console.time('opencv processing');
    try{
        let src = cv.imread('canvas');
        let gray_src = new cv.Mat();
        cv.cvtColor(src, gray_src, cv.COLOR_RGB2GRAY, 0);
        let raw_edge = new cv.Mat();
        let edge = new cv.Mat();
        let ksize = new cv.Size(5, 5);
        cv.GaussianBlur(gray_src, gray_src, ksize, 0, 0, cv.BORDER_DEFAULT);

        // You can try more different parameters
        cv.Canny(gray_src, raw_edge, 100, 200);
        let kernel_size = Math.ceil(Math.min(raw_edge.cols, raw_edge.rows)/144);
        let M = cv.Mat.ones(kernel_size, kernel_size, cv.CV_8U);
        // You can try more different parameters
        cv.morphologyEx(raw_edge, edge, cv.MORPH_CLOSE, M);
        let dst = cv.Mat.zeros(edge.rows, edge.cols, cv.CV_8UC3);
        cv.adaptiveThreshold(edge, edge, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, kernel_size, 2);

//        cv.threshold(edge, edge, 100, 200, cv.THRESH_BINARY);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        let poly = new cv.MatVector();
        cv.findContours(edge, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

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
            cnt.delete(); tmp.delete();
        }
        if (maxContourIndex >= 0) {
            let rotatedRect = cv.minAreaRect(contours.get(maxContourIndex));
            let vertices = cv.RotatedRect.points(rotatedRect);
            let contoursColor = new cv.Scalar(255, 255, 255, 100);
            let rectangleColor = new cv.Scalar(255, 0, 0, 222);
            cv.drawContours(src, contours, maxContourIndex, contoursColor, 1, 8, hierarchy, 100);
            // draw rotatedRect
            for (let i = 0; i < 4; i++) {
                cv.line(src, vertices[i], vertices[(i + 1) % 4], rectangleColor, 2, cv.LINE_AA, 0);
            }

            let angle = rotatedRect.angle;
            let center = new cv.Point(src.cols / 2, src.rows / 2);

            M = cv.getRotationMatrix2D(center,angle,1);
            let dsize = new cv.Size(src.rows*2, src.cols*2);
            cv.warpAffine(src, src, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        
            //try{
            //     let rect = new cv.Rect(rotatedRect.center.x/2, rotatedRect.center.y/2, rotatedRect.size.width, rotatedRect.size.height);
            //     src = src.roi(rect);
             //}catch(e){
             //    console.error(e, rotatedRect.center.x/2, rotatedRect.center.y/2, rotatedRect.size.width, rotatedRect.size.height);
             //}

        //    cv.drawContours(dst, poly, i, color, 1, 8, hierarchy, 0);
            cv.imshow('canvasOutput', src);
        }
        src.delete(); gray_src.delete(); raw_edge.delete(); edge.delete(); M.delete(); dst.delete(); hierarchy.delete(); contours.delete(); poly.delete();
    } catch(err){
        console.error(err);
    }
    console.timeEnd('opencv processing');
}

