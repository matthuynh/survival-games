import React from 'react';
import './App.css';
// import Control from './containers/Control';
import { BrowserRouter } from 'react-router-dom';
import Router from "./Routing/Router";

function App() {
  return (
    <BrowserRouter>
      <div>
        <Router />
      </div>
    </BrowserRouter>
  );
}

export default App;
