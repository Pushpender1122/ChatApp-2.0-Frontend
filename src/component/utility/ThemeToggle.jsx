import React from 'react';
import { IoMoon, IoSunny } from 'react-icons/io5';
import { useTheme } from '../context/theme';

const ThemeToggle = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink hover:bg-raised transition-colors ${className}`}
        >
            {theme === 'dark' ? <IoSunny size={20} /> : <IoMoon size={20} />}
        </button>
    );
};

export default ThemeToggle;
