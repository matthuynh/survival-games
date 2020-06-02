import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,

  // NOTE: Disabled strict mode, as it was causing constructors to load twice, affecting the WebSocket code in LobbiesPage.js
  // When strict mode is enabled, it allows us to detect errors, so we should try re-enabling it for testing other pages
  // Strict mode is only run anyways during development, it does not run when deployed 
  // https://reactjs.org/docs/strict-mode.html
  
  <>
    <App />
  </>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
