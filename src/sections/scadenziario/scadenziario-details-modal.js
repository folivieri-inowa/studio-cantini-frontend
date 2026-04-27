'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';

import axios from 'src/utils/axios';
import { useGetScadenziarioItem } from 'src/api/scadenziario-services';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { formatCurrency } from './scadenziario-utils';
import ScadenziarioTranchesPanel from './scadenziario-tranches-panel';

// ----------------------------------------------------------------------

function InfoRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0, minWidth: 130 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ textAlign: 'right', fontFamily: mono ? 'monospace' : undefined, letterSpacing: mono ? 0.5 : undefined }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

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
      const objectUrl = URL.createObjectURL(response.data);
      setBlobUrl(objectUrl);
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
    else load().then(() => {});
  }, [blobUrl, load]);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Allegato</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={handleOpen}
          disabled={loading || error}
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
        <Typography variant="body2" color="error.main">
          Impossibile caricare l&apos;allegato.
        </Typography>
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
            sx={{ width: '100%', height: 500, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          />
        )
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function ScadenziarioDetailsModal({ id, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [itemStatus, setItemStatus] = useState('');
  const { scadenziarioItem, scadenziarioItemLoading } = useGetScadenziarioItem(id);

  useEffect(() => {
    if (scadenziarioItem?.status) setItemStatus(scadenziarioItem.status);
  }, [scadenziarioItem]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed': return { color: 'success', label: 'Pagato' };
      case 'overdue':   return { color: 'error',   label: 'Scaduto' };
      case 'upcoming':  return { color: 'warning',  label: 'In scadenza' };
      case 'future':    return { color: 'info',     label: 'Da pagare' };
      default:          return { color: 'default',  label: status };
    }
  };

  const hasPaymentDetails = !!(
    scadenziarioItem?.company_name ||
    scadenziarioItem?.invoice_number ||
    scadenziarioItem?.iban ||
    scadenziarioItem?.attachment_url
  );

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: 2, maxHeight: 'calc(100% - 64px)' } }}
    >
      <DialogTitle sx={{ py: 2.5, px: 3, bgcolor: 'background.neutral' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify icon="solar:document-bold" sx={{ mr: 1.5, width: 28, height: 28, color: 'primary.main' }} />
            Dettagli Scadenza
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="chiudi">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {scadenziarioItemLoading ? (
          <Box sx={{ py: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : !scadenziarioItem?.id ? (
          <Typography>Nessun dato disponibile</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {scadenziarioItem.subject}
              </Typography>
              {itemStatus && (
                <Label variant="filled" color={getStatusInfo(itemStatus).color} sx={{ textTransform: 'uppercase', fontSize: '0.85rem', py: 1, px: 2, borderRadius: 1 }}>
                  {getStatusInfo(itemStatus).label}
                </Label>
              )}
            </Stack>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Dati base */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Dati scadenza</Typography>
              <InfoRow label="Descrizione" value={scadenziarioItem.description} />
              <InfoRow label="Causale" value={scadenziarioItem.causale} />
              <InfoRow label="Importo" value={formatCurrency(scadenziarioItem.amount)} />
              <InfoRow
                label="Data scadenza"
                value={scadenziarioItem.date ? format(new Date(scadenziarioItem.date), 'd MMMM yyyy', { locale: it }) : null}
              />
              <InfoRow
                label="Data pagamento"
                value={
                  (scadenziarioItem.paymentDate || scadenziarioItem.payment_date)
                    ? format(new Date(scadenziarioItem.paymentDate || scadenziarioItem.payment_date), 'd MMMM yyyy', { locale: it })
                    : 'Non ancora pagato'
                }
              />
            </Stack>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Estremi pagamento */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Estremi pagamento</Typography>
              {!hasPaymentDetails ? (
                <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  Nessun dato fattura disponibile
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  <InfoRow label="Fornitore" value={scadenziarioItem.company_name} />
                  <InfoRow label="N. Fattura" value={scadenziarioItem.invoice_number} />
                  <InfoRow
                    label="Data fattura"
                    value={scadenziarioItem.invoice_date ? format(new Date(scadenziarioItem.invoice_date), 'd MMMM yyyy', { locale: it }) : null}
                  />
                  <InfoRow label="Partita IVA" value={scadenziarioItem.vat_number} />
                  <InfoRow label="IBAN" value={scadenziarioItem.iban} mono />
                  <InfoRow label="Banca" value={scadenziarioItem.bank_name} />
                  <InfoRow label="Condizioni pagamento" value={scadenziarioItem.payment_terms?.type} />
                </Stack>
              )}
            </Stack>

            {/* Allegato fattura */}
            {scadenziarioItem?.attachment_url && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <AttachmentPreview url={scadenziarioItem.attachment_url} />
              </>
            )}

            {/* Contabile di pagamento */}
            {scadenziarioItem?.payment_receipt_url && (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2">Contabile di pagamento</Typography>
                  <AttachmentPreview url={scadenziarioItem.payment_receipt_url} />
                </Stack>
              </>
            )}

            {/* Piano di pagamento — solo per fatture */}
            {scadenziarioItem?.type === 'fattura' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Piano di pagamento</Typography>
                <ScadenziarioTranchesPanel
                  parentId={scadenziarioItem.id}
                  parentAmount={scadenziarioItem.amount}
                  ownerId={scadenziarioItem.owner_id}
                  onUpdated={onClose}
                />
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'background.neutral' }}>
        <Button variant="contained" color="primary" size="large" onClick={onClose} startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />} sx={{ px: 3 }}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
