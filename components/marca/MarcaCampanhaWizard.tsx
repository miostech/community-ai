'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Collapse,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    Paper,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Check as CheckIcon,
    LocalOffer as VendasIcon,
    Visibility as ViewsIcon,
    Work as BrandingIcon,
    Palette as CriativosIcon,
    ReceiptLong as ContentPayIcon,
    Analytics as ViewPayIcon,
    Percent as CommissionIcon,
    Instagram as InstagramIcon,
    MusicNote as TikTokIcon,
    YouTube as YouTubeIcon,
    InfoOutlined as InfoIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    ChevronRight as ChevronRightIcon,
    ArrowBack as ArrowBackIcon,
    Movie as ShortVideoIcon,
    Tag as TwitterIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { useAccount, type Account } from '@/contexts/AccountContext';

const STEPS = [
    { id: 'info', label: 'Informações' },
    { id: 'budget', label: 'Budget' },
    { id: 'prazos', label: 'Prazos' },
    { id: 'briefing', label: 'Briefing' },
    { id: 'regras', label: 'Regras' },
    { id: 'config', label: 'Config.' },
] as const;

type Objective = 'vendas' | 'views' | 'branding' | 'criativos' | '';
type PaymentFormat = 'per_content' | 'per_view' | 'commission';
type UsageRights = '30' | '90' | '365' | 'perpetual';
type PostingWhen = 'on_approval' | 'specific_date';
type VisibilityOpt = 'public' | 'community';

type PlatformKey = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'short_video';

type InstagramFormatId = 'ig_stories' | 'ig_reels_collab';
type YoutubeFormatId = 'yt_shorts' | 'yt_long';
type TiktokFormatId = 'tt_video' | 'tt_live';
type TwitterFormatId = 'x_post' | 'x_thread';

type PlatformFormatsKey = 'instagram' | 'tiktok' | 'youtube' | 'twitter';

interface PlatformFormatsState {
    instagram: InstagramFormatId[];
    tiktok: TiktokFormatId[];
    youtube: YoutubeFormatId[];
    twitter: TwitterFormatId[];
}

const INSTAGRAM_FORMAT_OPTS: ReadonlyArray<{ id: InstagramFormatId; label: string }> = [
    { id: 'ig_stories', label: 'Stories' },
    { id: 'ig_reels_collab', label: 'Reels em Collab' },
];

const YOUTUBE_FORMAT_OPTS: ReadonlyArray<{ id: YoutubeFormatId; label: string }> = [
    { id: 'yt_shorts', label: 'Shorts' },
    { id: 'yt_long', label: 'Vídeo longo' },
];

const TIKTOK_FORMAT_OPTS: ReadonlyArray<{ id: TiktokFormatId; label: string }> = [
    { id: 'tt_video', label: 'Vídeo no feed' },
    { id: 'tt_live', label: 'Live' },
];

const TWITTER_FORMAT_OPTS: ReadonlyArray<{ id: TwitterFormatId; label: string }> = [
    { id: 'x_post', label: 'Post' },
    { id: 'x_thread', label: 'Thread' },
];

interface WizardState {
    title: string;
    objective: Objective;
    startDate: string;
    endDate: string;
    noEndDate: boolean;
    budgetTotalReais: string;
    slots: string;
    slotsUnlimited: boolean;
    platforms: Record<PlatformKey, boolean>;
    /** Formatos por plataforma (obrigatório quando a plataforma está marcada). */
    platformFormats: PlatformFormatsState;
    paymentFormat: PaymentFormat;
    valuePerContentReais: string;
    maxContentsPerCreator: string;
    perCreatorIndividual: boolean;
    viewBonus1000: string;
    viewPayMin: string;
    viewPayMax: string;
    viewPayMaxUnlimited: boolean;
    applicationDeadline: string;
    contentDeadline: string;
    briefing: string;
    scriptIdeas: string;
    promotionUrl: string;
    promotionCoupon: string;
    campaignImages: string[];
    usageRights: UsageRights;
    postingWhen: PostingWhen;
    specificPostDate: string;
    hashtags: string;
    forbiddenTerms: string;
    restrictionsText: string;
    referenceVideoUrls: string;
    visibility: VisibilityOpt;
    requireApplication: boolean;
    requireContentReview: boolean;
    productShipping: boolean;
    /** Campanha carregada da API — evita duplicar blocos no briefing ao salvar de novo */
    hydratedFromCampaign: boolean;
}

const INITIAL: WizardState = {
    title: '',
    objective: '',
    startDate: '',
    endDate: '',
    noEndDate: false,
    budgetTotalReais: '',
    slots: '5',
    slotsUnlimited: false,
    platforms: {
        instagram: true,
        tiktok: false,
        youtube: false,
        twitter: false,
        short_video: false,
    },
    platformFormats: {
        instagram: [],
        tiktok: [],
        youtube: [],
        twitter: [],
    },
    paymentFormat: 'per_content',
    valuePerContentReais: '',
    maxContentsPerCreator: '',
    perCreatorIndividual: false,
    viewBonus1000: '',
    viewPayMin: '',
    viewPayMax: '',
    viewPayMaxUnlimited: false,
    applicationDeadline: '',
    contentDeadline: '',
    briefing: '',
    scriptIdeas: '',
    promotionUrl: '',
    promotionCoupon: '',
    campaignImages: [],
    usageRights: '30',
    postingWhen: 'on_approval',
    specificPostDate: '',
    hashtags: '',
    forbiddenTerms: '',
    restrictionsText: '',
    referenceVideoUrls: '',
    visibility: 'public',
    requireApplication: true,
    requireContentReview: true,
    productShipping: false,
    hydratedFromCampaign: false,
};

const OBJECTIVES: { id: Objective; label: string; Icon: SvgIconComponent }[] = [
    { id: 'vendas', label: 'Vendas', Icon: VendasIcon },
    { id: 'views', label: 'Views', Icon: ViewsIcon },
    { id: 'branding', label: 'Branding', Icon: BrandingIcon },
    { id: 'criativos', label: 'Criativos', Icon: CriativosIcon },
];

const OBJECTIVE_LABELS: Record<string, string> = {
    vendas: 'Vendas',
    views: 'Views',
    branding: 'Branding',
    criativos: 'Criativos',
};

const USAGE_LABELS: Record<UsageRights, string> = {
    '30': '30 dias',
    '90': '90 dias',
    '365': '1 ano',
    perpetual: 'Perpétuo',
};

/** Rótulo de campo com ícone de ajuda (tooltip). */
function FieldLabelTip({ text, tip }: { text: string; tip: string }) {
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
            <span>{text}</span>
            <Tooltip title={tip} arrow placement="top">
                <Box
                    component="span"
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        cursor: 'help',
                        verticalAlign: 'middle',
                        lineHeight: 0,
                    }}
                    aria-label={tip}
                >
                    <InfoIcon sx={{ fontSize: 17, color: 'text.secondary', opacity: 0.85 }} />
                </Box>
            </Tooltip>
        </Box>
    );
}

function ControlLabelWithTip({ text, tip }: { text: string; tip: string }) {
    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <span>{text}</span>
            <Tooltip title={tip} arrow placement="top">
                <Box component="span" sx={{ display: 'inline-flex', cursor: 'help', lineHeight: 0 }} aria-label={tip}>
                    <InfoIcon sx={{ fontSize: 17, color: 'text.secondary', opacity: 0.85 }} />
                </Box>
            </Tooltip>
        </Box>
    );
}

/** Recomendações quando o formato é pagamento por view (bônus / mín. / máx. por conteúdo). */
const BUDGET_VIEW_RECOMMENDATION_ROWS: ReadonlyArray<{
    tipo: string;
    bonus: string;
    min: string;
    max: string;
}> = [
    { tipo: 'Objetivo de vendas', bonus: 'R$ 25–75', min: 'R$ 50', max: 'R$ 2.000' },
    { tipo: 'Objetivo de views', bonus: 'R$ 15–50', min: 'R$ 30', max: 'R$ 1.000' },
    { tipo: 'Objetivo de branding', bonus: 'R$ 20–50', min: 'R$ 100', max: 'R$ 3.000' },
    { tipo: 'Nichos B2B', bonus: 'R$ 25–50', min: 'R$ 100', max: 'R$ 5.000' },
    { tipo: 'Nichos B2C', bonus: 'R$ 10–25', min: 'R$ 30', max: 'R$ 2.500' },
    { tipo: 'Cortes', bonus: 'R$ 8–20', min: 'R$ 5', max: 'R$ 3.000' },
    { tipo: 'Post no X', bonus: 'R$ 8–20', min: 'R$ 5', max: 'R$ 1.500' },
    { tipo: 'Post no Instagram Reels', bonus: 'R$ 20–100', min: 'R$ 50', max: 'R$ 3.000' },
    { tipo: 'Post no TikTok', bonus: 'R$ 10–50', min: 'R$ 5', max: 'R$ 3.000' },
    { tipo: 'Post no YouTube Shorts', bonus: 'R$ 10–50', min: 'R$ 5', max: 'R$ 3.000' },
    { tipo: 'Post no YouTube Normal', bonus: 'R$ 100–500', min: 'R$ 500', max: 'R$ 10.000' },
];

/** Recomendações quando o formato é pagamento por conteúdo (valor fixo + quantidade sugerida). */
const BUDGET_PER_CONTENT_RECOMMENDATION_ROWS: ReadonlyArray<{
    tipo: string;
    valor: string;
    maxConteudos: string;
}> = [
    { tipo: 'Objetivo de vendas', valor: 'R$ 200–1.000', maxConteudos: '3–6' },
    { tipo: 'Objetivo de views', valor: 'R$ 50–500', maxConteudos: '2–10' },
    { tipo: 'Objetivo de branding', valor: 'R$ 400–3.000', maxConteudos: '4–20' },
    { tipo: 'Apenas vídeo (sem post)', valor: 'R$ 50–400', maxConteudos: '2–5' },
    { tipo: 'Nichos B2B', valor: 'R$ 200–1.000', maxConteudos: '2–6' },
    { tipo: 'Nichos B2C', valor: 'R$ 50–500', maxConteudos: '2–10' },
    { tipo: 'Cortes', valor: 'R$ 5–30', maxConteudos: '10–50' },
    { tipo: 'Post no X', valor: 'R$ 10–20', maxConteudos: '2–10' },
    { tipo: 'Post no Instagram Reels', valor: 'R$ 100–1.000', maxConteudos: '2–20' },
    { tipo: 'Post no Instagram Stories', valor: 'R$ 20–400', maxConteudos: '5–50' },
    { tipo: 'Post no TikTok', valor: 'R$ 10–400', maxConteudos: '5–20' },
    { tipo: 'Post no YouTube Shorts', valor: 'R$ 10–400', maxConteudos: '5–20' },
    { tipo: 'Post no YouTube Normal', valor: 'R$ 500–5.000', maxConteudos: '1–3' },
];

