import React, { useEffect, useState } from 'react';
import { defHardLimits, resHardLimits } from '../utils';
import styled from '@emotion/styled';

export const TEXT_COLOR = '#5f5f5f';

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0em 1em;
    border-bottom: 2px dashed #2b2b2b;
    padding-bottom: 2px 0px;
`;

export const Label = styled.label`
    color: ${TEXT_COLOR};
    font-size: 14px;
    filter: drop-shadow(0px 0px 2px black);
    font-family: sans-serif;
`;

const Input = styled.input`
    background-color: #131313;
    color: ${TEXT_COLOR};
    width: 4em;
    margin-left: 0.5em;
    border-radius: 5px;
    -moz-appearance: textfield;
    /*-webkit-appearance: none;*/
    border-style: none none solid;
`;

export const Icon = styled.img`
    width: 24px;
    position: absolute;
    left: -5px;
    top: 0px;
`;

//props: defaultValue, onChange, label, placeholder, pool, iconStyle, manualUpdate
const LabeledInput = props => {
    const [value, setValue] = useState(props.defaultValue || 0);

    useEffect(() => {
        if (props.manualUpdate && props.manualFinish) {
            const hasMe = props.manualUpdate.filter(x => x.label === props.label)[0];
            if (hasMe) {
                props.manualFinish(props.label);
                //document.getElementById(props.label).value = hasMe.value;
                onChange({
                    target: {
                        value: hasMe.value,
                    }
                });
            }

        }
    }, [props.manualUpdate]);

    const onChange = event => {
        const diff = event.target.value - props.defaultValue;

        props.onChange({label: props.label, value: diff});
        setValue(event.target.value);
    };

    const diff = (props.defaultValue - value) * -1;
    const sign = diff > 0 ? '+' : '';
    const color = diff > 0 ? 'green' : 'red';

    let min = -84;
    let max = 280;
    if (props.label !== "Defense") {
        min = resHardLimits.get(props.label).lower;
        max = resHardLimits.get(props.label).upper;
    } else {
        min = defHardLimits.get(props.pool).lower;
        max = defHardLimits.get(props.pool).upper;
    }

    let style = {};
    let withIconStyle = { paddingLeft: '17px' };
    const activeDiffStyle = { color: "white" };

    if (diff !== 0) {
        style = { ...style, ...activeDiffStyle };
    }

    if (props.icon) {
        style = { ...style, ...withIconStyle };
    }

    let iconStyle = props.iconStyle || {};
    if (diff === 0) {
        iconStyle = { ...iconStyle, filter: 'opacity(0.5)' };
    }

    return (
        <Container>
            <div style={{ position: 'relative' }}>
                {props.icon && <Icon style={ iconStyle } src={props.icon} />}
                <Label style={ style }>{props.label}</Label>
                <Input
                    type="number"
                    style={ diff !== 0 ? { color: "white" } : {} }
                    //onBlur={onChange}
                    onChange={onChange}
                    placeholder={props.placeholder}
                    value={value}
                    min={props.defaultValue + min}
                    max={props.defaultValue + max}
                    title={`min, max: ${props.defaultValue + min},${props.defaultValue + max}`}
                    id={props.label}
                />
            </div>
            {diff === 0 ? <label style={{ color: TEXT_COLOR }}>-</label> : <label style={{ color }}>{sign}{diff}</label>}
        </Container>
    );
};

export default LabeledInput;
