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
    category: Yup.string().required('Categoria è un campo obbligatorio'),
    subject: Yup.string().required('Soggetto è un campo obbligatorio'),
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
    formState: { isSubmitting, errors },
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

  // Funzione per gestire il salvataggio con o senza stato completato
  const handleSaveWithStatus = (setCompleted) => {
    return handleSubmit(async (data) => {
      // Attiva la validazione dei campi
      await trigger('category');
      await trigger('subject');
      
      // Verifica che sia specificata almeno categoria e soggetto
      if (!data.category) {
        enqueueSnackbar('È necessario specificare una categoria', { variant: 'error' });
        return;
      }

      if (!data.subject) {
        enqueueSnackbar('È necessario specificare un soggetto', { variant: 'error' });
        return;
      }
      
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        // const documentsUrl = await handleUploadFiles(data.documents);

        const documentsUrl = await handleUploadFiles(data.documents);

        const dataToSend = {
          ...data,
          db,
          amount: parseFloat(data.positiveAmount || data.negativeAmount),
          documents: documentsUrl || data.documents || [],
          status: setCompleted ? 'completed' : data.status, // Imposta lo stato a 'completed' solo se richiesto
        }

      const response = await axios.post('/api/prima-nota/edit', dataToSend);

      if (response.status === 200) {
        onClose();
        reset();
        onUpdate();
        const message = setCompleted ? 
          "Prima nota aggiornata e completata con successo" : 
          "Aggiornamento completato!";
        enqueueSnackbar(message, { variant: 'success' });
      } else {
        enqueueSnackbar('Si è verificato un errore');
      }
    } catch (error) {
      console.error(error);
    }
  });
};

  // Manteniamo onSubmit per retrocompatibilità
  const onSubmit = handleSaveWithStatus(false);

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
            errors={errors}
          />
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleClose}
          >
            Annulla
          </Button>

          <LoadingButton 
            type="button"
            variant="contained" 
            color="success"
            onClick={handleSaveWithStatus(true)}
            loading={isSubmitting}
          >
            Aggiorna e completa
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
