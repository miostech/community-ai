'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Typography,
    IconButton,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const WHATSAPP_DEFAULT = '551153042686';

function buildWhatsAppUrl(personName: string, brandName: string, email: string): string {
    const phone = (process.env.NEXT_PUBLIC_WHATSAPP_MARCA_LP || WHATSAPP_DEFAULT).replace(/\D/g, '');
    const text = [
        'Olá! Sou uma marca e gostaria de agendar uma apresentação na Dome.',
        '',
        `Nome: ${personName}`,
        `Marca: ${brandName}`,
        `E-mail: ${email}`,
    ].join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export function MarcaApresentacaoLeadDialog({ open, onClose }: Props) {
    const [personName, setPersonName] = useState('');
    const [brandName, setBrandName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function reset() {
        setPersonName('');
        setBrandName('');
        setEmail('');
        setError('');
    }

    function handleClose() {
        if (loading) return;
        reset();
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/leads/marca-apresentacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    person_name: personName.trim(),
                    brand_name: brandName.trim(),
                    email: email.trim(),
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
                setError(data.error || 'Não foi possível enviar.');
                return;
            }
            const url = buildWhatsAppUrl(personName.trim(), brandName.trim(), email.trim());
            window.open(url, '_blank', 'noopener,noreferrer');
            reset();
            onClose();
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                    Agendar apresentação
                </Typography>
                <IconButton aria-label="Fechar" onClick={handleClose} size="small" disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={(e) => void handleSubmit(e)}>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Preencha seus dados. Vamos salvar o contato e abrir o WhatsApp para você falar com a equipe.
                    </Typography>
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    ) : null}
                    <Stack spacing={2}>
                        <TextField
                            required
                            label="Seu nome"
                            name="person_name"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            autoComplete="name"
                            fullWidth
                        />
                        <TextField
                            required
                            label="Nome da marca"
                            name="brand_name"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            required
                            type="email"
                            label="E-mail"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap' }}>
                    <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        }}
                    >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Enviar e abrir WhatsApp'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
