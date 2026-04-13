'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ScadenziarioOcrUpload({ onExtracted, onFileUploaded }) {
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setFilename(file.name);
      setLoading(true);
      try {
        const { ocrExtract, uploadAttachment } = await import('../../api/scadenziario-services');
        const [ocrResult, uploadResult] = await Promise.all([
          ocrExtract(file),
          uploadAttachment(file, 'temp'),
        ]);
        console.log('[OCR] Risultato grezzo Docling:', ocrResult);
        console.log('[OCR] Dati estratti:', ocrResult?.data);
        console.log('[OCR] Upload allegato:', uploadResult?.data);
        if (ocrResult?.data) onExtracted?.(ocrResult.data);
        if (uploadResult?.data?.url) onFileUploaded?.(uploadResult.data.url);
      } catch (err) {
        console.error('OCR/upload error', err);
      } finally {
        setLoading(false);
      }
    },
    [onExtracted, onFileUploaded]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => document.getElementById('ocr-file-input').click()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2.5,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <input
        id="ocr-file-input"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Analisi in corso…
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Iconify
            icon={filename ? 'eva:file-text-fill' : 'solar:cloud-upload-bold'}
            sx={{ width: 24, height: 24, color: filename ? 'primary.main' : 'text.disabled' }}
          />
          <Typography variant="body2" color={filename ? 'primary.main' : 'text.secondary'}>
            {filename || 'Carica PDF o immagine fattura (opzionale) — campi precompilati via OCR'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
