'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Stack,
    Alert,
    Divider,
    alpha,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { DomeLogo } from '@/components/ui/DomeLogo';

export default function MarcaCadastroPage() {
    const theme = useTheme();
    const router = useRouter();
    const { status } = useSession();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/marca/intent', { method: 'POST' }).catch(() => {});
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/marca/inicio');
        }
    }, [status, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/marca/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Não foi possível cadastrar.');
                setLoading(false);
                return;
            }
            const signInRes = await signIn('marca-credentials', {
                email: email.trim().toLowerCase(),
                password,
                redirect: false,
            });
            if (!signInRes || (typeof signInRes === 'object' && 'ok' in signInRes && !signInRes.ok)) {
                setError('Conta criada, mas o login automático falhou. Entre na página de login.');
                setLoading(false);
                return;
            }
            router.replace('/marca/inicio');
            router.refresh();
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setError('');
        setLoading(true);
        try {
            await signIn('google', { callbackUrl: '/marca/inicio' });
        } catch {
            setLoading(false);
        }
    }

    if (status === 'loading' || status === 'authenticated') {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 4,
                bgcolor: 'background.default',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 80,
                        left: 40,
                        width: 288,
                        height: 288,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        borderRadius: '50%',
                        filter: 'blur(64px)',
                    },
                }}
            />
            <Paper
                elevation={0}
                sx={{
                    position: 'relative',
                    maxWidth: 440,
                    width: '100%',
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <DomeLogo style={{ fontSize: 28, fontWeight: 700 }} />
                    </Link>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>
                        Cadastre sua marca
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Crie sua conta e acesse o portal para criar campanhas com creators.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                    <TextField
                        label="Nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        fullWidth
                        autoComplete="name"
                    />
                    <TextField
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        autoComplete="email"
                    />
                    <TextField
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                        autoComplete="new-password"
                        helperText="Mínimo 8 caracteres"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{
                            mt: 1,
                            py: 1.25,
                            fontWeight: 700,
                            textTransform: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        }}
                    >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Criar conta e continuar'}
                    </Button>
                </Stack>

                <Divider sx={{ my: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                        ou
                    </Typography>
                </Divider>

                <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogle}
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 600, py: 1.1 }}
                >
                    Continuar com Google
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                    Já tem conta?{' '}
                    <Link href="/marca/login" style={{ fontWeight: 600, color: theme.palette.primary.main }}>
                        Entrar
                    </Link>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                    <Link href="/#marcas" style={{ color: 'inherit' }}>
                        Voltar ao site
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}
