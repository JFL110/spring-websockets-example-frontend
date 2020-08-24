import React, { useState, useRef } from 'react';
import Frame from './frame';
import canvasSlice from './canvasSlice';
import config from './config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons/faShare'
import useOnClickOutside from './useOnClickOutside'

export default Frame.connectWithSlice(canvasSlice,
    ({ canvasId }) => {


        const [modalOpen, setModalOpen] = useState(false);
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

        const modalBoxRef = useRef();
        useOnClickOutside(modalBoxRef, () => {
            setModalOpen(false);
        });

        return <React.Fragment>
            {/* Mobile */}
            <div className="square-button canvas-name-mobile-button" onClick={() => setModalOpen(true)}>
                <FontAwesomeIcon icon={faShare} className="go-button" />
            </div>
            {modalOpen && <div className="mobile-canvas-name-modal" >
                <div>
                    <div id="modal-box" ref={modalBoxRef}>
                        Canvas name:<br/>
                        <form onSubmit={onSubmit}>
                            <input
                                type="text"
                                value={"/" + (text ?? "")}
                                onChange={e => stripSlashAndSet(e.target.value)}
                            />
                            <FontAwesomeIcon icon={faShare} className="go-button" onClick={go} />
                        </form>
                    </div>
                </div>
            </div>}
            {/* Desktop */}
            <div className="canvas-name">
                <form onSubmit={onSubmit}>
                    <input
                        type="text"
                        value={"/" + (text ?? "")}
                        onChange={e => stripSlashAndSet(e.target.value)}
                    />
                    <FontAwesomeIcon icon={faShare} className="go-button" onClick={go} />
                </form>
            </div>
        </React.Fragment>
    });