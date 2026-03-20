'use client';

import { useState, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
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
import DetailsTransactionsQuickView from './details-transactions-quick-view';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function isExcluded(exclusions, subjectId, detailId, month) {
  return exclusions.some(
    e => e.subjectId === subjectId && e.detailId === detailId && e.month === month
  );
}

function isSubjectFullyExcluded(exclusions, subjectId, details, month) {
  if (!details || details.length === 0) return false;
  return details.every(d => isExcluded(exclusions, subjectId, d.id, month));
}

// ----------------------------------------------------------------------

export default function MonthBreakdownDialog({
  open,
  onClose,
  month,
  year,
  category,
  db,
  owner,
  exclusions = [],
  onToggleExclusion,
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

  useEffect(() => {
    if (!open || !month) { setData(null); return; }

    setExpanded({});

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.post(endpoints.report.category.monthBreakdown, {
          db, owner, category, year, month,
        });
        setData(res.data);
      } catch (err) {
        console.error('month-breakdown fetch error:', err);
      }
      setLoading(false);
    };

    fetch();
  }, [open, month, year, category, db, owner]);

  const anomalyThreshold = monthlyAvg > 0 ? monthlyAvg * 2 : Infinity;
  const monthLabel = month ? MONTHS[month - 1] : '';

  const handleToggleSubject = (subject) => {
    // Toggle all details of this subject at once
    const allExcluded = isSubjectFullyExcluded(exclusions, subject.id, subject.details, month);
    subject.details.forEach(detail => {
      const excluded = isExcluded(exclusions, subject.id, detail.id, month);
      if (allExcluded && excluded) {
        // Re-include all
        onToggleExclusion({
          subjectId: subject.id,
          subjectName: subject.name,
          detailId: detail.id,
          detailName: detail.name,
          month,
          amount: detail.total,
        });
      } else if (!allExcluded && !excluded) {
        // Exclude all
        onToggleExclusion({
          subjectId: subject.id,
          subjectName: subject.name,
          detailId: detail.id,
          detailName: detail.name,
          month,
          amount: detail.total,
        });
      }
    });
  };

  const handleToggleDetail = (subject, detail) => {
    onToggleExclusion({
      subjectId: subject.id,
      subjectName: subject.name,
      detailId: detail.id,
      detailName: detail.name,
      month,
      amount: detail.total,
    });
  };

  return (
    <>
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">
            Movimenti {monthLabel} {year}
          </Typography>
          {data && (
            <Stack direction="row" spacing={1.5}>
              <Chip
                label={`Totale mese: ${fCurrencyEur(data.total)}`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`Media mensile: ${fCurrencyEur(monthlyAvg)}`}
                variant="outlined"
                size="small"
                color="info"
              />
            </Stack>
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
                    <TableCell padding="checkbox" />
                    <TableCell />
                    <TableCell>Soggetto / Dettaglio</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.subjects.map(subject => {
                    const subjectExcluded = isSubjectFullyExcluded(exclusions, subject.id, subject.details, month);
                    const someExcluded = subject.details.some(d => isExcluded(exclusions, subject.id, d.id, month));
                    const isAnomaly = subject.total > anomalyThreshold;
                    const isExpanded = !!expanded[subject.id];

                    return (
                      <Fragment key={subject.id}>
                        {/* Subject row */}
                        <TableRow
                          hover
                          sx={{
                            ...(subjectExcluded && { opacity: 0.45, bgcolor: 'action.hover' }),
                            ...(isAnomaly && !subjectExcluded && { bgcolor: 'error.lighter' }),
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={subjectExcluded}
                              indeterminate={someExcluded && !subjectExcluded}
                              onChange={() => handleToggleSubject(subject)}
                            />
                          </TableCell>
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
                              <IconButton
                                size="small"
                                onClick={() => handleViewTransactions({ subject: subject.id })}
                              >
                                <Iconify icon="solar:document-text-bold" />
                              </IconButton>
                            </Tooltip>
                            {isAnomaly && (
                              <Chip label="⚠" size="small" color="error" variant="soft" />
                            )}
                            {subjectExcluded && (
                              <Chip label="Escluso" size="small" color="default" variant="soft" />
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Detail rows (collapsed) */}
                        {isExpanded && subject.details.map(detail => {
                          const detailExcluded = isExcluded(exclusions, subject.id, detail.id, month);
                          const detailAnomaly = detail.total > anomalyThreshold;

                          return (
                            <TableRow
                              key={detail.id}
                              sx={{
                                ...(detailExcluded && { opacity: 0.45, bgcolor: 'action.hover' }),
                                ...(detailAnomaly && !detailExcluded && { bgcolor: 'error.lighter' }),
                              }}
                            >
                              <TableCell padding="checkbox" sx={{ pl: 4 }}>
                                <Checkbox
                                  size="small"
                                  checked={detailExcluded}
                                  onChange={() => handleToggleDetail(subject, detail)}
                                />
                              </TableCell>
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
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewTransactions({ subject: subject.id, detail: detail.id })}
                                  >
                                    <Iconify icon="solar:document-text-bold" />
                                  </IconButton>
                                </Tooltip>
                                {detailAnomaly && (
                                  <Chip label="⚠" size="small" color="error" variant="soft" />
                                )}
                                {detailExcluded && (
                                  <Chip label="Escluso" size="small" color="default" variant="soft" />
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

    <DetailsTransactionsQuickView
      open={transactionsModal.value}
      onClose={transactionsModal.onFalse}
      data={transactionsData}
    />
    </>
  );
}

MonthBreakdownDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  category: PropTypes.string,
  db: PropTypes.string,
  owner: PropTypes.string,
  exclusions: PropTypes.array,
  onToggleExclusion: PropTypes.func,
  monthlyAvg: PropTypes.number,
};
