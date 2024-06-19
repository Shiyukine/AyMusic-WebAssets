import React from "react";
import PropTypes from 'prop-types';

export default function TopBarWindowItem({ icon, onClick }) {
    const [hover, setHover] = React.useState(false);
    TopBarWindowItem.propTypes = {
        icon: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired
    }
    return (
        <img
            src={icon}
            width={32}
            height={32}
            alt=""
            onClick={onClick}
            className={"topbar__icon " + (hover ? "hover" : "")}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)} />
    );
}