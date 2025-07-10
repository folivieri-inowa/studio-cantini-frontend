import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import { deleteFile } from 'src/api/file-manager';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import FileManagerPanel from './file-manager-panel';
import FileManagerFileItem from './file-manager-file-item';
import FileManagerFolderItem from './file-manager-folder-item';
import FileManagerFileDetails from './file-manager-file-details';
import FileManagerUploadDialog from './file-manager-upload-dialog';
import FileManagerSubfolderItem from './file-manager-subfolder-item-new';

// ----------------------------------------------------------------------

export default function FileManagerGridView({
  table,
  data = [],
  dataFiltered = [],
  onDeleteItem,
  onRefresh,
  onNavigationStateChange,
  navigationState,
  db,
  categories = [],
  subjects = {},
  details = {},
}) {
  console.log('🔄 FileManagerGridView renderizzato');
  console.log('📊 Data ricevuta:', data);
  console.log('🗂️  Categories:', categories);
  console.log('👥 Subjects:', subjects);
  console.log('📋 Details:', details);
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

  // Ripristina lo stato di navigazione se presente
  useEffect(() => {
    if (navigationState && navigationState.viewMode) {
      setViewMode(navigationState.viewMode);
      setCurrentFolder(navigationState.currentFolder);
      setNavigationHistory(navigationState.navigationHistory);
    }
  }, [navigationState]);

  // Funzione per aggiornare currentFolder con i nuovi dati
  const updateCurrentFolderWithNewData = (newData, folderToUpdate) => {
    if (!newData || !folderToUpdate || !folderToUpdate.id) return folderToUpdate;
    
    const findFolderInData = (searchData, targetId) => {
      const found = searchData.find(item => item.id === targetId);
      if (found) {
        return found;
      }
      
      // Cerca ricorsivamente nelle sottocartelle
      const result = searchData.find(item => {
        if (item.subfolder && item.subfolder.length > 0) {
          return findFolderInData(item.subfolder, targetId);
        }
        return null;
      });
      
      return result ? findFolderInData(result.subfolder, targetId) : null;
    };

    const updatedFolder = findFolderInData(newData, folderToUpdate.id);
    if (updatedFolder) {
      // Mantieni le informazioni di gerarchia se presenti
      const mergedFolder = {
        ...updatedFolder,
        categoryId: folderToUpdate.categoryId,
        categoryName: folderToUpdate.categoryName,
        subjectId: folderToUpdate.subjectId,
        subjectName: folderToUpdate.subjectName,
        parentId: folderToUpdate.parentId
      };
      console.log('🔄 Folder aggiornato con nuovi dati:', mergedFolder);
      return mergedFolder;
    }
    return folderToUpdate;
  };

  // Quando i dati cambiano, aggiorna currentFolder se presente
  useEffect(() => {
    if (data && data.length > 0 && currentFolder) {
      const updatedFolder = updateCurrentFolderWithNewData(data, currentFolder);
      if (updatedFolder !== currentFolder) {
        setCurrentFolder(updatedFolder);
      }
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const newNavigationHistory = [...navigationHistory, { 
      viewMode, 
      folder: currentFolder 
    }];
    setNavigationHistory(newNavigationHistory);
    
    // Aggiorna lo stato, assicurandosi che la cartella abbia la proprietà files inizializzata
    const updatedFolder = { ...folder };
    if (!updatedFolder.files) {
      updatedFolder.files = [];
      // console.log(`Inizializzata la proprietà files per la cartella ${updatedFolder.name}`);
    }
    
    // Assicurati che ogni sottocartella abbia la proprietà files
    if (updatedFolder.subfolder && updatedFolder.subfolder.length > 0) {
      updatedFolder.subfolder = updatedFolder.subfolder.map(sub => {
        if (!sub.files) {
          return { ...sub, files: [] };
        }
        // Arricchisci le sottocartelle con le informazioni sulla categoria padre
        return { 
          ...sub, 
          categoryId: updatedFolder.id,
          categoryName: updatedFolder.name,
          files: sub.files || []
        };
      });
    }
    
    console.log('Cartella aggiornata con informazioni di gerarchia:', updatedFolder);
    
    setCurrentFolder(updatedFolder);
    setViewMode('subjects');

    // Aggiorna lo stato nel componente parent
    if (onNavigationStateChange) {
      onNavigationStateChange({
        viewMode: 'subjects',
        currentFolder: updatedFolder,
        navigationHistory: newNavigationHistory
      });
    }
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
    const newNavigationHistory = [...navigationHistory, { 
      viewMode, 
      folder: currentFolder 
    }];
    setNavigationHistory(newNavigationHistory);
    
    // Aggiorna lo stato, assicurandosi che la sottocartella abbia la proprietà files inizializzata
    const updatedSubfolder = { ...subfolder };
    if (!updatedSubfolder.files) {
      updatedSubfolder.files = [];
      // console.log(`Inizializzata la proprietà files per la sottocartella ${updatedSubfolder.name}`);
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
    
    let newViewMode = viewMode;
    
    // Arricchisci il subfolder con le informazioni sulla gerarchia
    // Se siamo in una categoria e stiamo entrando in un soggetto
    if (viewMode === 'subjects' && currentFolder && !currentFolder.parentId) {
      // Siamo in una categoria, entrando in un soggetto
      updatedSubfolder.categoryId = currentFolder.id;
      updatedSubfolder.categoryName = currentFolder.name;
      updatedSubfolder.parentId = currentFolder.id; // Assicurati che abbia un parentId
      console.log(`ENTRANDO IN SOGGETTO - categoryId: ${updatedSubfolder.categoryId}, categoryName: ${updatedSubfolder.categoryName}`);
      console.log('Subfolder aggiornato:', updatedSubfolder);
      // Stiamo entrando in un soggetto
      newViewMode = 'subject-details';
      setViewMode('subject-details');
    }
    // Se siamo in un soggetto e stiamo entrando in un dettaglio
    else if (viewMode === 'subject-details' && currentFolder && currentFolder.categoryId) {
      // Siamo in un soggetto, entrando in un dettaglio
      updatedSubfolder.categoryId = currentFolder.categoryId;
      updatedSubfolder.categoryName = currentFolder.categoryName;
      updatedSubfolder.subjectId = currentFolder.id;
      updatedSubfolder.subjectName = currentFolder.name;
      updatedSubfolder.parentId = currentFolder.id; // Il parent è il soggetto
      console.log(`ENTRANDO IN DETTAGLIO - categoryId: ${updatedSubfolder.categoryId}, subjectId: ${updatedSubfolder.subjectId}, detailId: ${updatedSubfolder.id}`);
      console.log('Subfolder aggiornato:', updatedSubfolder);
      // Stiamo entrando in un dettaglio
      newViewMode = 'details';
      setViewMode('details');
    }
    else {
      console.log('Situazione non riconosciuta in handleOpenSubfolder');
      console.log('viewMode:', viewMode);
      console.log('currentFolder:', currentFolder);
    }
    
    setCurrentFolder(updatedSubfolder);

    // Aggiorna lo stato nel componente parent
    if (onNavigationStateChange) {
      onNavigationStateChange({
        viewMode: newViewMode,
        currentFolder: updatedSubfolder,
        navigationHistory: newNavigationHistory
      });
    }
  };

  const handleBack = () => {
    console.log('Esecuzione handleBack, storia navigazione:', navigationHistory);
    
    let newViewMode = viewMode;
    let newCurrentFolder = currentFolder;
    let newNavigationHistory = [...navigationHistory];
    
    // Se c'è una cronologia, torna indietro all'ultimo stato
    if (navigationHistory.length > 0) {
      const lastState = navigationHistory[navigationHistory.length - 1];
      console.log('Tornando allo stato precedente:', lastState);
      newViewMode = lastState.viewMode;
      newCurrentFolder = lastState.folder;
      // Rimuovi l'ultimo stato dalla cronologia
      newNavigationHistory = navigationHistory.slice(0, -1);
    } else {
      // Comportamento di fallback se non c'è cronologia
      console.log('Nessuna cronologia disponibile, usando il comportamento di fallback');
      if (viewMode === 'details') {
        newViewMode = 'subjects';
        // Cerca il parent folder in base all'ID
        const parentFolder = data.find(folder => folder.id === currentFolder.parentId);
        console.log('Ricerca parent folder:', parentFolder);
        if (parentFolder) {
          newCurrentFolder = parentFolder;
        } else {
          console.log('Parent folder non trovato, tornando alle categorie');
          newViewMode = 'categories';
          newCurrentFolder = null;
        }
      } else if (viewMode === 'subjects') {
        console.log('Tornando alle categorie dalla sezione subjects');
        newViewMode = 'categories';
        newCurrentFolder = null;
      }
    }
    
    setViewMode(newViewMode);
    setCurrentFolder(newCurrentFolder);
    setNavigationHistory(newNavigationHistory);

    // Aggiorna lo stato nel componente parent
    if (onNavigationStateChange) {
      onNavigationStateChange({
        viewMode: newViewMode,
        currentFolder: newCurrentFolder,
        navigationHistory: newNavigationHistory
      });
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
    console.log('🔵 GRID-VIEW: handleOpenUploadDialog chiamato');
    console.log('=== APERTURA UPLOAD DIALOG ===');
    console.log('currentFolder passato al dialog:', JSON.stringify(currentFolder, null, 2));
    console.log('viewMode corrente:', viewMode);
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadSuccess = () => {
    enqueueSnackbar('File caricato con successo', { variant: 'success' });
    // Invece di fare un refresh completo, rimani nella stessa posizione
    // e aggiorna solo i dati necessari
    if (onRefresh) {
      onRefresh();
    }
    // Chiudi il dialog di upload
    setUploadDialogOpen(false);
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

            {/* Sezione soggetti - solo lista soggetti, nessun file o pulsante carica */}
            {currentFolder?.subfolder && currentFolder.subfolder.length > 0 && (
              <>
                <FileManagerPanel
                  title="Soggetti"
                  subTitle={`${currentFolder.subfolder.length} Elementi`}
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
                  {currentFolder.subfolder.map((subfolder) => (
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
          </>
        );
      
      case 'subject-details':
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

            {/* Sezione per le sottocartelle (Dettagli) se esistono */}
            {currentFolder?.subfolder && currentFolder.subfolder.length > 0 && (
              <>
                <FileManagerPanel
                  title="Dettagli"
                  subTitle={`${currentFolder.subfolder.length} Elementi`}
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
                  {currentFolder.subfolder.map((subfolder) => (
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

            {/* Sezione File del Soggetto */}
            <>
              <FileManagerPanel
                title="File del Soggetto"
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
                  <Typography variant="body1" sx={{ gridColumn: 'span 4', textAlign: 'center', color: 'text.disabled', my: 2 }}>
                    Nessun file in questo soggetto
                  </Typography>
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

              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={handleOpenUploadDialog}
              >
                Carica File
              </Button>
            </Stack>

            {/* Sezione per le sottocartelle (Dettagli) */}
            {currentFolder?.subfolder && currentFolder.subfolder.length > 0 && (
              <>
                <FileManagerPanel
                  title="Dettagli"
                  subTitle={`${currentFolder.subfolder.length} Elementi`}
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
                  {currentFolder.subfolder.map((subfolder) => (
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

            {/* Aggiunta la sezione File qui */}
            <>
              <FileManagerPanel
                title="File del Dettaglio"
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
                  <Typography variant="body1" sx={{ gridColumn: 'span 4', textAlign: 'center', color: 'text.disabled', my: 2 }}>
                    Nessun file in questo dettaglio
                  </Typography>
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
        currentFolder={currentFolder}
      />
    </Box>
  );
}

FileManagerGridView.propTypes = {
  data: PropTypes.array,
  dataFiltered: PropTypes.array,
  onDeleteItem: PropTypes.func,
  onRefresh: PropTypes.func,
  onNavigationStateChange: PropTypes.func,
  navigationState: PropTypes.shape({
    viewMode: PropTypes.string,
    currentFolder: PropTypes.object,
    navigationHistory: PropTypes.array,
  }),
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
