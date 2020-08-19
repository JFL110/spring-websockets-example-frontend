import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import { sendClear } from './canvasSocket';
import useOnClickOutside from './useOnClickOutside'

export default () => {

    const [clickedOnce, setClickedOnce] = useState(false);
    const onClick = () => {
        if (!clickedOnce) {
            setClickedOnce(true);
        } else {
            sendClear();
            setClickedOnce(false);
        }
    };

    const ref = useRef();
    useOnClickOutside(ref, () => {
        console.log
        setClickedOnce(false);
    });

    return <div
        ref={ref}
        className={"clear-button square-button" + (clickedOnce ? " clicked-once" : "")}
        onClick={onClick}>
        <FontAwesomeIcon icon={faTrashAlt} />
    </div>
};
