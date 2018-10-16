# PostFix WebIDE
PostFix WebIDE is a JavaScript-powered PostFix IDE for the web, powered by the PostFixJS interpreter and the [Monaco editor](https://microsoft.github.io/monaco-editor/).

## Getting started
This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app). More information on how to perform common tasks is available [here](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md).

0. _Prerequisites:_ Install NodeJS 8 or later and the latest version of npm (comes with NodeJS) on your machine. You can download it [here](https://nodejs.org/en/download/)

1. Clone PostFixJS beside this directory, i.e.
   ```
   |- postfixjs
   |  |- ...
   |  `- package.json
   `- webide
      |- ...
      |- README.md (this file)
      `- package.json
   ```

2. Install all dependencies with `npm install` in the `postfixjs` directory and then in the `webide` directory

3. To start development, run `npm start`  
   This will start a development server that automatically reloads the page on changes.

## Deploying the IDE
1. Create a production-ready build with `npm run build`  
   This will bundle the source files and create minified versions of them for faster loading.
   
2. Deploy the contents of the `build` directory to a web server
