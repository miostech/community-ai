'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Button,
    TextField,
    IconButton,
    CircularProgress,
    Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const CREATOR_ROLES = ['moderator', 'admin', 'criador'];

export default function CriarLivePage() {
    const { account } = useAccount();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const canCreate = CREATOR_ROLES.includes(account?.role || '');

    if (!canCreate) {
        router.replace('/dashboard/lives');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Título é obrigatório');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const body: Record<string, unknown> = { title: title.trim() };
            if (description.trim()) body.description = description.trim();
            if (scheduledAt) body.scheduled_at = new Date(scheduledAt).toISOString();

            const res = await fetch('/api/lives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Erro ao criar live');
                return;
            }

            router.push(`/dashboard/lives/${data.event._id}`);
        } catch {
            setError('Erro ao criar live. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    width: { md: 'calc(100% - 256px)' },
                    ml: { md: '256px' },
                    display: { xs: 'none', md: 'block' },
                }}
            >
                <Toolbar>
                    <IconButton edge="start" onClick={() => router.back()} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                        Criar Live
                    </Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', pt: 1, px: 1, gap: 1 }}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Criar Live
                </Typography>
            </Box>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ maxWidth: 600, mx: 'auto', pt: { xs: 2, md: 10 }, px: 2, pb: { xs: 12, sm: 4 } }}
            >
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    label="Título da live"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ maxLength: 200 }}
                    sx={{ mb: 3 }}
                />

                <TextField
                    label="Descrição (opcional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 2000 }}
                    sx={{ mb: 3 }}
                />

                <TextField
                    label="Data e horário (opcional)"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ mb: 4 }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading || !title.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                >
                    {loading ? 'Criando...' : 'Criar Live'}
                </Button>
            </Box>
        </>
    );
}
