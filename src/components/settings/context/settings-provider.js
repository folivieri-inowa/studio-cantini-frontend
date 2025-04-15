'use client';

import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { useMemo, useState, useEffect, useCallback } from 'react';

import { useLocalStorage } from 'src/hooks/use-local-storage';

import { localStorageGetItem } from 'src/utils/storage-available';

import { SettingsContext } from './settings-context';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'settings';

export function SettingsProvider({ children, defaultSettings }) {
  const { state, update, reset } = useLocalStorage(STORAGE_KEY, defaultSettings);

  const [openDrawer, setOpenDrawer] = useState(false);

  const isArabic = localStorageGetItem('i18nextLng') === 'ar';

  useEffect(() => {
    if (isArabic) {
      onChangeDirectionByLang('ar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArabic]);

  // Database select
  const onChangeDb = useCallback(
    (db) => {
      update('db', db);
    },
    [update]
  );

  // Year select
  const onChangeYear = useCallback(
    (year) => {
      update('year', year);
    },
    [update]
  );

  // Owner select
  const onChangeOwner = useCallback(
    (owner) => {
      update('owner', owner);
    },
    [update]
  );

  // Direction by lang
  const onChangeDirectionByLang = useCallback(
    (lang) => {
      update('themeDirection', lang === 'ar' ? 'rtl' : 'ltr');
    },
    [update]
  );

  // Drawer
  const onToggleDrawer = useCallback(() => {
    setOpenDrawer((prev) => !prev);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setOpenDrawer(false);
  }, []);

  const canReset = !isEqual(state, defaultSettings);

  const memoizedValue = useMemo(
    () => ({
      ...state,
      onUpdate: update,
      // Direction
      onChangeDirectionByLang,
      // Database select
      onChangeDb,
      // Year select
      onChangeYear,
      // Owner select
      onChangeOwner,
      // Reset
      canReset,
      onReset: reset,
      // Drawer
      open: openDrawer,
      onToggle: onToggleDrawer,
      onClose: onCloseDrawer,
    }),
    [state, update, onChangeDirectionByLang, onChangeDb, onChangeYear, onChangeOwner, canReset, reset, openDrawer, onToggleDrawer, onCloseDrawer]
  );

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}

SettingsProvider.propTypes = {
  children: PropTypes.node,
  defaultSettings: PropTypes.object,
};
