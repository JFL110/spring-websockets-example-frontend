import Frame from './frame'

/**
 * Redux slice for canvas state
 */
export default Frame.createSlice({
    name: 'socket',
    initialState: {
        canvasId: null,
        ready : false,
    },
    reducers: {
        ...Frame.settingReducers({
            setCanvasId: 'canvasId',
            setReady: 'ready',
        }),
    }
});