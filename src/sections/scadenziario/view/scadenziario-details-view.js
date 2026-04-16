'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'src/utils/axios';
import { useGetScadenziarioItem } from 'src/api/scadenziario-services';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { calculateScadenziarioStatus } from '../scadenziario-utils';

// ----------------------------------------------------------------------

function AttachmentPreview({ url }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');

  const load = useCallback(async () => {
    if (!url || blobUrl) return;
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      setBlobUrl(URL.createObjectURL(response.data));
    } catch (err) {
      console.error('[attachment] Errore caricamento:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url, blobUrl]);

  useEffect(() => {
    load();
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleOpen = useCallback(() => {
    if (blobUrl) window.open(blobUrl, '_blank');
  }, [blobUrl]);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Allegato</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={handleOpen}
          disabled={loading || error || !blobUrl}
          startIcon={<Iconify icon="eva:external-link-fill" />}
        >
          Apri
        </Button>
      </Stack>
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">Caricamento allegato…</Typography>
        </Box>
      )}
      {error && (
        <Typography variant="body2" color="error.main">Impossibile caricare l&apos;allegato.</Typography>
      )}
      {blobUrl && !loading && (
        isImage ? (
          <img
            src={blobUrl}
            alt="Allegato"
            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)' }}
          />
        ) : (
          <Box
            component="iframe"
            src={blobUrl}
            title="Anteprima allegato"
            sx={{ width: '100%', height: 480, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          />
        )
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function ScadenziarioDetailsView() {
  const router = useRouter();
  const params = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const confirm = useBoolean();

  const { id } = params;

  const { scadenziarioItem, scadenziarioItemLoading } = useGetScadenziarioItem(id);

  const [paymentDate, setPaymentDate] = useState(null);
  const [itemStatus, setItemStatus] = useState('');

  useEffect(() => {
    if (scadenziarioItem) {
      setPaymentDate(scadenziarioItem.paymentDate ? new Date(scadenziarioItem.paymentDate) : null);
      setItemStatus(scadenziarioItem.status);
    }
  }, [scadenziarioItem]);

  const handlePayScadenziario = useCallback(
    async (date) => {
      try {
        setPaymentDate(date);
        
        // Importa la funzione per aggiornare lo stato del pagamento
        const { updatePaymentStatus } = await import('../../../api/scadenziario-services');
        await updatePaymentStatus(id, date ? date.toISOString().split('T')[0] : null);
        
        if (date) {
          setItemStatus('completed');
          enqueueSnackbar('Pagamento registrato con successo!');
        } else {
          const newStatus = calculateScadenziarioStatus(scadenziarioItem.date, null);
          setItemStatus(newStatus);
          enqueueSnackbar('Pagamento annullato con successo!');
        }
      } catch (error) {
        console.error('Errore durante l\'aggiornamento del pagamento:', error);
        enqueueSnackbar('Si è verificato un errore durante l\'aggiornamento del pagamento!', { variant: 'error' });
      }
    },
    [enqueueSnackbar, scadenziarioItem, id]
  );

  const handleDeleteScadenziario = useCallback(() => {
    confirm.onTrue();
  }, [confirm]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      // Importa la funzione per eliminare una scadenza
      const { deleteScadenziario } = await import('../../../api/scadenziario-services');
      await deleteScadenziario(id);
      
      enqueueSnackbar('Scadenza eliminata con successo!');
      router.push(paths.dashboard.scadenziario.root);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della scadenza:', error);
      enqueueSnackbar('Si è verificato un errore durante l\'eliminazione!', { variant: 'error' });
    }
  }, [router, enqueueSnackbar, id]);

  const handleEditScadenziario = useCallback(() => {
    router.push(paths.dashboard.scadenziario.edit(id));
  }, [router, id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'error';
      case 'upcoming':
        return 'warning';
      case 'future':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Pagato';
      case 'overdue':
        return 'Scaduto';
      case 'upcoming':
        return 'In scadenza';
      case 'future':
        return 'Da pagare';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Dettaglio Scadenza"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Scadenziario', href: paths.dashboard.scadenziario.root },
          { name: scadenziarioItem?.description || '' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.scadenziario.root}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            Torna all'elenco
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      
      {scadenziarioItemLoading ? (
        <Typography>Caricamento in corso...</Typography>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h4">
                    {scadenziarioItem?.subject}
                  </Typography>
                  
                  <Label
                    variant="soft"
                    color={getStatusColor(itemStatus)}
                    sx={{ textTransform: 'uppercase' }}
                  >
                    {getStatusLabel(itemStatus)}
                  </Label>
                </Stack>
                
                <Divider sx={{ borderStyle: 'dashed' }} />
                
                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2">Dettagli</Typography>
                      
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Descrizione
                          </Typography>
                          <Typography variant="body2">{scadenziarioItem?.description}</Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Causale
                          </Typography>
                          <Typography variant="body2">{scadenziarioItem?.causale}</Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Importo
                          </Typography>
                          <Typography variant="body2">
                            {scadenziarioItem?.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>

                  <Grid xs={12} md={6}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2">Scadenza</Typography>
                      
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Data scadenza
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(scadenziarioItem?.date), 'dd MMMM yyyy', { locale: it })}
                          </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Data pagamento
                          </Typography>
                          <Typography variant="body2">
                            {paymentDate 
                              ? format(paymentDate, 'dd MMMM yyyy', { locale: it })
                              : 'Non pagato'}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
                
                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Estremi pagamento */}
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Estremi pagamento</Typography>
                  {!(scadenziarioItem?.company_name || scadenziarioItem?.invoice_number || scadenziarioItem?.iban || scadenziarioItem?.attachment_url) ? (
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                      Nessun dato fattura disponibile
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {scadenziarioItem?.company_name && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Fornitore</Typography>
                          <Typography variant="body2">{scadenziarioItem.company_name}</Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.invoice_number && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>N. Fattura</Typography>
                          <Typography variant="body2">{scadenziarioItem.invoice_number}</Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.invoice_date && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Data fattura</Typography>
                          <Typography variant="body2">
                            {format(new Date(scadenziarioItem.invoice_date), 'dd MMMM yyyy', { locale: it })}
                          </Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.vat_number && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Partita IVA</Typography>
                          <Typography variant="body2">{scadenziarioItem.vat_number}</Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.iban && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>IBAN</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>
                            {scadenziarioItem.iban}
                          </Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.bank_name && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Banca</Typography>
                          <Typography variant="body2">{scadenziarioItem.bank_name}</Typography>
                        </Stack>
                      )}
                      {scadenziarioItem?.payment_terms?.type && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Condizioni pagamento</Typography>
                          <Typography variant="body2">{scadenziarioItem.payment_terms.type}</Typography>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>

                {scadenziarioItem?.attachment_url && (
                  <>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <AttachmentPreview url={scadenziarioItem.attachment_url} />
                  </>
                )}

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Stack spacing={2}>
                  <Typography variant="subtitle2">Gestione pagamento</Typography>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <DatePicker
                      label="Seleziona data pagamento"
                      value={paymentDate}
                      onChange={(newDate) => handlePayScadenziario(newDate)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: 'Seleziona data pagamento',
                        },
                      }}
                    />
                    
                    <Button 
                      variant="contained" 
                      color="success"
                      disabled={!!paymentDate}
                      onClick={() => handlePayScadenziario(new Date())}
                    >
                      Segna come pagato oggi
                    </Button>
                    
                    {paymentDate && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handlePayScadenziario(null)}
                      >
                        Annulla pagamento
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
              
              <Divider sx={{ borderStyle: 'dashed' }} />
              
              <Stack direction="row" spacing={2} sx={{ p: 3, justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<Iconify icon="eva:edit-2-fill" />}
                  onClick={handleEditScadenziario}
                >
                  Modifica
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<Iconify icon="eva:trash-fill" />}
                  onClick={handleDeleteScadenziario}
                >
                  Elimina
                </Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Dialog di conferma per l'eliminazione */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina scadenza"
        content="Sei sicuro di voler eliminare questa scadenza? Questa azione non è reversibile."
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Elimina
          </Button>
        }
      />
    </Container>
  );
}
