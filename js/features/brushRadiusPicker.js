import React from 'react'
import Frame from './frame'
import brushSlice from './brushSlice'

const radiusToPercentage = {
    10: '70%',
    5: '50%',
    2: '20%'
};

const RadiusButton =
    ({ radius,
        isSelected,
        setRadius }) =>
        <div onClick={() => setRadius(radius)}
            className={"brush-size-button" + (isSelected ? " brush-selected" : "")}
        >
            <div style={{
                width: radiusToPercentage[radius],
                height: radiusToPercentage[radius],
            }} />
        </div>

export default Frame.connectWithSlice(brushSlice, ({
    radius,
    setRadius,
}) => {
    return <React.Fragment>
        <RadiusButton radius={10} isSelected={radius == 10} setRadius={setRadius} />
        <RadiusButton radius={5} isSelected={radius == 5} setRadius={setRadius} />
        <RadiusButton radius={2} isSelected={radius == 2} setRadius={setRadius} />
    </React.Fragment>
});
