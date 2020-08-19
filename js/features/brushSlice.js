import Frame from './frame'

const defaultColor = '#23239C';

/**
 * Redux slice for the canvas brush
 */
export default Frame.createSlice({
    name: 'brush',
    initialState: {
        color: defaultColor,
        radius: 10,
    },
    reducers: {
        ...Frame.settingReducers({
            setColor: 'color',
            setRadius: 'radius',
        }),
    }
});