/** Destaca linhas da tabela alinhadas às plataformas/formatos escolhidos. */
function budgetRecommendationRowMatchesSelection(
    tipo: string,
    platforms: Record<PlatformKey, boolean>,
    pf: PlatformFormatsState
): boolean {
    if (tipo === 'Post no Instagram Stories') return platforms.instagram && pf.instagram.includes('ig_stories');
    if (tipo === 'Post no Instagram Reels') return platforms.instagram && pf.instagram.includes('ig_reels_collab');
    if (tipo === 'Post no TikTok') return platforms.tiktok && (pf.tiktok.includes('tt_video') || pf.tiktok.includes('tt_live'));
    if (tipo === 'Post no X') return platforms.twitter && (pf.twitter.includes('x_post') || pf.twitter.includes('x_thread'));
    if (tipo === 'Post no YouTube Shorts') return platforms.youtube && pf.youtube.includes('yt_shorts');
    if (tipo === 'Post no YouTube Normal') return platforms.youtube && pf.youtube.includes('yt_long');
    if (tipo === 'Apenas vídeo (sem post)') return platforms.short_video;
    return false;
}

function BudgetValueRecommendations({
    paymentFormat,
    selection,
}: {
    paymentFormat: PaymentFormat;
    selection: { platforms: Record<PlatformKey, boolean>; platformFormats: PlatformFormatsState };
}) {
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    const isPerView = paymentFormat === 'per_view';
    const { platforms: selPlat, platformFormats: selPf } = selection;

    return (
        <Box>
            <Button
                type="button"
                variant="text"
                onClick={() => setOpen((o) => !o)}
                startIcon={<InfoIcon sx={{ fontSize: 20 }} />}
                endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    color: 'primary.main',
                    px: 0,
                    py: 0.5,
                    minWidth: 0,
                    justifyContent: 'flex-start',
                }}
            >
                Ver recomendações de valores
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, pl: 0.25 }}>
                {isPerView
                    ? 'Referência para pagamento por view (bônus por 1k views e faixas de pagamento).'
                    : 'Referência para pagamento por conteúdo (valor por peça e quantidade sugerida).'}
            </Typography>
            <Collapse in={open}>
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        mt: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'auto',
                        maxHeight: { xs: 320, sm: 'none' },
                    }}
                >
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow
                                sx={{
                                    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
                                }}
                            >
                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Tipo</TableCell>
                                {isPerView ? (
                                    <>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Bônus/1k views</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Pag. mínimo</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Pag. máximo/conteúdo</TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Valor por conteúdo</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Máx. conteúdos sugerido</TableCell>
                                    </>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isPerView
                                ? BUDGET_VIEW_RECOMMENDATION_ROWS.map((row, i) => (
                                      <TableRow
                                          key={row.tipo}
                                          sx={{
                                              bgcolor: budgetRecommendationRowMatchesSelection(row.tipo, selPlat, selPf)
                                                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.1)
                                                  : i % 2 === 1
                                                    ? alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.03)
                                                    : 'transparent',
                                              fontWeight: budgetRecommendationRowMatchesSelection(row.tipo, selPlat, selPf)
                                                  ? 700
                                                  : 400,
                                          }}
                                      >
                                          <TableCell sx={{ fontSize: 13 }}>{row.tipo}</TableCell>
                                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.bonus}</TableCell>
                                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.min}</TableCell>
                                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.max}</TableCell>
                                      </TableRow>
                                  ))
                                : BUDGET_PER_CONTENT_RECOMMENDATION_ROWS.map((row, i) => (
                                      <TableRow
                                          key={row.tipo}
                                          sx={{
                                              bgcolor: budgetRecommendationRowMatchesSelection(row.tipo, selPlat, selPf)
                                                  ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.1)
                                                  : i % 2 === 1
                                                    ? alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.03)
                                                    : 'transparent',
                                              fontWeight: budgetRecommendationRowMatchesSelection(row.tipo, selPlat, selPf)
                                                  ? 700
                                                  : 400,
                                          }}
                                      >
                                          <TableCell sx={{ fontSize: 13 }}>{row.tipo}</TableCell>
                                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.valor}</TableCell>
                                          <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.maxConteudos}</TableCell>
                                      </TableRow>
                                  ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, lineHeight: 1.5 }}>
                    * Valores de referência. Ajuste conforme o tamanho da audiência e a complexidade do conteúdo.
                </Typography>
            </Collapse>
        </Box>
    );
}

function brandDisplayName(account: Account | null): string {
    const n = [account?.first_name, account?.last_name].filter(Boolean).join(' ').trim();
    return n || 'Sua marca';
}

/**
 * Valor monetário digitado (pt-BR): milhares com ponto, decimais com vírgula.
 * Ex.: "1.500,00" → 1500, "500" → 500, "10,5" → 10.5, "1.50" (sem vírgula) → 1.5
 */
function parseMoney(s: string): number {
    let t = s.replace(/\s/g, '').trim();
    if (!t) return NaN;

    if (t.includes(',')) {
        t = t.replace(/\./g, '').replace(',', '.');
    } else {
        const dots = (t.match(/\./g) || []).length;
        if (dots > 1) {
            t = t.replace(/\./g, '');
        } else if (dots === 1) {
            const [intPart, fracPart] = t.split('.');
            if (/^\d+$/.test(intPart) && /^\d+$/.test(fracPart) && fracPart.length === 3) {
                t = intPart + fracPart;
            }
        }
    }

    const n = parseFloat(t);
    return Number.isFinite(n) ? n : NaN;
}

function coerceBudgetTotalCentsFromApi(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.round(v));
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        if (Number.isFinite(n)) return Math.max(0, Math.round(n));
    }
    if (v != null && typeof v === 'object' && typeof (v as { toString?: () => string }).toString === 'function') {
        const n = Number(String(v));
        if (Number.isFinite(n)) return Math.max(0, Math.round(n));
    }
    return 0;
}

