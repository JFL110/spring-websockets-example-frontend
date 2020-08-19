import React from 'react'
import Frame from './frame'
import CanvasDraw from "react-canvas-draw";
import ColorPicker from './colorPicker'
import BrushRadiusPicker from './brushRadiusPicker'
import ClearButton from './clearButton'
import brushSlice from './brushSlice'
import canvasSlice from './canvasSlice'
import { sendStartLine, sendLinePoints, sendFinishLine, setOnLinesUpdatedCallback } from './canvasSocket'

// Canvas state
const width = 1000;
const height = 1000;
const canvasState = {
    lineNumber: 0,
    reportedPoints: 0,
    myLines: {},
    remoteLines: [],
    highestLineNumbers: {}
}
const resetRemoteCanvasState = () => {
    canvasState.remoteLines = [];
    canvasState.highestLineNumbers = {};
    canvasState.myLines = {};
}

// Keep track of references to canvases. Not using React/Redux to manage state due to frequent big updates.
var readOnlyCanvasRef;
var canvasRef;

/**
 * Send update message for new line points
 */
const reportOnLineInProgress = (points, brushRadius, brushColor, isDot) => {
    if (canvasState.reportedPoints == 0) {
        // Send a message to start this line
        sendStartLine({
            brushColor: brushColor,
            brushRadius: brushRadius,
            lineNumber: canvasState.lineNumber,
            initialPoints: points,
            isFinished: isDot
        });

        //Record own starting of this line
        canvasState.myLines[canvasState.lineNumber] = {
            brushColor: brushColor,
            brushRadius: brushRadius,
            lineNumber: canvasState.lineNumber,
            points: [...points]
        };
    } else {
        const newPoints = [...points.slice(canvasState.reportedPoints, points.length)];
        // Send a line continuation message
        sendLinePoints({
            lineNumber: canvasState.lineNumber,
            points: newPoints
        });
        // Record own continuation of this line
        canvasState.myLines[canvasState.lineNumber].points.push(...newPoints);
    }
    canvasState.reportedPoints = points.length;
}

/**
 * Mark the end of a line
 */
const finishLineInProgress = () => {
    if (canvasState.reportedPoints == 0) {
        // This is a short line that was instantly started and finished
        const line = canvasRef.lines[canvasRef.lines.length - 1];
        if (line.points.length > 2 && line.points.some(p => p.x != 0 || p.y != 0)) {
            reportOnLineInProgress(line.points, line.brushRadius, line.brushColor, true);
        }
    } else {
        // Send message that line is terminated
        sendFinishLine({
            lineNumber: canvasState.lineNumber
        });
    }

    canvasState.reportedPoints = 0;
    canvasState.lineNumber++;

    syncMyLines();
}


/**
 * Remove lines from myLines if totally received and drawn on read only canvas
 */
const syncMyLines = () => {

    // Already empty shortcut
    if (canvasState.myLines.length == 0) {
        return;
    }

    // Loop through myLines and remove any that are finished and have been totally remotely received
    const linesToDraw = [];
    var changesMade = false;
    for (const n of [...Object.keys(canvasState.myLines)]) {
        const line = canvasState.myLines[n];
        if (n < canvasState.lineNumber) { // Line is finished
            const remoteLine = canvasState.remoteLines.find(l => l.isOwn && l.userNumber == n);
            if (remoteLine && (
                // ... either is marked as finished
                remoteLine.isFinished
                // ... or has enough points and is two lines behind our current line number
                || (remoteLine.points.length >= line.points.length && remoteLine.userNumber + 2 <= canvasState.lineNumber))) {
                // Line has been totally received
                delete canvasState.myLines[n];
                changesMade = true;
                continue;
            }
        }

        // Otherwise, draw the line on the user canvas
        if (line.points.length > 2) {
            linesToDraw.push(line);
        }
    }

    try {
        changesMade && canvasRef && canvasRef.loadSaveData(JSON.stringify({
            lines: linesToDraw,
            width: width * 2,
            height: height * 2
        }), true);
    } catch (err) {
        console.log("swallowing", err);
    }
}

/**
 * Subscribe to remote changes to lines
 */
