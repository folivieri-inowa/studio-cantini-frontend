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
import Autocomplete from '@mui/material/Autocomplete';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content';
import FileThumbnail from 'src/components/file-thumbnail';

import axios from 'src/utils/axios';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import DocumentUploadDialog from '../document-upload-dialog';

import { retryDocumentProcessing, clearAllArchiveDocuments } from 'src/api/archive';

// ----------------------------------------------------------------------

const SHOW_RESET_BUTTON =
  process.env.NEXT_PUBLIC_SHOW_RESET_BUTTON === 'true' ||
  process.env.NODE_ENV === 'development';

// Utility dimensione file
const fData = (size) => {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// Utility data
const fDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Mappa stati documento
const STATUS_CONFIG = {
  failed: { label: 'Errore', color: 'error', icon: 'eva:alert-circle-fill' },
  pending: { label: 'In Attesa', color: 'warning', icon: 'eva:clock-fill' },
  completed: { label: 'Pronto', color: 'success', icon: 'eva:checkmark-circle-2-fill' },
  ocr_in_progress: { label: 'OCR', color: 'info', icon: 'eva:loader-outline' },
  ocr_completed: { label: 'OCR OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
  cleaning_in_progress: { label: 'Pulizia', color: 'info', icon: 'eva:loader-outline' },
  cleaning_completed: { label: 'Pulizia OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
  embedding_in_progress: { label: 'Embedding', color: 'info', icon: 'eva:loader-outline' },
  embedding_completed: { label: 'Embedding OK', color: 'info', icon: 'eva:checkmark-circle-2-fill' },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || { label: status || '—', color: 'default', icon: 'eva:question-mark-circle-fill' };

const getFileType = (fileName) => {
  if (!fileName) return 'file';
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map = {
    pdf: 'pdf', doc: 'word', docx: 'word', txt: 'txt',
    xls: 'excel', xlsx: 'excel', csv: 'csv',
    jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif',
    mp3: 'audio', mp4: 'video', zip: 'zip',
  };
  return map[ext] || 'file';
};

// ----------------------------------------------------------------------
// Componente Cartella

function ArchiveFolderItem({ folder, onOpen, onMenuClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onOpen}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.light',
          transform: 'translateY(-1px)',
          boxShadow: 2,
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box
            component="img"
            src="/assets/icons/files/ic_folder.svg"
            sx={{ width: 44, height: 44 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(e, folder);
            }}
            sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, mt: -0.5, mr: -0.5 }}
          >
            <Iconify icon="eva:more-vertical-fill" width={16} />
          </IconButton>
        </Stack>

        <Box>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            {folder.name}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {folder.itemCount != null ? `${folder.itemCount} element${folder.itemCount === 1 ? 'o' : 'i'}` : '—'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// ----------------------------------------------------------------------
// Componente File

function ArchiveFileItem({ file, onClick, onMenuClick }) {
  const statusConfig = getStatusConfig(file.status);
  const isFailed = file.status === 'failed';
  const isProcessing = ['ocr_in_progress', 'cleaning_in_progress', 'embedding_in_progress'].includes(file.status);

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'translateY(-1px)',
          boxShadow: 2,
          ...(!isFailed && { borderColor: 'primary.light' }),
        },
        ...(isFailed && {
          borderColor: 'error.light',
          bgcolor: 'error.lighter',
        }),
      }}
    >
      <Stack spacing={1}>
        {/* Riga superiore: stato + menu */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Chip
            icon={<Iconify icon={statusConfig.icon} width={12} />}
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            variant={isFailed ? 'filled' : 'soft'}
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 600,
              '& .MuiChip-icon': { fontSize: 12, ml: '4px' },
              '& .MuiChip-label': { px: '6px' },
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(e, file);
            }}
            sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, mt: -0.5, mr: -0.5 }}
          >
            <Iconify icon="eva:more-vertical-fill" width={16} />
          </IconButton>
        </Stack>

        {/* Icona file */}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
          <FileThumbnail
            file={getFileType(file.name)}
            sx={{ width: 48, height: 48 }}
          />
        </Box>

        {/* Nome file */}
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.3 }}
        >
          {file.name || '—'}
        </Typography>

        {/* Metadati */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.75}
          sx={{ color: 'text.disabled' }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {fData(file.size)}
          </Typography>
          <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {fDate(file.date)}
          </Typography>
        </Stack>

        {/* Barra di progresso per documenti in elaborazione */}
        {isProcessing && (
          <LinearProgress
            sx={{ height: 2, borderRadius: 1, mt: 0.5 }}
            color={statusConfig.color}
          />
        )}
      </Stack>
    </Paper>
  );
}

