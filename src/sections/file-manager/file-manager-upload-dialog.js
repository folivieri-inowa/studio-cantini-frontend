import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import { uploadFile } from 'src/api/file-manager';

// ----------------------------------------------------------------------

export default function FileManagerUploadDialog({
  title = 'Carica File',
  open,
  onClose,
  onUploadSuccess,
  db,
  categories = [],
  subjects = {},
  details = {},
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selezione della categoria/soggetto/dettaglio
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');

  // Liste filtrate in base alle selezioni
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableDetails, setAvailableDetails] = useState([]);

  // Reset all when dialog is closed
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setSelectedCategory('');
      setSelectedSubject('');
      setSelectedDetail('');
      setAvailableSubjects([]);
      setAvailableDetails([]);
    }
  }, [open]);

  // Aggiorna i soggetti disponibili quando cambia la categoria
  useEffect(() => {
    if (selectedCategory && subjects[selectedCategory]) {
      setAvailableSubjects(subjects[selectedCategory]);
    } else {
      setAvailableSubjects([]);
    }
    // Reset subject and detail when category changes
    setSelectedSubject('');
    setSelectedDetail('');
  }, [selectedCategory, subjects]);

  // Aggiorna i dettagli disponibili quando cambia il soggetto
  useEffect(() => {
    if (selectedSubject && details[selectedSubject]) {
      setAvailableDetails(details[selectedSubject]);
    } else {
      setAvailableDetails([]);
    }
    // Reset detail when subject changes
    setSelectedDetail('');
  }, [selectedSubject, details]);

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles([...files, ...newFiles]);
    },
    [files]
  );

  const handleUpload = async () => {
    if (!selectedCategory) {
      enqueueSnackbar('Seleziona una categoria prima di caricare i file', { variant: 'warning' });
      return;
    }

    if (files.length === 0) {
      enqueueSnackbar('Aggiungi almeno un file da caricare', { variant: 'warning' });
      return;
    }

    setLoading(true);
    
    try {
      const uploadPromises = files.map(file => 
        uploadFile(
          db, 
          file, 
          selectedCategory,
          selectedSubject || null, 
          selectedDetail || null
        )
      );
      
      await Promise.all(uploadPromises);
      
      enqueueSnackbar('File caricati con successo', { variant: 'success' });
      
      // Notifica il componente padre per aggiornare la vista
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Errore durante il caricamento dei file:', error);
      enqueueSnackbar('Errore durante il caricamento dei file', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (inputFile) => {
    const filtered = files.filter((file) => file !== inputFile);
    setFiles(filtered);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle sx={{ p: (theme) => theme.spacing(3, 3, 2, 3) }}>{title}</DialogTitle>

      <DialogContent dividers sx={{ pt: 1, pb: 0, border: 'none' }}>
        <Stack spacing={3} sx={{ mb: 3 }}>
          <TextField
            select
            fullWidth
            label="Categoria"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>

          {selectedCategory && (
            <TextField
              select
              fullWidth
              label="Soggetto"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={availableSubjects.length === 0}
            >
              {availableSubjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {selectedSubject && (
            <TextField
              select
              fullWidth
              label="Dettaglio"
              value={selectedDetail}
              onChange={(e) => setSelectedDetail(e.target.value)}
              disabled={availableDetails.length === 0}
            >
              {availableDetails.map((detail) => (
                <MenuItem key={detail.id} value={detail.id}>
                  {detail.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>

        <Upload 
          multiple 
          files={files} 
          onDrop={handleDrop} 
          onRemove={handleRemoveFile} 
        />
      </DialogContent>

      <DialogActions>
        <Button
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={24} /> : <Iconify icon="eva:cloud-upload-fill" />}
          onClick={handleUpload}
        >
          {loading ? 'Caricamento...' : 'Carica'}
        </Button>

        {!!files.length && (
          <Button variant="outlined" color="inherit" onClick={handleRemoveAllFiles} disabled={loading}>
            Rimuovi tutti
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
          Annulla
        </Button>
      </DialogActions>
    </Dialog>
  );
}

FileManagerUploadDialog.propTypes = {
  title: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onUploadSuccess: PropTypes.func,
  db: PropTypes.string,
  categories: PropTypes.array,
  subjects: PropTypes.object,
  details: PropTypes.object,
};
