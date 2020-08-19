import React from 'react'
import WebCanvas from './features/webCanvas'
import { Route } from "react-router";

export default () =>
  <div className="canvas-app">
    <Route exact path="/:canvasPathId?" component={WebCanvas} />
  </div>