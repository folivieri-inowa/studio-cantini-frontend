'use client';

import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { Upload } from 'src/components/upload';

// ----------------------------------------------------------------------

const DOCUMENT_TYPES = [
  { value: 'fattura', label: 'Fattura' },
  { value: 'contratto', label: 'Contratto' },
  { value: 'bilancio', label: 'Bilancio' },
  { value: 'dichiarazione_fiscale', label: 'Dichiarazione Fiscale' },
  { value: 'comunicazione', label: 'Comunicazione' },
  { value: 'ricevuta', label: 'Ricevuta' },
  { value: 'altro', label: 'Altro' },
];

const PRIORITY_LEVELS = [
  { value: 'URGENT', label: 'Urgente' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'LOW', label: 'Bassa' },
  { value: 'BATCH', label: 'Batch' },
];

// ----------------------------------------------------------------------

export default function DocumentUploadDialog({ open, onClose, db, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const uploading = useBoolean();

  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    documentType: 'altro',
    documentSubtype: '',
    title: '',
    description: '',
    priority: 'NORMAL',
  });

  const handleDrop = useCallback((acceptedFiles) => {
    const newFile = acceptedFiles[0];
    if (newFile) {
      setFile(
        Object.assign(newFile, {
          preview: URL.createObjectURL(newFile),
        })
      );
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
  }, []);

  const handleFieldChange = useCallback((field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !db) {
      enqueueSnackbar('File e database sono obbligatori', { variant: 'error' });
      return;
    }

    try {
      uploading.onTrue();

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('db', db);
      uploadFormData.append('documentType', formData.documentType);
      uploadFormData.append('documentSubtype', formData.documentSubtype);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('priority', formData.priority);

      const response = await axios.post(endpoints.archive.upload, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar(response.data.message || 'Documento caricato con successo', {
        variant: 'success',
      });

      // Reset form
      setFile(null);
      setFormData({
        documentType: 'altro',
        documentSubtype: '',
        title: '',
        description: '',
        priority: 'NORMAL',
      });

      if (onSuccess) {
        onSuccess(response.data.document);
      }

      onClose();
    } catch (error) {
      console.error('Errore upload:', error);
      enqueueSnackbar(error.message || 'Errore durante il caricamento', {
        variant: 'error',
      });
    } finally {
      uploading.onFalse();
    }
  }, [file, db, formData, uploading, enqueueSnackbar, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!uploading.value) {
      setFile(null);
      setFormData({
        documentType: 'altro',
        documentSubtype: '',
        title: '',
        description: '',
        priority: 'NORMAL',
      });
      onClose();
    }
  }, [uploading.value, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Carica Nuovo Documento</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Upload Area */}
          <Upload
            file={file}
            onDrop={handleDrop}
            onDelete={handleRemoveFile}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            }}
          />

          {/* Form Fields */}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Titolo"
              value={formData.title}
              onChange={handleFieldChange('title')}
              placeholder="es. Fattura Fornitore XYZ - Gennaio 2024"
            />

            <TextField
              fullWidth
              select
              label="Tipo Documento"
              value={formData.documentType}
              onChange={handleFieldChange('documentType')}
            >
              {DOCUMENT_TYPES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Sottotipo (Opzionale)"
              value={formData.documentSubtype}
              onChange={handleFieldChange('documentSubtype')}
              placeholder="es. Fattura di Vendita, Contratto di Locazione"
            />

            <TextField
              fullWidth
              select
              label="Priorità"
              value={formData.priority}
              onChange={handleFieldChange('priority')}
            >
              {PRIORITY_LEVELS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descrizione (Opzionale)"
              value={formData.description}
              onChange={handleFieldChange('description')}
              placeholder="Note aggiuntive sul documento..."
            />
          </Stack>

          {/* Info Box */}
          <Card
            sx={{
              p: 2,
              bgcolor: 'background.neutral',
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="solar:info-circle-bold" width={20} color="info.main" />
                <Typography variant="subtitle2">Processamento Automatico</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Il documento verrà processato automaticamente attraverso una pipeline che include:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong>OCR:</strong> Estrazione testo dal documento
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong>Pulizia:</strong> Normalizzazione e pulizia del testo
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong>Indicizzazione:</strong> Creazione indici per ricerca semantica
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading.value}>
          Annulla
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleUpload}
          loading={uploading.value}
          disabled={!file}
          startIcon={<Iconify icon="solar:upload-bold" />}
        >
          Carica Documento
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

DocumentUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  db: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};
