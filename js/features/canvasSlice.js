import Frame from './frame'

/**
 * Redux slice for canvas state
 */
export default Frame.createSlice({
    name: 'socket',
    initialState: {
        canvasId: null,
        socketState: {},
    },
    reducers: {
        ...Frame.settingReducers({
            setColor: 'color',
            setCanvasId: 'canvasId',
            setSocketState: 'socketState',
        }),
    }
});