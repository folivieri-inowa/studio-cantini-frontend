'use client';

import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';
import { fData } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { Upload } from 'src/components/upload';

// ----------------------------------------------------------------------

export default function DocumentUploadDialog({ open, onClose, db, currentPath = '', onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const uploading = useBoolean();

  const [files, setFiles] = useState([]);

  const handleDrop = useCallback((acceptedFiles) => {
    // Mantieni i file con il loro path relativo
    const filesWithPath = acceptedFiles.map((file) => {
      // In alcuni browser, webkitRelativePath contiene il path completo
      const relativePath = file.webkitRelativePath || file.path || file.name;
      
      return {
        file,
        path: relativePath,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      };
    });

    setFiles((prev) => [...prev, ...filesWithPath]);
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // Revoca URL preview se esiste
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const handleRemoveAllFiles = useCallback(() => {
    // Revoca tutti gli URL preview
    files.forEach((f) => {
      if (f.preview) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
  }, [files]);

  const extractFolderInfo = (filePath) => {
    // Rimuovi il path relativo che inizia con "./" o contiene solo "."
    let cleanPath = filePath.replace(/^\.\//, '').replace(/^\.+$/, '');
    const parts = cleanPath.split('/').filter(Boolean);
    
    if (parts.length === 1) {
      // File nella root
      return {
        folderPath: currentPath || '',
        folderPathArray: currentPath ? currentPath.split('/').filter(Boolean) : [],
        parentFolder: currentPath ? currentPath.split('/').filter(Boolean).pop() : null,
        cleanFilename: parts[0],
      };
    }
    
    // File in sottocartelle
    const folders = parts.slice(0, -1);
    const filename = parts[parts.length - 1];
    const fullPath = currentPath ? `${currentPath}/${folders.join('/')}` : folders.join('/');
    
    return {
      folderPath: fullPath,
      folderPathArray: fullPath.split('/').filter(Boolean),
      parentFolder: folders[folders.length - 1],
      cleanFilename: filename,
    };
  };

  const handleUpload = useCallback(async () => {
    if (!files.length || !db) {
      enqueueSnackbar('Seleziona almeno un file', { variant: 'error' });
      return;
    }

    try {
      uploading.onTrue();

      let successCount = 0;
      let errorCount = 0;

      // Upload sequenziale dei file
      for (const fileData of files) {
        try {
          const folderInfo = extractFolderInfo(fileData.path);
          
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('db', db);
          formData.append('title', folderInfo.cleanFilename); // Usa il nome file come titolo
          
          // Aggiungi informazioni sulla cartella solo se non vuote
          if (folderInfo.folderPath && folderInfo.folderPath !== '') {
            formData.append('folderPath', folderInfo.folderPath);
          }
          if (folderInfo.folderPathArray && folderInfo.folderPathArray.length > 0) {
            formData.append('folderPathArray', JSON.stringify(folderInfo.folderPathArray));
          }
          if (folderInfo.parentFolder && folderInfo.parentFolder !== '') {
            formData.append('parentFolder', folderInfo.parentFolder);
          }

          await axios.post(endpoints.archive.upload, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          successCount++;
        } catch (err) {
          console.error(`Errore upload ${fileData.name}:`, err);
          errorCount++;
        }
      }

      // Feedback all'utente
      if (successCount > 0) {
        enqueueSnackbar(
          `${successCount} file caricati con successo${errorCount > 0 ? ` (${errorCount} errori)` : ''}`,
          { variant: successCount === files.length ? 'success' : 'warning' }
        );
      } else {
        enqueueSnackbar('Errore durante il caricamento', { variant: 'error' });
      }

      // Pulisci e chiudi
      handleRemoveAllFiles();
      onClose();
      
      if (onSuccess && successCount > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Errore upload:', error);
      enqueueSnackbar('Errore durante il caricamento', { variant: 'error' });
    } finally {
      uploading.onFalse();
    }
  }, [files, db, currentPath, enqueueSnackbar, uploading, onClose, onSuccess, handleRemoveAllFiles]);

  const handleClose = () => {
    handleRemoveAllFiles();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Carica Documenti
        {currentPath && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Cartella: {currentPath}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Suggerimento
            </Typography>
            <Typography variant="body2">
              Organizza i file sul tuo computer in cartelle (es: autovetture/Mercedes/assicurazione/polizza.pdf)
              e carica la cartella intera. La struttura verrà mantenuta automaticamente!
            </Typography>
          </Alert>

          <Upload
            multiple
            files={files.map((f) => f.preview || f.file)}
            onDrop={handleDrop}
            onRemove={(file) => {
              const index = files.findIndex((f) => f.file === file || f.preview === file);
              if (index !== -1) {
                handleRemoveFile(index);
              }
            }}
            accept={{
              'image/*': [],
              'application/pdf': ['.pdf'],
            }}
          />

          {files.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  {files.length} {files.length === 1 ? 'file selezionato' : 'file selezionati'}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                  onClick={handleRemoveAllFiles}
                >
                  Rimuovi Tutti
                </Button>
              </Stack>

              <List dense sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.neutral', borderRadius: 1 }}>
                {files.map((fileData, index) => {
                  const folderInfo = extractFolderInfo(fileData.path);
                  
                  return (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small" 
                          onClick={() => handleRemoveFile(index)}
                        >
                          <Iconify icon="solar:close-circle-bold" />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Iconify
                          icon={
                            fileData.type.includes('pdf')
                              ? 'vscode-icons:file-type-pdf2'
                              : fileData.type.includes('image')
                                ? 'vscode-icons:file-type-image'
                                : 'vscode-icons:default-file'
                          }
                          width={32}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {fileData.name}
                            </Typography>
                            <Chip label={fData(fileData.size)} size="small" variant="soft" />
                          </Stack>
                        }
                        secondary={
                          folderInfo.folderPath && (
                            <Typography variant="caption" color="text.secondary">
                              📁 {folderInfo.folderPath}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Annulla
        </Button>
        <LoadingButton
          variant="contained"
          loading={uploading.value}
          onClick={handleUpload}
          disabled={files.length === 0}
        >
          Carica {files.length > 0 && `(${files.length})`}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

DocumentUploadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  db: PropTypes.string.isRequired,
  currentPath: PropTypes.string,
  onSuccess: PropTypes.func,
};
