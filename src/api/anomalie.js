import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from '../utils/axios';

// ----------------------------------------------------------------------

/**
 * Hook per ottenere l'analisi delle anomalie con filtri avanzati
 * @param {string} db - Database di riferimento
 * @param {Object} options - Opzioni di configurazione e filtri
 * @returns {Object} Dati delle anomalie e stato del caricamento
 */
export function useGetAnomalieAnalysis(db, options = {}) {
  const { 
    soglia = 50, 
    mesi = 12, 
    limit = 100, 
    offset = 0, 
    tipo_anomalia = 'tutte',
    categoria_id,
    soggetto_id,
    data_da,
    data_a,
    soglia_minima = 0,
    soglia_massima = 1000,
    importo_minimo,
    importo_massimo,
    score_minimo = 0,
    ordine = 'score_desc'
  } = options;
  
  const URL = db ? [
    endpoints.anomalie.analysis, 
    { 
      params: { 
        db, 
        soglia, 
        mesi, 
        limit, 
        offset, 
        tipo_anomalia,
        categoria_id,
        soggetto_id,
        data_da,
        data_a,
        soglia_minima,
        soglia_massima,
        importo_minimo,
        importo_massimo,
        score_minimo,
        ordine
      } 
    }
  ] : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      anomalie: data?.data || [],
      anomalieLoading: isLoading,
      anomalieError: error,
      anomalieValidating: isValidating,
      anomalieEmpty: !isLoading && !data?.data?.length,
      statistiche: data?.statistiche || {},
      parametri: data?.parametri || {},
      paginazione: data?.paginazione || {},
      refetch: mutate,
      success: data?.success || false,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Hook per ottenere le statistiche generali delle anomalie
 * @param {string} db - Database di riferimento
 * @param {number} mesi - Numero di mesi da considerare
 * @returns {Object} Statistiche e stato del caricamento
 */
export function useGetAnomalieStats(db, mesi = 12) {
  const URL = db ? [endpoints.anomalie.stats, { params: { db, mesi } }] : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      stats: data?.data || {},
      statsLoading: isLoading,
      statsError: error,
      statsValidating: isValidating,
      periodoAnalisi: data?.periodo_analisi || {},
      refetch: mutate,
      success: data?.success || false,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/**
 * Funzione per chiamare l'analisi delle anomalie manualmente
 * @param {string} db - Database di riferimento
 * @param {Object} options - Opzioni di configurazione
 * @returns {Promise<Object>} Risultati dell'analisi
 */
export async function fetchAnomalieAnalysis(db, options = {}) {
  try {
    const { soglia = 50, mesi = 12, limit = 100, offset = 0, tipo = 'entrambi' } = options;
    
    const response = await fetcher([
      endpoints.anomalie.analysis, 
      { 
        params: { 
          db, 
          soglia, 
          mesi, 
          limit, 
          offset, 
          tipo 
        } 
      }
    ]);
    
    return response;
  } catch (error) {
    console.error('Errore nel fetch delle anomalie:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

/**
 * Funzione per chiamare le statistiche delle anomalie manualmente
 * @param {string} db - Database di riferimento
 * @param {number} mesi - Numero di mesi da considerare
 * @returns {Promise<Object>} Statistiche
 */
export async function fetchAnomalieStats(db, mesi = 12) {
  try {
    const response = await fetcher([
      endpoints.anomalie.stats, 
      { params: { db, mesi } }
    ]);
    
    return response;
  } catch (error) {
    console.error('Errore nel fetch delle statistiche anomalie:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

/**
 * Hook per ottenere i filtri disponibili (categorie, soggetti, etc.)
 * @param {string} db - Database di riferimento
 * @param {number} mesi - Numero di mesi da considerare
 * @returns {Object} Dati dei filtri disponibili
 */
export function useGetAnomalieFiltri(db, mesi = 12) {
  const URL = db ? [
    endpoints.anomalie.filtri, 
    { 
      params: { 
        db, 
        mesi 
      } 
    }
  ] : '';

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  const memoizedValue = useMemo(
    () => ({
      filtri: data?.data || {},
      filtriLoading: isLoading,
      filtriError: error,
      filtriValidating: isValidating,
      refetch: mutate,
      success: data?.success || false,
    }),
    [data, error, isLoading, isValidating, mutate]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------