setOnLinesUpdatedCallback(
    (allLines, clearing) => {
        if (!readOnlyCanvasRef)
            return;

        if (clearing) {
            console.log("clearing");
            resetRemoteCanvasState();
            readOnlyCanvasRef.clear();
        }

        if (Object.keys(canvasState.remoteLines).length == 0) {
            const sortedLines = [...Object.values(allLines.lines)]
                .filter(l => l.points.length > 2)
                .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

            // Inital draw
            readOnlyCanvasRef.loadSaveData(
                JSON.stringify({
                    lines: sortedLines,
                    width: width,
                    height: height
                })
                , true);
            canvasState.highestLineNumbers = { ...allLines.highestLineNumbers };
        } else {
            const newHighestLineNumbers = {};
            const linesToDraw = [];
            Object.values(allLines.lines)
                .filter(l => l.points.length > 2)
                .forEach(l => {
                    const highestLineNumberForUser = canvasState.highestLineNumbers[l.d] ?? -1;
                    if (l.userNumber < highestLineNumberForUser) {
                        return; // This line has been drawn already
                    }

                    // Add line
                    if (!newHighestLineNumbers[l.d] || (l.userNumber > newHighestLineNumbers[l.d])) {
                        newHighestLineNumbers[l.d] = l.isFinished ? l.userNumber + 1 : l.userNumber;
                    }

                    if (!(l.isOwn && !l.isFinished)) {// Don't redraw own lines on temp canvas
                        linesToDraw.push(l);
                    }
                });

            if (linesToDraw.length > 0) {

                const mainCanvas = readOnlyCanvasRef.ctx.drawing;
                const tmpCanvas = readOnlyCanvasRef.ctx.temp;

                tmpCanvas.clearRect(
                    0,
                    0,
                    width,
                    height
                );

                linesToDraw.forEach(l => {
                    const lineFinished = l.isFinished;
                    const canvas = lineFinished ? mainCanvas : tmpCanvas;

                    // Actual drawing of line - modified from react-canvas-draw/index.js
                    canvas.lineJoin = "round";
                    canvas.lineCap = "round";
                    canvas.strokeStyle = l.brushColor;

                    canvas.lineWidth = l.brushRadius * 2;

                    let p1 = l.points[0];
                    let p2 = l.points[1];

                    canvas.moveTo(p2.x, p2.y);
                    canvas.beginPath();

                    for (var i = 1, len = l.points.length; i < len; i++) {
                        var midPoint = {
                            x: p1.x + (p2.x - p1.x) / 2,
                            y: p1.y + (p2.y - p1.y) / 2
                        };
                        canvas.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
                        p1 = l.points[i];
                        p2 = l.points[i + 1];
                    }
                    canvas.lineTo(p1.x, p1.y);
                    canvas.stroke();
                });

                // Sync up highestLineNumbers
                for (var [k, v] of Object.entries(allLines.highestLineNumbers)) {
                    if (canvasState.highestLineNumbers[k] == null || canvasState.highestLineNumbers[k] < v) {
                        canvasState.highestLineNumbers[k] = v;
                    }
                }
                for (var [k1, v1] of Object.entries(newHighestLineNumbers)) {
                    if (canvasState.highestLineNumbers[k1] == null || canvasState.highestLineNumbers[k1] < v1) {
                        canvasState.highestLineNumbers[k1] = v1;
                    }
                }
            }
        }

        // Sync up remoteLines
        canvasState.remoteLines = [...Object.values(allLines.lines)];
        syncMyLines();
    });


/**
 * Wrap the canvas'
 */
export default
    Frame.connect(state => ({ ready: state[canvasSlice.name].ready }))(
        Frame.connectWithSlice(brushSlice,
            ({ color,
                ready,
                radius }) => {
                const digestCanvas = () => {
                    if (canvasRef?.isDrawing) {
                        reportOnLineInProgress(canvasRef.points, canvasRef.props.brushRadius, canvasRef.props.brushColor, false);
                    }
                }

                return <div>
                    <div className="controls-bar">
                        <ColorPicker />
                        <BrushRadiusPicker />
                        <ClearButton />
                    </div>
                    <div
                        className="canvas-container"
                        onMouseMove={digestCanvas}
                    >
                        {!ready && <div className="canvas-disabled-overlay"> <div className="loader" /></div>}
                        <CanvasDraw
                            brushColor={color}
                            brushRadius={radius}
                            className="user-canvas"
                            immediateLoading={true}
                            loadTimeOffset={0}
                            ref={cd => canvasRef = cd}
                            onChange={finishLineInProgress}
                            gridColor={"rgba(0,0,0,0)"}
                            canvasWidth={width}
                            canvasHeight={height}
                            hideGrid
                            disabled={!ready}
                        />
                        <CanvasDraw
                            className="others-canvas"
                            immediateLoading={true}
                            loadTimeOffset={0}
                            disabled
                            hideInterface
                            canvasWidth={width}
                            canvasHeight={height}
                            ref={cd => readOnlyCanvasRef = cd}
                        />
                    </div>
                </div>
            }));