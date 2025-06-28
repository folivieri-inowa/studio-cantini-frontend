import PropTypes from 'prop-types';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSnackbar } from 'src/components/snackbar';

import Iconify from 'src/components/iconify';
import { deleteFile } from 'src/api/file-manager';
import FileManagerPanel from './file-manager-panel';
import FileManagerFileItem from './file-manager-file-item';
import FileManagerFolderItem from './file-manager-folder-item';
import FileManagerSubfolderItem from './file-manager-subfolder-item';
import FileManagerFileDetails from './file-manager-file-details';
import FileManagerUploadDialog from './file-manager-upload-dialog';

// ----------------------------------------------------------------------

export default function FileManagerGridView({
  table,
  data = [],
  dataFiltered = [],
  onDeleteItem,
  onRefresh,
  db,
  categories = [],
  subjects = {},
  details = {},
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { selected, onSelectRow: onSelectItem } = table;

  const containerRef = useRef(null);

  // Stato per il pannello delle categorie
  const categoriesPanel = useBoolean(true);

  // Stati per gestire la visualizzazione dei dettagli dei file
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('categories'); // 'categories', 'subjects', 'details'

  // Navigazione tra le cartelle
  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setViewMode('subjects');
  };

  const handleOpenSubfolder = (subfolder) => {
    setCurrentFolder(subfolder);
    setViewMode('details');
  };

  const handleBack = () => {
    if (viewMode === 'details') {
      setViewMode('subjects');
      // Trova la cartella genitore
      const parentFolder = data.find(folder => folder.id === currentFolder.parentId);
      if (parentFolder) {
        setCurrentFolder(parentFolder);
      } else {
        setViewMode('categories');
        setCurrentFolder(null);
      }
    } else if (viewMode === 'subjects') {
      setViewMode('categories');
      setCurrentFolder(null);
    }
  };

  // Gestione dei file
  const handleOpenFileDetails = (file) => {
    setSelectedFile(file);
  };

  const handleCloseFileDetails = () => {
    setSelectedFile(null);
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadSuccess = () => {
    enqueueSnackbar('File caricato con successo', { variant: 'success' });
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleDeleteFile = async (file) => {
    try {
      // Estrai il percorso del file dall'URL
      const urlParts = file.url.split('/');
      const bucketIndex = urlParts.indexOf(db);
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      await deleteFile(db, filePath);
      
      enqueueSnackbar('File eliminato con successo', { variant: 'success' });
      
      if (onRefresh) {
        onRefresh();
      }
      
      return true;
    } catch (error) {
      console.error('Errore durante l\'eliminazione del file:', error);
      enqueueSnackbar('Errore durante l\'eliminazione del file', { variant: 'error' });
      return false;
    }
  };

  // Rendering condizionale in base al view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'categories':
        return (
          <>
            <FileManagerPanel
              title="Categorie"
              subTitle={`${data?.length || 0} Cartelle`}
              onOpen={handleOpenUploadDialog}
              collapse={categoriesPanel.value}
              onCollapse={categoriesPanel.onToggle}
              showNewButton
            />

            <Box
              gap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
            >
              {data?.map((folder) => (
                <FileManagerFolderItem 
                  key={folder.id} 
                  folder={folder} 
                  sx={{ maxWidth: 'auto' }}
                  onOpen={() => handleOpenFolder(folder)}
                />
              ))}
            </Box>
          </>
        );
      
      case 'subjects':
        return (
          <>
            <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
              <Button
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={handleBack}
              >
                Indietro
              </Button>
              
              <Typography variant="h6" sx={{ ml: 2 }}>
                {currentFolder?.name}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={handleOpenUploadDialog}
              >
                Carica File
              </Button>
            </Stack>

            {currentFolder?.subfolder?.length > 0 && (
              <>
                <FileManagerPanel
                  title="Soggetti"
                  subTitle={`${currentFolder?.subfolder?.length || 0} Elementi`}
                  collapse={false}
                />

                <Box
                  gap={3}
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }}
                  sx={{ mb: 3 }}
                >
                  {currentFolder?.subfolder?.map((subfolder) => (
                    <FileManagerSubfolderItem 
                      key={subfolder.id} 
                      subfolder={subfolder}
                      sx={{ maxWidth: 'auto' }} 
                      onOpen={() => handleOpenSubfolder(subfolder)}
                    />
                  ))}
                </Box>
              </>
            )}

            {currentFolder?.files?.length > 0 && (
              <>
                <FileManagerPanel
                  title="File"
                  subTitle={`${currentFolder?.files?.length || 0} File`}
                  collapse={false}
                />

                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }}
                  gap={3}
                >
                  {currentFolder?.files?.map((file) => (
                    <FileManagerFileItem
                      key={file.id || file.name}
                      file={file}
                      onOpen={() => handleOpenFileDetails(file)}
                      sx={{ maxWidth: 'auto' }}
                    />
                  ))}
                </Box>
              </>
            )}
          </>
        );
      
      case 'details':
        return (
          <>
            <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
              <Button
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                onClick={handleBack}
              >
                Indietro
              </Button>
              
              <Typography variant="h6" sx={{ ml: 2 }}>
                {currentFolder?.name}
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={handleOpenUploadDialog}
              >
                Carica File
              </Button>
            </Stack>

            {currentFolder?.subfolder?.length > 0 && (
              <>
                <FileManagerPanel
                  title="Dettagli"
                  subTitle={`${currentFolder?.subfolder?.length || 0} Elementi`}
                  collapse={false}
                />

                <Box
                  gap={3}
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }}
                  sx={{ mb: 3 }}
                >
                  {currentFolder?.subfolder?.map((detail) => (
                    <FileManagerSubfolderItem 
                      key={detail.id} 
                      subfolder={detail}
                      sx={{ maxWidth: 'auto' }} 
                      onOpen={() => {
                        setCurrentFolder(detail);
                      }}
                    />
                  ))}
                </Box>
              </>
            )}

            {currentFolder?.files?.length > 0 && (
              <>
                <FileManagerPanel
                  title="File"
                  subTitle={`${currentFolder?.files?.length || 0} File`}
                  collapse={false}
                />

                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  }}
                  gap={3}
                >
                  {currentFolder?.files?.map((file) => (
                    <FileManagerFileItem
                      key={file.id || file.name}
                      file={file}
                      onOpen={() => handleOpenFileDetails(file)}
                      sx={{ maxWidth: 'auto' }}
                    />
                  ))}
                </Box>
              </>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box ref={containerRef}>
      {renderContent()}

      <FileManagerFileDetails 
        open={!!selectedFile} 
        file={selectedFile} 
        onClose={handleCloseFileDetails} 
        onDelete={handleDeleteFile}
        db={db}
      />

      <FileManagerUploadDialog
        open={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onUploadSuccess={handleUploadSuccess}
        db={db}
        categories={categories}
        subjects={subjects}
        details={details}
      />
    </Box>
  );
}

FileManagerGridView.propTypes = {
  data: PropTypes.array,
  dataFiltered: PropTypes.array,
  onDeleteItem: PropTypes.func,
  onRefresh: PropTypes.func,
  table: PropTypes.object,
  db: PropTypes.string,
  categories: PropTypes.array,
  subjects: PropTypes.object,
  details: PropTypes.object,
};
