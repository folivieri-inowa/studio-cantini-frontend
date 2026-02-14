'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetArchiveFolders, useGetArchiveBreadcrumb } from 'src/api/archive';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content';

import FolderBreadcrumb from '../folder-breadcrumb';
import FileGridView from '../file-grid-view';
import FileListView from '../file-list-view';
import ViewModeToggle from '../view-mode-toggle';
import DocumentUploadDialog from '../document-upload-dialog-new';

// ----------------------------------------------------------------------

export default function ArchiveFinderView({ db }) {
  const router = useRouter();
  const settings = useSettingsContext();
  const uploadDialog = useBoolean();

  const [currentPath, setCurrentPath] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Fetch folders and files
  const {
    folders,
    files,
    foldersLoading,
    foldersError,
    foldersEmpty,
    foldersRefresh,
  } = useGetArchiveFolders(db, currentPath);

  // Fetch breadcrumb
  const { breadcrumb, breadcrumbLoading } = useGetArchiveBreadcrumb(currentPath);

  const handleNavigate = useCallback((path) => {
    setCurrentPath(path);
  }, []);

  const handleFolderClick = useCallback((folder) => {
    const newPath = folder.full_path || folder.folder_name;
    setCurrentPath(newPath);
  }, []);

  const handleFileClick = useCallback((file) => {
    router.push(paths.dashboard.archive.details(file.id));
  }, [router]);

  const handleViewModeChange = useCallback((event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }, []);

  const handleUploadSuccess = useCallback(() => {
    foldersRefresh();
    uploadDialog.onFalse();
  }, [foldersRefresh, uploadDialog]);

  const handleSearch = useCallback(() => {
    router.push(paths.dashboard.archive.search);
  }, [router]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h4">Archivio Digitale</Typography>
            {!breadcrumbLoading && breadcrumb.length > 1 && (
              <Typography variant="body2" color="text.secondary">
                {files.length} {files.length === 1 ? 'file' : 'files'}, {folders.length}{' '}
                {folders.length === 1 ? 'cartella' : 'cartelle'}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:search-fill" />}
              onClick={handleSearch}
            >
              Cerca
            </Button>

            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={uploadDialog.onTrue}
            >
              Carica File
            </Button>
          </Stack>
        </Stack>

        {/* Main Content */}
        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            {/* Breadcrumb and View Toggle */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <FolderBreadcrumb breadcrumb={breadcrumb} onNavigate={handleNavigate} />
              <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
            </Stack>

            {/* Content Area */}
            <Box sx={{ minHeight: 400 }}>
              {foldersLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 400 }}>
                  <Typography variant="body2" color="text.secondary">
                    Caricamento...
                  </Typography>
                </Stack>
              ) : foldersError ? (
                <EmptyContent
                  filled
                  title="Errore"
                  description="Si è verificato un errore durante il caricamento"
                  sx={{ py: 10 }}
                />
              ) : foldersEmpty ? (
                <EmptyContent
                  filled
                  title="Nessun elemento"
                  description="Carica i tuoi primi documenti per iniziare"
                  action={
                    <Button
                      variant="contained"
                      startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                      onClick={uploadDialog.onTrue}
                    >
                      Carica File
                    </Button>
                  }
                  sx={{ py: 10 }}
                />
              ) : viewMode === 'grid' ? (
                <FileGridView
                  folders={folders}
                  files={files}
                  onFolderClick={handleFolderClick}
                  onFileClick={handleFileClick}
                />
              ) : (
                <FileListView
                  folders={folders}
                  files={files}
                  onFolderClick={handleFolderClick}
                  onFileClick={handleFileClick}
                />
              )}
            </Box>
          </Stack>
        </Card>
      </Stack>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialog.value}
        onClose={uploadDialog.onFalse}
        db={db}
        currentPath={currentPath}
        onSuccess={handleUploadSuccess}
      />
    </Container>
  );
}
