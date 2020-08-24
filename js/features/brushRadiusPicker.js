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
        nextRadius,
        isSelected,
        setRadius }) =>
        <React.Fragment>
            {/* Desktop */}
            <div onClick={() => setRadius(radius)}
                className={"brush-size-button square-button desktop" + (isSelected ? " brush-selected" : "")}
            >
                <div style={{
                    width: radiusToPercentage[radius],
                    height: radiusToPercentage[radius],
                }} />
            </div>
            {/* Mobile */}
            <div onClick={() => setRadius(nextRadius)}
                className={"brush-size-button square-button mobile" + (isSelected ? " brush-selected" : "")}
            >
                <div style={{
                    width: radiusToPercentage[radius],
                    height: radiusToPercentage[radius],
                }} />
            </div>
        </React.Fragment>


export default Frame.connectWithSlice(brushSlice, ({
    radius,
    setRadius,
}) => {
    return <React.Fragment>
        <RadiusButton radius={10} isSelected={radius == 10} nextRadius={5} setRadius={setRadius} />
        <RadiusButton radius={5} isSelected={radius == 5} nextRadius={2} setRadius={setRadius} />
        <RadiusButton radius={2} isSelected={radius == 2} nextRadius={10} setRadius={setRadius} />
    </React.Fragment>
});
