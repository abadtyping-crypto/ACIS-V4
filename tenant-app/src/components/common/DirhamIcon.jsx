import React from 'react';
import { useTheme } from '../../context/useTheme';

/**
 * Renders the AED icon from public/dirham.svg
 */
const Icon = ({ className = 'h-4 w-4' }) => {
    const { resolvedTheme } = useTheme();

    return (
        <img
            src="/dirham.svg"
            alt="AED"
            className={`${className} -icon inline-block select-none`}
            style={{
                filter: resolvedTheme === 'dark'
                    ? 'brightness(0) invert(0.96) contrast(1.15)'
                    : 'none',
            }}
        />
    );
};

export default Icon;
