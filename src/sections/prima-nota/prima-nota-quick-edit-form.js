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
import { BACKEND_API } from '../../config-global';
import { useSettingsContext } from '../../components/settings';
import PrimaNotaNewEditDetails from './prima-nota-new-edit-details';

// ----------------------------------------------------------------------

export default function PrimaNotaQuickEditForm({ transaction, open, onClose, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();
  const { db } = useSettingsContext()

  const NewTransactionSchema = Yup.object().shape({
    date: Yup.mixed().nullable().required('Data è un campo obbligatorio'),
    // amount: Yup.number().required('Importo è un campo obbligatorio'),
    description: Yup.string().required('Descrizione è un campo obbligatorio'),
    paymentType: Yup.string().required('Metodo di pagamento è un campo obbligatorio'),
  });

  const methods = useForm({
    resolver: yupResolver(NewTransactionSchema),
    defaultValues: {
      id: transaction?.id || '',
      owner: transaction?.ownerid || '',
      date: transaction?.date || null,
      amount: transaction?.amount || null,
      negativeAmount: transaction?.amount < 0 ? transaction?.amount : null,
      positiveAmount: transaction?.amount > 0 ? transaction?.amount : null,
      description: transaction?.description || '',
      paymentType: transaction?.paymenttype || '',
      note: transaction?.note || '',
      category: transaction?.categoryid || '',
      subject: transaction?.subjectid || '',
      details: transaction?.detailid || '',
      documents: transaction?.documents || [],
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
        id: transaction?.id || '',
        owner: transaction?.ownerid || '',
        date: transaction?.date || null,
        amount: transaction?.amount || null,
        negativeAmount: transaction?.amount < 0 ? transaction?.amount : null,
        positiveAmount: transaction?.amount > 0 ? transaction?.amount : null,
        description: transaction?.description || '',
        paymentType: transaction?.paymenttype || '',
        note: transaction?.note || '',
        category: transaction?.categoryid || '',
        subject: transaction?.subjectid || '',
        details: transaction?.detailid || '',
        documents: transaction?.documents || [],
        status: transaction?.status || 'completed',
      });
    }
  }, [open, reset, transaction]);

  const handleUploadFiles = async (images) => {
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        if (image instanceof File) {
          const form = new FormData();
          form.append("file", image);
          const uploadedImage = await axios.post(`${BACKEND_API}/v1/upload`, form)
          return {url: uploadedImage.data.url, isNew: true};
        }
        if (image?.isNew){
          return image;
        }
        return {url: image, isNew: false};
      })
    );
    return imageUrls;
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // const documentsUrl = await handleUploadFiles(data.documents);

      const documentsUrl = await handleUploadFiles(data.documents);

      const dataToSend = {
        ...data,
        db,
        amount: parseFloat(data.positiveAmount || data.negativeAmount),
        documents: documentsUrl || data.documents || [],
      }

      const response = await axios.post('/api/prima-nota/edit', dataToSend);

      if (response.status === 200) {
        onClose();
        reset();
        onUpdate();
        enqueueSnackbar('Aggiornamento completato!');
      } else {
        enqueueSnackbar('Si è verificato un errore');
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
          <PrimaNotaNewEditDetails
            edit
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
            Aggiorna
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

PrimaNotaQuickEditForm.propTypes = {
  transaction: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
