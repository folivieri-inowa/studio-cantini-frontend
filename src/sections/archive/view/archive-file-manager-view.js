'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content';
import FileThumbnail from 'src/components/file-thumbnail';

import axios from 'src/utils/axios';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import DocumentUploadDialog from '../document-upload-dialog-new';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';

import { retryDocumentProcessing, clearAllArchiveDocuments } from 'src/api/archive';

// ----------------------------------------------------------------------

// Mostra Reset Archivio solo in sviluppo o con flag esplicito
const SHOW_RESET_BUTTON = process.env.NEXT_PUBLIC_SHOW_RESET_BUTTON === 'true' || process.env.NODE_ENV === 'development';

// Utility per formattare la dimensione file
const fData = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / (1024 ** i)).toFixed(2)} ${units[i]}`;
};

// Utility per formattare la data
const fDate = (date) => {
  if (!date) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(date).toLocaleDateString('it-IT', options);
};

// Componente Cartella (stile FileManager)
function ArchiveFolderItem({ folder, onOpen, onMenuClick, sx }) {
  return (
    <Paper
      variant="outlined"
      onClick={onOpen}
      sx={{
        p: 2.5,
        borderRadius: 2,
        cursor: 'pointer',
        position: 'relative',
        '&:hover': { bgcolor: 'action.hover' },
        ...sx,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box
            component="img"
            src="/assets/icons/files/ic_folder.svg"
            sx={{ width: 48, height: 48 }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(e, folder);
            }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>

        <Box>
          <Typography variant="subtitle1" noWrap>
            {folder.name}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {folder.itemCount || 0} elementi
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// Componente File (stile FileManager)
function ArchiveFileItem({ file, onClick, onMenuClick }) {
  const getFileType = (fileName) => {
    if (!fileName) return 'file';
    const extension = fileName.split('.').pop().toLowerCase();
    const fileTypeMap = {
      pdf: 'pdf', doc: 'word', docx: 'word', txt: 'txt',
      xls: 'excel', xlsx: 'excel', csv: 'csv',
      jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif',
      mp3: 'audio', mp4: 'video', zip: 'zip',
    };
    return fileTypeMap[extension] || 'file';
  };

  // Mappa degli stati per visualizzazione
  const getStatusConfig = (status) => {
    const configs = {
      failed: { label: 'Errore', color: 'error', icon: 'eva:alert-circle-fill' },
      pending: { label: 'In Attesa', color: 'warning', icon: 'eva:clock-fill' },
      completed: { label: 'Pronto', color: 'success', icon: 'eva:checkmark-circle-2-fill' },
      ocr_in_progress: { label: 'OCR...', color: 'info', icon: 'eva:loader-outline' },
      ocr_completed: { label: 'OCR OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
      cleaning_in_progress: { label: 'Cleaning...', color: 'info', icon: 'eva:loader-outline' },
      cleaning_completed: { label: 'Cleaning OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
      embedding_in_progress: { label: 'Embedding...', color: 'info', icon: 'eva:loader-outline' },
      embedding_completed: { label: 'Embedding OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
    };
    return configs[status] || { label: status, color: 'default', icon: 'eva:question-mark-circle-fill' };
  };

  const statusConfig = getStatusConfig(file.status);
  const isFailed = file.status === 'failed';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        cursor: 'pointer',
        textAlign: 'center',
        '&:hover': { bgcolor: 'action.hover' },
        ...(isFailed && {
          borderColor: 'error.main',
          bgcolor: 'error.lighter',
        }),
      }}
      onClick={onClick}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          {/* Stato del documento */}
          <Chip
            icon={<Iconify icon={statusConfig.icon} />}
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            variant={isFailed ? 'filled' : 'soft'}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { fontSize: 16 },
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(e, file);
            }}
          >
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>

        <FileThumbnail
          file={getFileType(file.name)}
          sx={{ width: 56, height: 56, mx: 'auto' }}
        />

        <Typography variant="subtitle2" noWrap>
          {file.name}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{ typography: 'caption', color: 'text.disabled' }}
        >
          <span>{fData(file.size)}</span>
          <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'currentColor' }} />
          <span>{fDate(file.date)}</span>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ----------------------------------------------------------------------

export default function ArchiveFileManagerView() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const { db } = settings;
  const router = useRouter();

  // Stato navigazione
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drawer per dettagli file
  const [selectedFile, setSelectedFile] = useState(null);
  const detailsDrawer = useBoolean(false);

  // Dialog stati
  const newFolderDialog = useBoolean(false);
  const renameFolderDialog = useBoolean(false);
  const renameFileDialog = useBoolean(false);
  const moveDialog = useBoolean(false);
  const uploadDialog = useBoolean(false);
  const previewDialog = useBoolean(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFileForAction, setSelectedFileForAction] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [moveTargetFolder, setMoveTargetFolder] = useState('');

  // Stato ricerca
  const [searchQuery, setSearchQuery] = useState('');

  // Menu contestuale
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Carica cartelle e documenti
  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const [foldersRes, docsRes] = await Promise.all([
        axios.get('/api/archive/folders', { params: { db, parentPath: currentPath } }),
        axios.get('/api/archive/documents', { params: { db, folderPath: currentPath, limit: 100 } }),
      ]);

      // Conta elementi per cartella
      const foldersWithCount = await Promise.all(
        (foldersRes.data.folders || []).map(async (folder) => {
          try {
            const countRes = await axios.get('/api/archive/documents', {
              params: { db, folderPath: folder.path, limit: 1 },
            });
            return { ...folder, itemCount: countRes.data.pagination?.total || 0 };
          } catch {
            return { ...folder, itemCount: 0 };
          }
        })
      );

      setFolders(foldersWithCount);
      setDocuments(docsRes.data.data || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      enqueueSnackbar('Errore caricamento dati', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [db, currentPath, enqueueSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigazione
  const navigateToFolder = (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  const navigateToRoot = () => {
    setCurrentPath('');
    setPathHistory([]);
  };

  const navigateToBreadcrumb = (index) => {
    const parts = currentPath.split('/').filter(Boolean);
    const newPath = parts.slice(0, index + 1).join('/');
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  // Gestione cartelle
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
      enqueueSnackbar('Errore creazione cartella', { variant: 'error' });
    }
  };

  const handleRenameFolder = async () => {
    if (!newFolderName.trim() || !selectedFolder) return;
    try {
      await axios.put('/api/archive/folders', {
        db,
        oldPath: selectedFolder.path,
        newName: newFolderName,
      });
      enqueueSnackbar('Cartella rinominata', { variant: 'success' });
      setNewFolderName('');
      renameFolderDialog.onFalse();
      loadData();
    } catch (error) {
      enqueueSnackbar('Errore rinomina', { variant: 'error' });
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Eliminare "${folder.name}"?`)) return;
    try {
      await axios.delete('/api/archive/folders', {
        params: { db, folderPath: folder.path },
      });
      enqueueSnackbar('Cartella eliminata', { variant: 'success' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Errore eliminazione', { variant: 'error' });
    }
  };

  // Menu contestuale
  const handleMenuOpen = (event, target) => {
    setAnchorEl(event.currentTarget);
    setMenuTarget(target);
    if (target.path) setSelectedFolder(target);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

  // Apertura dettagli file
  const handleFileClick = (file) => {
    setSelectedFile(file);
    detailsDrawer.onTrue();
  };

  // Gestione file - Rinomina
  const handleRenameFile = async () => {
    if (!newFileName.trim() || !selectedFileForAction) return;
    try {
      await axios.put('/api/archive/documents/rename', {
        db,
        documentId: selectedFileForAction.id,
        newName: newFileName,
      });
      enqueueSnackbar('File rinominato', { variant: 'success' });
      setNewFileName('');
      renameFileDialog.onFalse();
      loadData();
    } catch (error) {
      enqueueSnackbar('Errore rinomina file', { variant: 'error' });
    }
  };

  // Gestione file - Elimina
  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Eliminare "${file.original_filename || file.name}"?`)) return;
    try {
      await axios.delete(`/api/archive/documents/${file.id}`, { params: { db } });
      enqueueSnackbar('File eliminato', { variant: 'success' });
      loadData();
      if (detailsDrawer.value) detailsDrawer.onFalse();
    } catch (error) {
      enqueueSnackbar('Errore eliminazione file', { variant: 'error' });
    }
  };

  // Gestione file - Download
  const handleDownloadFile = async (file) => {
    try {
      const response = await axios.get(`/api/archive/documents/${file.id}/download`, {
        params: { db },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_filename || file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      enqueueSnackbar('Errore download file', { variant: 'error' });
    }
  };

  // Gestione file - Sposta
  const handleMoveFile = async () => {
    if (moveTargetFolder === undefined || !selectedFileForAction) return;
    try {
      await axios.put('/api/archive/documents/move', {
        db,
        documentId: selectedFileForAction.id,
        targetFolder: moveTargetFolder,
      });
      enqueueSnackbar('File spostato', { variant: 'success' });
      setMoveTargetFolder('');
      moveDialog.onFalse();
      detailsDrawer.onFalse(); // Chiudi il drawer dopo lo sposta
      loadData();
    } catch (error) {
      enqueueSnackbar('Errore spostamento file', { variant: 'error' });
    }
  };

  // Gestione file - Anteprima
  const handlePreviewFile = (file) => {
    setSelectedFileForAction(file);
    previewDialog.onTrue();
  };

  // Gestione file - Retry
  const handleRetryFile = async (file) => {
    try {
      await retryDocumentProcessing(file.id, db);
      enqueueSnackbar('Documento rimesso in coda per il processamento', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Errore retry:', error);
      enqueueSnackbar(error.response?.data?.message || 'Errore durante il retry', { variant: 'error' });
    }
  };

  // Reset tutti i documenti (TEMPORANEO - per sviluppo)
  const handleClearAll = async () => {
    if (!window.confirm('ATTENZIONE: Questo eliminerà TUTTI i documenti dall\'archivio. Sei sicuro?')) {
      return;
    }
    try {
      const result = await clearAllArchiveDocuments(db);
      enqueueSnackbar(result.message || 'Tutti i documenti eliminati', { variant: 'success' });
      loadData();
    } catch (error) {
      console.error('Errore clear-all:', error);
      enqueueSnackbar(error.response?.data?.message || 'Errore durante la cancellazione', { variant: 'error' });
    }
  };

  // Breadcrumb
  const breadcrumbItems = currentPath.split('/').filter(Boolean);

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h4">Archivio Documenti</Typography>
          <Stack direction="row" spacing={1} flex={1} justifyContent="flex-end">
            <TextField
              size="small"
              placeholder="Cerca nei documenti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`${paths.dashboard.archive.search}?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: 150, sm: 250, md: 350 } }}
            />
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
              onClick={uploadDialog.onTrue}
            >
              Carica
            </Button>
            <Button
              variant="soft"
              color="info"
              startIcon={<Iconify icon="eva:search-fill" />}
              onClick={() => router.push(paths.dashboard.archive.search)}
            >
              Ricerca Avanzata
            </Button>
            {/* Bottone reset archivio - solo in development o con NEXT_PUBLIC_SHOW_RESET_BUTTON=true */}
            {SHOW_RESET_BUTTON && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Iconify icon="eva:trash-2-fill" />}
              onClick={handleClearAll}
              sx={{ ml: 1 }}
            >
              Reset Archivio
            </Button>
            )}
          </Stack>
        </Stack>

        {/* Breadcrumbs e navigazione */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {currentPath && (
            <Tooltip title="Indietro">
              <IconButton onClick={navigateBack} size="small">
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
            </Tooltip>
          )}

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' },
              }}
              onClick={navigateToRoot}
            >
              Archivio
            </Typography>

            {breadcrumbItems.map((item, index) => (
              <Stack key={index} direction="row" alignItems="center" spacing={1}>
                <Iconify icon="eva:chevron-right-fill" sx={{ color: 'text.disabled', fontSize: 16 }} />
                <Typography
                  variant="body2"
                  sx={{
                    cursor: index === breadcrumbItems.length - 1 ? 'default' : 'pointer',
                    color: index === breadcrumbItems.length - 1 ? 'text.primary' : 'primary.main',
                    '&:hover': index === breadcrumbItems.length - 1 ? {} : { textDecoration: 'underline' },
                  }}
                  onClick={() => index !== breadcrumbItems.length - 1 && navigateToBreadcrumb(index)}
                >
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Cartelle */}
        {folders.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Cartelle ({folders.length})
            </Typography>
            <Grid container spacing={2}>
              {folders.map((folder) => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={folder.path}>
                  <ArchiveFolderItem
                    folder={folder}
                    onOpen={() => navigateToFolder(folder.name)}
                    onMenuClick={handleMenuOpen}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Documenti */}
        <Typography variant="h6" sx={{ mt: folders.length > 0 ? 4 : 2 }}>
          Documenti ({documents.length})
        </Typography>

        {documents.length === 0 ? (
          <EmptyContent
            title="Nessun documento"
            description="Questa cartella è vuota"
            img="/assets/icons/empty/ic_folder_empty.svg"
            sx={{ py: 8 }}
          />
        ) : (
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={doc.id}>
                <ArchiveFileItem
                  file={{
                    id: doc.id,
                    name: doc.original_filename,
                    size: doc.file_size,
                    type: doc.mime_type,
                    date: doc.created_at,
                    status: doc.processing_status,
                    errorMessage: doc.error_message,
                  }}
                  onClick={() => handleFileClick(doc)}
                  onMenuClick={handleMenuOpen}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Drawer dettagli file (apertura laterale da destra) */}
      <Drawer
        anchor="right"
        open={detailsDrawer.value}
        onClose={detailsDrawer.onFalse}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
      >
        <Stack spacing={2} sx={{ p: 3, height: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Dettagli</Typography>
            <IconButton onClick={detailsDrawer.onFalse}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>

          <Divider />

          {selectedFile && (
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <FileThumbnail
                  file={selectedFile.name?.split('.').pop() || 'file'}
                  sx={{ width: 80, height: 80, mx: 'auto' }}
                />
              </Box>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nome file
                </Typography>
                <Typography variant="body1">{selectedFile.original_filename || selectedFile.name}</Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Dimensione
                </Typography>
                <Typography variant="body1">{fData(selectedFile.file_size || selectedFile.size)}</Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo
                </Typography>
                <Typography variant="body1">{selectedFile.mime_type || selectedFile.type}</Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data creazione
                </Typography>
                <Typography variant="body1">{fDate(selectedFile.created_at || selectedFile.date)}</Typography>
              </Stack>

              {/* Stato processamento */}
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Stato processamento
                </Typography>
                {selectedFile.processing_status === 'failed' ? (
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Chip
                      icon={<Iconify icon="eva:alert-circle-fill" />}
                      label="Processamento fallito"
                      color="error"
                      size="small"
                    />
                    {selectedFile.error_message && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                        {selectedFile.error_message}
                      </Typography>
                    )}
                  </Stack>
                ) : selectedFile.processing_status === 'completed' ? (
                  <Chip
                    icon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                    label="Processato"
                    color="success"
                    size="small"
                    variant="soft"
                  />
                ) : (
                  <Chip
                    icon={<Iconify icon="eva:loader-outline" />}
                    label={selectedFile.processing_status?.replace(/_/g, ' ') || 'In attesa'}
                    color="info"
                    size="small"
                    variant="soft"
                  />
                )}
              </Stack>

              <Box flex={1} />

              <Stack spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:eye-fill" />}
                  onClick={() => handlePreviewFile(selectedFile)}
                >
                  Anteprima
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:download-fill" />}
                  onClick={() => handleDownloadFile(selectedFile)}
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:edit-2-fill" />}
                  onClick={() => {
                    setSelectedFileForAction(selectedFile);
                    setNewFileName(selectedFile.original_filename || selectedFile.name);
                    renameFileDialog.onTrue();
                  }}
                >
                  Rinomina
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:folder-move-fill" />}
                  onClick={() => {
                    setSelectedFileForAction(selectedFile);
                    setMoveTargetFolder('');
                    moveDialog.onTrue();
                  }}
                >
                  Sposta
                </Button>
                {/* Bottone Retry nel drawer - visibile solo per documenti falliti */}
                {selectedFile.processing_status === 'failed' && (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Iconify icon="eva:refresh-fill" />}
                    onClick={() => handleRetryFile(selectedFile)}
                  >
                    Riprova processamento
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Iconify icon="eva:trash-2-fill" />}
                  onClick={() => handleDeleteFile(selectedFile)}
                >
                  Elimina
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Drawer>

      {/* Menu contestuale */}
      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        {menuTarget?.path ? [
          // Menu per cartelle
          <MenuItem
            key="rename-folder"
            onClick={() => {
              handleMenuClose();
              setNewFolderName(menuTarget.name);
              renameFolderDialog.onTrue();
            }}
          >
            <ListItemIcon>
              <Iconify icon="eva:edit-2-fill" />
            </ListItemIcon>
            <ListItemText primary="Rinomina" />
          </MenuItem>,
          <MenuItem
            key="delete-folder"
            onClick={() => {
              handleMenuClose();
              handleDeleteFolder(menuTarget);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Iconify icon="eva:trash-2-fill" color="error.main" />
            </ListItemIcon>
            <ListItemText primary="Elimina" />
          </MenuItem>
        ] : menuTarget?.id ? [
          // Menu per file
          <MenuItem
            key="preview"
            onClick={() => {
              handleMenuClose();
              handlePreviewFile(menuTarget);
            }}
          >
            <ListItemIcon>
              <Iconify icon="eva:eye-fill" />
            </ListItemIcon>
            <ListItemText primary="Anteprima" />
          </MenuItem>,
          <MenuItem
            key="download"
            onClick={() => {
              handleMenuClose();
              handleDownloadFile(menuTarget);
            }}
          >
            <ListItemIcon>
              <Iconify icon="eva:download-fill" />
            </ListItemIcon>
            <ListItemText primary="Download" />
          </MenuItem>,
          <MenuItem
            key="rename-file"
            onClick={() => {
              handleMenuClose();
              setSelectedFileForAction(menuTarget);
              setNewFileName(menuTarget.original_filename || menuTarget.name);
              renameFileDialog.onTrue();
            }}
          >
            <ListItemIcon>
              <Iconify icon="eva:edit-2-fill" />
            </ListItemIcon>
            <ListItemText primary="Rinomina" />
          </MenuItem>,
          <MenuItem
            key="move"
            onClick={() => {
              handleMenuClose();
              setSelectedFileForAction(menuTarget);
              setMoveTargetFolder('');
              moveDialog.onTrue();
            }}
          >
            <ListItemIcon>
              <Iconify icon="eva:folder-move-fill" />
            </ListItemIcon>
            <ListItemText primary="Sposta" />
          </MenuItem>,
          // Bottone Retry - visibile solo per documenti falliti
          menuTarget?.processing_status === 'failed' && (
            <MenuItem
              key="retry"
              onClick={() => {
                handleMenuClose();
                handleRetryFile(menuTarget);
              }}
              sx={{ color: 'warning.main' }}
            >
              <ListItemIcon>
                <Iconify icon="eva:refresh-fill" color="warning.main" />
              </ListItemIcon>
              <ListItemText primary="Riprova processamento" />
            </MenuItem>
          ),
          <MenuItem
            key="delete-file"
            onClick={() => {
              handleMenuClose();
              handleDeleteFile(menuTarget);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Iconify icon="eva:trash-2-fill" color="error.main" />
            </ListItemIcon>
            <ListItemText primary="Elimina" />
          </MenuItem>
        ] : null}
      </Menu>

      {/* Dialog nuova cartella */}
      <Dialog open={newFolderDialog.value} onClose={newFolderDialog.onFalse} maxWidth="xs" fullWidth>
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
      <Dialog open={renameFolderDialog.value} onClose={renameFolderDialog.onFalse} maxWidth="xs" fullWidth>
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

      {/* Dialog upload documenti */}
      <DocumentUploadDialog
        open={uploadDialog.value}
        onClose={uploadDialog.onFalse}
        db={db}
        currentPath={currentPath}
        onSuccess={() => {
          uploadDialog.onFalse();
          loadData();
        }}
      />

      {/* Dialog rinomina file */}
      <Dialog open={renameFileDialog.value} onClose={renameFileDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Rinomina File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuovo nome"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={renameFileDialog.onFalse}>Annulla</Button>
          <Button variant="contained" onClick={handleRenameFile} disabled={!newFileName.trim()}>
            Rinomina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog sposta file */}
      <Dialog open={moveDialog.value} onClose={moveDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>Sposta File</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleziona la cartella di destinazione per "{selectedFileForAction?.original_filename || selectedFileForAction?.name}"
          </Typography>

          <Autocomplete
            fullWidth
            value={folders.find(f => f.path === moveTargetFolder) || null}
            onChange={(event, newValue) => setMoveTargetFolder(newValue?.path || '')}
            options={[{ name: '📁 Root (Archivio)', path: '' }, ...folders]}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon={option.path === '' ? 'eva:home-fill' : 'eva:folder-fill'} color={option.path === '' ? 'primary.main' : 'warning.main'} />
                <Typography>{option.name}</Typography>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cartella destinazione"
                placeholder="Cerca cartella..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: moveTargetFolder ? (
                    <Iconify icon="eva:folder-fill" color="warning.main" sx={{ ml: 1 }} />
                  ) : (
                    <Iconify icon="eva:home-fill" color="primary.main" sx={{ ml: 1 }} />
                  ),
                }}
              />
            )}
            sx={{ mt: 1 }}
          />

          {folders.length > 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: 'block' }}>
                Cartelle disponibili:
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense disablePadding>
                  <ListItemButton
                    selected={moveTargetFolder === ''}
                    onClick={() => setMoveTargetFolder('')}
                    sx={{ borderLeft: moveTargetFolder === '' ? 3 : 0, borderColor: 'primary.main' }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Iconify icon="eva:home-fill" color="primary.main" />
                    </ListItemIcon>
                    <ListItemText primary="Root (Archivio)" />
                    {moveTargetFolder === '' && <Iconify icon="eva:checkmark-fill" color="primary.main" />}
                  </ListItemButton>
                  {folders.map((folder) => (
                    <ListItemButton
                      key={folder.path}
                      selected={moveTargetFolder === folder.path}
                      onClick={() => setMoveTargetFolder(folder.path)}
                      sx={{ borderLeft: moveTargetFolder === folder.path ? 3 : 0, borderColor: 'primary.main' }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Iconify icon="eva:folder-fill" color="warning.main" />
                      </ListItemIcon>
                      <ListItemText primary={folder.name} />
                      {moveTargetFolder === folder.path && <Iconify icon="eva:checkmark-fill" color="primary.main" />}
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={moveDialog.onFalse}>Annulla</Button>
          <Button
            variant="contained"
            onClick={handleMoveFile}
            startIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Sposta in {moveTargetFolder ? folders.find(f => f.path === moveTargetFolder)?.name || 'cartella' : 'Root'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog anteprima file */}
      <Dialog
        open={previewDialog.value}
        onClose={previewDialog.onFalse}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" noWrap sx={{ maxWidth: 400 }}>
              {selectedFileForAction?.original_filename || selectedFileForAction?.name}
            </Typography>
            <IconButton onClick={previewDialog.onFalse}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
          {selectedFileForAction?.mime_type?.startsWith('image/') ? (
            <Box
              component="img"
              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9002'}/v1/archive/files/${selectedFileForAction?.storage_path}`}
              alt={selectedFileForAction?.original_filename}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : selectedFileForAction?.mime_type === 'application/pdf' ? (
            <Box
              component="iframe"
              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9002'}/v1/archive/files/${selectedFileForAction?.storage_path}`}
              sx={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Stack alignItems="center" spacing={2}>
              <FileThumbnail
                file={selectedFileForAction?.original_filename?.split('.').pop() || 'file'}
                sx={{ width: 120, height: 120 }}
              />
              <Typography variant="body1" color="text.secondary">
                Anteprima non disponibile per questo tipo di file
              </Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:download-fill" />}
                onClick={() => handleDownloadFile(selectedFileForAction)}
              >
                Scarica File
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={previewDialog.onFalse}>Chiudi</Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:download-fill" />}
            onClick={() => handleDownloadFile(selectedFileForAction)}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
