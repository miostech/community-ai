'use client';

import React, { useState } from 'react';
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
    FormControlLabel,
    Checkbox,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Grid,
    InputAdornment,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

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
    budget_per_creator: string;
    includes_product: boolean;
    product_description: string;
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
    budget_per_creator: '',
    includes_product: false,
    product_description: '',
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
    },
};

const NICHE_SUGGESTIONS = [
    'Beleza', 'Moda', 'Fitness', 'Alimentação', 'Viagem', 'Tecnologia',
    'Games', 'Casa & Decoração', 'Maternidade', 'Pets', 'Finanças', 'Humor',
    'Educação', 'Saúde', 'Esportes', 'Sustentabilidade', 'Arte', 'Música',
];

interface Props {
    initialData?: Partial<CampaignFormData>;
    campaignId?: string;
    mode: 'create' | 'edit';
}

export function CampaignForm({ initialData, campaignId, mode }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<CampaignFormData>({ ...EMPTY_FORM, ...initialData });
    const [nicheInput, setNicheInput] = useState('');
    const [deliverableInput, setDeliverableInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    function addDeliverable() {
        const trimmed = deliverableInput.trim();
        if (trimmed && !form.deliverables.includes(trimmed)) {
            setField('deliverables', [...form.deliverables, trimmed]);
        }
        setDeliverableInput('');
    }

    function removeDeliverable(d: string) {
        setField('deliverables', form.deliverables.filter((x) => x !== d));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = {
            ...form,
            slots: Number(form.slots),
            budget_per_creator: form.budget_per_creator ? Number(form.budget_per_creator) * 100 : undefined,
            filters: {
                gender: form.filters.gender || undefined,
                min_age: form.filters.min_age ? Number(form.filters.min_age) : undefined,
                max_age: form.filters.max_age ? Number(form.filters.max_age) : undefined,
                min_followers: form.filters.min_followers ? Number(form.filters.min_followers) : undefined,
                max_followers: form.filters.max_followers ? Number(form.filters.max_followers) : undefined,
            },
            application_deadline: form.application_deadline || undefined,
            content_deadline: form.content_deadline || undefined,
            start_date: form.start_date || undefined,
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
                            <TextField
                                label="Logo da marca (URL)"
                                value={form.brand_logo}
                                onChange={(e) => setField('brand_logo', e.target.value)}
                                fullWidth
                                size="small"
                                placeholder="https://..."
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
                            helperText="Resumo da campanha para os creators verem na vitrine."
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

                {/* Vagas e pagamento */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Vagas e pagamento</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Número de vagas *"
                                type="number"
                                value={form.slots}
                                onChange={(e) => setField('slots', Number(e.target.value))}
                                fullWidth
                                required
                                size="small"
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Valor por creator (R$)"
                                type="number"
                                value={form.budget_per_creator}
                                onChange={(e) => setField('budget_per_creator', e.target.value)}
                                fullWidth
                                size="small"
                                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                                placeholder="0,00"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.includes_product}
                                        onChange={(e) => setField('includes_product', e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Inclui produto/serviço gratuito"
                            />
                        </Grid>
                        {form.includes_product && (
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Descrição do produto"
                                    value={form.product_description}
                                    onChange={(e) => setField('product_description', e.target.value)}
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Entregas */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Entregas esperadas</Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                        <TextField
                            size="small"
                            placeholder="Ex: 1 vídeo UGC de 30s, 3 stories..."
                            value={deliverableInput}
                            onChange={(e) => setDeliverableInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addDeliverable();
                                }
                            }}
                            sx={{ flex: 1 }}
                        />
                        <Button variant="outlined" size="small" onClick={addDeliverable} startIcon={<AddIcon />}>
                            Add
                        </Button>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                        {form.deliverables.map((d) => (
                            <Chip key={d} label={d} size="small" onDelete={() => removeDeliverable(d)} />
                        ))}
                    </Stack>
                </Paper>

                {/* Filtros de creators */}
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Filtros de creators</Typography>
                    <Grid container spacing={2}>
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
