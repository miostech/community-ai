'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Fab,
    Badge,
    Box,
    Tooltip,
    Typography,
    Zoom,
} from '@mui/material';
import { TextsmsOutlined as ChatIcon } from '@mui/icons-material';

export function FloatingChatButtonMui() {
    const pathname = usePathname();
    const [showPulse, setShowPulse] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPulse(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    const isChatPage = pathname === '/dashboard/chat';

    if (isChatPage) {
        return null;
    }

    return (
        <Zoom in={true}>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 80, sm: 24 },
                    right: { xs: 16, sm: 24 },
                    zIndex: 50,
                }}
            >
                <Tooltip
                    title={
                        <Box>
                            <Typography variant="body2" fontWeight="bold">
                                IA treinada pela Nat & Luigi
                            </Typography>
                            <Typography variant="caption" color="grey.400">
                                Clique para conversar
                            </Typography>
                        </Box>
                    }
                    placement="left"
                    arrow
                >
                    <Link href="/dashboard/chat">
                        <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        // badgeContent={
                        //     <Box
                        //         sx={{
                        //             width: 16,
                        //             height: 16,
                        //             borderRadius: '50%',
                        //             bgcolor: 'success.main',
                        //             border: '2px solid',
                        //             borderColor: 'background.paper',
                        //             animation: 'pulse 2s infinite',
                        //             '@keyframes pulse': {
                        //                 '0%, 100%': { opacity: 1 },
                        //                 '50%': { opacity: 0.5 },
                        //             },
                        //         }}
                        //     />
                        // }
                        >
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                            // badgeContent={
                            //     <Box
                            //         sx={{
                            //             width: 24,
                            //             height: 24,
                            //             borderRadius: '50%',
                            //             background: 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)',
                            //             border: '2px solid',
                            //             borderColor: 'background.paper',
                            //             display: 'flex',
                            //             alignItems: 'center',
                            //             justifyContent: 'center',
                            //             fontSize: '8px',
                            //             fontWeight: 'bold',
                            //             color: 'white',
                            //             boxShadow: 1,
                            //         }}
                            //     >
                            //         N&L
                            //     </Box>
                            // }
                            >
                                <Fab
                                    sx={{
                                        width: { xs: 56, sm: 64 },
                                        height: { xs: 56, sm: 64 },
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                        boxShadow: 4,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                            boxShadow: 6,
                                            transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'visible',
                                    }}
                                    aria-label="Falar com a IA treinada pela Nat e o Luigi"
                                >
                                    <ChatIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 28 } }} />

                                    {/* Pulse ring */}
                                    {showPulse && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                                                opacity: 0.75,
                                                '@keyframes ping': {
                                                    '75%, 100%': {
                                                        transform: 'scale(1.5)',
                                                        opacity: 0,
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                </Fab>
                            </Badge>
                        </Badge>
                    </Link>
                </Tooltip>
            </Box>
        </Zoom>
    );
}
