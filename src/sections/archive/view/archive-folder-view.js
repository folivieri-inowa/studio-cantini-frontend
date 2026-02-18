'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content';

import axios from 'src/utils/axios';

// Importa componenti dal file manager
import FileManagerFolderItem from 'src/sections/file-manager/file-manager-folder-item';
import FileManagerFileItem from 'src/sections/file-manager/file-manager-file-item';

// ----------------------------------------------------------------------

export default function ArchiveFolderView() {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const { db } = settings;

  // Stato navigazione
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog stati
  const newFolderDialog = useBoolean(false);
  const renameFolderDialog = useBoolean(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Menu contestuale
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Carica cartelle e documenti
  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      // Carica cartelle
      const foldersRes = await axios.get('/api/archive/folders', {
        params: { db, parentPath: currentPath },
      });
      setFolders(foldersRes.data.folders || []);

      // Carica documenti
      const docsRes = await axios.get('/api/archive/documents', {
        params: { db, folderPath: currentPath, limit: 100 },
      });
      setDocuments(docsRes.data.data || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      enqueueSnackbar('Errore caricamento dati', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [db, currentPath, enqueueSnackbar]);

  // Carica dati all'avvio e quando cambia il percorso
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Naviga in una cartella
  const navigateToFolder = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  // Torna indietro
  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  // Vai a root
  const navigateToRoot = () => {
    setCurrentPath('');
    setPathHistory([]);
  };

  // Crea nuova cartella
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await axios.post('/api/archive/folders', {
        db,
        folderName: newFolderName,
        parentPath: currentPath,
      });
      enqueueSnackbar('Cartella creata con successo', { variant: 'success' });
      setNewFolderName('');
      newFolderDialog.onFalse();
      loadData();
    } catch (error) {
      console.error('Errore creazione cartella:', error);
      enqueueSnackbar('Errore creazione cartella', { variant: 'error' });
    }
  };

  // Rinomina cartella
  const handleRenameFolder = async () => {
    if (!newFolderName.trim() || !selectedFolder) return;
    try {
      await axios.put('/api/archive/folders', {
        db,
        oldPath: selectedFolder.path,
        newName: newFolderName,
      });
      enqueueSnackbar('Cartella rinominata con successo', { variant: 'success' });
      setNewFolderName('');
      setSelectedFolder(null);
      renameFolderDialog.onFalse();
      loadData();
    } catch (error) {
      console.error('Errore rinomina cartella:', error);
      enqueueSnackbar('Errore rinomina cartella', { variant: 'error' });
    }
  };

  // Elimina cartella
  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la cartella "${folder.name}"?`)) return;
    try {
      await axios.delete('/api/archive/folders', {
        params: { db, folderPath: folder.path },
      });
      enqueueSnackbar('Cartella eliminata con successo', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Errore eliminazione cartella:', error);
      enqueueSnackbar(error.response?.data?.message || 'Errore eliminazione cartella', { variant: 'error' });
    }
  };

  // Apri menu contestuale
  const handleMenuOpen = (event, folder) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedFolder(folder);
  };

  // Chiudi menu contestuale
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFolder(null);
  };

  // Breadcrumb items
  const breadcrumbItems = currentPath.split('/').filter(Boolean);

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Archivio Documenti</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:folder-add-fill" />}
              onClick={newFolderDialog.onTrue}
            >
              Nuova Cartella
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            >
              Carica
            </Button>
          </Stack>
        </Stack>

        {/* Breadcrumbs */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {currentPath && (
            <IconButton onClick={navigateBack} size="small">
              <Iconify icon="eva:arrow-back-fill" />
            </IconButton>
          )}
          <Breadcrumbs>
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', color: 'primary.main' }}
              onClick={navigateToRoot}
            >
              Archivio
            </Typography>
            {breadcrumbItems.map((item, index) => (
              <Typography
                key={index}
                variant="body2"
                color={index === breadcrumbItems.length - 1 ? 'text.primary' : 'primary.main'}
                sx={{ cursor: index === breadcrumbItems.length - 1 ? 'default' : 'pointer' }}
              >
                {item}
              </Typography>
            ))}
          </Breadcrumbs>
        </Stack>

        {/* Cartelle */}
        {folders.length > 0 && (
          <>
            <Typography variant="h6">
              Cartelle ({folders.length})
            </Typography>
            <Grid container spacing={2}>
              {folders.map((folder) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={folder.path}>
                  <Box position="relative">
                    <FileManagerFolderItem
                      folder={{
                        name: folder.name,
                        fileCount: 0,
                        subfolderCount: 0,
                      }}
                      onOpen={() => navigateToFolder(folder.name)}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, folder)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                      }}
                    >
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Documenti */}
        <Typography variant="h6" sx={{ mt: folders.length > 0 ? 4 : 0 }}>
          Documenti ({documents.length})
        </Typography>
        {documents.length === 0 ? (
          <EmptyContent
            title="Nessun documento"
            description="Questa cartella è vuota. Carica un documento per iniziare."
            img="/assets/icons/empty/ic_folder_empty.svg"
          />
        ) : (
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <FileManagerFileItem
                  file={{
                    name: doc.original_filename,
                    size: doc.file_size,
                    type: doc.mime_type,
                    modifiedDate: doc.created_at,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Menu contestuale cartella */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setNewFolderName(selectedFolder?.name || '');
            renameFolderDialog.onTrue();
          }}
        >
          <ListItemIcon>
            <Iconify icon="eva:edit-2-fill" />
          </ListItemIcon>
          <ListItemText primary="Rinomina" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleDeleteFolder(selectedFolder);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Iconify icon="eva:trash-2-fill" color="error.main" />
          </ListItemIcon>
          <ListItemText primary="Elimina" />
        </MenuItem>
      </Menu>

      {/* Dialog nuova cartella */}
      <Dialog open={newFolderDialog.value} onClose={newFolderDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>Nuova Cartella</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome cartella"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={newFolderDialog.onFalse}>Annulla</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
            Crea
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog rinomina cartella */}
      <Dialog open={renameFolderDialog.value} onClose={renameFolderDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>Rinomina Cartella</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuovo nome"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={renameFolderDialog.onFalse}>Annulla</Button>
          <Button variant="contained" onClick={handleRenameFolder} disabled={!newFolderName.trim()}>
            Rinomina
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
