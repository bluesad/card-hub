# card-hub 
![CI](https://github.com/ishida83/card-hub/workflows/CI/badge.svg)

npm run build to deploy to the Github Pages

https://ishida83.github.io/card-hub/


###Local Dev Start:
```bash
npm start
```

### OpenCV new app demo:
```shell
npm run start:new
```
### Continous Deployment
Create PR against  **main** branch will trigger pipeline
Merge PR into **main** branch would also trigger pipleine

### Local Deployment
Use following command to directly deploy to Github Pages:
```shell
npm run deploy
```

### OpenCV app
Production version: `/public/javascripts/cv-app.js`

Test version: `/public/javascripts/cv-setup.js`
test version is WIP while you could play around with typing `filter='gray';` in the chrome dev console