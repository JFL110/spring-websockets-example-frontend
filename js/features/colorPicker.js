import React, { useState, useRef, useEffect, useCallback } from 'react'
import Frame from './frame'
import { ChromePicker } from 'react-color';
import brushSlice from './brushSlice'
import useOnClickOutside from './useOnClickOutside'
import invert from 'invert-color';

export default Frame.connectWithSlice(brushSlice, ({
    color,
    setColor,
}) => {
    const [open, setOpen] = useState(false);

    // Close the picker when clicked outside
    const ref = useRef();
    useOnClickOutside(ref, e => {
        if (e.target?.id != "color-swatch-click-area") {
            setOpen(false);
        }
    });

    const closeOnSpaceBarPressed = useCallback((event) => {
        if (event.keyCode === 32) {
            setOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("keydown", closeOnSpaceBarPressed, false);
        return () => {
            document.removeEventListener("keydown", closeOnSpaceBarPressed, false);
        };
    }, []);

    return <div
        className="color-picker-container">
        <div
            style={{ backgroundColor: color }}
            className="color-swatch"
            onClick={() => setOpen(!open)} >
            <span
                id="color-swatch-click-area"
                style={{ color: invert(color, true /*select either black or white */) }}
                className="noselect">{color}</span>
        </div>
        {open && <div
            ref={ref}
            className="color-picker"
        >
            <ChromePicker
                color={color}
                disableAlpha
                onChange={c => setColor(c.hex)}
            />
        </div>}
    </div>
});
