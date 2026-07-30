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
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    AddPhotoAlternate as AddPhotoIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

const CREATOR_ROLES = ['moderator', 'admin', 'criador'];

export default function CriarLivePage() {
    const { account } = useAccount();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [membersOnly, setMembersOnly] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Selecione uma imagem (JPG, PNG, WebP ou GIF).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Imagem muito grande. Máximo 10MB.');
            return;
        }
        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('type', 'image');
            formData.append('files', file);
            const res = await fetch('/api/posts/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro no upload');
            const url = data.urls?.[0];
            if (url) setCoverUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const canCreate = CREATOR_ROLES.includes(account?.role || '');

    React.useEffect(() => {
        if (account && !canCreate) {
            router.replace('/dashboard/lives');
        }
    }, [account, canCreate, router]);

    if (!canCreate) return null;

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
            if (coverUrl) body.cover_image_url = coverUrl;
            if (membersOnly) body.members_only = true;

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
                    sx={{ mb: 3 }}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={membersOnly}
                            onChange={(e) => setMembersOnly(e.target.checked)}
                            color="warning"
                        />
                    }
                    label="Exclusiva para membros Premium"
                    sx={{ mb: 3 }}
                />

                <Box sx={{ mb: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>

                        Capa da live (opcional) — 16:9
                    </Typography>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleCoverUpload}
                        style={{ display: 'none' }}
                    />
                    {coverUrl ? (
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                                component="img"
                                src={coverUrl}
                                alt="Capa da live"
                                sx={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                            />
                            <IconButton
                                size="small"
                                onClick={() => setCoverUrl('')}
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ) : (
                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            startIcon={uploading ? <CircularProgress size={20} /> : <AddPhotoIcon />}
                            sx={{ py: 4, borderStyle: 'dashed' }}
                        >
                            {uploading ? 'Enviando...' : 'Adicionar capa'}
                        </Button>
                    )}
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading || uploading || !title.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                >
                    {loading ? 'Criando...' : 'Criar Live'}
                </Button>
            </Box>
        </>
    );
}
