import React, { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'
import { sendClear } from './canvasSocket';
import { useToasts } from 'react-toast-notifications'
import useOnClickOutside from './useOnClickOutside'

export default () => {
    const { addToast, removeToast } = useToasts()
    const [clickedOnce, setClickedOnce] = useState(false);
    const onClick = () => {
        if (!clickedOnce) {
            setClickedOnce(true);
            addToast("Click again to clear the canvas", {
                id:'clear-toast',
                appearance: 'info',
                autoDismiss: true,
            });
        } else {
            sendClear();
            removeToast('clear-toast');
            setClickedOnce(false);
        }
    };

    const ref = useRef();
    useOnClickOutside(ref, () => {
        console.log
        removeToast('clear-toast');
        setClickedOnce(false);
    });

    return <div
        ref={ref}
        className={"clear-button square-button" + (clickedOnce ? " clicked-once" : "")}
        onClick={onClick}>
        <FontAwesomeIcon icon={faTrashAlt} />
    </div>
};
