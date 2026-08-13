'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Stack,
  IconButton,
  Chip,
  useTheme,
  Dialog,
  DialogContent,
  Button,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Leaderboard as LeaderboardIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  WorkspacePremium as MedalIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useStories } from '@/contexts/StoriesContext';
import { useAccount } from '@/contexts/AccountContext';

interface PastWinner {
  accountId: string;
  name: string;
  avatar: string | null;
  totalWins: number;
  weeks: { weekStart: string; weekEnd: string; score: number }[];
}

function RankingShareModal({
  open,
  onClose,
  position,
  userName,
  userAvatar,
  score,
  weekLabel,
}: {
  open: boolean;
  onClose: () => void;
  position: number;
  userName: string;
  userAvatar: string | null;
  score: number;
  weekLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  const positionLabel = position === 1 ? '1º Lugar' : position === 2 ? '2º Lugar' : '3º Lugar';
  const emoji = position === 1 ? '🏆' : position === 2 ? '🥈' : '🥉';

  const drawCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1350;
    canvas.width = w;
    canvas.height = h;

    // Background — gradiente vibrante
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0f0c29');
    bg.addColorStop(0.4, '#302b63');
    bg.addColorStop(1, '#24243e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Glow orbs decorativos
    const drawOrb = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    drawOrb(180, 250, 300, 'rgba(139, 92, 246, 0.15)');
    drawOrb(900, 400, 350, 'rgba(59, 130, 246, 0.12)');
    drawOrb(540, 900, 400, 'rgba(236, 72, 153, 0.08)');
    drawOrb(100, 1100, 250, 'rgba(245, 158, 11, 0.1)');

    // Estrelas / partículas
    const stars = [
      [120, 180, 3], [280, 120, 2], [800, 160, 2.5], [950, 280, 2],
      [160, 600, 2], [920, 550, 3], [100, 900, 2], [980, 850, 2.5],
      [300, 1050, 2], [750, 1100, 3], [500, 150, 2], [700, 300, 1.5],
      [200, 450, 1.5], [850, 700, 2], [400, 800, 1.5], [650, 950, 2],
    ];
    stars.forEach(([x, y, r]) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      const sg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      sg.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      sg.addColorStop(1, 'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // Header — "RANKING DA COMUNIDADE"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 24px sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('RANKING DA COMUNIDADE', w / 2, 100);
    ctx.letterSpacing = '0px';

    // Linha decorativa
    const lineGrad = ctx.createLinearGradient(w / 2 - 150, 0, w / 2 + 150, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
    lineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(w / 2 - 150, 120, 300, 2);

    // Troféu grande
    ctx.font = '120px sans-serif';
    ctx.fillText(emoji, w / 2, 280);

    // Glow atrás do avatar
    const avatarY = 460;
    const avatarR = 120;
    const avatarGlow = ctx.createRadialGradient(w / 2, avatarY, avatarR, w / 2, avatarY, avatarR + 40);
    avatarGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    avatarGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = avatarGlow;
    ctx.beginPath();
    ctx.arc(w / 2, avatarY, avatarR + 40, 0, Math.PI * 2);
    ctx.fill();

    // Ring dourado
    const ringGrad = ctx.createLinearGradient(w / 2 - avatarR, avatarY - avatarR, w / 2 + avatarR, avatarY + avatarR);
    ringGrad.addColorStop(0, '#ffd700');
    ringGrad.addColorStop(0.5, '#fff5cc');
    ringGrad.addColorStop(1, '#ffaa00');
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w / 2, avatarY, avatarR + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Avatar
    const drawAvatarFallback = () => {
      const fbGrad = ctx.createLinearGradient(w / 2 - avatarR, avatarY - avatarR, w / 2 + avatarR, avatarY + avatarR);
      fbGrad.addColorStop(0, '#8b5cf6');
      fbGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = fbGrad;
      ctx.beginPath();
      ctx.arc(w / 2, avatarY, avatarR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(userName.slice(0, 2).toUpperCase(), w / 2, avatarY);
      ctx.textBaseline = 'alphabetic';
    };

    if (userAvatar) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = userAvatar;
        });
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, avatarY, avatarR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, w / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        ctx.restore();
      } catch {
        drawAvatarFallback();
      }
    } else {
      drawAvatarFallback();
    }

    // Nome
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(userName, w / 2, 640);

    // Badge de posição — pill com gradiente
    const badgeW = 340;
    const badgeH = 70;
    const badgeX = w / 2 - badgeW / 2;
    const badgeY = 675;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeGrad.addColorStop(0, '#ffd700');
    badgeGrad.addColorStop(0.5, '#ffe566');
    badgeGrad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 35);
    ctx.fill();
    // Sombra do badge
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = badgeGrad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 35);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    // Texto do badge
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`${emoji}  ${positionLabel.toUpperCase()}`, w / 2, badgeY + 47);

    // Score
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(`${score}`, w / 2, 860);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '28px sans-serif';
    ctx.fillText('PONTOS', w / 2, 900);

    // Semana
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '26px sans-serif';
    ctx.fillText(`Semana ${weekLabel}`, w / 2, 960);

    // Separador
    const sep = ctx.createLinearGradient(w / 2 - 200, 0, w / 2 + 200, 0);
    sep.addColorStop(0, 'transparent');
    sep.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
    sep.addColorStop(1, 'transparent');
    ctx.fillStyle = sep;
    ctx.fillRect(w / 2 - 200, 1010, 400, 1);

    // Logo "Dome"
    const logoGrad = ctx.createLinearGradient(w / 2 - 100, 1080, w / 2 + 100, 1080);
    logoGrad.addColorStop(0, '#8b5cf6');
    logoGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = logoGrad;
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('Dome', w / 2, 1100);

    // Subtítulo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '22px sans-serif';
    ctx.fillText('A cúpula de criadores de conteúdo', w / 2, 1140);
    ctx.fillText('de @dailytrombelli & @luigi.andersen', w / 2, 1172);

    // URL
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '20px sans-serif';
    ctx.fillText('dome.app.br', w / 2, 1200);
  }, [userName, userAvatar, score, weekLabel, emoji, positionLabel]);

  useEffect(() => {
    if (open) {
      setTimeout(drawCard, 100);
    }
  }, [open, drawCard]);

  const getCanvasBlob = () => new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png') ?? resolve(null));

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `ranking-dome-${positionLabel.replace(/\s/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShareInstagram = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;

    try {
      const file = new File([blob], 'ranking-dome.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
        return;
      }
    } catch {}

    handleDownload();
    alert('Imagem salva! Abra o Instagram e use-a nos Stories ou no Feed.');
  };

  const handleShareGeneral = async () => {
    const text = `${emoji} Estou em ${positionLabel} no ranking da comunidade Dome! ${score} pontos na semana ${weekLabel}. 🔥\n\ndome.app.br`;

    try {
      const blob = await getCanvasBlob();
      if (blob) {
        const file = new File([blob], 'ranking-dome.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ text, files: [file] });
          return;
        }
      }
    } catch {}

    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      alert('Texto copiado! Cole nas suas redes sociais.');
    } catch {
      prompt('Copie o texto:', text);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(0,0,0,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' } }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#1a1a2e', p: 2 }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', maxWidth: 360, height: 'auto', aspectRatio: '1080/1350', borderRadius: 12 }}
            />
          </Box>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            {emoji} Parabéns! Você está em {positionLabel}!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Compartilhe sua conquista nas redes sociais
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleShareInstagram}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                fontSize: '0.95rem',
                py: 1.2,
              }}
            >
              Compartilhar no Instagram
            </Button>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={handleShareGeneral}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Outros apps
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Salvar imagem
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function RankingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users, week, isLoading, error } = useStories();
  const { account } = useAccount();
  const theme = useTheme();
  const [pastWinners, setPastWinners] = useState<PastWinner[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  const testShare = searchParams.get('test') === 'share';

  useEffect(() => {
    fetch('/api/accounts/ranking-wins')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPastWinners(data);
      })
      .catch(() => {});
  }, []);

  // Criadores nunca aparecem no ranking (mas continuam na barra de stories do feed).
  const rankedUsers = users.filter((u) => u.role !== 'criador');
  const userPosition = account?.id ? rankedUsers.findIndex((u) => u.id === account.id) + 1 : 0;
  const userInRanking = account?.id && userPosition > 0;
  const userIsTopThree = (userPosition >= 1 && userPosition <= 3) || testShare;

  useEffect(() => {
    if (!isLoading && userIsTopThree) {
      const key = `ranking-share-shown-${week?.start || 'current'}`;
      if (testShare || !sessionStorage.getItem(key)) {
        if (!testShare) sessionStorage.setItem(key, '1');
        setShowShareModal(true);
      }
    }
  }, [isLoading, userIsTopThree, testShare, week?.start]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Erro ao carregar ranking: {error}</Typography>
      </Box>
    );
  }

  const destaque = rankedUsers[0];
  const ranking = rankedUsers.slice(0, 10);

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: 'auto',
        py: 3,
        px: 2,
        pb: { xs: 10, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <LeaderboardIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Ranking da Comunidade
        </Typography>
        <IconButton
          onClick={() => router.back()}
          sx={{ display: { xs: 'flex', md: 'none' } }}
          aria-label="Fechar"
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      {week && (
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Semana {week.label}
          </Typography>
        </Stack>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Quem mais interagiu esta semana: curtidas dadas, curtidas recebidas, posts e comentários somam os pontos. O ranking reseta toda segunda-feira.
      </Typography>

      {destaque && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: '2px solid',
            borderColor: 'warning.main',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.warning.main}08 0%, ${theme.palette.warning.dark}12 100%)`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1.5 }}>
            <TrophyIcon sx={{ fontSize: 24, color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight={700} color="warning.dark">
              Destaque da semana
            </Typography>
            {destaque.rankingWins > 0 && (
              <Chip
                icon={<MedalIcon sx={{ fontSize: 16 }} />}
                label={`${destaque.rankingWins}x campeão`}
                size="small"
                sx={{
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Stack>
          <Link
            href={`/dashboard/comunidade/perfil/${destaque.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={destaque.avatar || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  border: '3px solid',
                  borderColor: 'warning.main',
                  bgcolor: !destaque.avatar ? 'warning.light' : undefined,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                {!destaque.avatar && destaque.initials}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={600} noWrap>
                  {destaque.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {destaque.interactionCount} pontos
                  {destaque.stats && (
                    <> · {destaque.stats.postsCount} posts · {destaque.stats.likesGiven + destaque.stats.likesReceived} curtidas · {destaque.stats.commentsCount} comentários</>
                  )}
                </Typography>
              </Box>
              <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
            </Stack>
          </Link>
        </Paper>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
        Top 10 da semana
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {ranking.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Ninguém no ranking ainda. Interaja no feed para pontuar!</Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
            {ranking.map((user, index) => (
              <Link
                key={user.id}
                href={`/dashboard/comunidade/perfil/${user.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    px: 2,
                    py: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      minWidth: 28,
                      color: index === 0 ? 'warning.main' : 'text.secondary',
                      fontSize: index < 3 ? '1rem' : undefined,
                    }}
                  >
                    #{index + 1}
                  </Typography>
                  <Avatar
                    src={user.avatar || undefined}
                    sx={{
                      width: 40,
                      height: 40,
                      border: index === 0 ? '2px solid' : undefined,
                      borderColor: index === 0 ? 'warning.main' : undefined,
                      bgcolor: !user.avatar ? 'primary.main' : undefined,
                      fontSize: '0.875rem',
                    }}
                  >
                    {!user.avatar && user.initials}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography variant="body1" fontWeight={500} noWrap>
                        {user.name}
                      </Typography>
                      {user.rankingWins > 0 && (
                        <Chip
                          label={`${user.rankingWins}x`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: 'warning.light',
                            color: 'warning.dark',
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      )}
                    </Stack>
                    {user.stats && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {user.stats.postsCount} posts · {user.stats.likesGiven + user.stats.likesReceived} curtidas · {user.stats.commentsCount} comentários
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {user.interactionCount} pts
                  </Typography>
                </Stack>
              </Link>
            ))}
          </Stack>
        )}
      </Paper>

      {account?.id && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {userInRanking ? (
              <>Você está no {userPosition}º lugar esta semana</>
            ) : (
              <>Você ainda não está no top 10. Interaja no feed para subir!</>
            )}
          </Typography>
          {userIsTopThree && (
            <Button
              size="small"
              startIcon={<ShareIcon />}
              onClick={() => setShowShareModal(true)}
              sx={{ ml: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
            >
              Compartilhar
            </Button>
          )}
        </Box>
      )}

      {userIsTopThree && account && (
        <RankingShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          position={testShare && userPosition === 0 ? 1 : userPosition || 1}
          userName={`${account.first_name} ${account.last_name}`.trim()}
          userAvatar={account.avatar_url || null}
          score={rankedUsers[(userPosition || 1) - 1]?.interactionCount || 42}
          weekLabel={week?.label || ''}
        />
      )}

      {pastWinners.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <MedalIcon sx={{ fontSize: 22, color: 'warning.main' }} />
            <Typography variant="subtitle1" fontWeight={700}>
              Hall da Fama
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Campeões semanais e quantas vezes ficaram em 1º lugar.
          </Typography>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {pastWinners.map((winner) => (
                <Link
                  key={winner.accountId}
                  href={`/dashboard/comunidade/perfil/${winner.accountId}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      px: 2,
                      py: 1.5,
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <Avatar
                      src={winner.avatar || undefined}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: !winner.avatar ? 'warning.light' : undefined,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                      }}
                    >
                      {winner.name?.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={500} noWrap>
                        {winner.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {winner.totalWins}x campeão
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.25}>
                      {Array.from({ length: Math.min(winner.totalWins, 5) }).map((_, i) => (
                        <TrophyIcon key={i} sx={{ fontSize: 18, color: 'warning.main' }} />
                      ))}
                      {winner.totalWins > 5 && (
                        <Typography variant="caption" color="warning.main" fontWeight={700}>
                          +{winner.totalWins - 5}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Link>
              ))}
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
