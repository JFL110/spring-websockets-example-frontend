import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

const initCheckInterval = 500;

const urlBase = "http://springwebsocketsexample2-env.eba-9wepzsai.eu-west-2.elasticbeanstalk.com";
//const urlBase = "http://localhost:8080";

const lineDest = "/app/canvas/line/";
const clearDest = "/app/canvas/clear/";

/**
 * Websocket connection state
 */
var stompClient = null;
var failedConnectionAttempts = 0;
var reconnectTimeoutHandle = null;
var reInitTimeoutHandle = null;
var maxDelaySeconds = 15;
var connected = false;
var ownId = null;
var canvasId = null

/**
 * Canvas state
 */
var linesUpdatedCallback;
var allLines = {
    lines: {},
    highestLineNumbers: {}
};
export const setOnLinesUpdatedCallback = callback => {
    linesUpdatedCallback = callback;
    callback(allLines, false);
}

/**
 * Send a message that a line has started
 */
export const sendStartLine = ({
    brushColor,
    brushRadius,
    lineNumber,
    initialPoints,
    isFinished
}) => {
    if (!connected) {
        return;
    }
    stompClient.send(lineDest + canvasId, {}, JSON.stringify({
        t: 's',
        n: lineNumber,
        c: brushColor,
        r: brushRadius,
        p: initialPoints,
        f: isFinished
    }));
}

/**
 * Send a line continuation message
 */
export const sendLinePoints = ({
    lineNumber,
    pointsIndexStart,
    points
}) => {
    if (!connected) {
        return;
    }
    stompClient.send(lineDest + canvasId, {}, JSON.stringify({
        t: 'c',
        n: lineNumber,
        i: pointsIndexStart,
        p: points
    }));
}


/**
 * Send a message that a line has finished
 */
export const sendFinishLine = ({
    lineNumber
}) => {
    if (!connected) {
        return;
    }
    stompClient.send(lineDest + canvasId, {}, JSON.stringify({
        t: 'f',
        n: lineNumber
    }));
}


/**
 * Send a message to totally clear the canvas
 */
export const sendClear = () => {
    if (!connected) {
        return;
    }
    stompClient.send(clearDest + canvasId, {}, "");
}

const lineMessageToLine = l => ({
    isOwn: l.d == ownId,
    d: l.d,
    userNumber: l.n,
    z: l.z,
    points: l.p.filter(p => p != null),
    brushColor: l.c,
    brushRadius: l.r,
    isFinished: l.f
});

/**
 * Process a message about lines
 */
const processLinesMessage = msg => {

    const lineKey = msg.d + "~" + msg.n;

    if (msg.t == 's') {
        // Handle start message
        allLines.lines[lineKey] = lineMessageToLine(msg);
        if (!allLines.highestLineNumbers[msg.d] || allLines.highestLineNumbers[msg.d] < msg.n) {
            allLines.highestLineNumbers[msg.d] = msg.n;
        }
    } else if (msg.t == 'c') {
        // Handle continuation message
        const line = allLines.lines[lineKey];
        if (line) {
            line.points.push(...msg.p);
        }
    } else if (msg.t == 'f') {
        // Handle finish message
        const line = allLines.lines[lineKey];
        if (line) {
            line.isFinished = true;
        }
        console.log("finished", msg);
    }
    triggerLinesChangedCallback(false);
}

/**
 * Trigger the callback to draw all lines
 */
const triggerLinesChangedCallback = (clearing) => linesUpdatedCallback && linesUpdatedCallback(allLines, clearing)

/**
 * Try to connect the websocket, retry on failure
 */
const connect = (_canvasId) => {
    canvasId = _canvasId;
    console.log("Attempting to connect...");
    var socket = new SockJS(urlBase + '/canvas');
    stompClient = Stomp.over(socket);
    stompClient.debug = false;
    stompClient.connect({},
        // On Connect
        () => {
            connected = true;
            failedConnectionAttempts = 0;

            stompClient.subscribe('/topic/canvas/' + canvasId, messageOutput => {
                var body = JSON.parse(messageOutput.body);
                processLinesMessage(body);
            });

            stompClient.subscribe('/topic/clear/' + canvasId, () => {
                console.log("clearing canvas");
                allLines = {
                    lines: {},
                    highestLineNumbers: {}
                };
                triggerLinesChangedCallback(true);
            });

            // Init request
            stompClient.subscribe('/user/topic/init/' + canvasId, messageOutput => {
                if (ownId) {
                    // Ignore if already received
                    return;
                }
                var body = JSON.parse(messageOutput.body);
                ownId = body.userId;
                console.log("Got own id", ownId);
                allLines = {
                    lines: {},
                    highestLineNumbers: {}
                }
                body.lines
                    // Ignore erroneous short lines
                    .filter(l => l.p.length > 2)
                    .forEach(l => {
                        //
                        allLines.lines[l.d + "~" + l.n] = lineMessageToLine(l);

                        // Keep track of highest line number per client
                        if (!allLines.highestLineNumbers[l.d] || (allLines.highestLineNumbers[l.d] <= l.n)) {
                            allLines.highestLineNumbers[l.d] = l.f ? l.n + 1 : l.n;
                        }
                    });
                triggerLinesChangedCallback(true);
            });

            // Queue another init attempt
            const queueCheckInit = () => { reInitTimeoutHandle = setTimeout(checkInit, initCheckInterval) };
            const checkInit = () => {
                if (!ownId) {
                    stompClient.send('/app/canvas/init/' + canvasId, {}, "");
                    queueCheckInit();
                }
            }

            stompClient.send('/app/canvas/init/' + canvasId, {}, "");
            queueCheckInit();
        },
        // OnError
        () => {

            // Reset state
            failedConnectionAttempts++;
            clearTimeout(reconnectTimeoutHandle);
            clearTimeout(reInitTimeoutHandle);
            stompClient = null;
            connected = false;
            ownId = null;

            // Queue reconnect attempt
            var delaySeconds = 2 * failedConnectionAttempts;
            if (delaySeconds > maxDelaySeconds) {
                delaySeconds = maxDelaySeconds;
            }
            reconnectTimeoutHandle = setTimeout(connect, delaySeconds * 1000);
            console.log("Reconnecting in " + delaySeconds + " seconds...")
        });
}

export default connect;