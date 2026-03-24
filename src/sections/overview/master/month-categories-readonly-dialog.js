'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from '../../../routes/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { paths } from '../../../routes/paths';
import MonthBreakdownReadonlyDialog from './month-breakdown-readonly-dialog';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MonthCategoriesReadonlyDialog({
  open,
  onClose,
  month,
  year,
  categories,
  db,
  owner,
}) {
  const router = useRouter();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const monthLabel = month ? MONTHS[month - 1] : '';

  const sortedCategories = [...(categories || [])].sort((a, b) => b.expense - a.expense);

  const totalExpense = sortedCategories.reduce((sum, c) => sum + c.expense, 0);

  const handleOpenBreakdown = (category) => {
    setSelectedCategory(category);
    setBreakdownOpen(true);
  };

  const handleNavigateCategory = (categoryId) => {
    onClose();
    router.push(paths.dashboard.master.category.details({ id: categoryId }));
  };

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              Uscite per categoria — {monthLabel} {year}
            </Typography>
            <Chip
              label={`Totale: ${fCurrencyEur(totalExpense)}`}
              variant="outlined"
              size="small"
            />
          </Stack>
        </DialogTitle>

        <DialogContent>
          {sortedCategories.length === 0 ? (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Nessun dato disponibile</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoria</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="center" sx={{ width: 80 }}>Dettaglio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedCategories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            onClick={() => handleNavigateCategory(category.id)}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {capitalizeCase(category.name)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">
                            {fCurrencyEur(category.expense)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Vedi soggetti e dettagli" placement="top" arrow>
                            <IconButton size="small" onClick={() => handleOpenBreakdown(category)}>
                              <Iconify icon="solar:document-text-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {selectedCategory && (
        <MonthBreakdownReadonlyDialog
          open={breakdownOpen}
          onClose={() => setBreakdownOpen(false)}
          month={month}
          year={year}
          category={selectedCategory.id}
          categoryName={selectedCategory.name}
          db={db}
          owner={owner}
          monthlyAvg={selectedCategory.monthlyAvg}
        />
      )}
    </>
  );
}

MonthCategoriesReadonlyDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    expense: PropTypes.number,
    monthlyAvg: PropTypes.number,
  })),
  db: PropTypes.string,
  owner: PropTypes.string,
};
