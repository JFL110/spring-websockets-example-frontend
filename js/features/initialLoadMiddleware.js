import { matchPath } from 'react-router'
import canvasSlice from './canvasSlice'
import connect from './canvasSocket'

const reactRouterNavActionType = "@@router/LOCATION_CHANGE";

/**
 * Middleware that triggers on location change and connects the socket
 */
export default ({ dispatch }) => next => action => {
    if (action.type == reactRouterNavActionType) {
        const match = matchPath(action.payload.location.pathname, { path: "/:canvasId?" });
        if (match.isExact) {
            const canvasId = match.params?.canvasId;
            dispatch(canvasSlice.actions.setCanvasId(canvasId));
            connect(canvasId);
        }
    }
    next(action);
};
