import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ViewModeToggle({ value, onChange, sx }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={onChange}
      size="small"
      sx={sx}
    >
      <ToggleButton value="grid" aria-label="vista griglia">
        <Iconify icon="eva:grid-outline" width={20} />
      </ToggleButton>
      <ToggleButton value="list" aria-label="vista lista">
        <Iconify icon="eva:list-outline" width={20} />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

ViewModeToggle.propTypes = {
  value: PropTypes.oneOf(['grid', 'list']).isRequired,
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.object,
};
