'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Grid,
    InputAdornment,
    alpha,
    useTheme,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    AttachMoney as MoneyIcon,
    ShoppingBag as ProductIcon,
    Link as AffiliateIcon,
    PhotoCamera as PhotoCameraIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

export type CompensationType = 'paid' | 'product' | 'affiliate';

export interface CampaignFormData {
    brand_name: string;
    brand_logo: string;
    brand_website: string;
    brand_instagram: string;
    title: string;
    description: string;
    briefing: string;
    content_type: string;
    content_usage: string;
    category: string;
    niches: string[];
    slots: number;
    slots_unlimited: boolean;
    compensation_type: CompensationType;
    paid_payment_type: 'per_post' | 'per_views';
    requires_invoice: boolean;
    budget_per_creator: string;
    budget_per_1000_views: string;
    includes_product: boolean;
    product_description: string;
    affiliate_commission: string;
    affiliate_link: string;
    deliverables: string[];
    application_deadline: string;
    content_deadline: string;
    start_date: string;
    status: string;
    filters: {
        gender: string;
        min_age: string;
        max_age: string;
        min_followers: string;
        max_followers: string;
        countries: string;
    };
}

const EMPTY_FORM: CampaignFormData = {
    brand_name: '',
    brand_logo: '',
    brand_website: '',
    brand_instagram: '',
    title: '',
    description: '',
    briefing: '',
    content_type: 'ugc',
    content_usage: 'redes_marca',
    category: '',
    niches: [],
    slots: 1,
    slots_unlimited: false,
    compensation_type: 'paid',
    paid_payment_type: 'per_post',
    requires_invoice: false,
    budget_per_creator: '',
    budget_per_1000_views: '',
    includes_product: false,
    product_description: '',
    affiliate_commission: '',
    affiliate_link: '',
    deliverables: [],
    application_deadline: '',
    content_deadline: '',
    start_date: '',
    status: 'draft',
    filters: {
        gender: 'todos',
        min_age: '',
        max_age: '',
        min_followers: '',
        max_followers: '',
        countries: 'all',
    },
};

const COMPENSATION_OPTIONS: {
    value: CompensationType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    gradient: string;
}[] = [
    {
        value: 'paid',
        label: 'Campanha paga',
        sublabel: 'O creator recebe um valor fixo em dinheiro',
        icon: <MoneyIcon />,
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    },
    {
        value: 'product',
        label: 'Campanha de produto',
        sublabel: 'O creator recebe produto(s) ou serviço gratuitamente',
        icon: <ProductIcon />,
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    },
    {
        value: 'affiliate',
        label: 'Campanha de afiliação',
        sublabel: 'O creator divulga com link e recebe comissão por vendas',
        icon: <AffiliateIcon />,
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    },
];

const NICHE_SUGGESTIONS = [
    'Beleza', 'Moda', 'Fitness', 'Alimentação', 'Viagem', 'Tecnologia',
    'Games', 'Casa & Decoração', 'Maternidade', 'Pets', 'Finanças', 'Humor',
    'Educação', 'Saúde', 'Esportes', 'Sustentabilidade', 'Arte', 'Música',
];

const DELIVERABLE_TYPES = ['Reels', 'Stories', 'Foto', 'TikTok'] as const;

function parseDeliverables(deliverables: string[]): { quantities: Record<string, number>; other: string[] } {
    const quantities: Record<string, number> = { Reels: 0, Stories: 0, Foto: 0, TikTok: 0 };
    const other: string[] = [];
    for (const d of deliverables || []) {
        const m = d.trim().match(/^(\d+)\s+(.+)$/);
        const rest = m ? m[2].trim() : '';
        const num = m ? parseInt(m[1], 10) : 0;
        if (m && DELIVERABLE_TYPES.includes(rest as any) && !Number.isNaN(num) && num >= 0) {
            quantities[rest] = num;
        } else if (d.trim()) {
            other.push(d.trim());
        }
    }
    return { quantities, other };
}

