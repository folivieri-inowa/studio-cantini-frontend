'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';

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

import axios, { endpoints } from '../../../utils/axios';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { useBoolean } from '../../../hooks/use-boolean';
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import MonthTransactionsQuickView from '../category/month-transactions-quick-view';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MonthBreakdownReadonlyDialog({
  open,
  onClose,
  month,
  year,
  category,
  categoryName,
  db,
  owner,
  monthlyAvg,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [transactionsData, setTransactionsData] = useState(null);
  const transactionsModal = useBoolean();

  const handleViewTransactions = (params) => {
    setTransactionsData({ db, owner, year, month, category, exactMonth: true, ...params });
    transactionsModal.onTrue();
  };

  const fetchBreakdown = useCallback(async () => {
    if (!open || !month) { setData(null); return; }
    setLoading(true);
    try {
      const res = await axios.post(endpoints.report.category.monthBreakdown, {
        db, owner, category, year, month,
      });
      setData(res.data);
    } catch (err) {
      console.error('month-breakdown-readonly fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [open, month, year, category, db, owner]);

  useEffect(() => {
    setExpanded({});
    fetchBreakdown();
  }, [fetchBreakdown]);

  const anomalyThreshold = monthlyAvg > 0 ? monthlyAvg * 2 : Infinity;
  const monthLabel = month ? MONTHS[month - 1] : '';

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              {capitalizeCase(categoryName || '')} — {monthLabel} {year}
            </Typography>
            {data && (
              <Chip
                label={`Totale mese: ${fCurrencyEur(data.total)}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Caricamento...</Typography>
            </Box>
          )}

          {!loading && data && (
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell>Soggetto / Dettaglio</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="center" sx={{ width: 80 }}>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subjects.map(subject => {
                      const isAnomaly = subject.total > anomalyThreshold;
                      const isExpanded = !!expanded[subject.id];

                      return (
                        <Fragment key={subject.id}>
                          <TableRow
                            hover
                            sx={{ ...(isAnomaly && { bgcolor: 'error.lighter' }) }}
                          >
                            <TableCell sx={{ width: 40 }}>
                              {subject.details.length > 0 && (
                                <IconButton
                                  size="small"
                                  onClick={() => setExpanded(prev => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                                >
                                  <Iconify icon={isExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />
                                </IconButton>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {capitalizeCase(subject.name)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2">
                                {fCurrencyEur(subject.total)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Elenco movimenti" placement="top" arrow>
                                <IconButton size="small" onClick={() => handleViewTransactions({ subject: subject.id })}>
                                  <Iconify icon="solar:document-text-bold" />
                                </IconButton>
                              </Tooltip>
                              {isAnomaly && (
                                <Chip label="⚠" size="small" color="error" variant="soft" />
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && subject.details.map(detail => {
                            const detailAnomaly = detail.total > anomalyThreshold;
                            return (
                              <TableRow
                                key={detail.id}
                                hover
                                sx={{ ...(detailAnomaly && { bgcolor: 'error.lighter' }) }}
                              >
                                <TableCell />
                                <TableCell>
                                  <Typography variant="body2" sx={{ pl: 3 }}>
                                    {capitalizeCase(detail.name)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {fCurrencyEur(detail.total)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Elenco movimenti" placement="top" arrow>
                                    <IconButton size="small" onClick={() => handleViewTransactions({ subject: subject.id, detail: detail.id })}>
                                      <Iconify icon="solar:document-text-bold" />
                                    </IconButton>
                                  </Tooltip>
                                  {detailAnomaly && (
                                    <Chip label="⚠" size="small" color="error" variant="soft" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          )}

          {!loading && !data && (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Nessun dato disponibile</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      <MonthTransactionsQuickView
        open={transactionsModal.value}
        onClose={transactionsModal.onFalse}
        data={transactionsData}
      />
    </>
  );
}

MonthBreakdownReadonlyDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  category: PropTypes.string,
  categoryName: PropTypes.string,
  db: PropTypes.string,
  owner: PropTypes.string,
  monthlyAvg: PropTypes.number,
};
