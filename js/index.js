/*global setLoaded, dec, getLoaded*/
import React from 'react'
import { render } from 'react-dom'
import { combineReducers } from 'redux'
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import App from './app'
import { getStore, setStore } from './features/globalStore'
import { routerMiddleware, connectRouter, ConnectedRouter } from 'connected-react-router'
import { createBrowserHistory } from 'history'
import { ToastProvider } from 'react-toast-notifications';

import socketInitialLoadMiddleware from './features/initialLoadMiddleware'
import canvasSlice from './features/canvasSlice'
import brushSlice from './features/brushSlice'

import './styles.scss'

console.log("Thanks for taking a look at this websockets demo app. Head to https://jamesleach.dev for contact information or view the source for this app at https://github.com/JFL110/spring-websockets-example-frontend")

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
        <ToastProvider
          autoDismiss
          autoDismissTimeout={4000}
          placement='bottom-center'>
          <App />
        </ToastProvider>
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
