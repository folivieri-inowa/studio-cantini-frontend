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
import FileManagerSubfolderItem from './file-manager-subfolder-item-new';
import FileManagerEmptyFolder from './file-manager-empty-folder';
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
  const [navigationHistory, setNavigationHistory] = useState([]); // Cronologia di navigazione

  // Debug per verificare la presenza di file e lo stato di navigazione
  console.log('Data ricevuta:', data);
  if (currentFolder) {
    console.log('Cartella corrente:', currentFolder.name);
    console.log('File nella cartella corrente:', currentFolder.files);
    console.log('Tipo cartella corrente:', currentFolder.type);
    console.log('Modalità visualizzazione:', viewMode);
    console.log('Storia navigazione:', navigationHistory);
  }

  // Navigazione tra le cartelle
  const handleOpenFolder = (folder) => {
    console.log('Aprendo cartella:', folder.name, folder);
    
    // Controllo se la cartella ha sottocartelle o file
    const hasContent = (folder.subfolder && folder.subfolder.length > 0) || 
                      (folder.files && folder.files.length > 0);
    
    console.log('La cartella ha contenuto:', hasContent);
    console.log('Sottocartelle:', folder.subfolder);
    console.log('File:', folder.files);
    
    // Salva lo stato corrente nella cronologia
    setNavigationHistory([...navigationHistory, { 
      viewMode, 
      folder: currentFolder 
    }]);
    
    // Aggiorna lo stato, assicurandosi che la cartella abbia la proprietà files inizializzata
    const updatedFolder = { ...folder };
    if (!updatedFolder.files) {
      updatedFolder.files = [];
      console.log(`Inizializzata la proprietà files per la cartella ${updatedFolder.name}`);
    }
    
    // Assicurati che ogni sottocartella abbia la proprietà files
    if (updatedFolder.subfolder && updatedFolder.subfolder.length > 0) {
      updatedFolder.subfolder = updatedFolder.subfolder.map(sub => {
        if (!sub.files) {
          return { ...sub, files: [] };
        }
        return sub;
      });
    }
    
    setCurrentFolder(updatedFolder);
    setViewMode('subjects');
  };

  const handleOpenSubfolder = (subfolder) => {
    console.log('Aprendo sottocartella:', subfolder.name, subfolder);
    
    // Controllo se la sottocartella ha file o altre sottocartelle
    const hasContent = (subfolder.subfolder && subfolder.subfolder.length > 0) || 
                      (subfolder.files && subfolder.files.length > 0);
    
    console.log('La sottocartella ha contenuto:', hasContent);
    console.log('Sottocartelle della sottocartella:', subfolder.subfolder);
    console.log('File della sottocartella:', subfolder.files);
    
    // Salva lo stato corrente nella cronologia
    setNavigationHistory([...navigationHistory, { 
      viewMode, 
      folder: currentFolder 
    }]);
    
    // Aggiorna lo stato, assicurandosi che la sottocartella abbia la proprietà files inizializzata
    const updatedSubfolder = { ...subfolder };
    if (!updatedSubfolder.files) {
      updatedSubfolder.files = [];
      console.log(`Inizializzata la proprietà files per la sottocartella ${updatedSubfolder.name}`);
    }
    
    // Assicurati che ogni sottocartella abbia la proprietà files
    if (updatedSubfolder.subfolder && updatedSubfolder.subfolder.length > 0) {
      updatedSubfolder.subfolder = updatedSubfolder.subfolder.map(sub => {
        if (!sub.files) {
          return { ...sub, files: [] };
        }
        return sub;
      });
    }
    
    setCurrentFolder(updatedSubfolder);
    setViewMode('details');
  };

  const handleBack = () => {
    console.log('Esecuzione handleBack, storia navigazione:', navigationHistory);
    
    // Se c'è una cronologia, torna indietro all'ultimo stato
    if (navigationHistory.length > 0) {
      const lastState = navigationHistory[navigationHistory.length - 1];
      console.log('Tornando allo stato precedente:', lastState);
      setViewMode(lastState.viewMode);
      setCurrentFolder(lastState.folder);
      // Rimuovi l'ultimo stato dalla cronologia
      setNavigationHistory(navigationHistory.slice(0, -1));
    } else {
      // Comportamento di fallback se non c'è cronologia
      console.log('Nessuna cronologia disponibile, usando il comportamento di fallback');
      if (viewMode === 'details') {
        setViewMode('subjects');
        // Cerca il parent folder in base all'ID
        const parentFolder = data.find(folder => folder.id === currentFolder.parentId);
        console.log('Ricerca parent folder:', parentFolder);
        if (parentFolder) {
          setCurrentFolder(parentFolder);
        } else {
          console.log('Parent folder non trovato, tornando alle categorie');
          setViewMode('categories');
          setCurrentFolder(null);
        }
      } else if (viewMode === 'subjects') {
        console.log('Tornando alle categorie dalla sezione subjects');
        setViewMode('categories');
        setCurrentFolder(null);
      }
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
              collapse={categoriesPanel.value}
              onCollapse={categoriesPanel.onToggle}
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
              
              {/* Bottone "Nuova cartella" rimosso */}
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
            </Stack>

            {/* Sezione soggetti - modificata per essere mostrata sempre */}
            <>
              <FileManagerPanel
                title="Soggetti"
                subTitle={currentFolder?.subfolder?.length > 0 ? 
                  `${currentFolder.subfolder.length} Elementi` : 
                  'Nessun soggetto disponibile'}
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
                {currentFolder?.subfolder && currentFolder.subfolder.length > 0 ? (
                  <>
                    {currentFolder.subfolder.map((subfolder) => (
                      <FileManagerSubfolderItem 
                        key={subfolder.id} 
                        subfolder={subfolder}
                        sx={{ maxWidth: 'auto' }} 
                        onOpen={() => handleOpenSubfolder(subfolder)}
                      />
                    ))}
                    
                    {/* Aggiungi una cartella vuota in questa sezione */}
                    {/* Bottone "Nuovo soggetto" rimosso */}
                  </>
                ) : (
                  <FileManagerEmptyFolder 
                    title="Nessun soggetto" 
                    subtitle="Non ci sono soggetti disponibili" 
                    sx={{ maxWidth: 'auto', gridColumn: 'span 4' }}
                  />
                )}
              </Box>
            </>

            {/* Sezione file - mostrata sempre con migliori indicazioni */}
            <>
              <FileManagerPanel
                title="File"
                subTitle={`${currentFolder?.files?.length || 0} File${currentFolder?.files?.length === 1 ? '' : 's'}`}
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
                {currentFolder?.files && currentFolder.files.length > 0 ? (
                  currentFolder.files.map((file) => (
                    <FileManagerFileItem
                      key={file.id || file.name}
                      file={file}
                      onOpen={() => handleOpenFileDetails(file)}
                      sx={{ maxWidth: 'auto' }}
                    />
                  ))
                ) : (
                  <>
                    <Typography variant="body1" sx={{ gridColumn: 'span 4', textAlign: 'center', color: 'text.disabled', my: 2 }}>
                      Nessun file in questa cartella
                    </Typography>
                  </>
                )}
              </Box>
            </>
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
                        // Aggiungi alla cronologia prima di navigare
                        setNavigationHistory([...navigationHistory, { 
                          viewMode, 
                          folder: currentFolder 
                        }]);
                        setCurrentFolder(detail);
                      }}
                    />
                  ))}
                  
                </Box>
              </>
            )}

            {/* Sezione file - mostrata sempre con migliori indicazioni */}
            <>
              <FileManagerPanel
                title="File"
                subTitle={`${currentFolder?.files?.length || 0} File${currentFolder?.files?.length === 1 ? '' : 's'}`}
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
                {currentFolder?.files && currentFolder.files.length > 0 ? (
                  currentFolder.files.map((file) => (
                    <FileManagerFileItem
                      key={file.id || file.name}
                      file={file}
                      onOpen={() => handleOpenFileDetails(file)}
                      sx={{ maxWidth: 'auto' }}
                    />
                  ))
                ) : (
                  <>
                    <Typography variant="body1" sx={{ gridColumn: 'span 4', textAlign: 'center', color: 'text.disabled', my: 2 }}>
                      Nessun file in questa cartella
                    </Typography>
                  </>
                )}
              </Box>
            </>
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
};  // NOTA: La navigazione funziona in 3 livelli:
  // 1. 'categories': La vista iniziale che mostra tutte le categorie
  // 2. 'subjects': La vista che mostra i soggetti di una categoria
  // 3. 'details': La vista che mostra i dettagli di un soggetto
  // La navigazione viene gestita con un array di stati precedenti (navigationHistory)
  // che tiene traccia del percorso di navigazione per permettere di tornare indietro
  // al livello corretto con il pulsante "Indietro"
