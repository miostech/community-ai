'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Grid,
    Card,
    CardActionArea,
    Avatar,
    CircularProgress,
    Chip,
    Button,
    IconButton,
    Tooltip,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Slideshow as SlideshowIcon,
    People as PeopleIcon,
    Favorite as FavoriteIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { normalizeInstagramHandle, normalizeTikTokHandle } from '@/lib/normalize-social-handles';

interface ApresentacaoCreator {
    _id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    link_instagram: string | null;
    link_tiktok: string | null;
    followers: number | null;
    engagementScore: number | null;
    category: string | null;
}

interface ApresentacaoStats {
    totalCreators: number;
    totalFollowers: number;
    totalViews: number;
    followersUpdatedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    ugc: 'UGC Creator',
    influencer: 'Influencer',
    ambos: 'UGC + Influencer',
};

function formatFollowers(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

function getEngagementLevel(score: number): { label: string; color: 'error' | 'warning' | 'info' | 'success' } {
    if (score <= 30) return { label: 'Baixo', color: 'error' };
    if (score <= 60) return { label: 'Médio', color: 'warning' };
    if (score <= 80) return { label: 'Bom', color: 'info' };
    return { label: 'Excelente', color: 'success' };
}

/** Desenha o canvas longo em várias páginas A4 (como print da página). */
function addCanvasToPdfAsPages(pdf: jsPDF, canvas: HTMLCanvasElement, marginMm: number) {
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const pdfW = pageW - 2 * marginMm;
    const pdfH = pageH - 2 * marginMm;
    const totalImgHeightMm = (canvas.height / canvas.width) * pdfW;
    const pxPerPage = (pdfH / totalImgHeightMm) * canvas.height;
    let srcY = 0;

    while (srcY < canvas.height) {
        if (srcY > 0) pdf.addPage();
        const h = Math.min(pxPerPage, canvas.height - srcY);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.ceil(h);
        const ctx = slice.getContext('2d');
        if (!ctx) break;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, srcY, canvas.width, h, 0, 0, canvas.width, h);
        const sliceH_mm = (h / canvas.height) * totalImgHeightMm;
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', marginMm, marginMm, pdfW, sliceH_mm);
        srcY += h;
    }
}

