'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { PhotoLibrary as PhotoLibraryIcon } from '@mui/icons-material';

interface AddStoryDialogProps {
  open: boolean;
  onClose: () => void;
  /** Chamado após publicar com sucesso (ex.: refresh da lista de stories). */
  onSuccess?: () => void | Promise<void>;
}

export function AddStoryDialog({ open, onClose, onSuccess }: AddStoryDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const urlRes = await fetch('/api/stories/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isVideo ? 'video' : 'image',
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      if (!urlRes.ok) {
        const data = await urlRes.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao gerar link de upload');
      }
      const { sasUrl, finalUrl, mediaType } = await urlRes.json();
      const putRes = await fetch(sasUrl, {
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error('Falha ao enviar o arquivo. Tente novamente.');
      }
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: finalUrl, mediaType }),
      });
      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? '';
        const data = contentType.includes('application/json')
          ? await res.json()
          : { error: (await res.text()) || 'Erro ao publicar' };
        throw new Error(
          typeof data?.error === 'string' ? data.error : 'Erro ao publicar story'
        );
      }
      setFile(null);
      onClose();
      await onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const mensagem =
        msg && !/expected pattern|fetch failed|network/i.test(msg)
          ? `${msg} Tente novamente.`
          : 'Algo deu errado ao publicar. Tente novamente.';
      alert(mensagem);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar story</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sua foto ou vídeo aparece no seu perfil público por 24 horas.
        </Typography>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={<PhotoLibraryIcon />}
          sx={{ py: 2 }}
        >
          {file ? file.name : 'Escolher imagem ou vídeo'}
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/mov"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!file || uploading}
        >
          {uploading ? 'Publicando...' : 'Publicar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
