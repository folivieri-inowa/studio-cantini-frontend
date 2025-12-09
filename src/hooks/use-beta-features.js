'use client';

import { useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Lista degli utenti che hanno accesso alle funzionalità beta
const BETA_USERS = [
  'f.olivieri@inowa.it',
];

// ----------------------------------------------------------------------

/**
 * Hook per controllare se l'utente corrente ha accesso alle funzionalità beta
 * @returns {Object} { isBetaUser: boolean, userEmail: string | null }
 */
export function useBetaFeatures() {
  const { user } = useAuthContext();

  const isBetaUser = useMemo(() => {
    if (!user?.email) return false;
    return BETA_USERS.includes(user.email.toLowerCase());
  }, [user?.email]);

  return {
    isBetaUser,
    userEmail: user?.email || null,
  };
}
