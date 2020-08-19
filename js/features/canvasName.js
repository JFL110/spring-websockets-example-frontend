import React, { useState } from 'react';
import Frame from './frame';
import canvasSlice from './canvasSlice';
import config from './config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'

export default Frame.connectWithSlice(canvasSlice,
    ({ canvasId }) => {

        const [text, setText] = useState(canvasId);
        const stripSlashAndSet = v => {
            setText(v.replace(/^\/+/, ''));
        }

        const onSubmit = e => {
            e.preventDefault();
            go();
        }

        const go = () => {
            window.location.href = config.frontUrl + "/" + (text ?? "");
        }

        return <div className="canvas-name">
            <form onSubmit={onSubmit}>
                <input
                    type="text"
                    value={"/" + (text ?? "")}
                    onChange={e => stripSlashAndSet(e.target.value)}
                />
                <FontAwesomeIcon icon={faArrowRight} className="go-button" onClick={go} />
            </form>
        </div>
    });