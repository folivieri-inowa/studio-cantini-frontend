'use client';

import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { paths } from '../../../routes/paths';
import { useRouter } from '../../../routes/hooks';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { useBoolean } from '../../../hooks/use-boolean';
import Scrollbar from '../../../components/scrollbar';
import MonthBreakdownDialog from '../category/month-breakdown-dialog';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const EMPTY_EXCLUSIONS = [];

export default function MasterMonthBreakdownDialog({
  open,
  onClose,
  month,
  year,
  owner,
  db,
  compareYears = [],
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name }
  const categoryBreakdown = useBoolean();

  const monthLabel = month ? MONTHS[month - 1] : '';
  const paddedMonth = month ? String(month).padStart(2, '0') : null;

  // Deriva le categorie dai dati già in memoria — zero fetch
  const { categories, totalExpense } = useMemo(() => {
    if (!owner?.report?.categoryReport || !year || !paddedMonth) return { categories: [], totalExpense: 0 };
    const catReport = owner.report.categoryReport[year] ?? {};
    const cats = Object.entries(catReport)
      .map(([id, cat]) => ({
        id,
        name: cat.name,
        expense: cat.months?.[paddedMonth]?.expense ?? 0,
      }))
      .filter((c) => c.expense > 0)
      .sort((a, b) => b.expense - a.expense);
    return { categories: cats, totalExpense: cats.reduce((sum, c) => sum + c.expense, 0) };
  }, [owner, year, paddedMonth]);

  const handleNavigateToCategory = (categoryId) => {
    const params = new URLSearchParams({
      month: String(month),
      compareYears: compareYears.join(','),
      showIncome: 'false',
      showExpense: 'true',
    });
    router.push(`${paths.dashboard.master.category.details({ id: categoryId })}?${params.toString()}`);
    onClose();
  };

  const handleOpenCategoryBreakdown = (category) => {
    setSelectedCategory(category);
    categoryBreakdown.onTrue();
  };

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              Uscite {monthLabel} {year}
            </Typography>
            {totalExpense > 0 && (
              <Chip
                label={`Totale: ${fCurrencyEur(totalExpense)}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {categories.length === 0 ? (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">
                Nessun dato disponibile
              </Typography>
            </Box>
          ) : (
            <Scrollbar>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell align="center" sx={{ width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, fontWeight: 500 }}
                          onClick={() => handleNavigateToCategory(cat.id)}
                        >
                          {capitalizeCase(cat.name)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fCurrencyEur(cat.expense)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          <Tooltip title="Dettaglio soggetti" placement="top" arrow>
                            <IconButton size="small" onClick={() => handleOpenCategoryBreakdown(cat)}>
                              <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Divider />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">Totale</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{fCurrencyEur(totalExpense)}</Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Scrollbar>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Livello 1 — Soggetti/Dettagli per categoria selezionata */}
      {selectedCategory && (
        <MonthBreakdownDialog
          open={categoryBreakdown.value}
          onClose={categoryBreakdown.onFalse}
          month={month}
          year={year}
          category={selectedCategory.id}
          db={db}
          owner={typeof owner?.id === 'string' ? owner.id : 'all-accounts'}
          viewOnly
          exclusions={EMPTY_EXCLUSIONS}
        />
      )}
    </>
  );
}

MasterMonthBreakdownDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  owner: PropTypes.object,
  db: PropTypes.string,
  compareYears: PropTypes.array,
};
