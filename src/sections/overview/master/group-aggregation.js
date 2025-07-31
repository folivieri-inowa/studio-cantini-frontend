'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import Iconify from '../../../components/iconify';
import { useBoolean } from '../../../hooks/use-boolean';
import { useGroupAggregation } from '../../../api/group-aggregation';
import GroupAggregationModalWorking from './group-aggregation-modal-working';

export default function GroupAggregation({ 
  title = "Analisi Raggruppata", 
  subheader = "Seleziona categorie e soggetti per analisi personalizzate", 
  categories = [], 
  categoriesLoading = false, 
  categoriesError = null, 
  db = "",
  availableYears = [],
  selectedYear = null,
  onYearChange = null,
  settings = null,
  ...other 
}) {
  const [selection, setSelection] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [localSelectedYear, setLocalSelectedYear] = useState(selectedYear);
  const [isCollapsed, setIsCollapsed] = useState(true); // Collassato di default
  
  // Sincronizza lo stato locale con le props
  useEffect(() => {
    setLocalSelectedYear(selectedYear);
  }, [selectedYear]);

  const modalOpen = useBoolean();
  const { 
    aggregationData, 
    isCalculating, 
    calculationError, 
    calculateAggregation, 
    resetAggregation 
  } = useGroupAggregation(db);

  // Calcolo statistiche selezione
  const getSelectionStats = useCallback(() => {
    const selectedCategories = selection.length;
    let selectedSubjects = 0;
    let selectedDetails = 0;
    
    selection.forEach(categorySelection => {
      if (categorySelection.subjectSelections) {
        selectedSubjects += categorySelection.subjectSelections.length;
        categorySelection.subjectSelections.forEach(subjectSelection => {
          selectedDetails += subjectSelection.detailIds?.length || 0;
        });
      } else {
        // Backward compatibility per la vecchia struttura
        selectedSubjects += categorySelection.subjectIds?.length || 0;
      }
    });
    
    return { selectedCategories, selectedSubjects, selectedDetails };
  }, [selection]);

  const stats = getSelectionStats();

  // Gestione selezione categorie
  const handleCategoryToggle = useCallback((categoryId) => {
    setSelection(prev => {
      const existingIndex = prev.findIndex(sel => sel.categoryId === categoryId);
      
      if (existingIndex >= 0) {
        return prev.filter(sel => sel.categoryId !== categoryId);
      }
      
      const category = categories.find(cat => cat.id === categoryId);
      const subcategories = category?.subcategories || {};
      
      // Crea selezioni per tutti i soggetti della categoria
      const subjectSelections = Object.values(subcategories).map(subject => {
        const details = subject.details || {};
        const allDetailIds = Object.keys(details);
        
        return {
          subjectId: subject.id,
          detailIds: allDetailIds // Seleziona tutti i details per default
        };
      });
      
      return [...prev, {
        categoryId,
        subjectSelections
      }];
    });
  }, [categories]);

  // Gestione selezione soggetti
  const handleSubjectToggle = useCallback((categoryId, subjectId) => {
    setSelection(prev => {
      const categoryIndex = prev.findIndex(sel => sel.categoryId === categoryId);
      
      if (categoryIndex >= 0) {
        // La categoria esiste già nella selezione
        const updatedSelection = [...prev];
        const currentSubjectSelections = [...(updatedSelection[categoryIndex].subjectSelections || [])];
        
        const subjectIndex = currentSubjectSelections.findIndex(sel => sel.subjectId === subjectId);
        
        if (subjectIndex >= 0) {
          // Rimuovi il soggetto
          currentSubjectSelections.splice(subjectIndex, 1);
        } else {
          // Aggiungi il soggetto con tutti i suoi details
          const category = categories.find(cat => cat.id === categoryId);
          const subject = category?.subcategories?.[subjectId];
          const details = subject?.details || {};
          const allDetailIds = Object.keys(details);
          
          currentSubjectSelections.push({
            subjectId,
            detailIds: allDetailIds
          });
        }
        
        if (currentSubjectSelections.length === 0) {
          // Se non ci sono più soggetti, rimuovi l'intera categoria
          return updatedSelection.filter(sel => sel.categoryId !== categoryId);
        }
        
        // Aggiorna la lista dei soggetti
        updatedSelection[categoryIndex] = {
          ...updatedSelection[categoryIndex],
          subjectSelections: currentSubjectSelections
        };
        
        return updatedSelection;
      }
      
      // La categoria non esiste ancora, creala con questo soggetto
      const category = categories.find(cat => cat.id === categoryId);
      const subject = category?.subcategories?.[subjectId];
      const details = subject?.details || {};
      const allDetailIds = Object.keys(details);
      
      return [...prev, {
        categoryId,
        subjectSelections: [{
          subjectId,
          detailIds: allDetailIds
        }]
      }];
    });
  }, [categories]);

  // Gestione selezione details
  const handleDetailToggle = useCallback((categoryId, subjectId, detailId) => {
    setSelection(prev => {
      const categoryIndex = prev.findIndex(sel => sel.categoryId === categoryId);
      
      if (categoryIndex >= 0) {
        const updatedSelection = [...prev];
        const currentSubjectSelections = [...(updatedSelection[categoryIndex].subjectSelections || [])];
        const subjectIndex = currentSubjectSelections.findIndex(sel => sel.subjectId === subjectId);
        
        if (subjectIndex >= 0) {
          // Il soggetto esiste, aggiorna i suoi details
          const currentDetailIds = [...(currentSubjectSelections[subjectIndex].detailIds || [])];
          
          if (currentDetailIds.includes(detailId)) {
            // Rimuovi il detail
            const newDetailIds = currentDetailIds.filter(id => id !== detailId);
            
            if (newDetailIds.length === 0) {
              // Se non ci sono più details, rimuovi il soggetto
              currentSubjectSelections.splice(subjectIndex, 1);
              
              if (currentSubjectSelections.length === 0) {
                // Se non ci sono più soggetti, rimuovi la categoria
                return updatedSelection.filter(sel => sel.categoryId !== categoryId);
              }
            } else {
              currentSubjectSelections[subjectIndex] = {
                ...currentSubjectSelections[subjectIndex],
                detailIds: newDetailIds
              };
            }
          } else {
            // Aggiungi il detail
            currentSubjectSelections[subjectIndex] = {
              ...currentSubjectSelections[subjectIndex],
              detailIds: [...currentDetailIds, detailId]
            };
          }
          
          updatedSelection[categoryIndex] = {
            ...updatedSelection[categoryIndex],
            subjectSelections: currentSubjectSelections
          };
          
          return updatedSelection;
        }
        
        // Il soggetto non esiste, crealo con questo detail
        currentSubjectSelections.push({
          subjectId,
          detailIds: [detailId]
        });
        
        updatedSelection[categoryIndex] = {
          ...updatedSelection[categoryIndex],
          subjectSelections: currentSubjectSelections
        };
        
        return updatedSelection;
      }
      
      // La categoria non esiste, creala con questo soggetto e detail
      return [...prev, {
        categoryId,
        subjectSelections: [{
          subjectId,
          detailIds: [detailId]
        }]
      }];
    });
  }, []);

  // Gestione cambio anno
  const handleYearChange = useCallback((event) => {
    const newYear = event.target.value;
    setLocalSelectedYear(newYear);
    if (onYearChange) {
      onYearChange(newYear);
    }
  }, [onYearChange]);

  const handleCategoryExpand = useCallback((categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  // Gestione calcolo aggregazione
  const handleCalculate = useCallback(async () => {
    if (selection.length === 0) return;

    const groupData = {
      selection,
      groupName: `Aggregazione ${selection.length} categorie`
    };

    // Passa owner e year al calcolo aggregazione
    const ownerId = settings?.owner?.id || 'all-accounts';
    const year = settings?.year || localSelectedYear;
    
    await calculateAggregation(groupData, ownerId, year);
    modalOpen.onTrue();
  }, [selection, calculateAggregation, modalOpen, settings, localSelectedYear]);

  // Reset selezione
  const handleReset = useCallback(() => {
    setSelection([]);
    setExpandedCategories({});
    resetAggregation();
  }, [resetAggregation]);

  const canCalculate = selection.length > 0 && !isCalculating;

  return (
    <>
      <Card {...other}>
        <CardHeader
          title={title}
          subheader={subheader}
          action={
            <IconButton
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="espandi/collassa"
            >
              <Iconify icon={isCollapsed ? 'eva:arrow-down-fill' : 'eva:arrow-up-fill'} />
            </IconButton>
          }
        />
        <Collapse in={!isCollapsed}>
          <CardContent>
            <Stack spacing={3}>
              {/* Filtri superiori */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                  <Chip 
                    label={`${stats.selectedCategories} categorie`}
                    color={stats.selectedCategories > 0 ? 'primary' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`${stats.selectedSubjects} soggetti`}
                    color={stats.selectedSubjects > 0 ? 'primary' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`${stats.selectedDetails} dettagli`}
                    color={stats.selectedDetails > 0 ? 'primary' : 'default'}
                    variant="outlined"
                  />
                </Stack>
                
                {/* Dropdown filtro per anno */}
                {availableYears.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Anno</InputLabel>
                    <Select
                      value={localSelectedYear || ''}
                      label="Anno"
                  onChange={handleYearChange}
                >
                  <MenuItem value="">Tutti gli anni</MenuItem>
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
          
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Seleziona categorie e soggetti:
            </Typography>
            
            {categoriesLoading && (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2">Caricamento categorie...</Typography>
              </Stack>
            )}

            {categoriesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Errore nel caricamento delle categorie: {categoriesError.message}
              </Alert>
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <Alert severity="info">
                Nessuna categoria disponibile per il database selezionato.
              </Alert>
            )}

            {!categoriesLoading && !categoriesError && categories.length > 0 && (
              <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                {categories.map((category) => {
                  const categorySelection = selection.find(sel => sel.categoryId === category.id);
                  const isSelected = Boolean(categorySelection);
                  const isExpanded = Boolean(expandedCategories[category.id]);
                  const subcategories = category.subcategories || {};
                  const hasSubcategories = Object.keys(subcategories).length > 0;
                  
                  // Calcolo selezioni con la nuova struttura
                  const selectedSubjectSelections = categorySelection?.subjectSelections || [];
                  const allSubjectIds = Object.keys(subcategories);
                  const selectedSubjectIds = selectedSubjectSelections.map(sel => sel.subjectId);
                  
                  const isFullySelected = hasSubcategories && 
                    allSubjectIds.length > 0 && 
                    isSelected && 
                    selectedSubjectIds.length === allSubjectIds.length;

                  return (
                    <Box key={category.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Stack direction="row" alignItems="center" sx={{ p: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              indeterminate={isSelected && !isFullySelected && hasSubcategories}
                              onChange={() => handleCategoryToggle(category.id)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                              {category.name}
                              {isSelected && ` (${selectedSubjectIds.length}${hasSubcategories ? `/${allSubjectIds.length}` : ''})`}
                            </Typography>
                          }
                          sx={{ flexGrow: 1 }}
                        />
                        
                        {hasSubcategories && (
                          <IconButton
                            size="small"
                            onClick={() => handleCategoryExpand(category.id)}
                          >
                            <Iconify 
                              icon={isExpanded ? "eva:arrow-up-fill" : "eva:arrow-down-fill"} 
                            />
                          </IconButton>
                        )}
                      </Stack>

                      {hasSubcategories && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Stack spacing={0.5} sx={{ px: 2, pb: 1 }}>
                            {Object.values(subcategories).map((subject) => {
                              const subjectSelection = selectedSubjectSelections.find(sel => sel.subjectId === subject.id);
                              const isSubjectSelected = Boolean(subjectSelection);
                              const subjectDetails = subject.details || {};
                              const hasDetails = Object.keys(subjectDetails).length > 0;
                              const selectedDetailIds = subjectSelection?.detailIds || [];
                              const allDetailIds = Object.keys(subjectDetails);
                              
                              // Stato espansione del soggetto per i details
                              const subjectExpandKey = `${category.id}_${subject.id}`;
                              const isSubjectExpanded = Boolean(expandedCategories[subjectExpandKey]);
                              
                              const isSubjectFullySelected = hasDetails && 
                                allDetailIds.length > 0 && 
                                isSubjectSelected && 
                                selectedDetailIds.length === allDetailIds.length;
                              
                              return (
                                <Box key={subject.id} sx={{ ml: 2, border: 1, borderColor: 'divider', borderRadius: 1, backgroundColor: 'grey.50' }}>
                                  <Stack direction="row" alignItems="center" sx={{ p: 1 }}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={isSubjectSelected}
                                          indeterminate={isSubjectSelected && !isSubjectFullySelected && hasDetails}
                                          onChange={() => handleSubjectToggle(category.id, subject.id)}
                                          color="primary"
                                          size="small"
                                        />
                                      }
                                      label={
                                        <Typography 
                                          variant="body2" 
                                          color="text.secondary"
                                          fontWeight={isSubjectSelected ? 'medium' : 'normal'}
                                        >
                                          {subject.name}
                                          {isSubjectSelected && hasDetails && ` (${selectedDetailIds.length}/${allDetailIds.length})`}
                                        </Typography>
                                      }
                                      sx={{ flexGrow: 1 }}
                                    />
                                    
                                    {hasDetails && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleCategoryExpand(subjectExpandKey)}
                                      >
                                        <Iconify 
                                          icon={isSubjectExpanded ? "eva:arrow-up-fill" : "eva:arrow-down-fill"} 
                                        />
                                      </IconButton>
                                    )}
                                  </Stack>
                                  
                                  {/* Sezione Details */}
                                  {hasDetails && (
                                    <Collapse in={isSubjectExpanded} timeout="auto" unmountOnExit>
                                      <Stack spacing={0.5} sx={{ px: 2, pb: 1 }}>
                                        {Object.values(subjectDetails).map((detail) => {
                                          const isDetailSelected = selectedDetailIds.includes(detail.id);
                                          
                                          return (
                                            <FormControlLabel
                                              key={detail.id}
                                              control={
                                                <Checkbox
                                                  checked={isDetailSelected}
                                                  onChange={() => handleDetailToggle(category.id, subject.id, detail.id)}
                                                  color="primary"
                                                  size="small"
                                                />
                                              }
                                              label={
                                                <Typography 
                                                  variant="caption" 
                                                  color="text.disabled"
                                                  fontWeight={isDetailSelected ? 'medium' : 'normal'}
                                                >
                                                  {detail.name}
                                                </Typography>
                                              }
                                              sx={{ ml: 4 }}
                                            />
                                          );
                                        })}
                                      </Stack>
                                    </Collapse>
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        </Collapse>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {calculationError && (
            <Alert severity="error">
              Errore nel calcolo: {calculationError}
            </Alert>
          )}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={selection.length === 0}
              startIcon={<Iconify icon="eva:refresh-fill" />}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={!canCalculate}
              startIcon={
                isCalculating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="eva:bar-chart-2-fill" />
                )
              }
            >
              {isCalculating ? 'Calcolo...' : 'Visualizza Analisi'}
            </Button>
          </Stack>
            </Stack>
          </CardContent>
        </Collapse>
      </Card>

      {/* Modal per visualizzare i risultati */}
      <GroupAggregationModalWorking
        open={modalOpen.value}
        onClose={modalOpen.onFalse}
        data={aggregationData}
        categories={categories}
        loading={isCalculating}
        error={calculationError}
        settings={settings}
      />
    </>
  );
}

GroupAggregation.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  categories: PropTypes.array,
  categoriesLoading: PropTypes.bool,
  categoriesError: PropTypes.object,
  db: PropTypes.string,
  availableYears: PropTypes.array,
  selectedYear: PropTypes.number,
  onYearChange: PropTypes.func,
  settings: PropTypes.object,
};