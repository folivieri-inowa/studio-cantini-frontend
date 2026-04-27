'use client';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetScadenziarioItem } from 'src/api/scadenziario-services';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
} from 'src/components/hook-form';

import ScadenziarioOcrUpload from './scadenziario-ocr-upload';
import ScadenziarioAttachmentUpload from './scadenziario-attachment-upload';
import ScadenziarioTranchesPanel from './scadenziario-tranches-panel';

import { PAYMENT_TERMS_OPTIONS } from './utils/payment-terms';
import { calculateScadenziarioStatus } from './scadenziario-utils';

// ----------------------------------------------------------------------

export default function ScadenziarioEditModal({ id, open, onClose, onEdited }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const { scadenziarioItem, scadenziarioItemLoading } = useGetScadenziarioItem(id);

  const isFattura = scadenziarioItem?.type === 'fattura';

  const NewScadenziarioSchema = Yup.object().shape({
    subject: Yup.string().required('Soggetto richiesto'),
    date: Yup.date().required('Data scadenza richiesta'),
    amount: Yup.number().moreThan(0, 'Il valore deve essere maggiore di 0').required('Importo richiesto'),
    paymentDate: Yup.date().nullable(),
    status: Yup.string().required('Stato richiesto'),
  });

  const defaultValues = useMemo(
    () => ({
      subject: scadenziarioItem?.subject || '',
      description: scadenziarioItem?.description || '',
      causale: scadenziarioItem?.causale || '',
      date: scadenziarioItem?.date ? new Date(scadenziarioItem.date) : new Date(),
      amount: scadenziarioItem?.amount || 0,
      paymentDate: scadenziarioItem?.payment_date ? new Date(scadenziarioItem.payment_date) : null,
      status: scadenziarioItem?.status || 'future',
      // campi fattura
      invoice_number: scadenziarioItem?.invoice_number || '',
      invoice_date: scadenziarioItem?.invoice_date ? new Date(scadenziarioItem.invoice_date) : null,
      company_name: scadenziarioItem?.company_name || '',
      vat_number: scadenziarioItem?.vat_number || '',
      iban: scadenziarioItem?.iban || '',
      bank_name: scadenziarioItem?.bank_name || '',
      payment_terms_type: scadenziarioItem?.payment_terms?.type || '',
      attachment_url: scadenziarioItem?.attachment_url || '',
      payment_receipt_url: scadenziarioItem?.payment_receipt_url || '',
    }),
    [scadenziarioItem]
  );

  const methods = useForm({
    resolver: yupResolver(NewScadenziarioSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (scadenziarioItem) {
      reset({
        subject: scadenziarioItem.subject || '',
        description: scadenziarioItem.description || '',
        causale: scadenziarioItem.causale || '',
        date: scadenziarioItem.date ? new Date(scadenziarioItem.date) : new Date(),
        amount: scadenziarioItem.amount || 0,
        paymentDate: scadenziarioItem.payment_date ? new Date(scadenziarioItem.payment_date) : null,
        status: scadenziarioItem.status || 'future',
        invoice_number: scadenziarioItem.invoice_number || '',
        invoice_date: scadenziarioItem.invoice_date ? new Date(scadenziarioItem.invoice_date) : null,
        company_name: scadenziarioItem.company_name || '',
        vat_number: scadenziarioItem.vat_number || '',
        iban: scadenziarioItem.iban || '',
        bank_name: scadenziarioItem.bank_name || '',
        payment_terms_type: scadenziarioItem.payment_terms?.type || '',
        attachment_url: scadenziarioItem.attachment_url || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scadenziarioItem]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { updateScadenziario } = await import('../../api/scadenziario-services');
      const terms = PAYMENT_TERMS_OPTIONS.find((t) => t.value === data.payment_terms_type);

      await updateScadenziario(id, {
        subject: data.subject,
        description: data.description || null,
        causale: data.causale || null,
        date: data.date,
        amount: data.amount,
        payment_date: data.paymentDate || null,
        status: data.status,
        invoice_number: data.invoice_number || null,
        invoice_date: data.invoice_date || null,
        company_name: data.company_name || null,
        vat_number: data.vat_number || null,
        iban: data.iban || null,
        bank_name: data.bank_name || null,
        payment_terms: terms ? { type: terms.value, days: terms.days, end_of_month: terms.end_of_month } : null,
        attachment_url: data.attachment_url || null,
        payment_receipt_url: data.payment_receipt_url || null,
      });

      enqueueSnackbar('Scadenza modificata con successo!');
      onEdited?.();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: 'calc(100% - 64px)' }
      }}
    >
      <DialogTitle sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1, width: 24, height: 24, color: 'primary.main' }} />
          Modifica Scadenza
        </Typography>
        {scadenziarioItem && (
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            {scadenziarioItem.subject}
          </Typography>
        )}
      </DialogTitle>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {scadenziarioItemLoading ? (
        <Box sx={{ py: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <DialogContent sx={{ p: 3 }}>

            {/* Campi base */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Dati scadenza</Typography>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
              sx={{ mb: 3 }}
            >
              <RHFTextField name="subject" label="Soggetto *" />
              <RHFTextField name="description" label="Descrizione" />
              <RHFTextField name="causale" label="Causale" />

              <Controller
                name="date"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Data scadenza *"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      if (newValue && !values.paymentDate) {
                        setValue('status', calculateScadenziarioStatus(newValue, null));
                      }
                    }}
                    slotProps={{
                      textField: { fullWidth: true, error: !!error, helperText: error?.message },
                    }}
                  />
                )}
              />

              <RHFTextField name="amount" label="Importo (€) *" type="number" />

              <Controller
                name="paymentDate"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Data pagamento"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      setValue('status', newValue ? 'completed' : calculateScadenziarioStatus(values.date, null));
                    }}
                    slotProps={{
                      textField: { fullWidth: true, error: !!error, helperText: error?.message },
                    }}
                  />
                )}
              />

              <RHFSelect
                name="status"
                label="Stato pagamento"
                disabled
                InputProps={{ sx: { backgroundColor: 'background.neutral', opacity: 0.8 } }}
                helperText="Aggiornato automaticamente in base alla data di pagamento"
              >
                <MenuItem value="completed">Pagato</MenuItem>
                <MenuItem value="overdue">Scaduto</MenuItem>
                <MenuItem value="upcoming">In scadenza</MenuItem>
                <MenuItem value="future">Da pagare</MenuItem>
              </RHFSelect>
            </Box>

            {!isFattura && (
              <Controller
                name="attachment_url"
                control={control}
                render={({ field }) => (
                  <ScadenziarioAttachmentUpload
                    ownerId={scadenziarioItem?.owner_id}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}

            {/* Campi fattura */}
            {isFattura && (              <>
                <Divider sx={{ borderStyle: 'dashed', mb: 3 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Estremi pagamento</Typography>
                <Box
                  rowGap={3}
                  columnGap={2}
                  display="grid"
                  gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
                >
                  <RHFTextField name="company_name" label="Fornitore / Azienda" />
                  <RHFTextField name="invoice_number" label="N. Fattura" />

                  <Controller
                    name="invoice_date"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <DatePicker
                        label="Data fattura"
                        value={field.value ? new Date(field.value) : null}
                        onChange={field.onChange}
                        slotProps={{
                          textField: { fullWidth: true, error: !!error, helperText: error?.message },
                        }}
                      />
                    )}
                  />

                  <RHFSelect name="payment_terms_type" label="Condizione di pagamento">
                    <MenuItem value="">— nessuna —</MenuItem>
                    {PAYMENT_TERMS_OPTIONS.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </RHFSelect>

                  <RHFTextField name="vat_number" label="Partita IVA" />
                  <RHFTextField name="iban" label="IBAN" />
                  <RHFTextField name="bank_name" label="Banca" />
                </Box>

                {/* Allegato corrente + possibilità di sostituire */}
                <Box sx={{ mt: 1 }}>
                  {values.attachment_url && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Iconify icon="eva:file-text-fill" sx={{ color: 'primary.main', width: 18, height: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                        Allegato corrente
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        href={values.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<Iconify icon="eva:external-link-fill" />}
                      >
                        Apri
                      </Button>
                    </Stack>
                  )}
                  <ScadenziarioOcrUpload
                    onExtracted={() => {}}
                    onFileUploaded={(url) => setValue('attachment_url', url, { shouldDirty: true })}
                  />
                  <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                    {values.attachment_url ? 'Carica un nuovo file per sostituire l\'allegato esistente' : 'Carica PDF o immagine (opzionale)'}
                  </Typography>
                </Box>
              </>
            )}

            {/* Contabile di pagamento — per tutte le scadenze */}
            <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Contabile di pagamento</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Ricevuta o contabile del bonifico effettuato
            </Typography>
            {values.payment_receipt_url && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Iconify icon="eva:file-text-fill" sx={{ color: 'success.main', width: 18, height: 18 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>Contabile allegata</Typography>
                <Button size="small" variant="outlined" href={values.payment_receipt_url} target="_blank" startIcon={<Iconify icon="eva:external-link-fill" />}>
                  Apri
                </Button>
              </Stack>
            )}
            <Controller
              name="payment_receipt_url"
              control={control}
              render={({ field }) => (
                <ScadenziarioAttachmentUpload
                  ownerId={scadenziarioItem?.owner_id}
                  value={null}
                  onChange={(url) => { if (url) field.onChange(url); }}
                />
              )}
            />

            {/* Piano di pagamento — solo per fatture */}
            {isFattura && id && (
              <>
                <Divider sx={{ borderStyle: 'dashed', my: 3 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Piano di pagamento</Typography>
                <ScadenziarioTranchesPanel
                  parentId={id}
                  parentAmount={values.amount}
                  ownerId={scadenziarioItem?.owner_id}
                />
              </>
            )}

          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              startIcon={<Iconify icon="eva:close-fill" />}
            >
              Annulla
            </Button>

            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting}
              startIcon={<Iconify icon="eva:checkmark-fill" />}
            >
              Salva modifiche
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      )}
    </Dialog>
  );
}
