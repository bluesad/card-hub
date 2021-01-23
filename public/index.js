import cvService from './javascripts/cv-service.mjs';

// function component() {
//   const element = document.createElement('div');

//   // Lodash, currently included via a script, is required for this line to work
//   element.innerHTML = ['Hello', 'webpack'].join(' ');

//   return element;
// }

const LoadOpenCV = async ()=> {
  await cvService.load();
  window.cvService = cvService;
}

LoadOpenCV().then(() => {
  console.log('loadded');
}).catch(err => {
  console.error(err);
});


// document.body.appendChild(component());