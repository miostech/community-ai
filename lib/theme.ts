'use client';

import { createTheme } from '@mui/material/styles';

// Tema claro
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
        },
        secondary: {
            main: '#8b5cf6', // purple-500
            light: '#a78bfa', // purple-400
            dark: '#7c3aed', // purple-600
        },
        error: {
            main: '#ef4444', // red-500
        },
        warning: {
            main: '#f59e0b', // amber-500
        },
        success: {
            main: '#22c55e', // green-500
        },
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        text: {
            primary: '#111827', // gray-900
            secondary: '#6b7280', // gray-500
        },
        divider: '#e5e7eb', // gray-200
    },
    typography: {
        fontFamily: 'inherit',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiAppBar: {
            defaultProps: {
                color: 'default',
                elevation: 0,
                position: 'fixed',
            },
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #e5e7eb',
                    backdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    height: 67,
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    height: 67,
                    minHeight: 67,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    border: '1px solid #e5e7eb',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                },
            },
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(6px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                },
            },
        },
    },
});

// Tema escuro
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#3b82f6', // blue-500
            light: '#60a5fa', // blue-400
            dark: '#2563eb', // blue-600
        },
        secondary: {
            main: '#8b5cf6', // purple-500
            light: '#a78bfa', // purple-400
            dark: '#7c3aed', // purple-600
        },
        error: {
            main: '#ef4444', // red-500
        },
        warning: {
            main: '#f59e0b', // amber-500
        },
        success: {
            main: '#22c55e', // green-500
        },
        background: {
            default: '#000000',
            paper: '#000000',
        },
        text: {
            primary: '#f1f5f9', // slate-100
            secondary: '#94a3b8', // slate-400
        },
        divider: '#334155', // slate-700
    },
    typography: {
        fontFamily: 'inherit',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiAppBar: {
            defaultProps: {
                color: 'default',
                elevation: 0,
                position: 'fixed',
            },
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #334155',
                    backdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    height: 67,
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: {
                    height: 67,
                    minHeight: 67,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
                    border: '1px solid #334155',
                    backgroundColor: '#111111ff',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    fontSize: '0.875rem',
                    backgroundColor: '#000000',
                    '&:hover': {
                        backgroundColor: '#1e293b',
                    },
                    textWrap: "auto"
                },
            },
            defaultProps: {
                draggable: false,
                divider: false,
            }
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(6px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
        },
    },
});
