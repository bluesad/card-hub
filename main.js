/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// CONCATENATED MODULE: ./public/javascripts/cv-service.mjs
class CV {
  /**
   * We will use this method privately to communicate with the worker and
   * return a promise with the result of the event. This way we can call
   * the worker asynchronously.
   */
  _dispatch(event) {
    const { msg } = event;
    this._status[msg] = ["loading"];
    this.worker.postMessage(event);
    return new Promise((res, rej) => {
      let interval = setInterval(() => {
        const status = this._status[msg];
        if (status && status[0] === "done") res(status[1]);
        if (status && status[0] === "error") rej(status[1]);
        if (status && status[0] !== "loading") {
          delete this._status[msg];
          clearInterval(interval);
        }
      }, 50);
    });
  }

  /**
   * First, we will load the worker and we will capture the onmessage
   * and onerror events to know at all times the status of the event
   * we have triggered.
   *
   * Then, we are going to call the 'load' event, as we've just
   * implemented it so that the worker can capture it.
   */
  load() {
    this._status = {};
    this.worker = new Worker(`./javascripts/cv.worker.js`); // load worker

    // Capture events and save [status, event] inside the _status object
    this.worker.onmessage = (e) => {
      this._status[((e || {}).data || {}).msg] = ["done", e];
    };
    this.worker.onerror = (e) =>
      (this._status[((e || {}).data || {}).msg] = ["error", e]);
    return this._dispatch({ msg: "load" });
  }

  /**
   * We are going to use the _dispatch event that we created before to
   * call the postMessage with the msg and the image as payload.
   *
   * Thanks to what we have implemented in the _dispatch, this will
   * return a promise with the processed image.
   */
  imageProcessing(payload) {
    return this._dispatch({ msg: "imageProcessing", payload });
  }

  findContours(payload) {
    return this._dispatch({ msg: "findContours", payload });
  }

  filter({ payload, actionType }) {
    return this._dispatch({ msg: actionType, payload });
  }
}

// Export the same instant everywhere
/* harmony default export */ const cv_service = (new CV());

;// CONCATENATED MODULE: ./public/index.js


// function component() {
//   const element = document.createElement('div');

//   // Lodash, currently included via a script, is required for this line to work
//   element.innerHTML = ['Hello', 'webpack'].join(' ');

//   return element;
// }

const LoadOpenCV = async ()=> {
  await cv_service.load();
  window.cvService = cv_service;
}

LoadOpenCV().then(() => {
  console.log('loadded');
}).catch(err => {
  console.error(err);
});


// document.body.appendChild(component());
/******/ })()
;