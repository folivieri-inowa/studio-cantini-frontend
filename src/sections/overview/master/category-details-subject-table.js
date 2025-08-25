'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import Iconify from '../../../components/iconify';
import { capitalizeCase } from '../../../utils/change-case';
import { fCurrencyEur } from '../../../utils/format-number';

// Componente semplificato per la modal dei dettagli categoria
// Questo evita dipendenze complesse e problemi con il componente originale
export default function CategoryDetailsSubjectTable({ 
  title, 
  subheader, 
  tableData, 
  tableLabels,
  onViewRow,
  onViewDetails, // Nuovo callback per visualizzare i dettagli
  categoryId,    // ID della categoria
  settings,      // Impostazioni per i parametri
  ...other 
}) {
  const hasData = tableData && tableData.averageMonthlyCosts && tableData.averageMonthlyCosts.length > 0;

  return (
    <Card {...other}>
      <CardHeader 
        title={title} 
        subheader={
          <>
            {subheader}
            {hasData && tableData.averageMonthlyCosts.some(row => 
                row.values && row.values.some(value => parseFloat(value.totalExpense) === 0)
              ) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * I valori a €0,00 con asterisco indicano voci senza transazioni nell&apos;anno selezionato
              </Typography>
            )}
          </>
        } 
        sx={{ mb: 3 }} 
      />

      {!hasData ? (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Nessun dato disponibile per questa categoria.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                {tableLabels.map((label) => (
                  <TableCell key={label.id} align={label.align || 'left'}>
                    {label.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.averageMonthlyCosts.map((row) => (
                <CategoryDetailsSubjectRow
                  key={row.id}
                  row={row}
                  categoryId={categoryId || tableData.categoryId}
                  onViewRow={onViewRow}
                  onViewDetails={onViewDetails}
                  settings={settings}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

CategoryDetailsSubjectTable.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  tableData: PropTypes.object,
  tableLabels: PropTypes.array,
  onViewRow: PropTypes.func,
  onViewDetails: PropTypes.func,
  categoryId: PropTypes.string,
  settings: PropTypes.object,
};

// Componente per le righe della tabella
function CategoryDetailsSubjectRow({ row, categoryId, onViewRow, onViewDetails, settings }) {
  const [open, setOpen] = useState(false);
  
  const formatCurrencyWithZero = (value) => {
    if (value === null || value === undefined || value === '') {
      return fCurrencyEur(0);
    }
    return fCurrencyEur(value);
  };

  // Usa i dati direttamente dalla struttura del backend
  const totalExpense = parseFloat(row.totalExpense || 0);
  const totalIncome = parseFloat(row.totalIncome || 0);
  const averageCost = parseFloat(row.averageCost || 0);
  const difference = totalIncome - totalExpense;
  
  // Controlla se ci sono dettagli (values) per questo soggetto
  const hasValues = row.values && row.values.length > 0;
  
  return (
    <>
      <TableRow>
        <TableCell sx={{ width: '5%' }}>
          {hasValues ? (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          ) : null}
        </TableCell>
        
        <TableCell sx={{ width: '40%' }}>
          <Typography variant="body2" fontWeight="medium">
            {capitalizeCase(row.category || row.title || 'N/A')}
          </Typography>
        </TableCell>
        
        <TableCell align="right">
          <Tooltip title="Media annuale: Totale uscite diviso per 12 mesi" placement="top" arrow>
            <span>{formatCurrencyWithZero(averageCost)}</span>
          </Tooltip>
        </TableCell>
        
        <TableCell align="right">
          {formatCurrencyWithZero(totalExpense)}
        </TableCell>
        
        <TableCell align="right">
          {formatCurrencyWithZero(totalIncome)}
        </TableCell>
        
        <TableCell align="right">
          <Typography 
            variant="body2" 
            fontWeight="medium"
            color={difference >= 0 ? "success.main" : "error.main"}
          >
            {formatCurrencyWithZero(difference)}
          </Typography>
        </TableCell>
        
        <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {hasValues ? (
            <Tooltip title="Vedi dettaglio spese" placement="top" arrow>
              <IconButton 
                color="default" 
                onClick={() => onViewRow && onViewRow({ 
                  subject: row.id, 
                  category: categoryId,
                  db: settings?.db,
                  owner: settings?.owner ? settings.owner.id : 'all-accounts',
                  year: settings?.year
                })}
              >
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          ) : null}
        </TableCell>
      </TableRow>

      {hasValues && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="subtitle1" gutterBottom component="div">
                  Dettagli
                </Typography>
                <Table size="small" aria-label="details">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '5%' }}/>
                      <TableCell>Nome</TableCell>
                      <TableCell align="right">Media spesa mensile</TableCell>
                      <TableCell align="right">Uscite</TableCell>
                      <TableCell align="right">Entrate</TableCell>
                      <TableCell align="right">Delta</TableCell>
                      <TableCell>{' '}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.values.map((value) => (
                      <TableRow key={`${value.id}-${row.id}`}>
                        <TableCell sx={{ width: '5%' }}/>
                        <TableCell sx={{ width: '50%' }}>
                          {value.detailsId ? (
                            <Link
                              noWrap
                              color="inherit"
                              variant="subtitle2"
                              onClick={() => onViewRow && onViewRow({ 
                                details: value.id, 
                                subject: row.id, 
                                category: categoryId,
                                db: settings?.db,
                                owner: settings?.owner ? settings.owner.id : 'all-accounts',
                                year: settings?.year
                              })}
                              sx={{ cursor: 'pointer', color: 'blue' }}
                            >
                              {capitalizeCase(value.title || 'N/A')}
                            </Link>
                          ) : (
                            capitalizeCase(value.title || 'N/A')
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(value.averageCost || 0) > 0 
                            ? (
                              <Tooltip title="Media annuale: Totale uscite diviso per 12 mesi" placement="top" arrow>
                                <span>{formatCurrencyWithZero(value.averageCost)}</span>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(value.totalExpense || 0) > 0 
                            ? formatCurrencyWithZero(value.totalExpense) 
                            : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(value.totalIncome || 0) > 0 
                            ? formatCurrencyWithZero(value.totalIncome) 
                            : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrencyWithZero(
                            parseFloat(value.totalIncome || 0) - parseFloat(value.totalExpense || 0)
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                          <Tooltip title="Vedi dettaglio spese" placement="top" arrow>
                            <IconButton 
                              color="default" 
                              onClick={() => onViewDetails && onViewDetails({ 
                                details: value.id, 
                                subject: row.id, 
                                category: categoryId,
                                db: settings?.db,
                                owner: settings?.owner ? settings.owner.id : 'all-accounts',
                                year: settings?.year
                              })}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

CategoryDetailsSubjectRow.propTypes = {
  row: PropTypes.object,
  categoryId: PropTypes.string,
  onViewRow: PropTypes.func,
  onViewDetails: PropTypes.func,
  settings: PropTypes.object,
};
