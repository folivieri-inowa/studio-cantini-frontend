// File: api/scadenziario-api.js
import useSWR from 'swr';

import axios from '../utils/axios';

// URL del backend
const BACKEND_URL = '/api/scadenziario';

// ----------------------------------------------------------------------

/**
 * Recupera l'elenco di tutte le scadenze, con supporto per filtri
 * @param {Object} filters - Oggetto contenente i filtri (opzionale)
 * @returns {Promise<Object>} - Promise con i dati delle scadenze
 */
export async function getScadenziarioList(filters = {}) {
  try {
    const response = await axios.post(`${BACKEND_URL}/list`, { filters });
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle scadenze:', error);
    throw error;
  }
}

/**
 * Recupera i dettagli di una specifica scadenza
 * @param {string} id - ID della scadenza
 * @returns {Promise<Object>} - Promise con i dettagli della scadenza
 */
export async function getScadenziarioDetails(id) {
  try {
    const response = await axios.post(`${BACKEND_URL}/details`, { id });
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei dettagli della scadenza:', error);
    throw error;
  }
}

/**
 * Crea una nuova scadenza
 * @param {Object} scadenza - Dati della nuova scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza creata
 */
export async function createScadenziario(scadenza) {
  try {
    const response = await axios.post(`${BACKEND_URL}/create`, { scadenza });
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione della scadenza:', error);
    throw error;
  }
}

/**
 * Aggiorna una scadenza esistente
 * @param {string} id - ID della scadenza da aggiornare
 * @param {Object} scadenza - Dati aggiornati della scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza aggiornata
 */
export async function updateScadenziario(id, scadenza) {
  try {
    const response = await axios.post(`${BACKEND_URL}/update`, { id, scadenza });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento della scadenza:', error);
    throw error;
  }
}

/**
 * Aggiorna solo lo stato di pagamento di una scadenza
 * @param {string} id - ID della scadenza
 * @param {string} payment_date - Data di pagamento (formato YYYY-MM-DD)
 * @param {string} status - Nuovo stato della scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza aggiornata
 */
export async function updatePaymentStatus(id, payment_date, status) {
  try {
    const response = await axios.post(`${BACKEND_URL}/update-payment`, { id, payment_date, status });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato di pagamento:', error);
    throw error;
  }
}

/**
 * Elimina una scadenza
 * @param {string} id - ID della scadenza da eliminare
 * @returns {Promise<Object>} - Promise con l'esito dell'eliminazione
 */
export async function deleteScadenziario(id) {
  try {
    const response = await axios.post(`${BACKEND_URL}/delete`, { id });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione della scadenza:', error);
    throw error;
  }
}

/**
 * Elimina più scadenze contemporaneamente
 * @param {Array<string>} ids - Array di ID delle scadenze da eliminare
 * @returns {Promise<Object>} - Promise con l'esito dell'eliminazione
 */
export async function deleteMultipleScadenze(ids) {
  try {
    const response = await axios.post(`${BACKEND_URL}/delete-multiple`, { ids });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione di multiple scadenze:', error);
    throw error;
  }
}

/**
 * Aggiorna automaticamente lo stato di tutte le scadenze in base alle date
 * @returns {Promise<Object>} - Promise con l'esito dell'aggiornamento
 */
export async function updateAllStatus() {
  try {
    const response = await axios.post(`${BACKEND_URL}/update-status`, {});
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento automatico degli stati:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Hook SWR per integrazione con React
// ----------------------------------------------------------------------

/**
 * Hook per recuperare l'elenco delle scadenze con filtri opzionali
 * @param {Object} filters - Filtri da applicare alla query
 */
export function useGetScadenziario(filters = {}) {
  // Crea una chiave unica per SWR che cambia quando cambiano i filtri
  const swrKey = JSON.stringify(['scadenziario-list', filters]);
  
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      try {
        return await getScadenziarioList(filters);
      } catch (error) {
        console.error('Errore durante il recupero delle scadenze:', error);
        throw error;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const scadenziario = data?.data || [];

  return {
    scadenziario,
    scadenziarioLoading: isLoading,
    scadenziarioError: error,
    scadenziarioEmpty: !isLoading && !scadenziario.length,
    scadenziarioMutate: mutate,
  };
}

/**
 * Hook per recuperare i dettagli di una singola scadenza
 * @param {string} id - ID della scadenza
 */
export function useGetScadenziarioItem(id) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `scadenziario-detail-${id}` : null,
    async () => {
      try {
        return await getScadenziarioDetails(id);
      } catch (error) {
        console.error('Errore durante il recupero dei dettagli della scadenza:', error);
        throw error;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  
  const item = data?.data || {};

  return {
    scadenziarioItem: item,
    scadenziarioItemLoading: isLoading,
    scadenziarioItemError: error,
    scadenziarioItemMutate: mutate,
  };
}
