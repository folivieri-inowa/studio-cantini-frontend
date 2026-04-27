'use client';

import * as Yup from 'yup';
import { format } from 'date-fns';
import { useMemo, useState, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import StepLabel from '@mui/material/StepLabel';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import { useSettingsContext } from 'src/components/settings';

import {
  PAYMENT_TERMS_OPTIONS,
  FREQUENCY_OPTIONS,
  TYPE_OPTIONS,
  calculateDueDate,
  generateInstallments,
} from './utils/payment-terms';
import ScadenziarioOcrUpload from './scadenziario-ocr-upload';
import ScadenziarioAttachmentUpload from './scadenziario-attachment-upload';
import ScadenziarioInstallmentPreview from './scadenziario-installment-preview';
import { createTranche } from '../../api/scadenziario-api';

// ----------------------------------------------------------------------

const STEPS = ['Dati', 'Conferma'];

// ----------------------------------------------------------------------

function ScadenziarioFormStep1({ control, watch, setValue, calculatedDueDate, tranches, setTranches, ownerId }) {
  const watchedType = watch('type');

  const isFattura = watchedType === 'fattura';
  const isRata = watchedType === 'rata';
  const hasFixedDate = !isFattura && !isRata;

  const [trancheDate, setTrancheDate] = useState(null);
  const [trancheAmount, setTrancheAmount] = useState('');
  const [trancheNote, setTrancheNote] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const handleAddTranche = () => {
    if (!trancheDate || !trancheAmount) return;
    setTranches((prev) => [
      ...prev,
      {
        date: format(trancheDate, 'yyyy-MM-dd'),
        amount: parseFloat(trancheAmount),
        description: trancheNote || null,
        type: 'acconto',
        status: 'future',
      },
    ]);
    setTrancheDate(null);
    setTrancheAmount('');
    setTrancheNote('');
    setAddOpen(false);
  };

  const handleRemoveTranche = (index) => {
    setTranches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOcrExtracted = useCallback(
    (data) => {
      // Normalizza stringhe data in formato DD/MM/YYYY o YYYY-MM-DD → Date object
      const parseDate = (str) => {
        if (!str) return null;
        // DD/MM/YYYY o DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
        if (dmyMatch) return new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`);
        const d = new Date(str);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      const set = (name, value) => setValue(name, value, { shouldDirty: true, shouldTouch: true });

      if (data.invoice_number) set('invoice_number', data.invoice_number);
      if (data.amount)         set('amount', data.amount);
      if (data.company_name)   set('company_name', data.company_name);
      if (data.subject)        set('subject', data.subject);
      if (data.description)    set('description', data.description);
      if (data.vat_number)     set('vat_number', data.vat_number);
      if (data.iban)           set('iban', data.iban);
      if (data.bank_name)      set('bank_name', data.bank_name);
      if (data.payment_terms)  set('payment_terms_type', data.payment_terms);
      const invoiceDate = parseDate(data.invoice_date);
      if (invoiceDate) set('invoice_date', invoiceDate);
      const dueDate = parseDate(data.due_date);
      if (dueDate) set('date', dueDate);
    },
    [setValue]
  );

  const handleFileUploaded = useCallback(
    (url) => { setValue('attachment_url', url); },
    [setValue]
  );

  return (
    <Stack spacing={3}>
      {/* Tipo scadenza */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          Tipo scadenza
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {TYPE_OPTIONS.map((opt) => {
            const selected = watch('type') === opt.value;
            return (
              <Chip
                key={opt.value}
                label={opt.label}
                icon={<Iconify icon={opt.icon} sx={{ width: 16, height: 16 }} />}
                onClick={() => setValue('type', opt.value)}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer', fontWeight: selected ? 'bold' : 'normal' }}
              />
            );
          })}
        </Stack>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Campi per piano rate */}
      {isRata && (
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        >
          <RHFTextField name="group_name" label="Nome piano rate" />

          <RHFTextField name="rata_amount" label="Importo per rata (€)" type="number"
            inputProps={{ min: 0, step: 0.01 }} />

          <RHFTextField name="installments" label="Numero rate" type="number"
            inputProps={{ min: 1, max: 120, step: 1 }} />

          <RHFSelect name="frequency" label="Frequenza">
            {FREQUENCY_OPTIONS.map((f) => (
              <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
            ))}
          </RHFSelect>

          <Controller
            name="start_date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                label="Data prima rata"
                value={field.value ? new Date(field.value) : null}
                onChange={field.onChange}
                slotProps={{
                  textField: { fullWidth: true, error: !!error, helperText: error?.message },
                }}
              />
            )}
          />

          <RHFTextField name="description" label="Descrizione (opzionale)" />
        </Box>
      )}

      {/* Campi per fattura */}
      {isFattura && (
        <Stack spacing={3}>
          <ScadenziarioOcrUpload onExtracted={handleOcrExtracted} onFileUploaded={handleFileUploaded} />

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <RHFTextField name="subject" label="Soggetto *" />
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
              {PAYMENT_TERMS_OPTIONS.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </RHFSelect>

            {calculatedDueDate ? (
              <Alert severity="info" sx={{ alignSelf: 'center' }}>
                <strong>Scadenza calcolata:</strong>{' '}
                {format(calculatedDueDate, 'dd/MM/yyyy')}
              </Alert>
            ) : (
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Data scadenza"
                    value={field.value ? new Date(field.value) : null}
                    onChange={field.onChange}
                    slotProps={{
                      textField: { fullWidth: true, error: !!error, helperText: error?.message },
                    }}
                  />
                )}
              />
            )}

            <RHFTextField name="amount" label="Importo (€) *" type="number"
              inputProps={{ min: 0, step: 0.01 }} />
            <RHFTextField name="vat_number" label="Partita IVA" />
            <RHFTextField name="iban" label="IBAN" />
            <RHFTextField name="bank_name" label="Banca" />
            <RHFTextField name="description" label="Descrizione" />
            <RHFTextField name="causale" label="Causale" />
          </Box>

          {/* Piano di pagamento */}
          <Box sx={{ mt: 1 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">Piano di pagamento (opzionale)</Typography>
              {tranches.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {tranches.length} tranche · {tranches.reduce((a, t) => a + t.amount, 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </Typography>
              )}
            </Stack>

            {tranches.length > 0 && (
              <Table size="small" sx={{ mb: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Nota</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tranches.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{t.description || '—'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight="bold">
                          {t.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => handleRemoveTranche(i)}>
                          <Iconify icon="eva:trash-2-fill" width={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Button
              size="small"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setAddOpen((v) => !v)}
              sx={{ mb: 1 }}
            >
              Aggiungi tranche
            </Button>

            <Collapse in={addOpen}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ mt: 1 }}>
                <DatePicker
                  label="Data"
                  value={trancheDate}
                  onChange={setTrancheDate}
                  slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                />
                <TextField
                  label="Importo €"
                  size="small"
                  type="number"
                  value={trancheAmount}
                  onChange={(e) => setTrancheAmount(e.target.value)}
                  sx={{ maxWidth: 130 }}
                />
                <TextField
                  label="Nota (opz.)"
                  size="small"
                  value={trancheNote}
                  onChange={(e) => setTrancheNote(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  disabled={!trancheDate || !trancheAmount}
                  onClick={handleAddTranche}
                >
                  Aggiungi
                </Button>
              </Stack>
            </Collapse>
          </Box>
        </Stack>
      )}

      {/* Campi generici (fiscale, ricorrente, altro) */}
      {hasFixedDate && (
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
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
                onChange={field.onChange}
                slotProps={{
                  textField: { fullWidth: true, error: !!error, helperText: error?.message },
                }}
              />
            )}
          />

          <RHFTextField name="amount" label="Importo (€) *" type="number"
            inputProps={{ min: 0, step: 0.01 }} />

          <RHFSelect name="status" label="Stato">
            <MenuItem value="future">Da pagare</MenuItem>
            <MenuItem value="upcoming">In scadenza</MenuItem>
            <MenuItem value="overdue">Scaduto</MenuItem>
            <MenuItem value="completed">Pagato</MenuItem>
          </RHFSelect>
        </Box>

        <Controller
          name="attachment_url"
          control={control}
          render={({ field }) => (
            <ScadenziarioAttachmentUpload
              ownerId={ownerId}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ScadenziarioConfirmStep({ methods, calculatedDueDate, tranches }) {
  const data = methods.getValues();

  const rows = [
    { label: 'Tipo',         value: TYPE_OPTIONS.find(t => t.value === data.type)?.label || data.type },
    { label: 'Soggetto',     value: data.subject },
    { label: 'Fornitore',    value: data.company_name },
    { label: 'N. Fattura',   value: data.invoice_number },
    { label: 'Importo',      value: data.amount ? `€ ${parseFloat(data.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : null },
    { label: 'Scadenza',     value: calculatedDueDate ? format(calculatedDueDate, 'dd/MM/yyyy') : (data.date ? format(new Date(data.date), 'dd/MM/yyyy') : null) },
    { label: 'Descrizione',  value: data.description },
    { label: 'Causale',      value: data.causale },
  ].filter(r => r.value);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">Riepilogo scadenza</Typography>
      <Box
        sx={{
          borderRadius: 1.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {rows.map(({ label, value }, i) => (
          <Stack
            key={label}
            direction="row"
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: i % 2 === 0 ? 'background.neutral' : 'background.paper',
            }}
          >
            <Typography variant="body2" sx={{ width: 140, color: 'text.secondary', flexShrink: 0 }}>
              {label}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
          </Stack>
        ))}
      </Box>

      {tranches?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Piano di pagamento</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Nota</TableCell>
                <TableCell align="right">Importo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tranches.map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{t.description || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {t.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function ScadenziarioCreateModal({ open, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();

  const [step, setStep] = useState(0);
  const [installmentPreview, setInstallmentPreview] = useState([]);
  const [tranches, setTranches] = useState([]);

  const methods = useForm({
    defaultValues: {
      type: 'fattura',
      subject: '',
      description: '',
      causale: '',
      date: null,
      amount: '',
      status: 'future',
      owner_id: settings.owner?.id ?? settings.owner,
      // fattura
      invoice_number: '',
      invoice_date: null,
      company_name: '',
      vat_number: '',
      iban: '',
      bank_name: '',
      payment_terms_type: '30ggfm',
      attachment_url: '',
      // rata
      group_name: '',
      installments: 12,
      frequency: 'mensile',
      start_date: new Date(),
      rata_amount: '',
    },
  });

  const { reset, watch, setValue, handleSubmit, control, formState: { isSubmitting } } = methods;

  const watchedType = watch('type');
  const watchedInvoiceDate = watch('invoice_date');
  const watchedPaymentTerms = watch('payment_terms_type');

  const calculatedDueDate = useMemo(() => {
    if (watchedType !== 'fattura' || !watchedInvoiceDate || !watchedPaymentTerms) return null;
    return calculateDueDate(watchedInvoiceDate, watchedPaymentTerms);
  }, [watchedType, watchedInvoiceDate, watchedPaymentTerms]);

  const handleNext = useCallback(() => {
    const data = methods.getValues();
    if (data.type === 'rata') {
      const preview = generateInstallments({
        startDate: data.start_date,
        installments: parseInt(data.installments, 10),
        frequency: data.frequency,
        amount: parseFloat(data.rata_amount) || 0,
        groupName: data.group_name || 'Piano rate',
      });
      setInstallmentPreview(preview);
    }
    setStep(1);
  }, [methods]);

  const handleClose = useCallback(() => {
    reset();
    setStep(0);
    setInstallmentPreview([]);
    setTranches([]);
    onClose();
  }, [onClose, reset]);

  const onSubmit = useCallback(async () => {
    const data = methods.getValues();
    try {
      if (data.type === 'rata') {
        const { createGroup } = await import('../../api/scadenziario-services');
        await createGroup(
          {
            name: data.group_name,
            type: 'rata',
            total_amount: (parseFloat(data.rata_amount) || 0) * parseInt(data.installments, 10),
            installments: parseInt(data.installments, 10),
            frequency: data.frequency,
            start_date: data.start_date,
            owner_id: data.owner_id,
          },
          installmentPreview.map((inst) => ({
            ...inst,
            date: format(new Date(inst.date), 'yyyy-MM-dd'),
            status: 'future',
          }))
        );
      } else {
        const { createScadenziario } = await import('../../api/scadenziario-services');
        const terms = PAYMENT_TERMS_OPTIONS.find((t) => t.value === data.payment_terms_type);
        const dueDate = data.type === 'fattura' && calculatedDueDate
          ? format(calculatedDueDate, 'yyyy-MM-dd')
          : data.date ? format(new Date(data.date), 'yyyy-MM-dd') : null;

        const result = await createScadenziario({
          subject: data.subject,
          description: data.description || null,
          causale: data.causale || null,
          date: dueDate,
          amount: parseFloat(data.amount) || 0,
          status: data.status || 'future',
          owner_id: data.owner_id,
          type: data.type,
          alert_days: 15,
          invoice_number: data.invoice_number || null,
          invoice_date: data.invoice_date ? format(new Date(data.invoice_date), 'yyyy-MM-dd') : null,
          company_name: data.company_name || null,
          vat_number: data.vat_number || null,
          iban: data.iban || null,
          bank_name: data.bank_name || null,
          payment_terms: terms ? { type: terms.value, days: terms.days, end_of_month: terms.end_of_month } : null,
          attachment_url: data.attachment_url || null,
        });

        // Crea le tranches se la fattura madre è stata creata con successo
        if (data.type === 'fattura' && tranches.length > 0) {
          const parentId = result?.data?.id;
          if (parentId) {
            await Promise.all(
              tranches.map((t) =>
                createTranche({ ...t, parent_id: parentId, owner_id: data.owner_id || null })
              )
            );
          }
        }
      }

      enqueueSnackbar('Scadenza creata con successo!');
      onCreated?.();
      handleClose();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Errore durante il salvataggio', { variant: 'error' });
    }
  }, [methods, installmentPreview, tranches, calculatedDueDate, enqueueSnackbar, onCreated, handleClose]);

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { borderRadius: 2, maxHeight: 'calc(100% - 64px)' } }}
    >
      <DialogTitle sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <Iconify icon="solar:add-circle-bold" sx={{ mr: 1, width: 24, height: 24, color: 'primary.main' }} />
          Nuova scadenza
        </Typography>

        <Stepper activeStep={step} sx={{ mt: 2 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <FormProvider methods={methods}>
        <DialogContent sx={{ p: 3 }}>
          {step === 0 && (
            <ScadenziarioFormStep1
              control={control}
              watch={watch}
              setValue={setValue}
              calculatedDueDate={calculatedDueDate}
              tranches={tranches}
              setTranches={setTranches}
              ownerId={settings.owner?.id ?? settings.owner}
            />
          )}

          {step === 1 && (
            watchedType === 'rata'
              ? (
                <ScadenziarioInstallmentPreview
                  installments={installmentPreview}
                  onChange={setInstallmentPreview}
                />
              ) : (
                <ScadenziarioConfirmStep
                  methods={methods}
                  calculatedDueDate={calculatedDueDate}
                  tranches={tranches}
                />
              )
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={step === 0 ? handleClose : () => setStep(0)}
            startIcon={<Iconify icon={step === 0 ? 'eva:close-fill' : 'eva:arrow-back-fill'} />}
          >
            {step === 0 ? 'Annulla' : 'Indietro'}
          </Button>

          {step === 0 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<Iconify icon="eva:arrow-forward-fill" />}
            >
              Avanti
            </Button>
          ) : (
            <LoadingButton
              variant="contained"
              loading={isSubmitting}
              onClick={onSubmit}
              startIcon={<Iconify icon="eva:checkmark-fill" />}
            >
              Salva
            </LoadingButton>
          )}
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
