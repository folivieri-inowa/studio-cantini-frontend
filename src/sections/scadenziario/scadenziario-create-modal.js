'use client';

import * as Yup from 'yup';
import { format } from 'date-fns';
import { useState, useMemo, useCallback } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';

import { TYPE_OPTIONS } from './utils/payment-terms';
import { createTranche } from '../../api/scadenziario-api';

// ----------------------------------------------------------------------

const calculateDefaultStatus = (dueDate) => {
  const today = new Date();
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 15) return 'upcoming';
  return 'future';
};

// ----------------------------------------------------------------------

export default function ScadenziarioCreateModal({ open, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  // Tranches locali (solo per type === 'fattura')
  const [tranches, setTranches] = useState([]);
  const [trancheDate, setTrancheDate] = useState(null);
  const [trancheAmount, setTrancheAmount] = useState('');
  const [trancheNote, setTrancheNote] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const NewScadenziarioSchema = Yup.object().shape({
    subject: Yup.string().required('Soggetto richiesto'),
    description: Yup.string().required('Descrizione richiesta'),
    causale: Yup.string().required('Causale richiesta'),
    date: Yup.date().required('Data scadenza richiesta'),
    amount: Yup.number().moreThan(0, 'Il valore deve essere maggiore di 0').required('Importo richiesto'),
    paymentDate: Yup.date().nullable(),
    status: Yup.string().required('Stato richiesto'),
    type: Yup.string().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      subject: '',
      description: '',
      causale: '',
      date: new Date(),
      amount: 0,
      paymentDate: null,
      status: calculateDefaultStatus(new Date()),
      type: '',
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewScadenziarioSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const watchedType = watch('type');
  const isFattura = watchedType === 'fattura';

  const handleClose = useCallback(() => {
    reset();
    setTranches([]);
    setTrancheDate(null);
    setTrancheAmount('');
    setTrancheNote('');
    setAddOpen(false);
    onClose();
  }, [onClose, reset]);

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

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { createScadenziario } = await import('../../api/scadenziario-services');
      const result = await createScadenziario(data);

      // Se è una fattura con tranches, le creo subito dopo
      if (isFattura && tranches.length > 0) {
        const parentId = result?.data?.id;
        if (parentId) {
          await Promise.all(
            tranches.map((t) =>
              createTranche({ ...t, parent_id: parentId, owner_id: data.owner_id || null })
            )
          );
        }
      }

      reset();
      setTranches([]);
      enqueueSnackbar('Scadenza creata con successo!');
      onCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  // Calcoli riepilogo tranches
  const totalTranches = tranches.reduce((acc, t) => acc + t.amount, 0);
  const watchedAmount = watch('amount') || 0;
  const residual = parseFloat(watchedAmount) - totalTranches;

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
          Nuovo scadenziario
        </Typography>
      </DialogTitle>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <RHFTextField name="subject" label="Soggetto" />
            <RHFTextField name="description" label="Descrizione" />

            <RHFTextField name="causale" label="Causale" />

            <RHFSelect name="type" label="Tipo">
              <option value="">— Nessuno —</option>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </RHFSelect>

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Data scadenza"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    if (newValue) setValue('status', calculateDefaultStatus(newValue));
                  }}
                  slotProps={{
                    textField: { fullWidth: true, error: !!error, helperText: error?.message },
                  }}
                />
              )}
            />

            <RHFTextField name="amount" label="Importo" type="number" />

            <Controller
              name="paymentDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Data pagamento"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    if (newValue) setValue('status', 'completed');
                  }}
                  slotProps={{
                    textField: { fullWidth: true, error: !!error, helperText: error?.message },
                  }}
                />
              )}
            />

            <RHFSelect name="status" label="Stato pagamento">
              <option value="completed">Pagato</option>
              <option value="overdue">Scaduto</option>
              <option value="upcoming">In scadenza</option>
              <option value="future">Da pagare</option>
            </RHFSelect>
          </Box>

          {/* Sezione piano di pagamento — solo per fatture */}
          {isFattura && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2">Piano di pagamento</Typography>
                {tranches.length > 0 && (
                  <Typography variant="caption" color={residual < 0 ? 'error.main' : residual === 0 ? 'success.main' : 'text.secondary'}>
                    Programmato: {totalTranches.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    {' · '}
                    Residuo: {residual.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
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
            Salva
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
