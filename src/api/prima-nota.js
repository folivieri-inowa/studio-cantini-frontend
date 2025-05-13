import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetPrimaNota(db) {
  const URL = [endpoints.prima_nota.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      transactions: data?.data || [],
      transactionsLoading: isLoading,
      transactionsError: error,
      transactionsValidating: isValidating,
      transactionsEmpty: !isLoading && !data?.data.length,
      refetch: () => mutate(URL)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

export function useGetPrimaNotaDetail(id) {
  const URL = id ? [endpoints.prima_nota.details, { params: { id } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      transaction: data?.data,
      transactionLoading: isLoading,
      transactionError: error,
      transactionValidating: isValidating,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
// Funzioni per la gestione della cronologia delle importazioni

/**
 * Ottiene la cronologia delle importazioni
 * @param {Object} params - Parametri di ricerca
 * @returns {Promise<Object>} Risposta con la cronologia delle importazioni
 */
export async function getImportHistory(params) {
  try {
    const response = await fetcher(endpoints.prima_nota.import_history, {
      method: 'post',
      data: params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching import history:', error);
    throw error;
  }
}

/**
 * Ottiene i dettagli di un'importazione specifica
 * @param {Object} params - Parametri di ricerca
 * @returns {Promise<Object>} Risposta con i dettagli dell'importazione
 */
export async function getImportDetails(params) {
  try {
    const response = await fetcher(endpoints.prima_nota.import_details, {
      method: 'post',
      data: params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching import details:', error);
    throw error;
  }
}

/**
 * Annulla un'importazione
 * @param {Object} params - Parametri per identificare l'importazione da annullare
 * @returns {Promise<Object>} Risposta con il risultato dell'operazione
 */
export async function undoImport(params) {
  try {
    const response = await fetcher(endpoints.prima_nota.undo_import, {
      method: 'post',
      data: params,
    });
    return response.data;
  } catch (error) {
    console.error('Error undoing import:', error);
    throw error;
  }
}
