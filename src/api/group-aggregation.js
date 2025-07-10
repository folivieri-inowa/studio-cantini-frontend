import useSWR from 'swr';
import { useMemo, useState, useCallback } from 'react';

import { fetcher, endpoints } from '../utils/axios';

// ----------------------------------------------------------------------

/**
 * Hook per eseguire l'aggregazione di categorie e soggetti
 * @param {string} db - Database di riferimento  
 * @param {Object} groupData - Dati del gruppo (selection e groupName)
 * @returns {Object} Risultati aggregazione e funzioni di controllo
 */
export function useGroupAggregation(db) {
  // Stato per i dati dell'aggregazione corrente
  const [currentAggregation, setCurrentAggregation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  // Funzione per calcolare l'aggregazione
  const calculateAggregation = useCallback(async (groupData) => {
    if (!db || !groupData?.selection?.length) {
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Converte la selezione nel formato richiesto dal backend
      const selectedCategories = [];
      const selectedSubjects = [];
      const selectedDetails = [];
      
      groupData.selection.forEach(categorySelection => {
        selectedCategories.push(categorySelection.categoryId);
        if (categorySelection.subjectSelections) {
          categorySelection.subjectSelections.forEach(subjectSelection => {
            selectedSubjects.push(subjectSelection.subjectId);
            if (subjectSelection.detailIds) {
              selectedDetails.push(...subjectSelection.detailIds);
            }
          });
        } else {
          // Se non ci sono selezioni specifiche di soggetti, includi tutti i soggetti della categoria
          selectedSubjects.push(...categorySelection.subjectIds);
        }
      });

      const response = await fetch(endpoints.report.groupAggregation, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db,
          groupName: groupData.groupName,
          selectedCategories,
          selectedSubjects,
          selectedDetails
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore nella richiesta: ${response.statusText}`);
      }

      const data = await response.json();
      setCurrentAggregation(data);
      
    } catch (error) {
      console.error('Errore nel calcolo aggregazione:', error);
      setCalculationError(error.message || 'Errore durante il calcolo dell\'aggregazione');
    } finally {
      setIsCalculating(false);
    }
  }, [db]);

  // Funzione per resettare i dati
  const resetAggregation = useCallback(() => {
    setCurrentAggregation(null);
    setCalculationError(null);
  }, []);

  return {
    aggregationData: currentAggregation,
    isCalculating,
    calculationError,
    calculateAggregation,
    resetAggregation,
  };
}

// ----------------------------------------------------------------------

/**
 * Hook per ottenere i dati delle categorie per l'aggregazione
 * @param {string} db - Database di riferimento
 * @returns {Object} Categorie con subcategorie e stato del caricamento
 */
export function useGetCategoriesForAggregation(db) {
  const URL = db ? `${endpoints.report.categoriesSubjects}/${db}` : null;

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher, {
    dedupingInterval: 5 * 60 * 1000, // Cache per 5 minuti
    revalidateOnFocus: false,
  });

  const memoizedValue = useMemo(() => {
    // Estrae le categorie dalla risposta del nuovo endpoint
    const categories = data?.data || [];

    return {
      categories,
      categoriesLoading: isLoading,
      categoriesError: error,
      categoriesValidating: isValidating,
      categoriesEmpty: !isLoading && categories.length === 0,
    };
  }, [data, isLoading, error, isValidating]);

  return memoizedValue;
}
