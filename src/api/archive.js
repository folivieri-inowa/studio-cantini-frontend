import useSWR from 'swr';
import { useMemo } from 'react';

import axios from 'src/utils/axios';
import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

/**
 * Hook per ottenere lista documenti archivio
 */
export function useGetArchiveDocuments(db, filters = {}) {
  const URL = db
    ? [endpoints.archive.documents, { params: { db, ...filters } }]
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      documents: data?.data || [],
      pagination: data?.pagination || {},
      documentsLoading: isLoading,
      documentsError: error,
      documentsValidating: isValidating,
      documentsEmpty: !isLoading && !data?.data?.length,
      documentsRefresh: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

/**
 * Hook per ottenere singolo documento
 */
export function useGetArchiveDocument(id) {
  const URL = id ? endpoints.archive.document(id) : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      document: data?.document || null,
      loading: isLoading,
      error,
      validating: isValidating,
      refresh: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

/**
 * Hook per ottenere statistiche archivio
 */
export function useGetArchiveStats(db) {
  const URL = db ? [endpoints.archive.stats, { params: { db } }] : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      stats: data?.stats || null,
      statsLoading: isLoading,
      statsError: error,
      statsValidating: isValidating,
      statsRefresh: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

/**
 * Hook per ottenere cartelle e file in un percorso (Finder-like navigation)
 */
export function useGetArchiveFolders(db, path = '') {
  const URL = db
    ? [endpoints.archive.folders, { params: { db, path } }]
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      folders: data?.folders || [],
      files: data?.files || [],
      currentPath: data?.currentPath || '',
      foldersLoading: isLoading,
      foldersError: error,
      foldersValidating: isValidating,
      foldersEmpty: !isLoading && !data?.folders?.length && !data?.files?.length,
      foldersRefresh: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

/**
 * Hook per ottenere il breadcrumb di navigazione
 */
export function useGetArchiveBreadcrumb(path = '') {
  const URL = endpoints.archive.breadcrumb;

  const { data, isLoading, error, isValidating } = useSWR(
    path !== undefined ? [URL, { params: { path } }] : null,
    fetcher
  );

  return useMemo(
    () => ({
      breadcrumb: data?.breadcrumb || [{ name: 'Root', path: '' }],
      breadcrumbLoading: isLoading,
      breadcrumbError: error,
    }),
    [data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

/**
 * Retry del processamento di un documento
 * @param {string} documentId - ID del documento
 * @param {string} db - Database
 * @returns {Promise<Object>} - Risultato del retry
 */
export async function retryDocumentProcessing(documentId, db) {
  const response = await axios.post(endpoints.archive.retry(documentId), {
    db,
  });
  return response.data;
}

/**
 * Elimina TUTTI i documenti dall'archivio (operazione distruttiva)
 * @param {string} db - Database
 * @returns {Promise<Object>} - Risultato della cancellazione
 */
export async function clearAllArchiveDocuments(db) {
  const response = await axios.delete(endpoints.archive.clearAll, {
    data: {
      db,
      confirm: 'DELETE_ALL',
    },
  });
  return response.data;
}

// =============================================================================
// CHAT CONVERSAZIONALE
// =============================================================================

/**
 * Crea una nuova sessione di chat
 * @param {string} db - Database
 * @param {string} title - Titolo opzionale
 * @returns {Promise<Object>} - Sessione creata
 */
export async function createChatSession(db, title = null) {
  const response = await axios.post(endpoints.archive.chat.sessions, {
    db,
    title,
  });
  return response.data;
}

/**
 * Lista sessioni di chat
 * @param {string} db - Database
 * @returns {Promise<Array>} - Lista sessioni
 */
export async function listChatSessions(db) {
  const response = await axios.get(endpoints.archive.chat.sessions, {
    params: { db },
  });
  return response.data;
}

/**
 * Recupera messaggi di una sessione
 * @param {string} sessionId - ID sessione
 * @param {string} db - Database
 * @returns {Promise<Object>} - Messaggi e info sessione
 */
export async function getChatMessages(sessionId, db) {
  const response = await axios.get(endpoints.archive.chat.messages(sessionId), {
    params: { db },
  });
  return response.data;
}

/**
 * Invia messaggio e ricevi risposta
 * @param {string} sessionId - ID sessione
 * @param {string} db - Database
 * @param {string} message - Messaggio utente
 * @returns {Promise<Object>} - Risposta dell'assistente
 */
export async function sendChatMessage(sessionId, db, message) {
  const response = await axios.post(endpoints.archive.chat.messages(sessionId), {
    db,
    message,
  });
  return response.data;
}

/**
 * Elimina una sessione di chat
 * @param {string} sessionId - ID sessione
 * @param {string} db - Database
 * @returns {Promise<Object>} - Risultato
 */
export async function deleteChatSession(sessionId, db) {
  const response = await axios.delete(endpoints.archive.chat.messages(sessionId).replace('/messages', ''), {
    params: { db },
  });
  return response.data;
}
