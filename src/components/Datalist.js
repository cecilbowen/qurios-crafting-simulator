import React, { useEffect, useState } from 'react';

// props: placeholder, list, onChange, dontPersist, id, style, buttonStyle, inputStyle
const Datalist = props => {
    const [displayText, setDisplayText] = useState(props.placeholder);
    const [mode, setMode] = useState("button");
    const [currentInput, setCurrentInput] = useState("");
    const [currentItem, setCurrentItem] = useState(undefined);

    useEffect(() => {
        if (currentItem) {
            setCurrentInput(currentItem.name);
            setDisplayText(currentItem.name);
        }
    }, [currentItem]);

    const onItemSelected = event => {
        const itemName = event.target.value;
        const item = props.list.filter(x => x.name === itemName)[0];

        if (item) {
            props.onChange(item);
            if (!props.dontPersist) {
                setCurrentItem(item);
            } else {
                setCurrentInput("");
            }
        }

        setMode("button");
    };

    const onClick = () => {
        if (mode === "button") {
            setMode("datalist");
        }
    };

    const onEnter = e => {
        e = e || window.event;
        if (e.keyCode === 13) {
            onItemSelected(e);
        }
    };

    const renderDatalist = () => {
        const tempList = props.list.sort((a, b) => {
            const textA = a.name.toUpperCase();
            const textB = b.name.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        return (
            <div>
                <input
                    type="text"
                    list={props.id}
                    onBlur={onItemSelected}
                    onKeyDown={onEnter}
                    onChange={ev => setCurrentInput(ev.target.value)}
                    value={currentInput}
                    placeholder={props.placeholder}
                    autoFocus
                    style={props.inputStyle || {}}
                />
                <datalist id={props.id}>
                    {tempList.map((item, index) =>
                        <option key={`${item}-${index}`} value={item.name} />
                    )}
                </datalist>
            </div>
        );        
    };

    const renderButton = () => {
        return (
            <button style={ props.buttonStyle || { cursor: 'pointer' }} onClick={onClick}>{displayText}</button>
        );        
    };

    return (
        <div style={ props.style || {}}>
            {mode === "button" && renderButton()}
            {mode === "datalist" && renderDatalist()}
        </div>
    );
};

export default Datalist;