function formatDateForInput(d: unknown): string {
    if (d == null) return '';
    const date = new Date(d as string | number | Date);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

function centsToReaisInput(cents: number | undefined): string {
    if (cents == null || !Number.isFinite(cents)) return '';
    return (cents / 100).toFixed(2).replace('.', ',');
}

function formatBrlFromCents(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dedupeStr<T extends string>(arr: T[]): T[] {
    return [...new Set(arr)];
}

/** Melhor esforço ao reabrir rascunho: deduz formatos a partir de deliverables legados. */
function inferFormatsFromDeliverables(
    deliverables: string[],
    platforms: Record<PlatformKey, boolean>
): PlatformFormatsState {
    const blob = deliverables.join(' ').toLowerCase();
    const pf: PlatformFormatsState = {
        instagram: [],
        tiktok: [],
        youtube: [],
        twitter: [],
    };
    if (platforms.instagram) {
        if (blob.includes('stories')) pf.instagram.push('ig_stories');
        if (blob.includes('collab') || blob.includes('reels')) pf.instagram.push('ig_reels_collab');
        if (pf.instagram.length === 0) pf.instagram.push('ig_reels_collab');
    }
    if (platforms.youtube) {
        if (blob.includes('shorts')) pf.youtube.push('yt_shorts');
        if (blob.includes('longo') || blob.includes('normal') || (blob.includes('youtube') && !blob.includes('shorts'))) {
            if (!blob.includes('shorts')) pf.youtube.push('yt_long');
        }
        if (pf.youtube.length === 0) pf.youtube.push('yt_shorts');
    }
    if (platforms.tiktok) {
        if (blob.includes('live')) pf.tiktok.push('tt_live');
        if (blob.includes('tiktok') || pf.tiktok.length === 0) pf.tiktok.push('tt_video');
        pf.tiktok = dedupeStr(pf.tiktok);
    }
    if (platforms.twitter) {
        if (blob.includes('thread')) pf.twitter.push('x_thread');
        if (blob.includes('post') || blob.includes(' x') || pf.twitter.length === 0) pf.twitter.push('x_post');
        pf.twitter = dedupeStr(pf.twitter);
    }
    return pf;
}

/** Reidrata o assistente a partir de um documento de campanha (rascunho) salvo na API. */
function campaignToWizardState(c: Record<string, unknown>): WizardState {
    const category = typeof c.category === 'string' ? c.category : '';
    const objectiveMatch = OBJECTIVES.find((o) => o.label === category);
    const objective: Objective = objectiveMatch ? objectiveMatch.id : '';

    const nicheList = Array.isArray(c.niches) ? (c.niches as string[]) : [];
    const platforms: Record<PlatformKey, boolean> = {
        instagram: nicheList.includes('instagram'),
        tiktok: nicheList.includes('tiktok'),
        youtube: nicheList.includes('youtube'),
        twitter: nicheList.includes('twitter'),
        short_video: nicheList.includes('short_video'),
    };

    const deliverables = Array.isArray(c.deliverables) ? (c.deliverables as string[]) : [];
    const dBlob = deliverables.join(' ').toLowerCase();
    if (!Object.values(platforms).some(Boolean)) {
        if (dBlob.includes('reels') || dBlob.includes('instagram')) platforms.instagram = true;
        else if (dBlob.includes('tiktok')) platforms.tiktok = true;
        else if (dBlob.includes('youtube')) platforms.youtube = true;
        else if (dBlob.includes('post') && (dBlob.includes('x') || dBlob.includes('twitter'))) platforms.twitter = true;
    }
    if (!Object.values(platforms).some(Boolean)) {
        platforms.instagram = true;
    }

    const platformsSingle = normalizeSinglePlatform(platforms);

    const slotsUnlimited = c.slots_unlimited === true;
    const slotsNum = typeof c.slots === 'number' ? c.slots : parseInt(String(c.slots || '5'), 10) || 5;

    const paymentType = typeof c.payment_type === 'string' ? c.payment_type : '';
    const paymentFormat: PaymentFormat = paymentType === 'per_views' ? 'per_view' : 'per_content';

    const bpc = typeof c.budget_per_creator === 'number' ? c.budget_per_creator : 0;
    const bp1k = typeof c.budget_per_1000_views === 'number' ? c.budget_per_1000_views : 0;

    const contentDeadline = formatDateForInput(c.content_deadline);
    const applicationDeadline = formatDateForInput(c.application_deadline);
    const startDate = formatDateForInput(c.start_date);

    const platformFormats = inferFormatsFromDeliverables(deliverables, platformsSingle);

    const btc = coerceBudgetTotalCentsFromApi((c as { budget_total_cents?: unknown }).budget_total_cents);

    return {
        ...INITIAL,
        title: typeof c.title === 'string' ? c.title : '',
        objective,
        startDate,
        endDate: contentDeadline,
        noEndDate: !contentDeadline,
        budgetTotalReais: btc > 0 ? centsToReaisInput(btc) : '',
        slots: String(slotsUnlimited ? 1 : Math.max(1, slotsNum)),
        slotsUnlimited,
        platforms: platformsSingle,
        platformFormats,
        paymentFormat,
        valuePerContentReais: paymentFormat === 'per_content' ? centsToReaisInput(bpc) : '',
        viewBonus1000: paymentFormat === 'per_view' ? centsToReaisInput(bp1k) : '',
        viewPayMin: '',
        viewPayMax: '',
        viewPayMaxUnlimited: false,
        applicationDeadline,
        contentDeadline,
        briefing: typeof c.briefing === 'string' ? c.briefing : '',
        campaignImages: Array.isArray(c.images) ? (c.images as string[]) : [],
        productShipping: c.includes_product === true,
        hydratedFromCampaign: true,
    };
}

function anyPlatform(p: Record<PlatformKey, boolean>): boolean {
    return (Object.keys(p) as PlatformKey[]).some((k) => p[k]);
}

/** Uma única plataforma por campanha — se várias vierem true, mantém a primeira na ordem abaixo. */
function normalizeSinglePlatform(p: Record<PlatformKey, boolean>): Record<PlatformKey, boolean> {
    const order: PlatformKey[] = ['instagram', 'tiktok', 'youtube', 'twitter', 'short_video'];
    const active = order.filter((k) => p[k]);
    if (active.length <= 1) return { ...p };
    const keep = active[0];
    return {
        instagram: keep === 'instagram',
        tiktok: keep === 'tiktok',
        youtube: keep === 'youtube',
        twitter: keep === 'twitter',
        short_video: keep === 'short_video',
    };
}

function buildDeliverables(s: WizardState): string[] {
    const d: string[] = [];
    if (s.platforms.instagram) {
        for (const id of s.platformFormats.instagram) {
            if (id === 'ig_stories') d.push('1 Stories Instagram');
            if (id === 'ig_reels_collab') d.push('1 Reels em Collab');
        }
    }
    if (s.platforms.tiktok) {
        for (const id of s.platformFormats.tiktok) {
            if (id === 'tt_video') d.push('1 TikTok');
            if (id === 'tt_live') d.push('1 Live TikTok');
        }
    }
    if (s.platforms.youtube) {
        for (const id of s.platformFormats.youtube) {
            if (id === 'yt_shorts') d.push('1 YouTube Shorts');
            if (id === 'yt_long') d.push('1 Vídeo longo YouTube');
        }
    }
    if (s.platforms.twitter) {
        for (const id of s.platformFormats.twitter) {
            if (id === 'x_post') d.push('1 Post X');
            if (id === 'x_thread') d.push('1 Thread X');
        }
    }
    if (s.platforms.short_video) d.push('1 Vídeo');
    return d;
}

function inferContentType(s: WizardState): 'ugc' | 'reels' | 'tiktok' | 'post_feed' | 'stories' | 'outro' {
    const p = s.platforms;
    const onlyShort = p.short_video && !p.instagram && !p.tiktok && !p.youtube && !p.twitter;
    if (onlyShort) return 'outro';
    if (p.tiktok && s.platformFormats.tiktok.length > 0 && !p.instagram && !p.youtube) return 'tiktok';
    if (p.instagram && s.platformFormats.instagram.length > 0) {
        const ig = s.platformFormats.instagram;
        if (ig.includes('ig_stories') && !ig.includes('ig_reels_collab')) return 'stories';
        return 'reels';
    }
    if (p.youtube && s.platformFormats.youtube.length > 0) return 'outro';
    if (p.twitter && s.platformFormats.twitter.length > 0) return 'post_feed';
    if (p.tiktok) return 'tiktok';
    if (p.instagram) return 'reels';
    if (p.youtube || p.short_video) return 'outro';
    return 'ugc';
}

function buildPayload(s: WizardState, account: Account | null): Record<string, unknown> {
    const brandName = brandDisplayName(account);
    const brandLogo = account?.brand_logo_url?.trim() || '';

    const useBriefingVerbatim =
        s.hydratedFromCampaign && s.briefing.includes('## Direitos de uso');

    let briefing: string;
    if (useBriefingVerbatim) {
        briefing = s.briefing.trim();
    } else {
        briefing = s.briefing.trim();
        if (s.requireContentReview) {
            briefing = `**Revisão obrigatória:** aprovar conteúdo antes da postagem.\n\n${briefing}`;
        }
        if (s.requireApplication) {
            briefing = `**Candidatura obrigatória:** creators passam por aprovação antes de produzir.\n\n${briefing}`;
        }
        if (s.scriptIdeas.trim()) {
            briefing += `\n\n## Ideias de roteiro\n${s.scriptIdeas.trim()}`;
        }
        if (s.promotionUrl.trim() || s.promotionCoupon.trim()) {
            briefing += `\n\n## Divulgação`;
            if (s.promotionUrl.trim()) briefing += `\nURL: ${s.promotionUrl.trim()}`;
            if (s.promotionCoupon.trim()) briefing += `\nCupom: ${s.promotionCoupon.trim()}`;
        }
        briefing += `\n\n## Direitos de uso\n${USAGE_LABELS[s.usageRights]} — incluso na campanha.`;
        briefing += `\n\n## Postagem\n${
            s.postingWhen === 'on_approval'
                ? 'Data de postagem definida na aprovação do conteúdo.'
                : `Postar até / em: ${s.specificPostDate || '(definir)'}`
        }`;
        if (s.hashtags.trim()) briefing += `\n\n## Hashtags obrigatórias\n${s.hashtags.trim()}`;
        if (s.forbiddenTerms.trim()) briefing += `\n\n## Termos proibidos\n${s.forbiddenTerms.trim()}`;
        if (s.restrictionsText.trim()) briefing += `\n\n## Restrições específicas\n${s.restrictionsText.trim()}`;
        if (s.referenceVideoUrls.trim()) briefing += `\n\n## Vídeos de referência\n${s.referenceVideoUrls.trim()}`;
        if (s.visibility === 'community') {
            briefing += `\n\n**Visibilidade:** campanha vinculada a comunidade (configurar na plataforma).`;
        }
    }

    const objectiveLabel = s.objective ? OBJECTIVE_LABELS[s.objective] : 'Campanha';
    const description = `${s.title.trim()} — ${objectiveLabel}.`;

    const deliverables = buildDeliverables(s);
    const slots = s.slotsUnlimited ? 1 : Math.max(1, parseInt(s.slots, 10) || 1);

    const payload: Record<string, unknown> = {
        brand_name: brandName,
        brand_logo: brandLogo || undefined,
        title: s.title.trim(),
        description,
        briefing,
        content_type: inferContentType(s),
        content_usage: 'redes_marca',
        category: objectiveLabel,
        niches: (Object.keys(s.platforms) as PlatformKey[]).filter((k) => s.platforms[k]),
        slots,
        slots_unlimited: s.slotsUnlimited,
        deliverables,
        includes_product: s.productShipping,
        product_description: s.productShipping ? 'Marca envia produto após aprovação do creator.' : undefined,
        images: s.campaignImages,
        application_deadline: s.applicationDeadline || undefined,
        content_deadline: s.contentDeadline || (!s.noEndDate ? s.endDate : undefined) || undefined,
        start_date: s.startDate || undefined,
        filters: {},
        status: 'draft',
        requires_invoice: false,
    };

    const budgetTotal = parseMoney(s.budgetTotalReais);
    if (s.budgetTotalReais.trim() && !Number.isNaN(budgetTotal) && budgetTotal > 0) {
        payload.budget_total_cents = Math.round(budgetTotal * 100);
    }

    if (s.paymentFormat === 'per_content') {
        const cents = Math.round(parseMoney(s.valuePerContentReais) * 100);
        payload.budget_per_creator = cents;
        payload.payment_type = 'per_post';
    } else if (s.paymentFormat === 'per_view') {
        const bonus = Math.round(parseMoney(s.viewBonus1000) * 100);
        payload.budget_per_1000_views = bonus;
        payload.payment_type = 'per_views';
        payload.budget_per_creator = 0;
    }

    return payload;
}

/** Rascunho do assistente: garante textos mínimos e remove pagamento inválido. */
function buildDraftPayload(s: WizardState, account: Account | null): Record<string, unknown> {
    const base = buildPayload(s, account);
    const title = s.title.trim() || 'Nova campanha (rascunho)';
    base.title = title;
    if (!s.title.trim()) {
        base.description = 'Rascunho — complete os dados na edição.';
    }
    if (s.briefing.trim().length < 20) {
        base.briefing =
            'Rascunho salvo. Complete o briefing, as regras e o orçamento na edição da campanha.';
    }
    const dels = buildDeliverables(s);
    base.deliverables = dels.length ? dels : ['1 Reels em Collab'];

    const perContent = parseMoney(s.valuePerContentReais);
    if (s.paymentFormat === 'per_content' && (Number.isNaN(perContent) || perContent <= 0)) {
        delete base.budget_per_creator;
        delete base.payment_type;
    }
    const bonus = parseMoney(s.viewBonus1000);
    if (s.paymentFormat === 'per_view' && (Number.isNaN(bonus) || bonus <= 0)) {
        delete base.budget_per_1000_views;
        delete base.payment_type;
        delete base.budget_per_creator;
    }

    const btDraft = parseMoney(s.budgetTotalReais);
    base.budget_total_cents =
        s.budgetTotalReais.trim() && !Number.isNaN(btDraft) && btDraft > 0 ? Math.round(btDraft * 100) : 0;

    base.status = 'draft';
    base.wizard_draft = true;
    return base;
}

const PLATFORM_DISPLAY: Record<PlatformKey, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'X',
    short_video: 'Apenas vídeo',
};

const CONTENT_TYPE_PREVIEW_LABEL: Record<
    ReturnType<typeof inferContentType>,
    string
> = {
    ugc: 'UGC',
    reels: 'Reels',
    tiktok: 'TikTok',
    stories: 'Stories',
    post_feed: 'Post',
    outro: 'Vídeo',
};

function collectFormatLabels(s: WizardState): string[] {
    const out: string[] = [];
    INSTAGRAM_FORMAT_OPTS.forEach(({ id, label }) => {
        if (s.platformFormats.instagram.includes(id)) out.push(label);
    });
    YOUTUBE_FORMAT_OPTS.forEach(({ id, label }) => {
        if (s.platformFormats.youtube.includes(id)) out.push(label);
    });
    TIKTOK_FORMAT_OPTS.forEach(({ id, label }) => {
        if (s.platformFormats.tiktok.includes(id)) out.push(label);
    });
    TWITTER_FORMAT_OPTS.forEach(({ id, label }) => {
        if (s.platformFormats.twitter.includes(id)) out.push(label);
    });
    return out;
}

function briefingPaymentLine(s: WizardState, fmt: (n: number) => string): string {
    if (s.paymentFormat === 'commission') return 'Comissão — temporariamente indisponível';
    if (s.paymentFormat === 'per_view') {
        const b = parseMoney(s.viewBonus1000);
        const bonusPart =
            !Number.isNaN(b) && b > 0 ? `${fmt(b)}/1k views` : 'Bônus por 1k views a definir';
        if (s.viewPayMaxUnlimited) return `${bonusPart} • Sem teto`;
        const max = parseMoney(s.viewPayMax);
        const maxPart = !Number.isNaN(max) && max > 0 ? `Teto ${fmt(max)}` : 'Teto a definir';
        return `${bonusPart} • ${maxPart}`;
    }
    const v = parseMoney(s.valuePerContentReais);
    if (!Number.isNaN(v) && v > 0) return `${fmt(v)} por conteúdo`;
    return 'Valor por conteúdo a definir';
}

function BriefingFullPreviewDialog({
    open,
    onClose,
    s,
    brandName,
}: {
    open: boolean;
    onClose: () => void;
    s: WizardState;
    brandName: string;
}) {
    const theme = useTheme();
    const fmt = (n: number) =>
        n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const budgetN = parseMoney(s.budgetTotalReais);
    const budgetLine =
        s.budgetTotalReais.trim() && !Number.isNaN(budgetN) && budgetN > 0
            ? fmt(budgetN)
            : 'Não informado';

    const objectiveLabel = s.objective ? OBJECTIVE_LABELS[s.objective] : null;
    const ctLabel = CONTENT_TYPE_PREVIEW_LABEL[inferContentType(s)];
    const estiloLine = [objectiveLabel || 'Objetivo a definir', 'UGC', ctLabel].join(', ');

    const activePlats = (Object.keys(s.platforms) as PlatformKey[]).filter((k) => s.platforms[k]);
    const platformName = activePlats.map((k) => PLATFORM_DISPLAY[k]).join(', ') || '—';

    const formatChips = collectFormatLabels(s);
    const deliverableLines = buildDeliverables(s);

    const postingLine =
        s.postingWhen === 'on_approval'
            ? 'A marca define na aprovação'
            : s.specificPostDate
              ? `Postar até ${s.specificPostDate.split('-').reverse().join('/')}`
              : 'Data específica a definir';

    const briefingBody =
        s.briefing.trim() ||
        'Ainda sem texto — complete o passo Briefing para ver o conteúdo aqui.';

    const Section = ({
        k,
        children,
    }: {
        k: string;
        children: React.ReactNode;
    }) => (
        <Box sx={{ py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={800}
                letterSpacing={0.8}
                display="block"
                sx={{ mb: 1 }}
            >
                {k}
            </Typography>
            {children}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            scroll="paper"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: 'min(90vh, 720px)',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <Box
                sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 1.5,
                    flexShrink: 0,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing={1}>
                            PREVIEW
                        </Typography>
                        <Typography variant="h6" fontWeight={800}>
                            Briefing completo
                        </Typography>
                    </Box>
                    <Button
                        type="button"
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={onClose}
                        sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
                    >
                        Voltar
                    </Button>
                </Stack>
            </Box>
            <DialogContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                <Box sx={{ px: 2.5, pb: 3 }}>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                        {s.title.trim() || 'Nome da campanha'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Rascunho
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                        {brandName}
                    </Typography>

                    <Section k="INFORMAÇÕES">
                        <Typography variant="body2" color="text.secondary">
                            Orçamento da campanha
                        </Typography>
                        <Typography variant="body1" fontWeight={700} sx={{ mb: 1.5 }}>
                            {budgetLine}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Estilo
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {estiloLine}
                        </Typography>
                    </Section>

                    <Section k="PAGAMENTO">
                        <Typography variant="body1" fontWeight={700} color="success.main">
                            {briefingPaymentLine(s, fmt)}
                        </Typography>
                    </Section>

                    <Section k="PLATAFORMAS">
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            <Chip label={platformName} size="small" sx={{ fontWeight: 700 }} variant="outlined" />
                        </Stack>
                    </Section>

                    <Section k="ESTILO DO CONTEÚDO">
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {(formatChips.length ? formatChips : deliverableLines.length ? deliverableLines : ['—']).map(
                                (label) => (
                                    <Chip key={label} label={label} size="small" sx={{ fontWeight: 600 }} />
                                )
                            )}
                        </Stack>
                    </Section>

                    <Section k="PÚBLICO-ALVO">
                        <Typography variant="body2" color="text.secondary">
                            Não preenchido neste assistente — ajuste filtros depois na edição da campanha, se precisar.
                        </Typography>
                    </Section>

                    <Section k="CRIADOR DESEJADO">
                        <Typography variant="body2" color="text.secondary">
                            {objectiveLabel
                                ? `Prioridade alinhada ao objetivo: ${objectiveLabel}.`
                                : 'Defina o objetivo no passo Informações para orientar o tipo de creator.'}
                        </Typography>
                    </Section>

                    <Section k="BRIEFING">
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.02),
                                typography: 'body2',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {briefingBody}
                        </Paper>
                    </Section>

                    <Section k="REGRAS">
                        <Typography variant="body2" color="text.secondary">
                            Direito de uso
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 1.5 }}>
                            {USAGE_LABELS[s.usageRights]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Postagem
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {postingLine}
                        </Typography>
                    </Section>

                    <Section k="FLUXO">
                        <Stack spacing={1.25} sx={{ mt: 0.5 }}>
                            {s.requireApplication && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                    <Typography variant="body2" fontWeight={600}>
                                        Aplicação obrigatória
                                    </Typography>
                                </Stack>
                            )}
                            {s.requireContentReview && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                    <Typography variant="body2" fontWeight={600}>
                                        Revisão antes de postar
                                    </Typography>
                                </Stack>
                            )}
                            {!s.requireApplication && !s.requireContentReview && (
                                <Typography variant="body2" color="text.secondary">
                                    Nenhum fluxo obrigatório marcado — revise em Config.
                                </Typography>
                            )}
                        </Stack>
                    </Section>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

function CampaignPreviewCard({
    s,
    brandName,
    onOpenBriefing,
}: {
    s: WizardState;
    brandName: string;
    onOpenBriefing: () => void;
}) {
    const theme = useTheme();
    const perContent = parseMoney(s.valuePerContentReais);
    const fmt = (n: number) =>
        n > 0
            ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : 'R$ 0,00';

    const activePlatforms = (Object.keys(s.platforms) as PlatformKey[]).filter((k) => s.platforms[k]);
    const platformLabel =
        activePlatforms.includes('tiktok') && activePlatforms.length === 1
            ? 'TikTok'
            : activePlatforms.includes('instagram')
              ? 'Instagram'
              : activePlatforms.length
                ? activePlatforms.join(', ')
                : '—';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
                Preview
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1.5 }}>
                Card da campanha
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                <Chip label="Ativo" size="small" color="success" sx={{ fontWeight: 600 }} />
                <Chip label="Rascunho" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                {s.budgetTotalReais && parseMoney(s.budgetTotalReais) > 0 && (
                    <Chip label={fmt(parseMoney(s.budgetTotalReais))} size="small" variant="outlined" />
                )}
            </Stack>
            <Typography variant="subtitle1" fontWeight={800}>
                {s.title.trim() || 'Nome da campanha'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {brandName}
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600} display="block">
                {s.paymentFormat === 'per_view'
                    ? `${fmt(parseMoney(s.viewPayMin))} / ${fmt(parseMoney(s.viewPayMax))} · bônus/1k views`
                    : `${fmt(perContent)}${s.maxContentsPerCreator ? ` · máx. ${s.maxContentsPerCreator} por creator` : ''}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {platformLabel}
            </Typography>
            <Button
                type="button"
                size="small"
                endIcon={<ChevronRightIcon />}
                onClick={onOpenBriefing}
                sx={{
                    mt: 2,
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                }}
            >
                Ver briefing
            </Button>
        </Paper>
    );
}

interface MarcaCampanhaWizardProps {
    open: boolean;
    onClose: () => void;
    /** Quando definido, carrega rascunho existente e salva com PATCH em vez de POST */
    continueCampaignId?: string;
}

export function MarcaCampanhaWizard({ open, onClose, continueCampaignId }: MarcaCampanhaWizardProps) {
    const theme = useTheme();
    const router = useRouter();
    const { account, refreshAccount } = useAccount();
    const [step, setStep] = useState(0);
    const [s, setS] = useState<WizardState>(INITIAL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [confirmExitOpen, setConfirmExitOpen] = useState(false);
    const [activateAfterSaveOpen, setActivateAfterSaveOpen] = useState(false);
    const [savedCampaignIdForActivate, setSavedCampaignIdForActivate] = useState<string | null>(null);
    const [savedBudgetTotalCents, setSavedBudgetTotalCents] = useState(0);
    const [activateLoading, setActivateLoading] = useState(false);
    const [activateError, setActivateError] = useState('');
    const [hydrating, setHydrating] = useState(false);
    const [loadedBaseline, setLoadedBaseline] = useState<WizardState | null>(null);
    const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
    const [briefingPreviewOpen, setBriefingPreviewOpen] = useState(false);

    const brandName = useMemo(() => brandDisplayName(account), [account]);

    useEffect(() => {
        if (!open) return;

        if (!continueCampaignId) {
            setLoadedBaseline(null);
            setEditingCampaignId(null);
            setS(INITIAL);
            setHydrating(false);
            setStep(0);
            setError('');
            setActivateAfterSaveOpen(false);
            setSavedCampaignIdForActivate(null);
            setSavedBudgetTotalCents(0);
            setActivateError('');
            return;
        }

        let cancelled = false;
        setHydrating(true);
        setError('');

        (async () => {
            try {
                const res = await fetch(`/api/campaigns/${continueCampaignId}`);
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok || !data.campaign) {
                    setError(typeof data.error === 'string' ? data.error : 'Não foi possível carregar o rascunho.');
                    setHydrating(false);
                    return;
                }
                const camp = data.campaign as Record<string, unknown>;
                if (camp.status !== 'draft') {
                    setError('Só é possível continuar a configuração de campanhas em rascunho.');
                    setHydrating(false);
                    return;
                }
                const ws = campaignToWizardState(camp);
                setS(ws);
                setLoadedBaseline(structuredClone(ws));
                setEditingCampaignId(String(camp._id ?? continueCampaignId));
                setStep(0);
            } catch {
                if (!cancelled) setError('Erro de conexão ao carregar o rascunho.');
            } finally {
                if (!cancelled) setHydrating(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, continueCampaignId]);

    const isDirty = useMemo(() => {
        const base = loadedBaseline ?? INITIAL;
        return JSON.stringify(s) !== JSON.stringify(base);
    }, [s, loadedBaseline]);

    const resetWizard = useCallback(() => {
        setStep(0);
        setS(INITIAL);
        setLoadedBaseline(null);
        setEditingCampaignId(null);
        setError('');
        setConfirmExitOpen(false);
        setActivateAfterSaveOpen(false);
        setSavedCampaignIdForActivate(null);
        setSavedBudgetTotalCents(0);
        setActivateError('');
        setActivateLoading(false);
    }, []);

    const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
        setS((prev) => ({ ...prev, [key]: value }));
    };

    /** Apenas uma plataforma por campanha (Instagram, TikTok, YouTube, X ou Apenas vídeo). */
    const selectExclusivePlatform = useCallback((key: PlatformKey) => {
        setS((prev) => {
            if (prev.platforms[key]) return prev;
            const platforms: Record<PlatformKey, boolean> = {
                instagram: false,
                tiktok: false,
                youtube: false,
                twitter: false,
                short_video: false,
            };
            platforms[key] = true;
            return {
                ...prev,
                platforms,
                platformFormats: { instagram: [], tiktok: [], youtube: [], twitter: [] },
            };
        });
    }, []);

    const toggleWizardFormat = useCallback((pk: PlatformFormatsKey, id: string) => {
        setS((prev) => {
            const cur = [...prev.platformFormats[pk]] as string[];
            const has = cur.includes(id);
            const next = (has ? cur.filter((x) => x !== id) : [...cur, id]) as PlatformFormatsState[PlatformFormatsKey];
            return {
                ...prev,
                platformFormats: { ...prev.platformFormats, [pk]: next },
            };
        });
    }, []);

    const validateStep = (i: number): string | null => {
        if (i === 0) {
            if (!s.title.trim()) return 'Informe o nome da campanha.';
            if (!s.objective) return 'Selecione um objetivo.';
            if (!s.startDate) return 'Informe a data de início.';
            if (!s.noEndDate && !s.endDate) return 'Informe a data de término ou marque “Sem data de término”.';
        }
        if (i === 1) {
            const total = parseMoney(s.budgetTotalReais);
            if (s.budgetTotalReais.trim() && (Number.isNaN(total) || total < 500)) {
                return 'Orçamento total mínimo de R$ 500 (ou deixe em branco por enquanto).';
            }
            if (!anyPlatform(s.platforms)) return 'Selecione uma plataforma.';
            const pfLabels: Record<PlatformFormatsKey, string> = {
                instagram: 'Instagram',
                tiktok: 'TikTok',
                youtube: 'YouTube',
                twitter: 'X',
            };
            const missingFormats: string[] = [];
            (['instagram', 'tiktok', 'youtube', 'twitter'] as PlatformFormatsKey[]).forEach((k) => {
                if (s.platforms[k] && s.platformFormats[k].length === 0) missingFormats.push(pfLabels[k]);
            });
            if (missingFormats.length === 1) {
                return `Selecione pelo menos um formato em ${missingFormats[0]}.`;
            }
            if (missingFormats.length > 1) {
                return `Selecione pelo menos um formato para: ${missingFormats.join(', ')}.`;
            }
            if (s.paymentFormat === 'per_content') {
                const v = parseMoney(s.valuePerContentReais);
                if (Number.isNaN(v) || v <= 0) return 'Informe o valor por conteúdo.';
            }
            if (s.paymentFormat === 'per_view') {
                const b = parseMoney(s.viewBonus1000);
                if (Number.isNaN(b) || b <= 0) return 'Informe o bônus por 1k views (maior que zero).';
            }
            if (!s.slotsUnlimited) {
                const n = parseInt(s.slots, 10);
                if (Number.isNaN(n) || n < 1) return 'Informe o número de vagas ou marque ilimitado.';
            }
        }
        if (i === 3) {
            if (s.briefing.trim().length < 20) return 'O briefing deve ter pelo menos 20 caracteres.';
        }
        if (i === 4) {
            if (s.postingWhen === 'specific_date' && !s.specificPostDate) return 'Informe a data de postagem ou escolha “Definir na aprovação”.';
        }
        return null;
    };

    const goNext = () => {
        setError('');
        const err = validateStep(step);
        if (err) {
            setError(err);
            return;
        }
        setStep((x) => Math.min(x + 1, STEPS.length - 1));
    };

    const handleRequestClose = useCallback(() => {
        if (loading || hydrating || activateAfterSaveOpen) return;
        if (!isDirty) {
            resetWizard();
            onClose();
            return;
        }
        setConfirmExitOpen(true);
    }, [loading, hydrating, isDirty, onClose, resetWizard, activateAfterSaveOpen]);

    const goBack = () => {
        setError('');
        if (step <= 0) {
            handleRequestClose();
            return;
        }
        setStep((x) => x - 1);
    };

    const discardAndExit = () => {
        setConfirmExitOpen(false);
        resetWizard();
        onClose();
    };

    const saveDraftAndExit = async () => {
        setError('');
        setLoading(true);
        try {
            const built = buildDraftPayload(s, account);
            const payload = { ...built };
            if (editingCampaignId) delete payload.wizard_draft;

            const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns';
            const method = editingCampaignId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Erro ao salvar rascunho.');
                return;
            }
            const id = editingCampaignId || data.campaign?._id;
            setConfirmExitOpen(false);
            resetWizard();
            if (id) router.push(`/marca/campanhas/${id}`);
            onClose();
        } catch {
            setError('Erro de conexão ao salvar rascunho.');
        } finally {
            setLoading(false);
        }
    };

    const finishAfterSaveWithoutActivate = useCallback(() => {
        const id = savedCampaignIdForActivate;
        if (!id) return;
        setActivateAfterSaveOpen(false);
        setSavedCampaignIdForActivate(null);
        setSavedBudgetTotalCents(0);
        setActivateError('');
        resetWizard();
        router.push(`/marca/campanhas/${id}`);
        onClose();
    }, [savedCampaignIdForActivate, resetWizard, router, onClose]);

    const confirmActivateCampaign = useCallback(async () => {
        const id = savedCampaignIdForActivate;
        if (!id) return;
        setActivateLoading(true);
        setActivateError('');
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' }),
            });
            const data = await res.json();
            if (!res.ok) {
                setActivateError(typeof data.error === 'string' ? data.error : 'Não foi possível ativar.');
                return;
            }
            await refreshAccount();
            setActivateAfterSaveOpen(false);
            setSavedCampaignIdForActivate(null);
            setSavedBudgetTotalCents(0);
            resetWizard();
            router.push(`/marca/campanhas/${id}`);
            onClose();
        } catch {
            setActivateError('Erro de conexão.');
        } finally {
            setActivateLoading(false);
        }
    }, [savedCampaignIdForActivate, refreshAccount, resetWizard, router, onClose]);

    /** Campanha já está salva em rascunho; leva à recarga de saldo (modal no layout). */
    const goToAddSaldoKeepingDraft = useCallback(() => {
        setActivateAfterSaveOpen(false);
        setSavedCampaignIdForActivate(null);
        setSavedBudgetTotalCents(0);
        setActivateError('');
        resetWizard();
        onClose();
        router.push('/marca/inicio?adicionarSaldo=1');
    }, [resetWizard, router, onClose]);

    const handleSubmit = async () => {
        setError('');
        for (let i = 0; i < STEPS.length; i++) {
            const stepErr = validateStep(i);
            if (stepErr) {
                setError(stepErr);
                return;
            }
        }
        const bud = parseMoney(s.budgetTotalReais);
        if (!s.budgetTotalReais.trim() || Number.isNaN(bud) || bud < 500) {
            setError(
                'Informe o budget total (mínimo R$ 500). Esse valor será retido da sua carteira ao ativar a campanha.',
            );
            return;
        }
        setLoading(true);
        try {
            const payload = buildPayload(s, account);
            const url = editingCampaignId ? `/api/campaigns/${editingCampaignId}` : '/api/campaigns';
            const method = editingCampaignId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(typeof data.error === 'string' ? data.error : 'Erro ao salvar campanha.');
                return;
            }
            const id = editingCampaignId || (data.campaign?._id != null ? String(data.campaign._id) : null);
            if (!id) {
                setError('Campanha salva, mas não foi possível obter o identificador.');
                return;
            }
            const camp = data.campaign as { budget_total_cents?: number } | undefined;
            const centsFromApi = typeof camp?.budget_total_cents === 'number' ? camp.budget_total_cents : NaN;
            const cents = Number.isFinite(centsFromApi) ? centsFromApi : Math.round(bud * 100);
            setSavedCampaignIdForActivate(id);
            setSavedBudgetTotalCents(cents);
            setActivateError('');
            setActivateAfterSaveOpen(true);
        } catch {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    async function uploadAsset(file: File) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('type', 'image');
            formData.append('files', file);
            const res = await fetch('/api/posts/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha no upload');
            const url = data.urls?.[0];
            if (url) update('campaignImages', [...s.campaignImages, url]);
        } catch {
            setError('Não foi possível enviar o arquivo.');
        } finally {
            setUploading(false);
        }
    }

    const isLast = step === STEPS.length - 1;

    const loadFailed = Boolean(continueCampaignId && !hydrating && !loadedBaseline && error);

    const stepContent = (() => {
        switch (step) {
            case 0:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Informações
                        </Typography>
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Nome da campanha"
                                    tip="Nome que identifica a campanha na sua lista e para os criadores. Pode incluir o objetivo no título para ficar mais claro."
                                />
                            }
                            placeholder="Nome da campanha | [Objetivo]"
                            value={s.title}
                            onChange={(e) => update('title', e.target.value)}
                            fullWidth
                            required
                        />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Objetivo
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                                    gap: 1.5,
                                }}
                            >
                                {OBJECTIVES.map(({ id, label, Icon }) => {
                                    const selected = s.objective === id;
                                    return (
                                        <Box key={id} sx={{ position: 'relative' }}>
                                            <Paper
                                                component="div"
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => update('objective', id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        update('objective', id);
                                                    }
                                                }}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    pr: 5,
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    border: '2px solid',
                                                    borderColor: selected ? 'primary.main' : 'divider',
                                                    bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <Icon sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                                                <Typography variant="body2" fontWeight={700}>
                                                    {label}
                                                </Typography>
                                            </Paper>
                                            <IconButton
                                                size="small"
                                                sx={{ position: 'absolute', top: 4, right: 4 }}
                                                aria-label="Sobre este objetivo"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <InfoIcon fontSize="small" color="action" />
                                            </IconButton>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Prazo da campanha
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Início"
                                            tip="Data a partir da qual a campanha vale para planejamento e comunicação com criadores."
                                        />
                                    }
                                    type="date"
                                    value={s.startDate}
                                    onChange={(e) => update('startDate', e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Término"
                                            tip="Data final da campanha no calendário. Se marcar “Sem data de término”, este campo fica desativado."
                                        />
                                    }
                                    type="date"
                                    value={s.endDate}
                                    onChange={(e) => update('endDate', e.target.value)}
                                    fullWidth
                                    disabled={s.noEndDate}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={s.noEndDate}
                                        onChange={(_, c) => {
                                            update('noEndDate', c);
                                            if (c) update('endDate', '');
                                        }}
                                    />
                                }
                                label={
                                    <ControlLabelWithTip
                                        text="Sem data de término"
                                        tip="Use quando a campanha não tiver fim fixo; o campo de término é desconsiderado."
                                    />
                                }
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    </Stack>
                );
            case 1:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Budget
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label={
                                    <FieldLabelTip
                                        text="Budget total"
                                        tip="Valor total planejado para a campanha (referência para você). Se informar valor, sugerimos no mínimo R$ 500; pode deixar em branco em rascunho."
                                    />
                                }
                                placeholder="0,00"
                                value={s.budgetTotalReais}
                                onChange={(e) => update('budgetTotalReais', e.target.value)}
                                fullWidth
                                InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography> }}
                                helperText="Mínimo de R$ 500"
                            />
                            <TextField
                                label={
                                    <FieldLabelTip
                                        text="Vagas"
                                        tip="Quantos creators podem participar ao mesmo tempo. Com “Vagas ilimitadas”, este número não se aplica."
                                    />
                                }
                                value={s.slots}
                                onChange={(e) => update('slots', e.target.value)}
                                fullWidth
                                disabled={s.slotsUnlimited}
                                helperText="Deixe vazio para ilimitado"
                            />
                        </Stack>
                        <FormControlLabel
                            control={
                                <Checkbox checked={s.slotsUnlimited} onChange={(_, c) => update('slotsUnlimited', c)} />
                            }
                            label={
                                <ControlLabelWithTip
                                    text="Vagas ilimitadas"
                                    tip="Quando ativo, não há limite fixo de creators; candidaturas podem seguir abertas conforme a regra da campanha."
                                />
                            }
                        />
                        
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                                Plataformas
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                                Escolha apenas uma por campanha. Para mais de uma rede (ex.: Instagram e TikTok), crie uma
                                campanha para cada.
                            </Typography>
                            <Stack spacing={1.5}>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {(
                                        [
                                            ['instagram', 'Instagram', InstagramIcon],
                                            ['tiktok', 'TikTok', TikTokIcon],
                                            ['youtube', 'YouTube', YouTubeIcon],
                                            ['twitter', 'X', TwitterIcon],
                                        ] as const
                                    ).map(([key, label, IconPl]) => (
                                        <Chip
                                            key={key}
                                            icon={<IconPl sx={{ '&&': { fontSize: 18 } }} />}
                                            label={label}
                                            onClick={() => selectExclusivePlatform(key)}
                                            color={s.platforms[key] ? 'primary' : 'default'}
                                            variant={s.platforms[key] ? 'filled' : 'outlined'}
                                            sx={{ fontWeight: 600 }}
                                        />
                                    ))}
                                </Stack>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    <Chip
                                        icon={<ShortVideoIcon sx={{ '&&': { fontSize: 18 } }} />}
                                        label="Apenas vídeo"
                                        onClick={() => selectExclusivePlatform('short_video')}
                                        color={s.platforms.short_video ? 'primary' : 'default'}
                                        variant={s.platforms.short_video ? 'filled' : 'outlined'}
                                        sx={{ fontWeight: 600 }}
                                    />
                                </Stack>
                            </Stack>

                            {s.platforms.instagram && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Formatos do Instagram{' '}
                                        <Typography component="span" color="error.main">
                                            *
                                        </Typography>
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {INSTAGRAM_FORMAT_OPTS.map(({ id, label }) => {
                                            const selected = s.platformFormats.instagram.includes(id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={label}
                                                    onClick={() => toggleWizardFormat('instagram', id)}
                                                    color={selected ? 'primary' : 'default'}
                                                    variant={selected ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {s.platforms.instagram && s.platformFormats.instagram.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                                            Selecione pelo menos um formato
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {s.platforms.tiktok && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Formatos do TikTok{' '}
                                        <Typography component="span" color="error.main">
                                            *
                                        </Typography>
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {TIKTOK_FORMAT_OPTS.map(({ id, label }) => {
                                            const selected = s.platformFormats.tiktok.includes(id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={label}
                                                    onClick={() => toggleWizardFormat('tiktok', id)}
                                                    color={selected ? 'primary' : 'default'}
                                                    variant={selected ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {s.platformFormats.tiktok.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                                            Selecione pelo menos um formato
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {s.platforms.youtube && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Formatos do YouTube{' '}
                                        <Typography component="span" color="error.main">
                                            *
                                        </Typography>
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {YOUTUBE_FORMAT_OPTS.map(({ id, label }) => {
                                            const selected = s.platformFormats.youtube.includes(id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={label}
                                                    onClick={() => toggleWizardFormat('youtube', id)}
                                                    color={selected ? 'primary' : 'default'}
                                                    variant={selected ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {s.platformFormats.youtube.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                                            Selecione pelo menos um formato
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {s.platforms.twitter && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                        Formatos do X{' '}
                                        <Typography component="span" color="error.main">
                                            *
                                        </Typography>
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {TWITTER_FORMAT_OPTS.map(({ id, label }) => {
                                            const selected = s.platformFormats.twitter.includes(id);
                                            return (
                                                <Chip
                                                    key={id}
                                                    label={label}
                                                    onClick={() => toggleWizardFormat('twitter', id)}
                                                    color={selected ? 'primary' : 'default'}
                                                    variant={selected ? 'filled' : 'outlined'}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                    {s.platformFormats.twitter.length === 0 && (
                                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75 }}>
                                            Selecione pelo menos um formato
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Formato de pagamento
                            </Typography>
                            <Stack spacing={1.5}>
                                {(
                                    [
                                        {
                                            id: 'per_content' as const,
                                            label: 'Pagar por conteúdo',
                                            sub: 'Valor fixo por entrega',
                                            Icon: ContentPayIcon,
                                            disabled: false,
                                        },
                                        {
                                            id: 'per_view' as const,
                                            label: 'Pagar por view',
                                            sub: 'Baseado em performance',
                                            Icon: ViewPayIcon,
                                            disabled: false,
                                        },
                                        {
                                            id: 'commission' as const,
                                            label: 'Pagar por comissão',
                                            sub: 'Temporariamente indisponível',
                                            Icon: CommissionIcon,
                                            disabled: true,
                                        },
                                    ] as const
                                ).map(({ id, label, sub, Icon: Pi, disabled }) => {
                                    const selected = s.paymentFormat === id;
                                    return (
                                        <Paper
                                            key={id}
                                            component="button"
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => !disabled && update('paymentFormat', id)}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 2,
                                                width: '100%',
                                                textAlign: 'left',
                                                cursor: disabled ? 'not-allowed' : 'pointer',
                                                opacity: disabled ? 0.55 : 1,
                                                border: '2px solid',
                                                borderColor: selected && !disabled ? 'primary.main' : 'divider',
                                                borderRadius: 2,
                                                bgcolor: selected && !disabled ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                                            }}
                                        >
                                            <Pi color="primary" />
                                            <Box>
                                                <Typography fontWeight={700}>{label}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {sub}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>
                        {(s.paymentFormat === 'per_content' || s.paymentFormat === 'per_view') && (
                            <BudgetValueRecommendations
                                paymentFormat={s.paymentFormat}
                                selection={{ platforms: s.platforms, platformFormats: s.platformFormats }}
                            />
                        )}
                        {s.paymentFormat === 'per_content' && (
                            <Stack spacing={2}>
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Valor por conteúdo (R$)"
                                            tip="Valor fixo que cada creator recebe por entrega de conteúdo aprovada neste modelo de pagamento."
                                        />
                                    }
                                    value={s.valuePerContentReais}
                                    onChange={(e) => update('valuePerContentReais', e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Máx. conteúdos por creator"
                                            tip="Quantidade máxima de conteúdos que cada criador pode produzir para esta campanha."
                                        />
                                    }
                                    placeholder="Ilimitado"
                                    value={s.maxContentsPerCreator}
                                    onChange={(e) => update('maxContentsPerCreator', e.target.value)}
                                    fullWidth
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={s.perCreatorIndividual}
                                            onChange={(_, c) => update('perCreatorIndividual', c)}
                                        />
                                    }
                                    label={
                                        <ControlLabelWithTip
                                            text="Selecionar individualmente para cada creator"
                                            tip="Permite definir valores ou condições diferentes por creator depois, em vez de um único valor para todos."
                                        />
                                    }
                                />
                            </Stack>
                        )}
                        {s.paymentFormat === 'per_view' && (
                            <Stack spacing={2}>
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Bônus por 1k views (R$)"
                                            tip="Valor adicional pago a cada mil visualizações obtidas pelo conteúdo publicado (modelo por performance)."
                                        />
                                    }
                                    value={s.viewBonus1000}
                                    onChange={(e) => update('viewBonus1000', e.target.value)}
                                    fullWidth
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        label={
                                            <FieldLabelTip
                                                text="Pagamento mínimo (R$)"
                                                tip="Valor mínimo garantido ao creator neste modelo, independentemente das views iniciais."
                                            />
                                        }
                                        value={s.viewPayMin}
                                        onChange={(e) => update('viewPayMin', e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label={
                                            <FieldLabelTip
                                                text="Pagamento máximo (R$)"
                                                tip="Teto de quanto a campanha paga por creator/conteúdo neste modelo; evita valores muito altos se o vídeo viralizar."
                                            />
                                        }
                                        value={s.viewPayMax}
                                        onChange={(e) => update('viewPayMax', e.target.value)}
                                        fullWidth
                                        disabled={s.viewPayMaxUnlimited}
                                    />
                                </Stack>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={s.viewPayMaxUnlimited}
                                            onChange={(_, c) => update('viewPayMaxUnlimited', c)}
                                        />
                                    }
                                    label={
                                        <ControlLabelWithTip
                                            text="Máximo ilimitado"
                                            tip="Sem teto de pagamento por performance; use com critério conforme o orçamento da campanha."
                                        />
                                    }
                                />
                            </Stack>
                        )}
                    </Stack>
                );
            case 2:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Prazos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Defina prazos para candidaturas e entrega de conteúdo (opcional em rascunho).
                        </Typography>
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Prazo para candidaturas"
                                    tip="Até quando creators podem se candidatar. Deixe em branco em rascunho se ainda não definiu."
                                />
                            }
                            type="date"
                            value={s.applicationDeadline}
                            onChange={(e) => update('applicationDeadline', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Prazo para entrega do conteúdo"
                                    tip="Data limite para o creator entregar o material (rascunho ou versão final, conforme sua regra)."
                                />
                            }
                            type="date"
                            value={s.contentDeadline}
                            onChange={(e) => update('contentDeadline', e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                );
            case 3:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Briefing
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Descreva detalhadamente o que você espera dos criadores.
                        </Typography>
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Briefing da campanha"
                                    tip="Tudo que o creator precisa saber: produto, mensagens, tom de voz, o que mostrar e o que evitar."
                                />
                            }
                            placeholder="Pontos principais, tom de voz, mensagens chave, CTAs..."
                            value={s.briefing}
                            onChange={(e) => update('briefing', e.target.value)}
                            fullWidth
                            multiline
                            minRows={5}
                        />
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Ideias de roteiro (opcional)"
                                    tip="Sugestões de falas, estrutura de vídeo ou ângulos que você prefere; o creator ainda pode adaptar."
                                />
                            }
                            placeholder="Se você já tem ideias de roteiro ou script..."
                            value={s.scriptIdeas}
                            onChange={(e) => update('scriptIdeas', e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label={
                                    <FieldLabelTip
                                        text="URL para divulgar (opcional)"
                                        tip="Link que o creator deve citar ou colocar na bio/descrição (site, produto, landing)."
                                    />
                                }
                                placeholder="https://seusite.com/produto"
                                value={s.promotionUrl}
                                onChange={(e) => update('promotionUrl', e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label={
                                    <FieldLabelTip
                                        text="Cupom de desconto (opcional)"
                                        tip="Código promocional que a audiência pode usar; aparece no material combinado com o creator."
                                    />
                                }
                                placeholder="Ex: CRIADOR10"
                                value={s.promotionCoupon}
                                onChange={(e) => update('promotionCoupon', e.target.value)}
                                fullWidth
                            />
                        </Stack>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                Assets da marca (opcional)
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                Logo, imagens ou materiais de referência.
                            </Typography>
                            <Button variant="outlined" component="label" disabled={uploading} sx={{ textTransform: 'none' }}>
                                {uploading ? 'Enviando…' : 'Clique para fazer upload'}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) void uploadAsset(f);
                                        e.target.value = '';
                                    }}
                                />
                            </Button>
                            {s.campaignImages.length > 0 && (
                                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                                    {s.campaignImages.map((url) => (
                                        <Chip
                                            key={url}
                                            label={url.slice(-24)}
                                            onDelete={() =>
                                                update(
                                                    'campaignImages',
                                                    s.campaignImages.filter((u) => u !== url)
                                                )
                                            }
                                            size="small"
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                );
            case 4:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Regras
                        </Typography>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                Tempo de direito de uso
                            </Typography>
                            <ToggleButtonGroup
                                exclusive
                                value={s.usageRights}
                                onChange={(_, v) => v && update('usageRights', v)}
                                fullWidth
                                sx={{ flexWrap: 'wrap' }}
                            >
                                {(['30', '90', '365', 'perpetual'] as UsageRights[]).map((u) => (
                                    <ToggleButton key={u} value={u} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                        {USAGE_LABELS[u]}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Incluso na campanha, sem custo adicional.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                                Quando o criador deve postar?
                            </Typography>
                            <Stack spacing={1.5}>
                                {(
                                    [
                                        {
                                            id: 'on_approval' as const,
                                            title: 'Definir na aprovação',
                                            desc: 'Você define o momento de postagem ao aprovar o conteúdo.',
                                        },
                                        {
                                            id: 'specific_date' as const,
                                            title: 'Data específica',
                                            desc: 'Todos postam em uma data definida.',
                                        },
                                    ] as const
                                ).map(({ id, title, desc }) => {
                                    const selected = s.postingWhen === id;
                                    return (
                                        <Paper
                                            key={id}
                                            component="button"
                                            type="button"
                                            onClick={() => update('postingWhen', id)}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                width: '100%',
                                                textAlign: 'left',
                                                border: '2px solid',
                                                borderColor: selected ? 'primary.main' : 'divider',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                bgcolor: selected ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
                                            }}
                                        >
                                            <Typography fontWeight={700}>{title}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {desc}
                                            </Typography>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                            {s.postingWhen === 'specific_date' && (
                                <TextField
                                    label={
                                        <FieldLabelTip
                                            text="Data prevista de postagem"
                                            tip="Dia em que todos os creators devem publicar, quando você escolhe data fixa em vez de definir na aprovação."
                                        />
                                    }
                                    type="date"
                                    value={s.specificPostDate}
                                    onChange={(e) => update('specificPostDate', e.target.value)}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        </Box>
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Hashtags obrigatórias"
                                    tip="Tags que devem aparecer na legenda ou comentário (#publi, #ad, marca do produto, etc.)."
                                />
                            }
                            placeholder="#publi, #ad..."
                            value={s.hashtags}
                            onChange={(e) => update('hashtags', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Termos proibidos"
                                    tip="Palavras ou assuntos que não podem ser citados no conteúdo (concorrentes, promessas legais sensíveis, etc.)."
                                />
                            }
                            placeholder="Digite termos separados por vírgula"
                            value={s.forbiddenTerms}
                            onChange={(e) => update('forbiddenTerms', e.target.value)}
                            fullWidth
                        />
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Restrições específicas"
                                    tip="Regras extras: cenário, roupa, menções, uso de música, local, duração, etc."
                                />
                            }
                            placeholder="Ex: Não mencionar concorrentes..."
                            value={s.restrictionsText}
                            onChange={(e) => update('restrictionsText', e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />
                        <TextField
                            label={
                                <FieldLabelTip
                                    text="Vídeos de referência (URLs)"
                                    tip="Links de vídeos que mostram o estilo, ritmo ou formato que você espera (um por linha)."
                                />
                            }
                            placeholder="Cole URLs, uma por linha"
                            value={s.referenceVideoUrls}
                            onChange={(e) => update('referenceVideoUrls', e.target.value)}
                            fullWidth
                            multiline
                            minRows={2}
                        />
                    </Stack>
                );
            case 5:
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight={700}>
                            Config.
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Onde essa campanha ficará disponível?
                        </Typography>
                        <Stack spacing={1.5}>
                            {(
                                [
                                    {
                                        id: 'public' as const,
                                        title: 'Público',
                                        desc: 'Qualquer criador pode ver.',
                                    },
                                    {
                                        id: 'community' as const,
                                        title: 'Vincular a uma comunidade',
                                        desc: 'Disponível apenas para membros (ajuste fino na plataforma).',
                                    },
                                ] as const
                            ).map(({ id, title, desc }) => {
                                const selected = s.visibility === id;
                                return (
                                    <Paper
                                        key={id}
                                        component="button"
                                        type="button"
                                        onClick={() => update('visibility', id)}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            width: '100%',
                                            textAlign: 'left',
                                            border: '2px solid',
                                            borderColor: selected ? 'primary.main' : 'divider',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Typography fontWeight={700}>{title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {desc}
                                        </Typography>
                                    </Paper>
                                );
                            })}
                        </Stack>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ pt: 1 }}>
                            Como os criadores participam
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={s.requireApplication}
                                    onChange={(_, c) => update('requireApplication', c)}
                                />
                            }
                            label={
                                <ControlLabelWithTip
                                    text="Aplicação obrigatória — creators precisam ser aprovados antes de produzir"
                                    tip="Só quem você aprovar pode produzir conteúdo, reduzindo risco e alinhando perfil com a marca."
                                />
                            }
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={s.requireContentReview}
                                    onChange={(_, c) => update('requireContentReview', c)}
                                />
                            }
                            label={
                                <ControlLabelWithTip
                                    text="Revisão obrigatória — aprovar conteúdo antes da postagem"
                                    tip="Você valida o material antes de ir ao ar; o briefing pode incluir essa regra automaticamente."
                                />
                            }
                        />
                        <FormControlLabel
                            control={
                                <Checkbox checked={s.productShipping} onChange={(_, c) => update('productShipping', c)} />
                            }
                            label={
                                <ControlLabelWithTip
                                    text="Envio de produto — marca envia o produto após aprovação"
                                    tip="Indica que há envio físico do produto para o creator após a candidatura ser aceita."
                                />
                            }
                        />
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.06), borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Recomendação: mantenha aplicação e revisão ativos para garantir qualidade.
                            </Typography>
                        </Paper>
                    </Stack>
                );
            default:
                return null;
        }
    })();

    const walletCentsAtivarDialogo = account?.wallet_balance_cents ?? 0;
    const saldoInsuficienteParaAtivar = walletCentsAtivarDialogo < savedBudgetTotalCents;

    return (
        <>
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (loading || activateAfterSaveOpen) return;
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    handleRequestClose();
                }
            }}
            maxWidth={false}
            fullWidth
            PaperProps={{
                sx: {
                    maxWidth: 1180,
                    width: '100%',
                    height: { xs: '100%', sm: 'min(90vh, 880px)' },
                    maxHeight: { xs: '100%', sm: '90vh' },
                    m: { xs: 0, sm: 2 },
                    borderRadius: { xs: 0, sm: 3 },
                },
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            width: { xs: 0, md: 200 },
                            display: { xs: 'none', md: 'flex' },
                            flexDirection: 'column',
                            borderRight: 1,
                            borderColor: 'divider',
                            p: 2,
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, px: 0.5 }}>
                            Continuar campanha
                        </Typography>
                        <Stack spacing={0.5}>
                            {STEPS.map((st, idx) => {
                                const done = idx < step;
                                const active = idx === step;
                                return (
                                    <Stack
                                        key={st.id}
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{
                                            py: 1,
                                            px: 1,
                                            borderRadius: 2,
                                            bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                fontWeight: 800,
                                                bgcolor: done ? 'success.main' : active ? 'primary.main' : 'action.hover',
                                                color: done ? 'success.contrastText' : active ? 'primary.contrastText' : 'text.secondary',
                                            }}
                                        >
                                            {done ? <CheckIcon sx={{ fontSize: 16 }} /> : idx + 1}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            fontWeight={active ? 700 : 500}
                                            color={active ? 'primary.main' : 'text.secondary'}
                                            sx={{ fontSize: 13 }}
                                        >
                                            {st.label}
                                        </Typography>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                px: 2,
                                pt: 1,
                            }}
                        >
                            <IconButton
                                onClick={() => handleRequestClose()}
                                aria-label="Fechar"
                                size="small"
                                disabled={loading || hydrating}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, pb: 2 }}>
                            {hydrating && continueCampaignId ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                                    <CircularProgress />
                                </Box>
                            ) : loadFailed ? (
                                <Stack alignItems="center" spacing={2} sx={{ py: 6, px: 2 }}>
                                    <Typography color="error" textAlign="center" fontWeight={600}>
                                        {error}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            resetWizard();
                                            onClose();
                                        }}
                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                        Voltar às campanhas
                                    </Button>
                                </Stack>
                            ) : (
                                <>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={700}
                                        sx={{ display: { xs: 'block', md: 'none' }, mb: 1 }}
                                    >
                                        {STEPS[step].label} · passo {step + 1} de {STEPS.length}
                                    </Typography>
                                    <Button
                                        type="button"
                                        size="small"
                                        endIcon={<ChevronRightIcon />}
                                        onClick={() => setBriefingPreviewOpen(true)}
                                        sx={{
                                            display: { xs: 'inline-flex', sm: 'none' },
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            mb: 1,
                                            px: 0,
                                            minWidth: 0,
                                        }}
                                    >
                                        Ver briefing completo
                                    </Button>
                                    {error && (
                                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                            {error}
                                        </Typography>
                                    )}
                                    {stepContent}
                                </>
                            )}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            width: { xs: 0, sm: 260 },
                            display: { xs: 'none', sm: 'block' },
                            flexShrink: 0,
                            borderLeft: 1,
                            borderColor: 'divider',
                            p: 2,
                            bgcolor: alpha(theme.palette.grey[500], 0.04),
                            overflowY: 'auto',
                        }}
                    >
                        <CampaignPreviewCard
                            s={s}
                            brandName={brandName}
                            onOpenBriefing={() => setBriefingPreviewOpen(true)}
                        />
                    </Box>
                </Box>

                <Divider />
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1.5, flexShrink: 0 }}
                >
                    <Button
                        onClick={goBack}
                        disabled={loading || hydrating || loadFailed}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {step === 0 ? 'Cancelar' : 'Voltar'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={isLast ? () => void handleSubmit() : goNext}
                        disabled={loading || hydrating || loadFailed}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        }}
                    >
                        {loading
                            ? 'Salvando…'
                            : isLast
                              ? editingCampaignId
                                  ? 'Salvar campanha'
                                  : 'Criar campanha'
                              : 'Continuar'}
                    </Button>
                </Stack>
            </Box>
        </Dialog>

        <BriefingFullPreviewDialog
            open={briefingPreviewOpen}
            onClose={() => setBriefingPreviewOpen(false)}
            s={s}
            brandName={brandName}
        />

        <Dialog
            open={activateAfterSaveOpen}
            onClose={(_, reason) => {
                if (activateLoading) return;
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    finishAfterSaveWithoutActivate();
                }
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle fontWeight={800}>Ativar campanha?</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        Sua campanha já foi salva como <strong>rascunho</strong>. Ao ativar, o valor de{' '}
                        <strong>{formatBrlFromCents(savedBudgetTotalCents)}</strong> (budget total desta campanha) será{' '}
                        <strong>retido</strong> da sua carteira e ficará vinculado a esta campanha.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Saldo disponível agora: <strong>{formatBrlFromCents(walletCentsAtivarDialogo)}</strong>
                        {!saldoInsuficienteParaAtivar ? (
                            <>
                                <br />
                                Após ativar:{' '}
                                <strong>
                                    {formatBrlFromCents(
                                        Math.max(0, walletCentsAtivarDialogo - savedBudgetTotalCents),
                                    )}
                                </strong>
                            </>
                        ) : null}
                    </Typography>
                    {saldoInsuficienteParaAtivar ? (
                        <Alert severity="warning">
                            Saldo insuficiente para ativar. Toque em <strong>Adicionar saldo</strong> para recarregar a
                            carteira — a campanha permanece em rascunho. Ou use <strong>Ir para a campanha</strong> se
                            preferir ajustar o budget depois.
                        </Alert>
                    ) : null}
                    {activateError ? <Alert severity="error">{activateError}</Alert> : null}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, px: 3, pb: 2, gap: 1 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    disabled={activateLoading}
                    onClick={finishAfterSaveWithoutActivate}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    Ir para a campanha
                </Button>
                {saldoInsuficienteParaAtivar ? (
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={activateLoading}
                        onClick={goToAddSaldoKeepingDraft}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        Adicionar saldo
                    </Button>
                ) : (
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={activateLoading}
                        onClick={() => void confirmActivateCampaign()}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {activateLoading ? 'Ativando…' : 'Ativar campanha'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>

        <Dialog
            open={confirmExitOpen}
            onClose={() => {
                if (!loading) setConfirmExitOpen(false);
            }}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle fontWeight={800}>Sair da criação de campanha?</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Você pode salvar como rascunho e continuar depois, ou sair descartando as alterações.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 3, pb: 2, pt: 0, gap: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%">
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setConfirmExitOpen(false)}
                        disabled={loading}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        Continuar editando
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => void saveDraftAndExit()}
                        disabled={loading}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                        {loading ? 'Salvando…' : 'Salvar rascunho e sair'}
                    </Button>
                </Stack>
                <Button
                    fullWidth
                    color="error"
                    variant="contained"
                    onClick={discardAndExit}
                    disabled={loading}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    Sair sem salvar
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
}
