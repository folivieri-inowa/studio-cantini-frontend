'use client';

import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import Iconify from '../../../components/iconify';
import { useBoolean } from '../../../hooks/use-boolean';
import { useGroupAggregation } from '../../../api/group-aggregation';

export default function GroupAggregationSimple({ 
  title = "Analisi Raggruppata", 
  subheader = "Versione semplificata per debug", 
  categories = [], 
  categoriesLoading = false, 
  categoriesError = null, 
  db = "",
  ...other 
}) {
  const [selection, setSelection] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  
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
    const selectedSubjects = selection.reduce((total, sel) => total + sel.subjectIds.length, 0);
    
    return { selectedCategories, selectedSubjects };
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
        const allSubjectIds = category?.subcategories ? Object.keys(category.subcategories) : [];
        
        return [...prev, {
          categoryId,
          subjectIds: allSubjectIds
        }];
      
    });
  }, [categories]);

  // Gestione selezione soggetti
  const handleSubjectToggle = useCallback((categoryId, subjectId) => {
    setSelection(prev => {
      const categoryIndex = prev.findIndex(sel => sel.categoryId === categoryId);
      
      if (categoryIndex >= 0) {
        const updatedSelection = [...prev];
        const {subjectIds} = updatedSelection[categoryIndex];
        
        if (subjectIds.includes(subjectId)) {
          updatedSelection[categoryIndex].subjectIds = subjectIds.filter(id => id !== subjectId);
          
          if (updatedSelection[categoryIndex].subjectIds.length === 0) {
            return updatedSelection.filter(sel => sel.categoryId !== categoryId);
          }
        } else {
          updatedSelection[categoryIndex].subjectIds.push(subjectId);
        }
        
        return updatedSelection;
      }
      return [...prev, {
        categoryId,
        subjectIds: [subjectId]
      }];
    });
  }, []);
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

    await calculateAggregation(groupData);
    modalOpen.onTrue();
  }, [selection, calculateAggregation, modalOpen]);

  // Reset selezione
  const handleReset = useCallback(() => {
    setSelection([]);
    setExpandedCategories({});
    resetAggregation();
  }, [resetAggregation]);

  const canCalculate = selection.length > 0 && !isCalculating;

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
      />
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" spacing={2}>
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
              {categories.slice(0, 3).map((category) => {
                const isSelected = selection.some(sel => sel.categoryId === category.id);
                const isExpanded = Boolean(expandedCategories[category.id]);
                const selectedSubjects = selection.find(sel => sel.categoryId === category.id)?.subjectIds || [];
                const subcategories = category.subcategories || {};
                const hasSubcategories = Object.keys(subcategories).length > 0;

                return (
                  <Box key={category.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Stack direction="row" alignItems="center" sx={{ p: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(isSelected)}
                            onChange={() => handleCategoryToggle(category.id)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
                            {category.name}
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
                          {Object.values(subcategories).slice(0, 2).map((subject) => (
                            <FormControlLabel
                              key={subject.id}
                              control={
                                <Checkbox
                                  checked={Boolean(selectedSubjects.includes(subject.id))}
                                  onChange={() => handleSubjectToggle(category.id, subject.id)}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label={
                                <Typography variant="body2" color="text.secondary">
                                  {subject.name}
                                </Typography>
                              }
                              sx={{ ml: 2 }}
                            />
                          ))}
                          {Object.values(subcategories).length > 2 && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                              ... e altri {Object.values(subcategories).length - 2} soggetti
                            </Typography>
                          )}
                        </Stack>
                      </Collapse>
                    )}
                  </Box>
                );
              })}
              <Typography variant="caption" color="text.secondary">
                Mostrate solo le prime 3 categorie per test
              </Typography>
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
    </Card>
  );
}

GroupAggregationSimple.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  categories: PropTypes.array,
  categoriesLoading: PropTypes.bool,
  categoriesError: PropTypes.object,
  db: PropTypes.string,
};
