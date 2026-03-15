import React from 'react';

/**
 * Renders the AED icon from public/dirham.svg
 */
const Icon = ({ className = 'h-4 w-4' }) => {
    return (
        <img
            src="/dirham.svg"
            alt="AED"
            className={`${className} -icon inline-block select-none`}
        />
    );
};

export default Icon;
