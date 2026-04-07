'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    TextField,
    Stack,
    Alert,
    IconButton,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    PhotoCamera as PhotoCameraIcon,
    InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useAccount } from '@/contexts/AccountContext';
import { isBrandProfileComplete } from '@/lib/marca-brand-profile';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function MarcaNovaCampanhaModal({ open, onClose }: Props) {
    const theme = useTheme();
    const router = useRouter();
    const { account, refreshAccount } = useAccount();
    const fileRef = useRef<HTMLInputElement>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (open && account) {
            setLogoUrl(account.brand_logo_url?.trim() || '');
            setDescription(account.brand_description?.trim() || '');
            setError('');
        }
    }, [open, account]);

    async function uploadFile(file: File) {
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('type', 'image');
            formData.append('files', file);
            const res = await fetch('/api/posts/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro no upload');
            const url = data.urls?.[0];
            if (url) setLogoUrl(url);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro ao enviar imagem');
        } finally {
            setUploading(false);
        }
    }

    async function handleContinue() {
        if (!logoUrl.trim()) {
            setError('Envie o logo da marca.');
            return;
        }
        if (description.trim().length < 20) {
            setError('A descrição da marca deve ter pelo menos 20 caracteres.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/marca/business-profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_logo_url: logoUrl.trim(),
                    brand_description: description.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Não foi possível salvar o perfil da marca.');
                setSaving(false);
                return;
            }
            await refreshAccount();
            onClose();
            router.push('/marca/campanhas/nova');
        } catch {
            setError('Erro de conexão ao salvar.');
        } finally {
            setSaving(false);
        }
    }

    const complete = account ? isBrandProfileComplete(account) : false;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
        >
            <DialogContent sx={{ p: 0, display: 'flex', minHeight: 420 }}>
                <Box
                    sx={{
                        width: 200,
                        flexShrink: 0,
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                        borderRight: 1,
                        borderColor: 'divider',
                        p: 2,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                        Nova campanha
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'warning.main',
                            }}
                        />
                        <Typography variant="body2" fontWeight={600} color="warning.dark">
                            Pré-requisitos
                        </Typography>
                    </Stack>
                </Box>

                <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, position: 'relative' }}>
                    <IconButton
                        onClick={onClose}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        aria-label="Fechar"
                    >
                        <CloseIcon />
                    </IconButton>

                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2, pr: 4 }}>
                        Pendências da marca
                    </Typography>

                    <Alert
                        severity="warning"
                        icon={<InfoIcon />}
                        sx={{ mb: 2, borderRadius: 2 }}
                    >
                        Complete os dados da marca antes de continuar. Para iniciar sua campanha, precisamos que o
                        perfil da marca tenha os dados básicos preenchidos.
                    </Alert>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Logo da marca
                    </Typography>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        hidden
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadFile(f);
                            e.target.value = '';
                        }}
                    />
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Box
                            sx={{
                                width: 88,
                                height: 88,
                                borderRadius: 2,
                                border: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                            }}
                        >
                            {logoUrl ? (
                                <Box
                                    component="img"
                                    src={logoUrl}
                                    alt="Logo"
                                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <PhotoCameraIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
                            )}
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            {uploading ? 'Enviando…' : 'Alterar'}
                        </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        Peso: 120×120px mín. · recomendado 400×400px
                    </Typography>

                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Descrição da marca
                    </Typography>
                    <TextField
                        multiline
                        minRows={4}
                        fullWidth
                        placeholder="Descreva brevemente sua marca para os creators."
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                        slotProps={{ htmlInput: { maxLength: 1000 } }}
                        sx={{ mb: 0.5 }}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                            Visível para os creators
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {description.length}/1000
                        </Typography>
                    </Stack>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={2}
                        sx={{ mt: 3 }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {complete
                                ? 'Perfil completo. Você pode seguir para criar a campanha.'
                                : 'Complete as pendências acima para continuar.'}
                        </Typography>
                        <Button
                            variant="contained"
                            disabled={saving || !logoUrl.trim() || description.trim().length < 20}
                            onClick={handleContinue}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                },
                            }}
                        >
                            {saving ? 'Salvando…' : 'Salvar e continuar'}
                        </Button>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
