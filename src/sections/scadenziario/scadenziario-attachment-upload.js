'use client';

import { useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import { uploadScadenziarioAttachment } from 'src/api/scadenziario-api';

// ----------------------------------------------------------------------

export default function ScadenziarioAttachmentUpload({ ownerId, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadScadenziarioAttachment(file, ownerId);
      onChange(result.data.url);
    } catch (err) {
      setError('Errore caricamento file. Riprova.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => onChange(null);

  if (value) {
    const filename = value.split('/').pop();
    return (
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{
        p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'success.light',
        bgcolor: (t) => alpha(t.palette.success.main, 0.04),
      }}>
        <Iconify icon="eva:file-text-fill" sx={{ color: 'success.main', width: 24, height: 24 }} />
        <Typography variant="body2" sx={{ flex: 1, color: 'success.dark' }} noWrap>
          {filename}
        </Typography>
        <Button size="small" color="error" onClick={handleRemove} startIcon={<Iconify icon="eva:trash-2-fill" />}>
          Rimuovi
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      sx={{
        p: 3, borderRadius: 1, border: '2px dashed', borderColor: 'divider',
        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={handleInputChange} />
      {uploading ? (
        <Stack spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">Caricamento…</Typography>
          <LinearProgress sx={{ width: 200 }} />
        </Stack>
      ) : (
        <Stack spacing={0.5} alignItems="center">
          <Iconify icon="eva:cloud-upload-fill" sx={{ width: 36, height: 36, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            Trascina qui o clicca per caricare la contabile
          </Typography>
          <Typography variant="caption" color="text.disabled">
            PDF, JPG, PNG — max 20MB
          </Typography>
        </Stack>
      )}
      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
