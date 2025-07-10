'use client';

import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetFileManager } from 'src/api/file-manager';

import { useTable } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';

import FileManagerGridView from '../file-manager-grid-view-new';

// ----------------------------------------------------------------------

export default function FileManagerView() {
  const table = useTable({ defaultRowsPerPage: 10 });
  const { db } = useSettingsContext();
  const settings = useSettingsContext();

  const { fileManager, fileManagerLoading, refetch } = useGetFileManager(db);

  // Preparazione della struttura per categorie/soggetti/dettagli
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [details, setDetails] = useState({});

  // Organizzazione dei dati per il dialogo di upload
  useEffect(() => {
    if (fileManager && fileManager.length > 0) {
      // Estrai le categorie
      const cats = fileManager.map(cat => ({
        id: cat.id,
        name: cat.name,
      }));
      setCategories(cats);

      // Organizza i soggetti per categoria
      const subjectsByCategory = {};
      const detailsBySubject = {};

      fileManager.forEach(category => {
        if (category.subfolder && category.subfolder.length) {
          subjectsByCategory[category.id] = category.subfolder.map(sub => ({
            id: sub.id,
            name: sub.name,
          }));

          // Organizza i dettagli per soggetto
          category.subfolder.forEach(subject => {
            if (subject.subfolder && subject.subfolder.length) {
              detailsBySubject[subject.id] = subject.subfolder.map(detail => ({
                id: detail.id,
                name: detail.name,
              }));
            }
          });
        }
      });

      setSubjects(subjectsByCategory);
      setDetails(detailsBySubject);
    }
  }, [fileManager]);

  // Funzione per assicurare che ogni cartella abbia la proprietà files e verifica gli oggetti vuoti
  const processFileManagerData = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    console.log('Processando i dati del file manager:', data);
    let totalFiles = 0;
    let totalCategories = 0;
    let totalSubjects = 0;
    let totalDetails = 0;
    
    const processedData = data.map(category => {
      // Assicurati che la categoria abbia la proprietà files
      const updatedCategory = { ...category };
      totalCategories += 1;
      
      // Inizializzazione e controllo dei file a livello di categoria
      if (!updatedCategory.files) {
        updatedCategory.files = [];
        // console.log(`Inizializzata la proprietà files per la categoria ${updatedCategory.name}`);
      } else if (updatedCategory.files.length > 0) {
        console.log(`La categoria ${updatedCategory.name} ha ${updatedCategory.files.length} file:`, updatedCategory.files);
        totalFiles += updatedCategory.files.length;
      }
      
      // Processa le sottocartelle (soggetti)
      if (updatedCategory.subfolder && updatedCategory.subfolder.length > 0) {
        updatedCategory.subfolder = updatedCategory.subfolder.map(subject => {
          const updatedSubject = { ...subject };
          totalSubjects += 1;
          
          // Inizializzazione e controllo dei file a livello di soggetto
          if (!updatedSubject.files) {
            updatedSubject.files = [];
            // console.log(`Inizializzata la proprietà files per il soggetto ${updatedSubject.name}`);
          } else if (updatedSubject.files.length > 0) {
            console.log(`Il soggetto ${updatedSubject.name} ha ${updatedSubject.files.length} file:`, updatedSubject.files);
            totalFiles += updatedSubject.files.length;
          }
          
          // Processa i dettagli
          if (updatedSubject.subfolder && updatedSubject.subfolder.length > 0) {
            updatedSubject.subfolder = updatedSubject.subfolder.map(detail => {
              const updatedDetail = { ...detail };
              totalDetails += 1;
              
              // Inizializzazione e controllo dei file a livello di dettaglio
              if (!updatedDetail.files) {
                updatedDetail.files = [];
                // console.log(`Inizializzata la proprietà files per il dettaglio ${updatedDetail.name}`);
              } else if (updatedDetail.files.length > 0) {
                console.log(`Il dettaglio ${updatedDetail.name} ha ${updatedDetail.files.length} file:`, updatedDetail.files);
                totalFiles += updatedDetail.files.length;
              }
              return updatedDetail;
            });
          }
          
          return updatedSubject;
        });
      }
      
      return updatedCategory;
    });
    
    console.log(`Riepilogo struttura dati:`);
    console.log(`- Totale categorie: ${totalCategories}`);
    console.log(`- Totale soggetti: ${totalSubjects}`);
    console.log(`- Totale dettagli: ${totalDetails}`);
    console.log(`- Totale file trovati: ${totalFiles}`);
    
    return processedData;
  };

  // Stato per mantenere la posizione di navigazione dopo il refresh
  const [navigationState, setNavigationState] = useState({
    viewMode: 'categories',
    currentFolder: null,
    navigationHistory: []
  });

  const handleRefresh = () => {
    refetch();
  };

  // Funzione per aggiornare lo stato di navigazione
  const handleNavigationStateChange = (newNavigationState) => {
    setNavigationState(newNavigationState);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4">Archivio File</Typography>
          {/* Pulsante di caricamento rimosso da qui, verrà mostrato solo all'interno delle cartelle */}
        </Stack>

        {fileManagerLoading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {!fileManager || fileManager.length === 0 ? (
              <EmptyContent
                filled
                title="Nessun file trovato"
                description="Naviga in una cartella per caricare i file"
                sx={{ py: 10 }}
              />
            ) : (
              <FileManagerGridView
                table={table}
                data={processFileManagerData(fileManager)}
                onRefresh={handleRefresh}
                onNavigationStateChange={handleNavigationStateChange}
                navigationState={navigationState}
                db={db}
                categories={categories}
                subjects={subjects}
                details={details}
              />
            )}
          </>
        )}
      </Container>
    );
  };