function ApresentacaoMetricCards({ stats }: { stats: ApresentacaoStats }) {
    const theme = useTheme();
    return (
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', mb: 4 }}>
            <Paper
                elevation={0}
                sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <PeopleIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {stats.totalCreators.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Creators na Dome
                    </Typography>
                </Box>
            </Paper>
            <Paper
                elevation={0}
                sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.secondary.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <FavoriteIcon sx={{ fontSize: 28, color: 'secondary.main' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {formatFollowers(stats.totalFollowers)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Base de seguidores
                    </Typography>
                    {stats.followersUpdatedAt && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
                            Atualizado em {new Date(stats.followersUpdatedAt).toLocaleDateString('pt-BR')}
                        </Typography>
                    )}
                </Box>
            </Paper>
            <Paper
                elevation={0}
                sx={{
                    flex: '1 1 200px',
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <VisibilityIcon sx={{ fontSize: 28, color: 'info.main' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {formatFollowers(stats.totalViews)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Alcance nas redes sociais
                    </Typography>
                    {stats.followersUpdatedAt && (
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
                            Atualizado em {new Date(stats.followersUpdatedAt).toLocaleDateString('pt-BR')}
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Stack>
    );
}

export default function ApresentacaoPage() {
    const theme = useTheme();
    const [creators, setCreators] = useState<ApresentacaoCreator[]>([]);
    const [stats, setStats] = useState<ApresentacaoStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'engagement' | 'followers'>('engagement');
    const [showEngagementScore, setShowEngagementScore] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const pdfCaptureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/admin/influencers/apresentacao?sortBy=${sortBy}`)
            .then((r) => r.json())
            .then((data) => {
                setCreators(data.creators || []);
                setStats(data.stats || null);
            })
            .catch(() => {
                setCreators([]);
                setStats(null);
            })
            .finally(() => setLoading(false));
    }, [sortBy]);

    const handleDownloadPdf = async () => {
        const el = pdfCaptureRef.current;
        if (!stats || !el) return;
        setPdfLoading(true);
        try {
            await new Promise<void>((r) => requestAnimationFrame(() => r()));
            await document.fonts.ready;
            const bg = theme.palette.background.default;
            // Escala ~1.5 reduz artefato de “texto duplo” no raster; canvas padrão (sem foreignObject)
            const canvas = await html2canvas(el, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: bg,
                foreignObjectRendering: false,
                ignoreElements: (node) =>
                    node instanceof HTMLElement && node.hasAttribute('data-html2canvas-ignore'),
                onclone: (clonedDoc) => {
                    const root = clonedDoc.querySelector('[data-pdf-capture]');
                    if (!root) return;

                    const stripStyle = clonedDoc.createElement('style');
                    stripStyle.textContent = `
                        [data-pdf-capture] {
                            -webkit-font-smoothing: antialiased;
                            -moz-osx-font-smoothing: grayscale;
                            text-rendering: optimizeSpeed;
                        }
                        [data-pdf-capture] .MuiCardActionArea-focusHighlight,
                        [data-pdf-capture] .MuiTouchRipple-root {
                            display: none !important;
                        }
                        /* Não usar * com -webkit-text-stroke: isso some com o texto dentro de Chip no canvas */
                        [data-pdf-capture] .MuiTypography-root,
                        [data-pdf-capture] a {
                            text-shadow: none !important;
                            -webkit-text-stroke: 0 transparent !important;
                        }
                        [data-pdf-capture] .MuiChip-root {
                            box-shadow: none !important;
                            overflow: visible !important;
                            background: transparent !important;
                        }
                        [data-pdf-capture] svg {
                            -webkit-text-stroke: initial !important;
                        }
                        [data-pdf-capture] .MuiTypography-noWrap {
                            white-space: normal !important;
                            overflow: visible !important;
                            text-overflow: clip !important;
                            word-break: break-word;
                        }
                    `;
                    clonedDoc.head.appendChild(stripStyle);

                    root.querySelectorAll('.MuiPaper-root, .MuiCard-root').forEach((node) => {
                        const h = node as HTMLElement;
                        h.style.border = 'none';
                        h.style.boxShadow = 'none';
                    });

                    const chipPalette = (chip: Element): { bg: string; fg: string } => {
                        if (chip.classList.contains('MuiChip-colorSuccess')) {
                            return { bg: theme.palette.success.main, fg: theme.palette.success.contrastText };
                        }
                        if (chip.classList.contains('MuiChip-colorError')) {
                            return { bg: theme.palette.error.main, fg: theme.palette.error.contrastText };
                        }
                        if (chip.classList.contains('MuiChip-colorWarning')) {
                            return { bg: theme.palette.warning.main, fg: theme.palette.warning.contrastText };
                        }
                        if (chip.classList.contains('MuiChip-colorInfo')) {
                            return { bg: theme.palette.info.main, fg: theme.palette.info.contrastText };
                        }
                        if (chip.classList.contains('MuiChip-colorPrimary')) {
                            return { bg: theme.palette.primary.main, fg: theme.palette.primary.contrastText };
                        }
                        if (chip.classList.contains('MuiChip-colorSecondary')) {
                            return { bg: theme.palette.secondary.main, fg: theme.palette.secondary.contrastText };
                        }
                        return { bg: theme.palette.action.selected, fg: theme.palette.text.primary };
                    };

                    /* html2canvas não pinta o texto dentro do Chip MUI — no clone, virar uma pílula única (sem classes MUI que esticam a largura) */
                    root.querySelectorAll('.MuiChip-root').forEach((chip) => {
                        const labelEl = chip.querySelector('.MuiChip-label');
                        const text = labelEl?.textContent?.trim() ?? '';
                        const { bg, fg } = chipPalette(chip);
                        const chipEl = chip as HTMLElement;
                        chipEl.removeAttribute('class');
                        chipEl.innerHTML = '';
                        chipEl.textContent = text;
                        chipEl.style.cssText = [
                            'display:inline-flex',
                            'align-items:center',
                            'justify-content:center',
                            'box-sizing:border-box',
                            'padding:4px 12px',
                            'border-radius:9999px',
                            `background:${bg}`,
                            `color:${fg}`,
                            'font-size:11px',
                            'font-weight:600',
                            'line-height:1.35',
                            'white-space:nowrap',
                            'font-family:inherit',
                            '-webkit-font-smoothing:antialiased',
                            'text-align:center',
                            'width:fit-content',
                            'max-width:100%',
                            'margin:0',
                            'border:none',
                            'box-shadow:none',
                            'height:auto',
                            'min-height:auto',
                            'vertical-align:middle',
                        ].join(';');
                    });
                },
            });
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            addCanvasToPdfAsPages(pdf, canvas, 0);
            const fileName = `dome-creators-${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(fileName);
        } catch (e) {
            console.error('PDF:', e);
        } finally {
            setPdfLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 4 }, pb: { xs: 10, sm: 4 } }}>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Box
                        ref={pdfCaptureRef}
                        data-pdf-capture
                        sx={{
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            px: { xs: 0, sm: 0 },
                            py: 0,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <SlideshowIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                                <Typography variant="h5" fontWeight={700}>
                                    Dome Creators
                                </Typography>
                            </Stack>
                            <Box data-html2canvas-ignore>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={pdfLoading ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
                                    disabled={loading || !stats || pdfLoading}
                                    onClick={handleDownloadPdf}
                                >
                                    {pdfLoading ? 'Gerando…' : 'Baixar PDF'}
                                </Button>
                            </Box>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Nossos top creators e métricas da comunidade.
                        </Typography>

                        {stats && <ApresentacaoMetricCards stats={stats} />}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                        >
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Top creators
                                </Typography>
                                <Tooltip
                                    title={showEngagementScore ? 'Ocultar score de engajamento' : 'Mostrar score de engajamento'}
                                    placement="top"
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowEngagementScore((v) => !v)}
                                        aria-label={showEngagementScore ? 'Ocultar score de engajamento' : 'Mostrar score de engajamento'}
                                        aria-pressed={showEngagementScore}
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        {showEngagementScore ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    size="small"
                                    label="Por engajamento"
                                    color={sortBy === 'engagement' ? 'primary' : 'default'}
                                    variant={sortBy === 'engagement' ? 'filled' : 'outlined'}
                                    onClick={() => setSortBy('engagement')}
                                    sx={{
                                        fontWeight: 600,
                                        justifyContent: 'center',
                                        '& .MuiChip-label': { px: 1.25, textAlign: 'center', width: '100%' },
                                    }}
                                />
                                <Chip
                                    size="small"
                                    label="Por seguidores"
                                    color={sortBy === 'followers' ? 'primary' : 'default'}
                                    variant={sortBy === 'followers' ? 'filled' : 'outlined'}
                                    onClick={() => setSortBy('followers')}
                                    sx={{
                                        fontWeight: 600,
                                        justifyContent: 'center',
                                        '& .MuiChip-label': { px: 1.25, textAlign: 'center', width: '100%' },
                                    }}
                                />
                            </Stack>
                        </Stack>
                        <Grid container spacing={2}>
                            {creators.map((c) => {
                                const fullName = `${c.first_name} ${c.last_name}`.trim();
                                const igHandle = c.link_instagram ? normalizeInstagramHandle(c.link_instagram) : null;
                                const ttHandle = c.link_tiktok ? normalizeTikTokHandle(c.link_tiktok) : null;
                                const handle = igHandle ? `@${igHandle}` : ttHandle ? `@${ttHandle}` : null;
                                return (
                                    <Grid key={c._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Card
                                            component={Link}
                                            href={`/dashboard/influenciadores/${c._id}`}
                                            elevation={0}
                                            sx={{
                                                textDecoration: 'none',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                height: '100%',
                                            }}
                                        >
                                            <CardActionArea sx={{ p: 2, height: '100%' }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        src={c.avatar_url || undefined}
                                                        sx={{
                                                            width: 56,
                                                            height: 56,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                            color: 'primary.main',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {fullName.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                                                            {fullName}
                                                        </Typography>
                                                        {handle && (
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                {handle}
                                                            </Typography>
                                                        )}
                                                        {c.category && (
                                                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                                                                {CATEGORY_LABELS[c.category] || c.category}
                                                            </Typography>
                                                        )}
                                                        {c.followers != null && (
                                                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.25 }}>
                                                                {formatFollowers(c.followers)} seguidores
                                                            </Typography>
                                                        )}
                                                        {showEngagementScore && (
                                                            <Box sx={{ mt: 0.75 }}>
                                                                {c.engagementScore != null ? (
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${c.engagementScore}/100 · ${getEngagementLevel(c.engagementScore).label}`}
                                                                        color={getEngagementLevel(c.engagementScore).color}
                                                                        sx={{
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 600,
                                                                            justifyContent: 'center',
                                                                            height: 'auto',
                                                                            minHeight: 22,
                                                                            py: 0.25,
                                                                            '& .MuiChip-label': {
                                                                                px: 1,
                                                                                py: 0,
                                                                                textAlign: 'center',
                                                                                lineHeight: 1.25,
                                                                            },
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                        Sem dados de engajamento no momento
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                        {creators.length === 0 && !loading && (
                            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nenhum creator no portfólio.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
}