function buildDeliverablesFromQuantities(quantities: Record<string, number>, other: string[]): string[] {
    const fromQty = (DELIVERABLE_TYPES as unknown as string[])
        .filter((t) => (quantities[t] ?? 0) > 0)
        .map((t) => `${quantities[t]} ${t}`);
    return [...fromQty, ...other];
}

function BrandLogoUpload({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}) {
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || disabled || uploading) return;
        if (!file.type.startsWith('image/')) {
            setUploadError('Selecione uma imagem (JPG, PNG, WebP ou GIF).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Imagem muito grande. Máximo 10MB.');
            return;
        }
        setUploadError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('type', 'image');
            formData.append('files', file);
            const res = await fetch('/api/posts/media', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro no upload');
            const url = data.urls?.[0];
            if (url) onChange(url);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = () => {
        if (disabled || uploading) return;
        onChange('');
        setUploadError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Box>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {value ? (
                <Box
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box
                        component="img"
                        src={value}
                        alt="Logo da marca"
                        sx={{
                            width: 64,
                            height: 64,
                            objectFit: 'contain',
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.grey[500], 0.08),
                        }}
                    />
                    <Stack direction="row" spacing={1} flex={1}>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || uploading}
                        >
                            {uploading ? 'Enviando...' : 'Trocar'}
                        </Button>
                        <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemove}
                            disabled={disabled || uploading}
                        >
                            Remover
                        </Button>
                    </Stack>
                </Box>
            ) : (
                <Box
                    onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
                    sx={{
                        border: 2,
                        borderStyle: 'dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: disabled || uploading ? 'default' : 'pointer',
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        '&:hover': (disabled || uploading) ? {} : { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                >
                    {uploading ? (
                        <Stack alignItems="center" spacing={1}>
                            <CircularProgress size={32} />
                            <Typography variant="body2" color="text.secondary">Enviando logo...</Typography>
                        </Stack>
                    ) : (
                        <>
                            <PhotoCameraIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" display="block">
                                Clique para selecionar uma imagem
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                JPG, PNG, WebP ou GIF. Máx. 10MB
                            </Typography>
                        </>
                    )}
                </Box>
            )}
            {uploadError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {uploadError}
                </Typography>
            )}
        </Box>
    );
}

interface Props {
    initialData?: Partial<CampaignFormData>;
    campaignId?: string;
    mode: 'create' | 'edit';
}

