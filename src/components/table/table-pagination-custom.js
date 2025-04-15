import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

export default function TablePaginationCustom({
  dense,
  onChangeDense,
  rowsPerPageOptions = [5, 10, 25],
  rowsPerPage= 50,
  callbackRowsPerPage,
  sx,
  ...other
}) {

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TablePagination
        rowsPerPageOptions={[5, 25, 50, { value: -1, label: 'Tutte' }]}
        component="div"
        rowsPerPage={rowsPerPage}
        {...other}
        sx={{
          borderTopColor: 'transparent',
        }}
      />

      {onChangeDense && (
        <FormControlLabel
          label="Dense"
          control={<Switch checked={dense} onChange={onChangeDense} />}
          sx={{
            pl: 2,
            py: 1.5,
            top: 0,
            position: {
              sm: 'absolute',
            },
          }}
        />
      )}
    </Box>
  );
}

TablePaginationCustom.propTypes = {
  dense: PropTypes.bool,
  callbackRowsPerPage: PropTypes.func,
  rowsPerPageDefault: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onChangeDense: PropTypes.func,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  sx: PropTypes.object,
};
