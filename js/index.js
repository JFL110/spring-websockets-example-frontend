/*global setLoaded, dec, getLoaded*/
import React from 'react'
import { render } from 'react-dom'
import { combineReducers } from 'redux'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import App from './app'
// import loggingMiddleware from './features/loggingMiddleware'
import { getStore, setStore } from './features/globalStore'
import { routerMiddleware, connectRouter, ConnectedRouter } from 'connected-react-router'
import { createBrowserHistory } from 'history'

import socketInitialLoadMiddleware from './features/initialLoadMiddleware'
import canvasSlice from './features/canvasSlice'
import brushSlice from './features/brushSlice'

import './styles.scss'


// Queue rendering until after all resources (css) have loaded, or after one second
setLoaded(() => {

  const history = createBrowserHistory({});

  const rootReducer = combineReducers({
    router: connectRouter(history),
    [canvasSlice.name]: canvasSlice.reducer,
    [brushSlice.name]: brushSlice.reducer
  })

  setLoaded(null);

  setStore(configureStore({
    reducer: rootReducer,
    middleware: [/*loggingMiddleware,*/ routerMiddleware(history), socketInitialLoadMiddleware, ...getDefaultMiddleware()],
  }));


  render(
    <Provider store={getStore()}>
      <ConnectedRouter history={history} >
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root')
  );
});

// Decrement the resource count and set a trigger to trigger the root func even if resources don't load
dec();
setTimeout(function () {
  let currentLoaded = getLoaded();
  if (currentLoaded != null) {
    // Didn't trigger - trigger it now
    setLoaded(null);
    console.log("Warning - Delayed load");
    currentLoaded();
  }
}, 1000);
