'use client';

import PropTypes from 'prop-types';
import { it } from 'date-fns/locale';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// ----------------------------------------------------------------------

export default function LocalizationProvider({ children }) {

  return (
    <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      {children}
    </MuiLocalizationProvider>
  );
}

LocalizationProvider.propTypes = {
  children: PropTypes.node,
};
