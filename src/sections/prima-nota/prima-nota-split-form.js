import * as Yup from 'yup';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import FormProvider from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

import axios from '../../utils/axios';
import PrimaNotaSpitDetails from './prima-nota-spit-details';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function PrimaNotaSplitForm({ transaction, open, onClose, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();
  const { db } = useSettingsContext()

  const NewTransactionSchema = Yup.object().shape({
    date: Yup.mixed().nullable().required('Data è un campo obbligatorio'),
    description: Yup.string().required('Descrizione è un campo obbligatorio'),
    paymentType: Yup.string().required('Metodo di pagamento è un campo obbligatorio'),
  });

  const methods = useForm({
    resolver: yupResolver(NewTransactionSchema),
    defaultValues: {
      id: '',
      owner: transaction?.ownerid || '',
      date: '',
      description: '',
      paymentType: '',
      note: '',
      category: '',
      subject: '',
      details: '',
      status: transaction?.status || 'completed',
    },
  });

  const {
    reset,
    trigger,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open && transaction?.id) {
      reset({
        id: transaction?.id,
        owner: transaction?.ownerid || '',
        date: new Date(transaction?.date),
        description: transaction?.description || '',
        paymentType: transaction.paymenttype || '',
        note: '',
        category: '',
        subject: '',
        details: '',
        status: transaction?.status || 'completed',
      });
    }
  }, [open, reset, transaction]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataToSend = {
        ...data,
        db,
        amount: Math.round(parseFloat(data.positiveAmount || data.negativeAmount) * 100) / 100,
        documents: data.documents || [],
      }

      const response = await axios.post('/api/prima-nota/split', dataToSend);
      if (response.status === 200) {
        onClose();
        reset();
        onUpdate();
        enqueueSnackbar('Prima nota create correttamente!');
      } else {
        enqueueSnackbar('Si è verificato un errore', { variant: 'error' });
      }
    } catch (error) {
      console.error(error);
    }
  });

  const handleClose = () => {
    onClose();
    reset();
  }

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={handleClose}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <PrimaNotaSpitDetails
            maxAmount={transaction?.amount}
            control={control}
            setValue={setValue}
            watch={watch}
            trigger={trigger}
          />
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleClose}
          >
            Annulla
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Crea
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

PrimaNotaSplitForm.propTypes = {
  transaction: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
