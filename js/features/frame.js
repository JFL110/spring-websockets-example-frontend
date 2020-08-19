import { connect } from 'react-redux'
import { createSlice } from '@reduxjs/toolkit'
import update from 'immutability-helper';
import { getStore } from './globalStore'

function _connectWithSlice(slice, component) {
    return connect(
        state => ({
            ...state[slice.name]
        }),
        { ...slice.actions })(component);
}

function _setterReducer(propName) {
    if (!propName)
        throw "propName required";

    return (state, action) => state[propName] = action.payload;
}

function _settingReducers(propMap) {
    if (!propMap)
        throw "propMap required";

    const asObj = {};
    Object.entries(propMap).forEach(([key, value]) => asObj[key] = (state, action) => { state[value] = action.payload; });
    return asObj;
}

export default {

    // Global store
    getStore: getStore,
    dispatch: a => getStore().dispatch(a),
    getState: () => getStore().getState,

    // Slice
    connect: connect,
    createSlice: createSlice,
    setterReducer: _setterReducer,
    settingReducers: _settingReducers,

    // Immutability
    imutUpdate: update,

    // Connect
    connectWithSlice: _connectWithSlice,
}