import React from 'react';

/**
 * Renders the custom Dirham icon from public/dirham.svg
 */
const DirhamIcon = ({ className = 'h-4 w-4' }) => {
    return (
        <img
            src="/dirham.svg"
            alt="AED"
            className={`${className} dirham-icon inline-block select-none`}
        />
    );
};

export default DirhamIcon;
