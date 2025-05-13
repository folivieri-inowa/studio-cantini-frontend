'use client';

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import TableContainer from '@mui/material/TableContainer';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fDate } from 'src/utils/format-time';
import { useSettingsContext } from 'src/components/settings';

import axios from 'src/utils/axios';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export default function ImportHistoryDialog({ open, onClose, onUpdate }) {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettingsContext();
  const { db } = settings;
  const { enqueueSnackbar } = useSnackbar();

  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedImport, setSelectedImport] = useState(null);
  
  const confirmDialogUndo = useBoolean();
  const detailsDialog = useBoolean();
  
  const [selectedImportDetails, setSelectedImportDetails] = useState({
    transactions: [],
    loading: false
  });

  const getImportHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/prima-nota/import-history', {
        db,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });

      if (response.status === 200) {
        setImports(response.data.imports || []);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (error) {
      console.error('Errore nel recupero della cronologia importazioni:', error);
      enqueueSnackbar('Errore nel recupero della cronologia importazioni', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [db, page, rowsPerPage, enqueueSnackbar]);

  useEffect(() => {
    if (open.value) {
      getImportHistory();
    }
  }, [open.value, getImportHistory]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = async (importId) => {
    setSelectedImportDetails({
      transactions: [],
      loading: true
    });
    
    try {
      const response = await axios.post('/api/prima-nota/import-history/details', {
        db,
        importId
      });

      if (response.status === 200) {
        setSelectedImportDetails({
          transactions: response.data.transactions || [],
          loading: false
        });
        detailsDialog.onTrue();
      }
    } catch (error) {
      console.error('Errore nel recupero dei dettagli dell\'importazione:', error);
      enqueueSnackbar('Errore nel recupero dei dettagli dell\'importazione', { variant: 'error' });
      setSelectedImportDetails({
        transactions: [],
        loading: false
      });
    }
  };

  const handleUndoImport = async () => {
    if (!selectedImport) return;
    
    try {
      const response = await axios.post('/api/prima-nota/undo-import', {
        db,
        importId: selectedImport
      });

      if (response.status === 200) {
        enqueueSnackbar('Importazione annullata con successo', { variant: 'success' });
        getImportHistory();
        if (onUpdate) onUpdate();
        confirmDialogUndo.onFalse();
      } else {
        enqueueSnackbar('Errore durante l\'annullamento dell\'importazione', { variant: 'error' });
      }
    } catch (error) {
      console.error('Errore nell\'annullamento dell\'importazione:', error);
      enqueueSnackbar('Errore nell\'annullamento dell\'importazione', { variant: 'error' });
    }
  };

  const handleConfirmUndo = (importId) => {
    setSelectedImport(importId);
    confirmDialogUndo.onTrue();
  };

  return (
    <>
      <Dialog
        open={open.value}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="cronologia-importazioni-dialog"
      >
        <DialogTitle id="cronologia-importazioni-dialog">
          Cronologia Importazioni
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading && <LinearProgress />}
          
          <Card>
            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data Importazione</TableCell>
                      <TableCell>Intestatario</TableCell>
                      <TableCell>Categoria</TableCell>
                      <TableCell>Soggetto</TableCell>
                      <TableCell>N. Record</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {imports.length > 0 ? (
                      imports.map((importItem) => (
                        <TableRow key={importItem.id}>
                          <TableCell>{fDate(importItem.date)}</TableCell>
                          <TableCell>{importItem.owner?.name || '-'}</TableCell>
                          <TableCell>{importItem.category?.name || '-'}</TableCell>
                          <TableCell>{importItem.subject?.name || '-'}</TableCell>
                          <TableCell>{importItem.count || 0}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                              <Tooltip title="Visualizza dettagli">
                                <IconButton 
                                  color="info" 
                                  size="small"
                                  onClick={() => handleViewDetails(importItem.id)}
                                >
                                  <Iconify icon="eva:eye-outline" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Annulla importazione">
                                <IconButton 
                                  color="error" 
                                  size="small"
                                  onClick={() => handleConfirmUndo(importItem.id)}
                                >
                                  <Iconify icon="eva:undo-outline" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 3 }}>
                            <Typography variant="subtitle1">
                              {loading ? 'Caricamento in corso...' : 'Nessuna importazione trovata'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Righe per pagina:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
            />
          </Card>
        </DialogContent>
      </Dialog>
      
      {/* Dialog per visualizzare i dettagli dell'importazione */}
      <Dialog
        open={detailsDialog.value}
        onClose={detailsDialog.onFalse}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Dettagli Importazione
          <IconButton
            aria-label="close"
            onClick={detailsDialog.onFalse}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImportDetails.loading ? (
            <LinearProgress />
          ) : (
            <>
              {selectedImportDetails.transactions.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Data</TableCell>
                        <TableCell>Descrizione</TableCell>
                        <TableCell>Importo</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Soggetto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedImportDetails.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{fDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.category?.name || '-'}</TableCell>
                          <TableCell>{transaction.subject?.name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 5 }}>
                  Nessun dettaglio disponibile per questa importazione
                </Typography>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog di conferma per annullare un'importazione */}
      <ConfirmDialog
        open={confirmDialogUndo.value}
        onClose={confirmDialogUndo.onFalse}
        title="Annulla Importazione"
        content="Sei sicuro di voler annullare questa importazione? Tutte le transazioni importate in questo gruppo verranno eliminate. Questa operazione non può essere annullata."
        action={
          <Button variant="contained" color="error" onClick={handleUndoImport}>
            Annulla Importazione
          </Button>
        }
      />
    </>
  );
}

ImportHistoryDialog.propTypes = {
  open: PropTypes.object,
  onClose: PropTypes.func,
  onUpdate: PropTypes.func,
};
