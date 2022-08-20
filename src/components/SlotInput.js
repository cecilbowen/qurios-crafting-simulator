import React, { useEffect, useState } from 'react';
import { SkillMod, SkillModDivPlus, SkillModDivMinus } from './SkillInput';
import { Label, TEXT_COLOR, Icon } from './LabeledInput';
import styled from '@emotion/styled';
import GENERIC from '../images/generic.png';
import SLOT1 from '../images/slots/slot1.png';
import SLOT2 from '../images/slots/slot2.png';
import SLOT3 from '../images/slots/slot3.png';
import SLOT4 from '../images/slots/slot4.png';

import SLOT1_1 from '../images/slots/slot1_1.png';
import SLOT2_1 from '../images/slots/slot2_1.png';
import SLOT2_2 from '../images/slots/slot2_2.png';
import SLOT3_1 from '../images/slots/slot3_1.png';
import SLOT3_2 from '../images/slots/slot3_2.png';
import SLOT3_3 from '../images/slots/slot3_3.png';
import SLOT4_1 from '../images/slots/slot4_1.png';
import SLOT4_2 from '../images/slots/slot4_2.png';
import SLOT4_3 from '../images/slots/slot4_3.png';
import SLOT4_4 from '../images/slots/slot4_4.png';

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0em 1em;
    border-bottom: 2px dashed #2b2b2b;
    padding-bottom: 2px 0px;
`;

const SLOT4_IMAGES = [SLOT4, SLOT4_1, SLOT4_2, SLOT4_3, SLOT4_4];
const SLOT3_IMAGES = [SLOT3, SLOT3_1, SLOT3_2, SLOT3_3];
const SLOT2_IMAGES = [SLOT2, SLOT2_1, SLOT2_2];
const SLOT1_IMAGES = [SLOT1, SLOT1_1];
const SLOT_IMAGES = [undefined, SLOT1_IMAGES, SLOT2_IMAGES, SLOT3_IMAGES, SLOT4_IMAGES];

//props: slots, onSlotsUpdated, showNumbers
const SlotInput = props => {
    const [currentSlots, setCurrentSlots] = useState([0, 0, 0]);
    const [slotHistory, setSlotHistory] = useState([]);

    useEffect(() => {
        // fill with slots
        const tempSlots = currentSlots.slice(0);
        for (let i = 0; i < props.slots.length; i++) {
            tempSlots[i] = props.slots[i];
        }
        setCurrentSlots(tempSlots);
    }, []);

    const onSlotsUpdated = (newSlots, history, slotsAdded) => {
        const initialHistory = history[0] || newSlots;
        const slotDiffs = initialHistory.map((x, idx) => Math.abs(x - newSlots[idx]));

        console.log('initialHistory, currentSlots', initialHistory, newSlots);
        console.log('mincemeat', slotsAdded, slotDiffs);
        props.onSlotsUpdated(slotsAdded, slotDiffs);
    };

    const slotsUp = event => {
        const tSlots = currentSlots.slice(0);
        const history = slotHistory.slice(0);
        const zeroIndex = tSlots.indexOf(0);

        if (zeroIndex !== -1) {
            history.push(tSlots.slice(0));
            tSlots[zeroIndex] = 1;
        } else {
            for (let i = 0; i < tSlots.length; i++) {
                if (tSlots[i] < 4) {
                    history.push(tSlots.slice(0));
                    tSlots[i] = tSlots[i] + 1;
                    break;
                }
            }
        }

        console.log("slots, history", tSlots, history);
        setSlotHistory(history);
        setCurrentSlots(tSlots);
        onSlotsUpdated(tSlots, history, history.length);
    };

    const slotsDown = event => {
        let tSlots = currentSlots.slice(0);
        const history = slotHistory.slice(0);

        if (history.length === 0) {
            return;
        }

        tSlots = history.pop();

        setSlotHistory(history);
        setCurrentSlots(tSlots);
        onSlotsUpdated(tSlots, history, history.length);
    };

    const renderSlots = tempSlots => {
        if (!props.showNumbers) {
            return <div style={{ width: '5em' }}>{tempSlots.map((slotLevel, index, arr) =>
                renderSlot(slotLevel, index, arr))}
            </div>;
        }

        return <Label>{slotsDisplay}</Label>;
    };

    const renderSlot = (slotLevel, index, arr) => {
        let slotIcon;
        const slotIconStyle = { width: '24px', height: '22px', position: 'inherit' };

        const oldSlot = slotHistory.slice(0)[0] || arr;
        const oldSlotLevel = oldSlot[index];
        const slotDiff = Math.abs(slotLevel - oldSlotLevel);
        const slotBase = SLOT_IMAGES[slotLevel];
        if (slotBase) {
            slotIcon = SLOT_IMAGES[slotLevel][slotDiff];
        }

        console.log('slot level, slots, oldSLots', slotLevel, arr, oldSlot);

        if (slotIcon) {
            return (
                <Icon key={`slot-${index}`} style={slotIconStyle} src={slotIcon} />
            )
        }

        return null;
    };

    const tempSlots = currentSlots.slice(0);
    const slotsDisplay = `[${tempSlots.join("-")}]`;
    const removeSlotDisabled = slotHistory.length === 0;
    const addSlotDisabled = currentSlots[2] === 4;

    const diff = slotHistory.length;
    const sign = '+';
    const color = "green";

    let iconStyle = { width: '16px', left: '-2px', top: '0.5px' };
    if (diff === 0) {
        iconStyle = { ...iconStyle, filter: 'opacity(0.5)' };
    }

    return (
        <Container>
            <div style={{ position: 'relative', display: 'flex' }}>
                <SkillMod style={{ marginLeft: '17px' }} onClick={slotsDown} disabled={removeSlotDisabled}><SkillModDivMinus>-</SkillModDivMinus></SkillMod>
                <Icon style={iconStyle} src={GENERIC} />
                {renderSlots(tempSlots)}
                <SkillMod onClick={slotsUp} disabled={addSlotDisabled}><SkillModDivPlus>+</SkillModDivPlus></SkillMod>                
            </div>
            {diff === 0 ? <label style={{ color: TEXT_COLOR }}>-</label> : <label style={{ color }}>{sign}{diff}</label>}
        </Container>
    );
};

export default SlotInput;