export function CampaignForm({ initialData, campaignId, mode }: Props) {
    const router = useRouter();
    const theme = useTheme();
    const [form, setForm] = useState<CampaignFormData>({ ...EMPTY_FORM, ...initialData });
    const [nicheInput, setNicheInput] = useState('');
    const [deliverableQuantities, setDeliverableQuantities] = useState<Record<string, number>>(() =>
        parseDeliverables(initialData?.deliverables ?? []).quantities
    );
    const [deliverablesOther, setDeliverablesOther] = useState<string[]>(() =>
        parseDeliverables(initialData?.deliverables ?? []).other
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (initialData?.deliverables?.length) {
            const { quantities, other } = parseDeliverables(initialData.deliverables);
            setDeliverableQuantities(quantities);
            setDeliverablesOther(other);
        }
    }, [initialData?.deliverables?.length]);

    function setField<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function setFilter(key: keyof CampaignFormData['filters'], value: string) {
        setForm((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value } }));
    }

    function addNiche(niche: string) {
        const trimmed = niche.trim();
        if (trimmed && !form.niches.includes(trimmed)) {
            setField('niches', [...form.niches, trimmed]);
        }
        setNicheInput('');
    }

    function removeNiche(niche: string) {
        setField('niches', form.niches.filter((n) => n !== niche));
    }

    function setDeliverableQuantity(type: string, value: number) {
        const n = Math.max(0, Math.floor(Number(value)) || 0);
        setDeliverableQuantities((prev) => ({ ...prev, [type]: n }));
    }

    function removeOtherDeliverable(item: string) {
        setDeliverablesOther((prev) => prev.filter((x) => x !== item));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const isPaid = form.compensation_type === 'paid';
        if (isPaid && form.paid_payment_type === 'per_post' && !form.budget_per_creator?.trim()) {
            setError('Informe o valor por creator para campanha paga por post.');
            setLoading(false);
            return;
        }
        if (isPaid && form.paid_payment_type === 'per_views' && !form.budget_per_1000_views?.trim()) {
            setError('Informe o valor a cada 1.000 visualizações para campanha paga por visualizações.');
            setLoading(false);
            return;
        }

        const builtDeliverables = buildDeliverablesFromQuantities(deliverableQuantities, deliverablesOther);
        if (builtDeliverables.length === 0) {
            setError('Informe pelo menos uma entrega esperada (quantidade maior que zero em Reels, Stories, Foto ou TikTok).');
            setLoading(false);
            return;
        }

        // Map compensation_type to model fields
        const isProduct = form.compensation_type === 'product';
        const isAffiliate = form.compensation_type === 'affiliate';
        const isPaidPerPost = isPaid && form.paid_payment_type === 'per_post';
        const isPaidPerViews = isPaid && form.paid_payment_type === 'per_views';

        const payload = {
            ...form,
            slots: form.slots_unlimited ? 1 : Number(form.slots),
            slots_unlimited: form.slots_unlimited,
            budget_per_creator: isPaidPerPost && form.budget_per_creator ? Number(form.budget_per_creator) * 100 : isPaidPerViews ? 0 : undefined,
            payment_type: isPaid ? form.paid_payment_type : undefined,
            budget_per_1000_views: isPaidPerViews && form.budget_per_1000_views ? Number(form.budget_per_1000_views) * 100 : undefined,
            requires_invoice: isPaid ? form.requires_invoice : undefined,
            includes_product: isProduct,
            product_description: isProduct ? form.product_description : undefined,
            // Store affiliate info in product_description field with a prefix when type is affiliate
            ...(isAffiliate && {
                product_description: [
                    form.affiliate_commission ? `Comissão: ${form.affiliate_commission}%` : '',
                    form.affiliate_link ? `Link: ${form.affiliate_link}` : '',
                ].filter(Boolean).join(' | ') || undefined,
            }),
            content_usage: isAffiliate ? 'ambos' : form.content_usage,
            filters: {
                gender: form.filters.gender || undefined,
                min_age: form.filters.min_age ? Number(form.filters.min_age) : undefined,
                max_age: form.filters.max_age ? Number(form.filters.max_age) : undefined,
                min_followers: form.filters.min_followers ? Number(form.filters.min_followers) : undefined,
                max_followers: form.filters.max_followers ? Number(form.filters.max_followers) : undefined,
                countries: form.filters.countries && form.filters.countries !== 'all' ? [form.filters.countries] : [],
            },
            application_deadline: form.application_deadline || undefined,
            content_deadline: form.content_deadline || undefined,
            start_date: form.start_date || undefined,
            deliverables: builtDeliverables,
        };

        try {
            const url = mode === 'create' ? '/api/campaigns' : `/api/campaigns/${campaignId}`;
            const method = mode === 'create' ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Erro ao salvar campanha.');
            } else {
                setSuccess(mode === 'create' ? 'Campanha criada com sucesso!' : 'Campanha atualizada com sucesso!');
                if (mode === 'create') {
                    setTimeout(() => router.push(`/dashboard/admin/campanhas/${data.campaign._id}`), 1000);
                }
            }
        } catch {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                {/* Marca */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Informações da marca</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Nome da marca *"
                                value={form.brand_name}
                                onChange={(e) => setField('brand_name', e.target.value)}
                                fullWidth
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Instagram da marca"
                                value={form.brand_instagram}
                                onChange={(e) => setField('brand_instagram', e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="@marca"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Website da marca"
                                value={form.brand_website}
                                onChange={(e) => setField('brand_website', e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="https://"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Logo da marca
                            </Typography>
                            <BrandLogoUpload
                                value={form.brand_logo}
                                onChange={(url) => setField('brand_logo', url)}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Campanha */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Detalhes da campanha</Typography>
                    <Stack spacing={2}>
                        <TextField
                            label="Título da campanha *"
                            value={form.title}
                            onChange={(e) => setField('title', e.target.value)}
                            fullWidth
                            required
                            size="small"
                        />
                        <TextField
                            label="Descrição curta *"
                            value={form.description}
                            onChange={(e) => setField('description', e.target.value)}
                            fullWidth
                            required
                            multiline
                            rows={3}
                            size="small"
                            inputProps={{ maxLength: 500 }}
                            helperText={`Resumo da campanha para os creators verem na vitrine. ${form.description.length}/500 caracteres`}
                        />
                        <TextField
                            label="Briefing completo *"
                            value={form.briefing}
                            onChange={(e) => setField('briefing', e.target.value)}
                            fullWidth
                            required
                            multiline
                            rows={6}
                            size="small"
                            helperText="Instruções detalhadas, referências, tom de voz, etc."
                        />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Tipo de conteúdo</InputLabel>
                                    <Select
                                        value={form.content_type}
                                        label="Tipo de conteúdo"
                                        onChange={(e) => setField('content_type', e.target.value)}
                                    >
                                        <MenuItem value="ugc">UGC</MenuItem>
                                        <MenuItem value="reels">Reels</MenuItem>
                                        <MenuItem value="stories">Stories</MenuItem>
                                        <MenuItem value="tiktok">TikTok</MenuItem>
                                        <MenuItem value="post_feed">Post Feed</MenuItem>
                                        <MenuItem value="outro">Outro</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Uso do conteúdo</InputLabel>
                                    <Select
                                        value={form.content_usage}
                                        label="Uso do conteúdo"
                                        onChange={(e) => setField('content_usage', e.target.value)}
                                    >
                                        <MenuItem value="redes_marca">Redes da marca</MenuItem>
                                        <MenuItem value="anuncios">Anúncios pagos</MenuItem>
                                        <MenuItem value="ambos">Ambos</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Categoria"
                                    value={form.category}
                                    onChange={(e) => setField('category', e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="Ex: Beleza, Moda, Tech..."
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status inicial</InputLabel>
                                    <Select
                                        value={form.status}
                                        label="Status inicial"
                                        onChange={(e) => setField('status', e.target.value)}
                                    >
                                        <MenuItem value="draft">Rascunho</MenuItem>
                                        <MenuItem value="active">Ativa (publicar agora)</MenuItem>
                                        <MenuItem value="paused">Pausada</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Nichos */}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Nichos</Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Adicionar nicho..."
                                    value={nicheInput}
                                    onChange={(e) => setNicheInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addNiche(nicheInput);
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Button variant="outlined" size="small" onClick={() => addNiche(nicheInput)} startIcon={<AddIcon />}>
                                    Add
                                </Button>
                            </Stack>
                            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
                                {form.niches.map((n) => (
                                    <Chip key={n} label={n} size="small" onDelete={() => removeNiche(n)} />
                                ))}
                            </Stack>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                {NICHE_SUGGESTIONS.filter((s) => !form.niches.includes(s)).map((s) => (
                                    <Chip
                                        key={s}
                                        label={s}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => addNiche(s)}
                                        sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                {/* Tipo de compensação */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Tipo de compensação *</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                        Defina como os creators serão recompensados por essa campanha.
                    </Typography>

                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                        {COMPENSATION_OPTIONS.map((opt) => {
                            const selected = form.compensation_type === opt.value;
                            return (
                                <Grid size={{ xs: 12, sm: 4 }} key={opt.value}>
                                    <Box
                                        onClick={() => setField('compensation_type', opt.value)}
                                        sx={{
                                            p: { xs: 1.5, sm: 2 },
                                            borderRadius: 2.5,
                                            border: 2,
                                            borderColor: selected ? 'transparent' : 'divider',
                                            cursor: 'pointer',
                                            background: selected ? opt.gradient : 'transparent',
                                            color: selected ? 'white' : 'text.primary',
                                            transition: 'all 0.15s',
                                            '&:hover': {
                                                borderColor: selected ? 'transparent' : 'primary.main',
                                                bgcolor: selected ? undefined : alpha(theme.palette.primary.main, 0.04),
                                            },
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1.5,
                                                    bgcolor: selected ? 'rgba(255,255,255,0.25)' : alpha(theme.palette.primary.main, 0.1),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: selected ? 'white' : 'primary.main',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {React.cloneElement(opt.icon as React.ReactElement, { sx: { fontSize: 18 } } as Record<string, unknown>)}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                                                {opt.label}
                                            </Typography>
                                        </Stack>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.7rem',
                                                lineHeight: 1.4,
                                                color: selected ? 'rgba(255,255,255,0.85)' : 'text.secondary',
                                            }}
                                        >
                                            {opt.sublabel}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Vagas — sempre visível */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={!!form.slots_unlimited}
                                        onChange={(e) => setField('slots_unlimited', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Sem limite de vagas"
                                sx={{ mb: 1, display: 'block', '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                            />
                            {!form.slots_unlimited && (
                                <TextField
                                    label="Número de vagas *"
                                    type="number"
                                    value={form.slots}
                                    onChange={(e) => setField('slots', Number(e.target.value))}
                                    fullWidth
                                    required
                                    size="small"
                                    inputProps={{ min: 1 }}
                                    helperText="Quantos creators serão selecionados para essa campanha"
                                />
                            )}
                        </Grid>

                        {/* Campos condicionais por tipo — campanha paga */}
                        {form.compensation_type === 'paid' && (
                            <>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Forma de pagamento</Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Box
                                            onClick={() => setField('paid_payment_type', 'per_post')}
                                            sx={{
                                                px: 2,
                                                py: 1.25,
                                                borderRadius: 2,
                                                border: 2,
                                                borderColor: form.paid_payment_type === 'per_post' ? 'primary.main' : 'divider',
                                                bgcolor: form.paid_payment_type === 'per_post' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Por post</Typography>
                                            <Typography variant="caption" color="text.secondary">Valor fixo por creator</Typography>
                                        </Box>
                                        <Box
                                            onClick={() => setField('paid_payment_type', 'per_views')}
                                            sx={{
                                                px: 2,
                                                py: 1.25,
                                                borderRadius: 2,
                                                border: 2,
                                                borderColor: form.paid_payment_type === 'per_views' ? 'primary.main' : 'divider',
                                                bgcolor: form.paid_payment_type === 'per_views' ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Por visualizações</Typography>
                                            <Typography variant="caption" color="text.secondary">Valor a cada 1.000 visualizações</Typography>
                                        </Box>
                                    </Stack>
                                </Grid>
                                {form.paid_payment_type === 'per_post' && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Valor por creator (R$) *"
                                            type="number"
                                            value={form.budget_per_creator}
                                            onChange={(e) => setField('budget_per_creator', e.target.value)}
                                            fullWidth
                                            size="small"
                                            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                            placeholder="0,00"
                                            helperText="Valor bruto que cada creator receberá por post"
                                        />
                                    </Grid>
                                )}
                                {form.paid_payment_type === 'per_views' && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Valor a cada 1.000 visualizações (R$) *"
                                            type="number"
                                            value={form.budget_per_1000_views}
                                            onChange={(e) => setField('budget_per_1000_views', e.target.value)}
                                            fullWidth
                                            size="small"
                                            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                            placeholder="0,00"
                                            helperText="Valor pago a cada mil visualizações do conteúdo"
                                        />
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!form.requires_invoice}
                                                onChange={(e) => setField('requires_invoice', e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label="Exige nota fiscal do creator (será exibido na vitrine para quem for se inscrever)"
                                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                                    />
                                </Grid>
                            </>
                        )}

                        {form.compensation_type === 'product' && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Descrição do produto / serviço *"
                                    value={form.product_description}
                                    onChange={(e) => setField('product_description', e.target.value)}
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                    placeholder="Ex: Kit skincare completo (sérum + hidratante + protetor solar), valor aprox. R$ 250"
                                    helperText="Descreva o que o creator receberá e, se possível, o valor estimado"
                                />
                            </Grid>
                        )}

                        {form.compensation_type === 'affiliate' && (
                            <>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Comissão por venda (%)"
                                        type="number"
                                        value={form.affiliate_commission}
                                        onChange={(e) => setField('affiliate_commission', e.target.value)}
                                        fullWidth
                                        size="small"
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                        placeholder="10"
                                        helperText="Percentual de comissão por cada venda gerada"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Link de afiliação / plataforma"
                                        value={form.affiliate_link}
                                        onChange={(e) => setField('affiliate_link', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder="https://hotmart.com/... ou hotmart, kiwify, eduzz..."
                                        helperText="URL base ou nome da plataforma de afiliação"
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Paper>

                {/* Entregas */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Entregas esperadas *</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
                        Informe a quantidade de cada tipo de conteúdo que o creator deve entregar. Pelo menos uma opção deve ter quantidade maior que zero.
                    </Typography>
                    <Grid container spacing={2}>
                        {DELIVERABLE_TYPES.map((type) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={type}>
                                <TextField
                                    label={type}
                                    type="number"
                                    value={deliverableQuantities[type] ?? 0}
                                    onChange={(e) => setDeliverableQuantity(type, Number(e.target.value) || 0)}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0, step: 1 }}
                                    placeholder="0"
                                />
                            </Grid>
                        ))}
                    </Grid>
                    {deliverablesOther.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5 }}>Outros (editados anteriormente)</Typography>
                            {deliverablesOther.map((d) => (
                                <Chip key={d} label={d} size="small" onDelete={() => removeOtherDeliverable(d)} />
                            ))}
                        </Stack>
                    )}
                </Paper>

                {/* Filtros de creators */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Filtros de creators</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>País</InputLabel>
                                <Select
                                    value={form.filters.countries}
                                    label="País"
                                    onChange={(e) => setFilter('countries', e.target.value)}
                                >
                                    <MenuItem value="all">Todos os países</MenuItem>
                                    <MenuItem value="Brasil">Brasil</MenuItem>
                                    <MenuItem value="Portugal">Portugal</MenuItem>
                                    <MenuItem value="Estados Unidos">Estados Unidos</MenuItem>
                                    <MenuItem value="Espanha">Espanha</MenuItem>
                                    <MenuItem value="México">México</MenuItem>
                                    <MenuItem value="Argentina">Argentina</MenuItem>
                                    <MenuItem value="Colômbia">Colômbia</MenuItem>
                                    <MenuItem value="Chile">Chile</MenuItem>
                                    <MenuItem value="Reino Unido">Reino Unido</MenuItem>
                                    <MenuItem value="França">França</MenuItem>
                                    <MenuItem value="Alemanha">Alemanha</MenuItem>
                                    <MenuItem value="Itália">Itália</MenuItem>
                                    <MenuItem value="Outro">Outro</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Gênero</InputLabel>
                                <Select
                                    value={form.filters.gender}
                                    label="Gênero"
                                    onChange={(e) => setFilter('gender', e.target.value)}
                                >
                                    <MenuItem value="todos">Todos</MenuItem>
                                    <MenuItem value="feminino">Feminino</MenuItem>
                                    <MenuItem value="masculino">Masculino</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                label="Idade mínima"
                                type="number"
                                value={form.filters.min_age}
                                onChange={(e) => setFilter('min_age', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                label="Idade máxima"
                                type="number"
                                value={form.filters.max_age}
                                onChange={(e) => setFilter('max_age', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6 }}>
                            <TextField
                                label="Seguidores mínimos"
                                type="number"
                                value={form.filters.min_followers}
                                onChange={(e) => setFilter('min_followers', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 6 }}>
                            <TextField
                                label="Seguidores máximos"
                                type="number"
                                value={form.filters.max_followers}
                                onChange={(e) => setFilter('max_followers', e.target.value)}
                                fullWidth
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Datas */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Datas</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Início da campanha"
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setField('start_date', e.target.value)}
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Prazo para candidaturas"
                                type="date"
                                value={form.application_deadline}
                                onChange={(e) => setField('application_deadline', e.target.value)}
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Prazo para entrega"
                                type="date"
                                value={form.content_deadline}
                                onChange={(e) => setField('content_deadline', e.target.value)}
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                <Divider />

                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/dashboard/admin/campanhas')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
                        }}
                    >
                        {loading ? <CircularProgress size={18} color="inherit" /> : mode === 'create' ? 'Criar campanha' : 'Salvar alterações'}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
