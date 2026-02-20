'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountProvider, useAccount } from '@/contexts/AccountContext';
import { CoursesProvider } from '@/contexts/CoursesContext';
import { SidebarMui } from './SidebarMui';
import { MobileMenuMui } from './MobileMenuMui';
import { MobileHeaderMui, MOBILE_HEADER_OFFSET } from './MobileHeaderMui';
import { FloatingChatButtonMui } from '@/components/chat/FloatingChatButtonMui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CreatePostProvider } from '@/contexts/CreatePostContext';
import { PostsProvider } from '@/contexts/PostsContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';
import { StoriesProvider } from '@/contexts/StoriesContext';
import { MuiProvider } from '@/components/providers/MuiProvider';
import { Box, Button, Dialog, DialogContent, Typography, Avatar } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPhone, isLoading, isSubscriptionActive } = useAccount();

  // Modal de telefone só aparece se tiver assinatura ativa e não tiver telefone
  const showPhoneModal = !isLoading && isSubscriptionActive && !hasPhone && pathname !== '/dashboard/perfil';

  const isComunidadePage = pathname === '/dashboard/comunidade' || pathname?.startsWith('/dashboard/comunidade/');
  const isCriarPostPage = pathname === '/dashboard/comunidade/criar';
  const hideBlobs = isComunidadePage || isCriarPostPage;

  return (
    <>
      <StoriesProvider>
        <PostsProvider>
          <CreatePostProvider>
            <ChatHistoryProvider>
              <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Background decorative elements - apenas em páginas que não sejam comunidade */}
                {!hideBlobs && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'hidden',
                      pointerEvents: 'none'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 80,
                        left: 40,
                        width: 288,
                        height: 288,
                        bgcolor: 'primary.light',
                        borderRadius: '50%',
                        filter: 'blur(64px)',
                        opacity: 0.15
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 160,
                        right: 40,
                        width: 288,
                        height: 288,
                        bgcolor: 'secondary.light',
                        borderRadius: '50%',
                        filter: 'blur(64px)',
                        opacity: 0.15
                      }}
                    />
                  </Box>
                )}

                <SidebarMui />
                {!isComunidadePage && <MobileHeaderMui />}
                <MobileMenuMui />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    position: 'relative',
                    zIndex: 10,
                    overflowX: 'hidden',
                    pt: isComunidadePage ? 0 : { xs: MOBILE_HEADER_OFFSET, md: 0 },
                  }}
                >
                  {isComunidadePage ? (
                    children
                  ) : (
                    <Box sx={{ p: { xs: 0, md: 4 } }}>
                      {children}
                    </Box>
                  )}
                </Box>

                {/* Modal de cadastro de telefone */}
                <Dialog
                  open={showPhoneModal}
                  PaperProps={{
                    sx: {
                      maxWidth: 400,
                      mx: 2,
                      borderRadius: 3,
                    },
                  }}
                >
                  <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: 'warning.light',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <PhoneIcon sx={{ color: 'warning.dark' }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      Cadastre seu telefone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Para usar a comunidade, é preciso cadastrar seu número de telefone no seu perfil.
                    </Typography>
                    <Button
                      component={Link}
                      href="/dashboard/perfil"
                      variant="contained"
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        },
                      }}
                    >
                      Ir para Meu Perfil
                    </Button>
                  </DialogContent>
                </Dialog>

                {/* Botão flutuante de chat - apenas em páginas que não sejam comunidade */}
                {!isComunidadePage && <FloatingChatButtonMui />}
              </Box>
            </ChatHistoryProvider>
          </CreatePostProvider>
        </PostsProvider>
      </StoriesProvider>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <CoursesProvider>
          <MuiProvider>
            <DashboardContent>{children}</DashboardContent>
          </MuiProvider>
        </CoursesProvider>
      </AccountProvider>
    </ProtectedRoute>
  );
}
