import { matchPath } from 'react-router'
import canvasSlice from './canvasSlice'
import connect from './canvasSocket'
import { push } from 'connected-react-router'

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const reactRouterNavActionType = "@@router/LOCATION_CHANGE";

function randomId(length) {
    var result = '';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Middleware that triggers on location change and connects the socket
 */
export default ({ dispatch }) => next => action => {
    if (action.type == reactRouterNavActionType) {
        const match = matchPath(action.payload.location.pathname, { path: "/:canvasId?" });
        if (match.isExact) {
            var canvasId = match.params?.canvasId;
            if ("random" == canvasId) {
                canvasId = randomId(10);
                dispatch(push(canvasId));
            } else {
                // If coming from random url - will do this on next dispatch
                dispatch(canvasSlice.actions.setCanvasId(canvasId));
                connect(canvasId);
            }
        }
    }
    next(action);
};
