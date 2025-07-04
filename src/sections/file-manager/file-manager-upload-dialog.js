import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useRef } from 'react';

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
  currentFolder,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Selezione della categoria/soggetto/dettaglio
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Ref per mantenere i valori stabili anche durante i re-render
  const uploadParamsRef = useRef({
    categoryId: '',
    subjectId: '',
    detailId: ''
  });

  // Liste filtrate in base alle selezioni
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableDetails, setAvailableDetails] = useState([]);

  useEffect(() => {
    if (open && currentFolder) {
      console.log('=== UPLOAD DIALOG DEBUG ===');
      console.log('currentFolder completo:', JSON.stringify(currentFolder, null, 2));
      console.log('Proprietà del currentFolder:');
      console.log('- id:', currentFolder.id);
      console.log('- name:', currentFolder.name);
      console.log('- parentId:', currentFolder.parentId);
      console.log('- categoryId:', currentFolder.categoryId);
      console.log('- subjectId:', currentFolder.subjectId);
      console.log('- categoryName:', currentFolder.categoryName);
      console.log('- subjectName:', currentFolder.subjectName);
      console.log('- type:', currentFolder.type);
      
      // Imposta flag di inizializzazione
      setIsInitializing(true);
      
      // Reset delle selezioni
      setSelectedCategory('');
      setSelectedSubject('');
      setSelectedDetail('');
      
      // Determina i valori da impostare
      let categoryToSet = '';
      let subjectToSet = '';
      let detailToSet = '';
      
      // Se il currentFolder ha informazioni sulla gerarchia, usale
      if (currentFolder.categoryId && currentFolder.subjectId) {
        // Siamo in un dettaglio
        categoryToSet = currentFolder.categoryId;
        subjectToSet = currentFolder.subjectId;
        detailToSet = currentFolder.id;
        console.log('🔵 RICONOSCIUTO COME DETTAGLIO');
        console.log('Categoria:', currentFolder.categoryName, '(ID:', currentFolder.categoryId, ')');
        console.log('Soggetto:', currentFolder.subjectName, '(ID:', currentFolder.subjectId, ')');
        console.log('Dettaglio:', currentFolder.name, '(ID:', currentFolder.id, ')');
      } else if (currentFolder.categoryId && !currentFolder.subjectId) {
        // Siamo in un soggetto
        categoryToSet = currentFolder.categoryId;
        subjectToSet = currentFolder.id;
        detailToSet = '';
        console.log('🟡 RICONOSCIUTO COME SOGGETTO');
        console.log('Categoria:', currentFolder.categoryName, '(ID:', currentFolder.categoryId, ')');
        console.log('Soggetto:', currentFolder.name, '(ID:', currentFolder.id, ')');
      } else if (currentFolder.parentId && !currentFolder.categoryId) {
        // Siamo in un soggetto che ha solo parentId (struttura alternativa)
        categoryToSet = currentFolder.parentId;
        subjectToSet = currentFolder.id;
        detailToSet = '';
        console.log('🟡 RICONOSCIUTO COME SOGGETTO (con parentId)');
        console.log('Categoria (parentId):', currentFolder.parentId);
        console.log('Soggetto:', currentFolder.name, '(ID:', currentFolder.id, ')');
      } else if (!currentFolder.parentId && !currentFolder.categoryId) {
        // Siamo in una categoria
        categoryToSet = currentFolder.id;
        subjectToSet = '';
        detailToSet = '';
        console.log('🟢 RICONOSCIUTO COME CATEGORIA');
        console.log('Categoria:', currentFolder.name, '(ID:', currentFolder.id, ')');
      } else {
        console.log('❌ SITUAZIONE NON RICONOSCIUTA');
        console.log('currentFolder.categoryId:', currentFolder.categoryId);
        console.log('currentFolder.subjectId:', currentFolder.subjectId);
        console.log('currentFolder.parentId:', currentFolder.parentId);
        console.log('currentFolder.name:', currentFolder.name);
      }
      
      console.log('🎯 Valori che verranno impostati:');
      console.log('  - categoryToSet:', categoryToSet);
      console.log('  - subjectToSet:', subjectToSet);
      console.log('  - detailToSet:', detailToSet);
      
      // Salva i valori nella ref che rimane stabile
      uploadParamsRef.current = {
        categoryId: categoryToSet,
        subjectId: subjectToSet || null,
        detailId: detailToSet || null
      };
      
      console.log('💾 Valori salvati nella ref:', uploadParamsRef.current);
      
      // Imposta i valori con un timeout per assicurarsi che gli altri useEffect abbiano terminato
      setTimeout(() => {
        console.log('🔧 Impostando i valori finali...');
        setSelectedCategory(categoryToSet);
        setSelectedSubject(subjectToSet);
        setSelectedDetail(detailToSet);
        setIsInitializing(false);
        
        console.log('✅ Valori impostati:');
        console.log('  - selectedCategory:', categoryToSet);
        console.log('  - selectedSubject:', subjectToSet);
        console.log('  - selectedDetail:', detailToSet);
      }, 200);
      
      console.log('=== FINE DEBUG ===');
    }
  }, [open, currentFolder, categories, subjects, details]);

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
    // Reset subject and detail when category changes, ma NON durante l'inizializzazione
    if (!isInitializing) {
      setSelectedSubject('');
      setSelectedDetail('');
    }
  }, [selectedCategory, subjects, isInitializing]);

  // Aggiorna i dettagli disponibili quando cambia il soggetto
  useEffect(() => {
    if (selectedSubject && details[selectedSubject]) {
      setAvailableDetails(details[selectedSubject]);
    } else {
      setAvailableDetails([]);
    }
    // Reset detail when subject changes, ma NON durante l'inizializzazione
    if (!isInitializing) {
      setSelectedDetail('');
    }
  }, [selectedSubject, details, isInitializing]);

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
    console.log('=== AVVIO UPLOAD ===');
    console.log('selectedCategory (state):', selectedCategory);
    console.log('selectedSubject (state):', selectedSubject);
    console.log('selectedDetail (state):', selectedDetail);
    console.log('🔍 Verifica valori prima dell\'upload:');
    console.log('  - selectedCategory è vuoto?', !selectedCategory);
    console.log('  - selectedSubject è vuoto?', !selectedSubject);
    console.log('  - selectedDetail è vuoto?', !selectedDetail);
    
    console.log('💾 Valori dalla ref:', uploadParamsRef.current);
    
    // Usa i valori dalla ref che sono stabili
    const { categoryId, subjectId, detailId } = uploadParamsRef.current;
    
    console.log('🎯 Valori finali per upload:');
    console.log('  - categoryId:', categoryId);
    console.log('  - subjectId:', subjectId);
    console.log('  - detailId:', detailId);
    
    if (!categoryId) {
      enqueueSnackbar('Errore nel riconoscimento della posizione corrente', { variant: 'error' });
      return;
    }

    if (files.length === 0) {
      enqueueSnackbar('Aggiungi almeno un file da caricare', { variant: 'warning' });
      return;
    }

    setLoading(true);
    
    try {
      const uploadPromises = files.map(file => {
        console.log('Caricando file:', file.name);
        console.log('Con parametri dalla ref - Category:', categoryId, 'Subject:', subjectId || 'null', 'Detail:', detailId || 'null');
        return uploadFile(
          db, 
          file, 
          categoryId,
          subjectId, 
          detailId
        );
      });
      
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
            disabled={!!currentFolder}
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
              disabled={!!currentFolder || availableSubjects.length === 0}
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
              disabled={!!currentFolder || availableDetails.length === 0}
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
  currentFolder: PropTypes.object,
};
