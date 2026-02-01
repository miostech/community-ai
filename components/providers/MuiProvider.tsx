'use client';

import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '@/contexts/ThemeContext';
import { lightTheme, darkTheme } from '@/lib/theme';

interface MuiProviderProps {
    children: React.ReactNode;
}

export function MuiProvider({ children }: MuiProviderProps) {
    const { resolvedTheme } = useTheme();

    const muiTheme = useMemo(() => {
        return resolvedTheme === 'dark' ? darkTheme : lightTheme;
    }, [resolvedTheme]);

    return (
        <MuiThemeProvider theme={muiTheme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
}
