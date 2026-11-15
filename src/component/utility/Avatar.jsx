import React from 'react';
import fallback from './avatar.svg';

function Avatar({ src, alt, ...props }) {
    return (
        <img
            {...props}
            src={src || fallback}
            alt={alt}
            onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallback;
            }}
        />
    );
}

export default Avatar;
