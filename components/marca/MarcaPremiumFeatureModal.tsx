'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack,
    IconButton,
    Box,
    alpha,
    useTheme,
} from '@mui/material';
import { Close as CloseIcon, WorkspacePremium as PremiumIcon } from '@mui/icons-material';
import type { MarcaPremiumFeatureId } from '@/lib/marca-premium-routes';
import { MARCA_PLAN_MONTHLY_BRL } from '@/lib/marca-plans';

const COPY: Record<
    MarcaPremiumFeatureId,
    { title: string; lead: string; valuePoints: string[] }
> = {
    comunidades: {
        title: 'Comunidades',
        lead: 'Entre em comunidades onde criadores e marcas já conversam em torno de campanhas, tendências e parcerias.',
        valuePoints: [
            'Descubra onde seu público e seus criadores já estão ativos — menos atrito na prospecção.',
            'Participe de conversas com contexto: briefings, feedback e oportunidades em um só lugar.',
            'Transforme relacionamento em resultado: da primeira mensagem ao conteúdo publicado.',
        ],
    },
    criadores: {
        title: 'Criadores',
        lead: 'A vitrine de criadores foi feita para você encontrar perfis alinhados à campanha — sem planilhas infinitas.',
        valuePoints: [
            'Filtre por nicho, rede e estilo de conteúdo para montar o time certo em minutos.',
            'Veja portfólio e sinais de performance antes de convidar alguém para a campanha.',
            'Reduza idas e vindas: menos tentativa e erro, mais creators que combinam com a marca.',
        ],
    },
    tracking: {
        title: 'Tracking',
        lead: 'Acompanhe o que importa depois que o conteúdo sai do ar: visibilidade, engajamento e retorno da campanha.',
        valuePoints: [
            'Centralize indicadores para decidir o que repetir, ajustar ou escalar na próxima leva.',
            'Mostre resultado para o time e para o financeiro com números organizados.',
            'Antecipe problemas: veja quem performou e onde investir o próximo real.',
        ],
    },
};

interface Props {
    open: boolean;
    onClose: () => void;
    feature: MarcaPremiumFeatureId;
}

export function MarcaPremiumFeatureModal({ open, onClose, feature }: Props) {
    const theme = useTheme();
    const router = useRouter();
    const c = COPY[feature];

    function goSubscribe() {
        onClose();
        router.push('/marca/planos');
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1,
                    pr: 1,
                    pt: 2.5,
                }}
            >
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                            flexShrink: 0,
                        }}
                    >
                        <PremiumIcon />
                    </Box>
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
                            Recurso do portal da marca
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25 }}>
                            {c.title}
                        </Typography>
                    </Box>
                </Stack>
                <IconButton aria-label="Fechar" onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                    {c.lead}
                </Typography>
                <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 2.25 }}>
                    {c.valuePoints.map((line) => (
                        <Typography key={line} component="li" variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                            {line}
                        </Typography>
                    ))}
                </Stack>
                <Box
                    sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        border: 1,
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                    }}
                >
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Investimento do plano (cobrança mensal)
                    </Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">
                        {MARCA_PLAN_MONTHLY_BRL.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                        })}
                        <Typography component="span" variant="body2" color="text.secondary" fontWeight={600} sx={{ ml: 0.5 }}>
                            /mês
                        </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        O valor acima é o preço do acesso a estes recursos; o foco é o retorno em tempo, clareza e
                        performance das suas campanhas.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, px: 3, pb: 2.5, gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Agora não
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => void goSubscribe()}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                    }}
                >
                    Ver planos e assinar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