// ----------------------------------------------------------------------
// Skeleton card

function SkeletonCard() {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Skeleton width={60} height={22} sx={{ borderRadius: 2 }} />
          <Skeleton variant="circular" width={24} height={24} />
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
          <Skeleton variant="rounded" width={48} height={48} />
        </Box>
        <Skeleton width="80%" height={14} sx={{ mx: 'auto' }} />
        <Skeleton width="60%" height={12} sx={{ mx: 'auto' }} />
      </Stack>
    </Paper>
  );
}

// ----------------------------------------------------------------------
// View principale

export default function ArchiveFileManagerView() {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const { db } = settings;
  const router = useRouter();

  // Navigazione
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Drawer dettagli
  const [selectedFile, setSelectedFile] = useState(null);
  const detailsDrawer = useBoolean(false);

  // Dialogs
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

  // Ricerca
  const [searchQuery, setSearchQuery] = useState('');

  // Menu contestuale
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Carica dati
  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const [foldersRes, docsRes] = await Promise.all([
        axios.get('/api/archive/folders', { params: { db, parentPath: currentPath } }),
        axios.get('/api/archive/documents', { params: { db, folderPath: currentPath, limit: 100 } }),
      ]);

      const rawFolders = foldersRes.data?.folders || [];
      const foldersWithCount = await Promise.all(
        rawFolders.map(async (folder) => {
          try {
            const countRes = await axios.get('/api/archive/documents', {
              params: { db, folderPath: folder.path, limit: 1 },
            });
            return { ...folder, itemCount: countRes.data?.pagination?.total ?? 0 };
          } catch {
            return { ...folder, itemCount: 0 };
          }
        })
      );

      setFolders(foldersWithCount);
      setDocuments(docsRes.data?.data || []);
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
    setPathHistory((prev) => [...prev, currentPath]);
    setCurrentPath(newPath);
  };

  const navigateBack = () => {
    if (pathHistory.length === 0) return;
    const previousPath = pathHistory[pathHistory.length - 1];
    setPathHistory((prev) => prev.slice(0, -1));
    setCurrentPath(previousPath);
  };

  const navigateToRoot = () => {
    setCurrentPath('');
    setPathHistory([]);
  };

  const navigateToBreadcrumb = (index) => {
    const parts = currentPath.split('/').filter(Boolean);
    const newPath = parts.slice(0, index + 1).join('/');
    setPathHistory((prev) => [...prev, currentPath]);
    setCurrentPath(newPath);
  };

  // Gestione cartelle
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await axios.post('/api/archive/folders', { db, folderName: newFolderName, parentPath: currentPath });
      enqueueSnackbar('Cartella creata', { variant: 'success' });
      setNewFolderName('');
      newFolderDialog.onFalse();
      loadData();
    } catch {
      enqueueSnackbar('Errore creazione cartella', { variant: 'error' });
    }
  };

  const handleRenameFolder = async () => {
    if (!newFolderName.trim() || !selectedFolder) return;
    try {
      await axios.put('/api/archive/folders', { db, oldPath: selectedFolder.path, newName: newFolderName });
      enqueueSnackbar('Cartella rinominata', { variant: 'success' });
      setNewFolderName('');
      renameFolderDialog.onFalse();
      loadData();
    } catch {
      enqueueSnackbar('Errore rinomina', { variant: 'error' });
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Eliminare la cartella "${folder.name}"?`)) return;
    try {
      await axios.delete('/api/archive/folders', { params: { db, folderPath: folder.path } });
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

  // Dettagli file
  const handleFileClick = (file) => {
    setSelectedFile(file);
    detailsDrawer.onTrue();
  };

  // Rinomina file
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
    } catch {
      enqueueSnackbar('Errore rinomina file', { variant: 'error' });
    }
  };

  // Elimina file
  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Eliminare "${file.original_filename || file.name}"?`)) return;
    try {
      await axios.delete(`/api/archive/documents/${file.id}`, { params: { db } });
      enqueueSnackbar('File eliminato', { variant: 'success' });
      loadData();
      if (detailsDrawer.value) detailsDrawer.onFalse();
    } catch {
      enqueueSnackbar('Errore eliminazione file', { variant: 'error' });
    }
  };

  // Download file
  const handleDownloadFile = async (file) => {
    try {
      const response = await axios.get(`/api/archive/documents/${file.id}/download`, {
        params: { db },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_filename || file.name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Errore download file', { variant: 'error' });
    }
  };

  // Sposta file
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
      detailsDrawer.onFalse();
      loadData();
    } catch {
      enqueueSnackbar('Errore spostamento file', { variant: 'error' });
    }
  };

  // Anteprima
  const handlePreviewFile = (file) => {
    setSelectedFileForAction(file);
    previewDialog.onTrue();
  };

  // Retry processamento
  const handleRetryFile = async (file) => {
    try {
      await retryDocumentProcessing(file.id, db);
      enqueueSnackbar('Documento rimesso in coda', { variant: 'success' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante il retry', { variant: 'error' });
    }
  };

  // Reset archivio
  const handleClearAll = async () => {
    if (!window.confirm("ATTENZIONE: Questo eliminerà TUTTI i documenti dall'archivio. Sei sicuro?")) return;
    try {
      const result = await clearAllArchiveDocuments(db);
      enqueueSnackbar(result?.message || 'Tutti i documenti eliminati', { variant: 'success' });
      loadData();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Errore durante la cancellazione', { variant: 'error' });
    }
  };

  const breadcrumbItems = currentPath.split('/').filter(Boolean);
  const isEmpty = !loading && folders.length === 0 && documents.length === 0;

  // ----------------------------------------------------------------------

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Stack spacing={3}>

        {/* ── Header ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Archivio Documenti
            </Typography>
            {!loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {folders.length > 0 && `${folders.length} cartel${folders.length === 1 ? 'la' : 'le'}`}
                {folders.length > 0 && documents.length > 0 && ' · '}
                {documents.length > 0 && `${documents.length} document${documents.length === 1 ? 'o' : 'i'}`}
                {isEmpty && 'Cartella vuota'}
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
          >
            {/* Search */}
            <TextField
              size="small"
              placeholder="Cerca…"
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
              sx={{ width: { xs: '100%', sm: 200, md: 260 } }}
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="eva:search-fill" />}
              onClick={() => router.push(paths.dashboard.archive.search)}
            >
              Avanzata
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="eva:folder-add-fill" />}
              onClick={newFolderDialog.onTrue}
            >
              Cartella
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={uploadDialog.onTrue}
            >
              Carica
            </Button>

            {SHOW_RESET_BUTTON && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Iconify icon="eva:trash-2-fill" />}
                onClick={handleClearAll}
              >
                Reset
              </Button>
            )}
          </Stack>
        </Stack>

        {/* ── Barra progresso caricamento ── */}
        {loading && <LinearProgress sx={{ borderRadius: 1, height: 3 }} />}

        {/* ── Breadcrumb ── */}
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minHeight: 32 }}>
          {currentPath && (
            <Tooltip title="Torna indietro">
              <IconButton size="small" onClick={navigateBack} sx={{ mr: 0.5 }}>
                <Iconify icon="eva:arrow-back-fill" width={18} />
              </IconButton>
            </Tooltip>
          )}

          <Chip
            label="Archivio"
            size="small"
            variant={currentPath ? 'outlined' : 'filled'}
            color={currentPath ? 'default' : 'primary'}
            onClick={navigateToRoot}
            sx={{ cursor: 'pointer', fontWeight: 500 }}
          />

          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <Stack key={index} direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="eva:chevron-right-fill" sx={{ color: 'text.disabled', width: 14 }} />
                <Chip
                  label={item}
                  size="small"
                  variant={isLast ? 'filled' : 'outlined'}
                  color={isLast ? 'primary' : 'default'}
                  onClick={() => !isLast && navigateToBreadcrumb(index)}
                  sx={{ cursor: isLast ? 'default' : 'pointer', fontWeight: 500 }}
                />
              </Stack>
            );
          })}
        </Stack>

        {/* ── Cartelle ── */}
        {(loading || folders.length > 0) && (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="eva:folder-fill" sx={{ color: 'warning.main', width: 18 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Cartelle
              </Typography>
              {!loading && (
                <Typography variant="caption" color="text.disabled">
                  ({folders.length})
                </Typography>
              )}
            </Stack>

            <Grid container spacing={1.5}>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between">
                            <Skeleton variant="rounded" width={44} height={44} />
                            <Skeleton variant="circular" width={24} height={24} />
                          </Stack>
                          <Stack spacing={0.5}>
                            <Skeleton width="70%" height={14} />
                            <Skeleton width="40%" height={12} />
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))
                : folders.map((folder) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={folder.path}>
                      <ArchiveFolderItem
                        folder={folder}
                        onOpen={() => navigateToFolder(folder.name)}
                        onMenuClick={handleMenuOpen}
                      />
                    </Grid>
                  ))}
            </Grid>
          </Box>
        )}

        {/* ── Documenti ── */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Iconify icon="eva:file-text-fill" sx={{ color: 'primary.main', width: 18 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Documenti
            </Typography>
            {!loading && (
              <Typography variant="caption" color="text.disabled">
                ({documents.length})
              </Typography>
            )}
          </Stack>

          {loading ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                  <SkeletonCard />
                </Grid>
              ))}
            </Grid>
          ) : documents.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                py: 6,
                px: 3,
                borderRadius: 2,
                textAlign: 'center',
                borderStyle: 'dashed',
              }}
            >
              <Iconify icon="eva:inbox-outline" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {isEmpty ? 'Cartella vuota' : 'Nessun documento in questa cartella'}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
                Carica un documento per iniziare
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={uploadDialog.onTrue}
              >
                Carica documento
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={1.5}>
              {documents.map((doc) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={doc.id}>
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
        </Box>
      </Stack>

      {/* ══════════════════════════════════════
          DRAWER dettagli file
      ══════════════════════════════════════ */}
      <Drawer
        anchor="right"
        open={detailsDrawer.value}
        onClose={detailsDrawer.onFalse}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {selectedFile && (
          <>
            {/* Header drawer */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
                Dettagli
              </Typography>
              <Tooltip title="Vai al dettaglio completo">
                <IconButton
                  size="small"
                  onClick={() => router.push(paths.dashboard.archive.details(selectedFile.id))}
                >
                  <Iconify icon="eva:external-link-fill" width={18} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={detailsDrawer.onFalse}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Box>

            {/* Contenuto drawer */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <Stack spacing={3}>
                {/* Thumbnail + nome */}
                <Box sx={{ textAlign: 'center', py: 1 }}>
                  <FileThumbnail
                    file={getFileType(selectedFile.original_filename || selectedFile.name)}
                    sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5 }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.4 }}
                  >
                    {selectedFile.original_filename || '—'}
                  </Typography>
                </Box>

                {/* Stato */}
                {(() => {
                  const cfg = getStatusConfig(selectedFile.processing_status);
                  return (
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      spacing={1}
                    >
                      <Chip
                        icon={<Iconify icon={cfg.icon} width={14} />}
                        label={cfg.label}
                        color={cfg.color}
                        size="small"
                        variant={selectedFile.processing_status === 'failed' ? 'filled' : 'soft'}
                      />
                    </Stack>
                  );
                })()}

                {/* Errore (se fallito) */}
                {selectedFile.processing_status === 'failed' && selectedFile.error_message && (
                  <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                    {selectedFile.error_message}
                  </Alert>
                )}

                <Divider />

                {/* Metadati */}
                <Stack spacing={1.5}>
                  {[
                    { label: 'Dimensione', value: fData(selectedFile.file_size) },
                    { label: 'Tipo', value: selectedFile.mime_type || '—' },
                    { label: 'Caricato il', value: fDate(selectedFile.created_at) },
                    { label: 'Priorità', value: selectedFile.priority || '—' },
                    {
                      label: 'Tipo documento',
                      value: selectedFile.document_type
                        ? `${selectedFile.document_type}${selectedFile.document_subtype ? ` / ${selectedFile.document_subtype}` : ''}`
                        : '—',
                    },
                  ].map(({ label, value }) => (
                    <Stack key={label} direction="row" alignItems="baseline" spacing={1}>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ minWidth: 100, flexShrink: 0, fontWeight: 500 }}
                      >
                        {label}
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Box>

            {/* Azioni drawer */}
            <Box sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="eva:eye-fill" />}
                    onClick={() => handlePreviewFile(selectedFile)}
                  >
                    Anteprima
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="eva:download-fill" />}
                    onClick={() => handleDownloadFile(selectedFile)}
                  >
                    Download
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
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
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="eva:folder-move-fill" />}
                    onClick={() => {
                      setSelectedFileForAction(selectedFile);
                      setMoveTargetFolder('');
                      moveDialog.onTrue();
                    }}
                  >
                    Sposta
                  </Button>
                </Stack>

                {selectedFile.processing_status === 'failed' && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    size="small"
                    startIcon={<Iconify icon="eva:refresh-fill" />}
                    onClick={() => handleRetryFile(selectedFile)}
                  >
                    Riprova processamento
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Iconify icon="eva:trash-2-fill" />}
                  onClick={() => handleDeleteFile(selectedFile)}
                >
                  Elimina
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Drawer>

      {/* ══════════════════════════════════════
          MENU contestuale
      ══════════════════════════════════════ */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 180 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Menu cartella */}
        {menuTarget?.path != null && !menuTarget?.id && [
          <MenuItem
            key="rename-folder"
            onClick={() => {
              handleMenuClose();
              setNewFolderName(menuTarget.name);
              renameFolderDialog.onTrue();
            }}
          >
            <ListItemIcon><Iconify icon="eva:edit-2-fill" /></ListItemIcon>
            <ListItemText primary="Rinomina" />
          </MenuItem>,
          <MenuItem
            key="delete-folder"
            onClick={() => { handleMenuClose(); handleDeleteFolder(menuTarget); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><Iconify icon="eva:trash-2-fill" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="Elimina" />
          </MenuItem>,
        ]}

        {/* Menu file */}
        {menuTarget?.id && [
          <MenuItem
            key="view"
            onClick={() => { handleMenuClose(); router.push(paths.dashboard.archive.details(menuTarget.id)); }}
          >
            <ListItemIcon><Iconify icon="eva:eye-fill" /></ListItemIcon>
            <ListItemText primary="Dettaglio completo" />
          </MenuItem>,
          <MenuItem
            key="preview"
            onClick={() => { handleMenuClose(); handlePreviewFile(menuTarget); }}
          >
            <ListItemIcon><Iconify icon="eva:image-2-fill" /></ListItemIcon>
            <ListItemText primary="Anteprima" />
          </MenuItem>,
          <MenuItem
            key="download"
            onClick={() => { handleMenuClose(); handleDownloadFile(menuTarget); }}
          >
            <ListItemIcon><Iconify icon="eva:download-fill" /></ListItemIcon>
            <ListItemText primary="Download" />
          </MenuItem>,
          <Divider key="div1" />,
          <MenuItem
            key="rename-file"
            onClick={() => {
              handleMenuClose();
              setSelectedFileForAction(menuTarget);
              setNewFileName(menuTarget.original_filename || menuTarget.name);
              renameFileDialog.onTrue();
            }}
          >
            <ListItemIcon><Iconify icon="eva:edit-2-fill" /></ListItemIcon>
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
            <ListItemIcon><Iconify icon="eva:folder-move-fill" /></ListItemIcon>
            <ListItemText primary="Sposta" />
          </MenuItem>,
          menuTarget?.processing_status === 'failed' && (
            <MenuItem
              key="retry"
              onClick={() => { handleMenuClose(); handleRetryFile(menuTarget); }}
              sx={{ color: 'warning.main' }}
            >
              <ListItemIcon><Iconify icon="eva:refresh-fill" sx={{ color: 'warning.main' }} /></ListItemIcon>
              <ListItemText primary="Riprova processamento" />
            </MenuItem>
          ),
          <Divider key="div2" />,
          <MenuItem
            key="delete-file"
            onClick={() => { handleMenuClose(); handleDeleteFile(menuTarget); }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon><Iconify icon="eva:trash-2-fill" sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText primary="Elimina" />
          </MenuItem>,
        ]}
      </Menu>

      {/* ══════════════════════════════════════
          DIALOGS
      ══════════════════════════════════════ */}

      {/* Nuova cartella */}
      <Dialog open={newFolderDialog.value} onClose={newFolderDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Nuova Cartella</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nome cartella"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
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

      {/* Rinomina cartella */}
      <Dialog open={renameFolderDialog.value} onClose={renameFolderDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Rinomina Cartella</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuovo nome"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
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

      {/* Rinomina file */}
      <Dialog open={renameFileDialog.value} onClose={renameFileDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Rinomina File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuovo nome"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
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

      {/* Sposta file */}
      <Dialog open={moveDialog.value} onClose={moveDialog.onFalse} maxWidth="sm" fullWidth>
        <DialogTitle>
          Sposta — <Typography component="span" variant="body1" color="text.secondary">
            {selectedFileForAction?.original_filename || selectedFileForAction?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleziona la cartella di destinazione:
          </Typography>

          <Paper variant="outlined" sx={{ maxHeight: 260, overflow: 'auto', borderRadius: 2 }}>
            <List dense disablePadding>
              <ListItemButton
                selected={moveTargetFolder === ''}
                onClick={() => setMoveTargetFolder('')}
                sx={{
                  borderLeft: moveTargetFolder === '' ? '3px solid' : '3px solid transparent',
                  borderColor: moveTargetFolder === '' ? 'primary.main' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Iconify icon="eva:home-fill" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText primary="Root (Archivio principale)" />
                {moveTargetFolder === '' && (
                  <Iconify icon="eva:checkmark-fill" sx={{ color: 'primary.main' }} />
                )}
              </ListItemButton>

              {folders.map((folder) => (
                <ListItemButton
                  key={folder.path}
                  selected={moveTargetFolder === folder.path}
                  onClick={() => setMoveTargetFolder(folder.path)}
                  sx={{
                    borderLeft: moveTargetFolder === folder.path ? '3px solid' : '3px solid transparent',
                    borderColor: moveTargetFolder === folder.path ? 'primary.main' : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Iconify icon="eva:folder-fill" sx={{ color: 'warning.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={folder.name} />
                  {moveTargetFolder === folder.path && (
                    <Iconify icon="eva:checkmark-fill" sx={{ color: 'primary.main' }} />
                  )}
                </ListItemButton>
              ))}

              {folders.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.disabled">
                    Nessuna cartella disponibile
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={moveDialog.onFalse}>Annulla</Button>
          <Button
            variant="contained"
            onClick={handleMoveFile}
            startIcon={<Iconify icon="eva:arrow-forward-fill" />}
          >
            Sposta in{' '}
            {moveTargetFolder
              ? folders.find((f) => f.path === moveTargetFolder)?.name || 'cartella'
              : 'Root'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload */}
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

      {/* Anteprima */}
      <Dialog
        open={previewDialog.value}
        onClose={previewDialog.onFalse}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '85vh' } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" noWrap sx={{ maxWidth: 400, fontWeight: 600 }}>
              {selectedFileForAction?.original_filename || selectedFileForAction?.name}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Download">
                <IconButton size="small" onClick={() => handleDownloadFile(selectedFileForAction)}>
                  <Iconify icon="eva:download-fill" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={previewDialog.onFalse}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            p: 0,
          }}
        >
          {selectedFileForAction?.mime_type?.startsWith('image/') ? (
            <Box
              component="img"
              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9002'}/v1/archive/files/${selectedFileForAction?.storage_path}`}
              alt={selectedFileForAction?.original_filename}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', p: 2 }}
            />
          ) : selectedFileForAction?.mime_type === 'application/pdf' ? (
            <Box
              component="iframe"
              src={`${process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9002'}/v1/archive/files/${selectedFileForAction?.storage_path}`}
              sx={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
              <FileThumbnail
                file={selectedFileForAction?.original_filename?.split('.').pop() || 'file'}
                sx={{ width: 96, height: 96 }}
              />
              <Typography variant="body1" color="text.secondary">
                Anteprima non disponibile per questo tipo di file
              </Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:download-fill" />}
                onClick={() => handleDownloadFile(selectedFileForAction)}
              >
                Scarica file
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
