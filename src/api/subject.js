import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetSubjects(db) {
  const URL = [endpoints.subject.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => {
      // Ordiniamo alfabeticamente i soggetti
      const sortedSubjects = data?.data 
        ? [...data.data].sort((a, b) => a.name.localeCompare(b.name))
        : [];

      return {
        subjects: sortedSubjects,
        subjectsLoading: isLoading,
        subjectsError: error,
        subjectsValidating: isValidating,
        subjectsEmpty: !isLoading && !data?.data.length,
        refetchSubjects: () => mutate(URL)
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}
