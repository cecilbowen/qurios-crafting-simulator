import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Label, TEXT_COLOR } from './LabeledInput';

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0em 1em;
    border-bottom: 2px dashed #2b2b2b;
    padding-bottom: 2px 0px;
`;

const SkillSquareContainer = styled.div`
    display: flex;
`;

const SkillSquare = styled.div`
    border: 2px solid black;
    background-color: lightgray;
    width: 10px;
    height: 12px;
`;

export const SkillMod = styled.div`
    position: relative;
    height: 16px;
    width: 16px;
    font-weight: bold;
    background-color: #262722;
    cursor: pointer;
    color: #7e7e7e;
    margin: 0em 6px;
    border-radius: 4px;
    user-select: none;
    -webkit-user-select: none;
    &:hover {
        background-color: #906b3f;
    }
`;

export const SkillModDivPlus = styled.div`
    position: absolute;
    left: 1.75px;
    top: -5.5px;
    font-family: monospace;
    font-size: 22px;
`;

export const SkillModDivMinus = styled.div`
    position: absolute;
    left: 1.75px;
    top: -5.5px;
    font-family: monospace;
    font-size: 22px;
`;

const SkillModLabel = styled.label`
    font-family: monospace;
    font-size: 15px;
    margin-top: 4px;
`;

// props: skill, currentSkillLevel, onSkillMod, new, onSkillDropped, disabled
const SkillInput = props => {
    const [skillMod, setSkillMod] = useState(props.new ? 1 : 0);
    const skill = props.skill;

    const onSkillLevelChanged = (skill, newLevel) => {
        const diff = props.currentSkillLevel - newLevel;
        props.onSkillLevelChanged(skill, -diff);
    };

    const skillModUp = event => {
        if (props.disabled) { return; }
        let newSkillMod = skillMod + 1;
        if (props.currentSkillLevel + newSkillMod > skill.maxLevel) {
            newSkillMod--;
        }
        setSkillMod(newSkillMod);
        onSkillLevelChanged(skill, props.currentSkillLevel + newSkillMod);
    };

    const skillModDown = event => {
        if (props.disabled) { return; }
        let newSkillMod = skillMod - 1;
        if (props.new && (props.currentSkillLevel + newSkillMod) <= 0) {
            // remove [new] skill
            props.onSkillDropped(skill);
            return;
        }

        if (props.currentSkillLevel + newSkillMod < 0) {
            newSkillMod++;
        }
        setSkillMod(newSkillMod);
        onSkillLevelChanged(skill, props.currentSkillLevel + newSkillMod);
    };

    const renderSkillSquare = (number, index) => {
        let backgroundColor = "#353535"; //light gray
        let modColor = "#00fe00"; // green
        if (skillMod < 0) {
            modColor = "#d42c29"; // red
        }

        if (number <= props.currentSkillLevel) {
            backgroundColor = "lightblue";
        }

        const value1 = props.currentSkillLevel;
        const value2 = props.currentSkillLevel + skillMod;
        const min = Math.min(value1, value2);
        const max = Math.max(value1, value2);

        if (number > min && number <= max) {
            backgroundColor = modColor;
        }

        return <SkillSquare
            key={`${skill.name}-${number}-${index}`}
            style={{ backgroundColor }}
            title={`${number}/ (${min}, ${max})`}
        />;
    };

    const diff = skillMod;
    let level = "";
    let sign = diff > 0 ? '+' : '-';
    let color = diff > 0 ? 'green' : (diff === 0) ? TEXT_COLOR : 'red';
    if (diff !== 0) {
        level = "Lv ";
    }
    
    if (diff < 0) {
        sign = "";
    }

    const renderSkill = () => {
        const skillIDs = [];
        for (let i = 0; i < skill.maxLevel; i++) {
            skillIDs.push(i + 1);
        }

        const theSquares = skillIDs.map((number, index) => renderSkillSquare(number, index));

        let skillModStyle = {};

        if (props.disabled) {
            skillModStyle = { cursor: 'no-drop' };
        }

        return (
            <Container>
                <div style={{ textAlign: "left" }}>
                    <Label style={ diff !== 0 ? { color: "white" } : {} }>{skill.name}</Label>
                    <div style={{ display: "flex", marginBottom: "4px" }}>
                        <SkillMod style={skillModStyle}
                            disabled={props.disabled} onClick={skillModDown}><SkillModDivMinus>-</SkillModDivMinus>
                        </SkillMod>
                        <SkillSquareContainer>
                            {theSquares}
                        </SkillSquareContainer>
                        <SkillMod style={skillModStyle}
                            disabled={props.disabled} onClick={skillModUp}><SkillModDivPlus>+</SkillModDivPlus>
                        </SkillMod>
                    </div>
                </div>
                <SkillModLabel style={{ color }}>{level}{sign}{diff === 0 ? '' : diff}</SkillModLabel>
            </Container>

        );
    };

    return (
        <div>
            {renderSkill()}
        </div>
    );
};

export default SkillInput;
