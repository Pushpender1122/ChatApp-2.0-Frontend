import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme, StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { } });

const getInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: theme,
            primary: {
                main: theme === 'dark' ? '#f5f5f5' : '#171717',
                contrastText: theme === 'dark' ? '#171717' : '#ffffff',
            },
            background: {
                default: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
                paper: theme === 'dark' ? '#171717' : '#ffffff',
            },
            text: {
                primary: theme === 'dark' ? '#f5f5f5' : '#171717',
                secondary: theme === 'dark' ? '#ababab' : '#646464',
            },
            divider: theme === 'dark' ? '#404040' : '#e5e5e5',
        },
        typography: {
            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
            button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiButton: { defaultProps: { disableElevation: true } },
            MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
        },
    }), [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <StyledEngineProvider injectFirst>
                <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
            </StyledEngineProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
