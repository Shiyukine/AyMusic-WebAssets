import React from "react";

export default function SwitchChoice({ items }) {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    return (
        items.map((item, index) => (
            <div key={index}>
                <input type="radio" id={item.id} name="choice" value={item.value} />
                <label htmlFor={item.id}>{item.label}</label>
            </div>
        ))
    )
}