import useSWR from 'swr';
import { useMemo } from 'react';

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
