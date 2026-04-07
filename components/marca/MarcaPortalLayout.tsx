'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    Box,
    Stack,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Avatar,
    Button,
    CircularProgress,
    useMediaQuery,
    IconButton,
    useTheme,
    Chip,
    Menu,
    MenuItem,
    Paper,
    alpha,
} from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useTheme as useAppTheme } from '@/contexts/ThemeContext';
import {
    Home as HomeIcon,
    Campaign as CampaignIcon,
    Groups as GroupsIcon,
    Diversity3 as CommunitiesIcon,
    ChatBubbleOutline as MessagesIcon,
    BarChart as TrackingIcon,
    School as SchoolIcon,
    CardMembership as PlanosIcon,
    Menu as MenuIcon,
    Settings as SettingsIcon,
    Redeem as RedeemIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { DomeLogo } from '@/components/ui/DomeLogo';
import { useAccount } from '@/contexts/AccountContext';
import { MarcaAdicionarSaldoModal } from '@/components/marca/MarcaAdicionarSaldoModal';
import { MarcaPremiumFeatureModal } from '@/components/marca/MarcaPremiumFeatureModal';
import { getMarcaPremiumFeatureForPath } from '@/lib/marca-premium-routes';

const DRAWER_WIDTH = 268;

const NAV: ReadonlyArray<{
    href: string;
    label: string;
    Icon: typeof HomeIcon;
    match: (p: string) => boolean;
    beta?: boolean;
}> = [
    { href: '/marca/inicio', label: 'Início', Icon: HomeIcon, match: (p: string) => p === '/marca/inicio' },
    {
        href: '/marca/campanhas',
        label: 'Campanhas',
        Icon: CampaignIcon,
        match: (p: string) => p === '/marca/campanhas' || p.startsWith('/marca/campanhas/'),
    },
    {
        href: '/marca/planos',
        label: 'Planos',
        Icon: PlanosIcon,
        match: (p: string) => p === '/marca/planos' || p.startsWith('/marca/planos/'),
    },
    { href: '/marca/comunidades', label: 'Comunidades', Icon: CommunitiesIcon, match: (p: string) => p.startsWith('/marca/comunidades') },
    {
        href: '/marca/criadores',
        label: 'Criadores',
        Icon: GroupsIcon,
        match: (p: string) => p === '/marca/criadores' || p.startsWith('/marca/criadores/'),
    },
    { href: '/marca/mensagens', label: 'Mensagens', Icon: MessagesIcon, match: (p: string) => p.startsWith('/marca/mensagens') },
    {
        href: '/marca/tracking',
        label: 'Tracking',
        Icon: TrackingIcon,
        match: (p: string) => p.startsWith('/marca/tracking'),
        beta: true,
    },
    { href: '/marca/aulas', label: 'Aulas & Tutoriais', Icon: SchoolIcon, match: (p: string) => p.startsWith('/marca/aulas') },
];

function formatBrl(cents: number) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Portal da marca usa o mesmo tema claro/escuro do resto do site (ThemeContext + MUI). */
export function MarcaPortalLayout({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useAppTheme();
    const muiTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;
    return (
        <MuiThemeProvider theme={muiTheme}>
            <MarcaPortalLayoutInner>{children}</MarcaPortalLayoutInner>
        </MuiThemeProvider>
    );
}

function MarcaPortalLayoutInner({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const { resolvedTheme, setTheme } = useAppTheme();
    const pathname = usePathname() || '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const { account, fullName, isSubscriptionActive, isLoading: accountLoading } = useAccount();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [saldoOpen, setSaldoOpen] = React.useState(false);
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

    const displayName = account?.first_name?.trim() || fullName?.split(' ')[0] || 'Marca';
    const balance = account?.wallet_balance_cents ?? 0;

    const premiumFeature = getMarcaPremiumFeatureForPath(pathname);

    const mainContent = (() => {
        if (!premiumFeature) {
            return children;
        }
        if (accountLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            );
        }
        if (!isSubscriptionActive) {
            return (
                <>
                    <MarcaPremiumFeatureModal
                        open
                        feature={premiumFeature}
                        onClose={() => router.push('/marca/inicio')}
                    />
                    <Box sx={{ py: 6, px: 2, textAlign: 'center', maxWidth: 420, mx: 'auto' }}>
                        <Typography variant="body2" color="text.secondary">
                            Assine o plano mensal do portal da marca para acessar esta área.
                        </Typography>
                    </Box>
                </>
            );
        }
        return children;
    })();

    React.useEffect(() => {
        const flag = searchParams.get('adicionarSaldo');
        if (flag !== '1' && flag !== 'true') return;
        setSaldoOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('adicionarSaldo');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname);
    }, [searchParams, pathname, router]);

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Link href="/marca/inicio" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <DomeLogo style={{ fontSize: 20, fontWeight: 600 }} />
                </Link>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Portal da marca
                </Typography>
            </Box>
            <List sx={{ flex: 1, py: 1, px: 1, overflowY: 'auto' }}>
                {NAV.map(({ href, label, Icon, match, beta }) => {
                    const selected = match(pathname);
                    return (
                        <ListItemButton
                            key={href}
                            component={Link}
                            href={href}
                            selected={selected}
                            onClick={() => setMobileOpen(false)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.25,
                                py: 1,
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: 'primary.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Icon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <span>{label}</span>
                                        {beta && (
                                            <Chip label="Beta" size="small" color="primary" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                                        )}
                                    </Box>
                                }
                                primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: 14 }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Saldo disponível
                    </Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                        {formatBrl(balance)}
                    </Typography>
                    <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={() => setSaldoOpen(true)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            mb: 1,
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        }}
                    >
                        Adicionar saldo
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<RedeemIcon />}
                        disabled
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Resgatar cupons
                    </Button>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.75, textAlign: 'center' }}>
                        2 cupons disponíveis
                    </Typography>
                </Paper>

                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5 }}>
                    <Avatar
                        src={account?.avatar_url || undefined}
                        sx={{
                            width: 36,
                            height: 36,
                            background: !account?.avatar_url ? 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)' : undefined,
                            fontSize: 14,
                        }}
                    >
                        {!account?.avatar_url && (displayName.charAt(0)?.toUpperCase() || '?')}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }} noWrap>
                        {displayName}
                    </Typography>
                    <IconButton size="small" aria-label="Menu da conta" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Stack>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <MenuItem
                        onClick={() => {
                            setMenuAnchor(null);
                            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {resolvedTheme === 'dark' ? (
                                <LightModeOutlined fontSize="small" />
                            ) : (
                                <DarkModeOutlined fontSize="small" />
                            )}
                        </ListItemIcon>
                        {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setMenuAnchor(null);
                            void signOut({ callbackUrl: '/' });
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        Sair
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            {isMdUp ? (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            borderRight: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            ) : (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderRight: 1,
                            borderColor: 'divider',
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            )}

            <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                {!isMdUp && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1.5,
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        }}
                    >
                        <IconButton onClick={() => setMobileOpen(true)} edge="start" aria-label="menu">
                            <MenuIcon />
                        </IconButton>
                        <Link href="/marca/inicio" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <DomeLogo style={{ fontSize: 18, fontWeight: 600 }} />
                        </Link>
                    </Box>
                )}
                <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>{mainContent}</Box>
            </Box>

            <MarcaAdicionarSaldoModal open={saldoOpen} onClose={() => setSaldoOpen(false)} />
        </Box>
    );
}
