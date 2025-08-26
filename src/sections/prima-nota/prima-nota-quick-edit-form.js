import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import FormProvider from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

import axios from '../../utils/axios';
import { BACKEND_API } from '../../config-global';
import { useSettingsContext } from '../../components/settings';
import PrimaNotaNewEditDetails from './prima-nota-new-edit-details';

// ----------------------------------------------------------------------

export default function PrimaNotaQuickEditForm({ transaction, open, onClose, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();
  const { db } = useSettingsContext();

  // Stati separati per i loading dei bottoni
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompletingUpdate, setIsCompletingUpdate] = useState(false);
  
  // Stati per la modal di conferma modifiche importo
  const [showAmountChangeConfirm, setShowAmountChangeConfirm] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);
  const [amountChangeInfo, setAmountChangeInfo] = useState(null);

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
      excludedFromStats: transaction?.excluded_from_stats || false,
    },
  });

  const {
    reset,
    trigger,
    control,
    setValue,
    watch,
    getValues,
    handleSubmit,
    formState: { errors },
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

  // Funzione per rilevare cambiamenti di importo
  const detectAmountChanges = (data) => {
    const originalAmount = transaction?.amount || 0;
    const newAmount = parseFloat(data.positiveAmount || data.negativeAmount) || 0;
    
    const originalSign = originalAmount >= 0 ? 'Avere' : 'Dare';
    const newSign = newAmount >= 0 ? 'Avere' : 'Dare';
    
    const originalAbsValue = Math.abs(originalAmount);
    const newAbsValue = Math.abs(newAmount);
    
    // Controlla se c'è stato un cambio di segno
    const signChanged = originalSign !== newSign;
    
    // Controlla se c'è stato un cambio di importo
    const amountChanged = originalAbsValue !== newAbsValue;
    
    if (signChanged || amountChanged) {
      return {
        hasChanges: true,
        signChanged,
        amountChanged,
        originalAmount: originalAbsValue,
        newAmount: newAbsValue,
        originalSign,
        newSign
      };
    }
    
    return { hasChanges: false };
  };

  // Funzione per gestire il salvataggio con o senza stato completato
  const handleSaveWithStatus = (setCompleted) => 
    handleSubmit(async (data) => {
      // Controlla se ci sono modifiche all'importo
      const changeInfo = detectAmountChanges(data);
      
      // Se ci sono modifiche di importo, mostra la modal di conferma
      if (changeInfo.hasChanges) {
        setAmountChangeInfo(changeInfo);
        setPendingSaveAction(() => () => performSave(data, setCompleted));
        setShowAmountChangeConfirm(true);
        return;
      }
      
      // Se non ci sono modifiche, procedi direttamente con il salvataggio
      await performSave(data, setCompleted);
    });

  // Funzione che esegue effettivamente il salvataggio
  const performSave = async (data, setCompleted) => {
    // Imposta il loading appropriato
    if (setCompleted) {
      setIsCompletingUpdate(true);
    } else {
      setIsUpdating(true);
    }

    try {
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
      enqueueSnackbar('Si è verificato un errore durante il salvataggio', { variant: 'error' });
    } finally {
      // Reset dei loading stati
      setIsUpdating(false);
      setIsCompletingUpdate(false);
    }
  };

  // Gestisce la conferma della modal
  const handleConfirmAmountChange = async () => {
    setShowAmountChangeConfirm(false);
    if (pendingSaveAction) {
      await pendingSaveAction();
      setPendingSaveAction(null);
      setAmountChangeInfo(null);
    }
  };

  // Gestisce l'annullamento della modal
  const handleCancelAmountChange = () => {
    setShowAmountChangeConfirm(false);
    setPendingSaveAction(null);
    setAmountChangeInfo(null);
  };

  // Manteniamo onSubmit per retrocompatibilità
  const onSubmit = handleSaveWithStatus(false);

  const handleClose = () => {
    onClose();
    reset();
  }

  return (
    <>
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
              getValues={getValues}
              trigger={trigger}
              errors={errors}
              showExcludeFromStats={false}
            />
          </DialogContent>

          <DialogActions>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={isUpdating || isCompletingUpdate}
            >
              Annulla
            </Button>

            <LoadingButton 
              type="button"
              variant="contained" 
              color="info"
              onClick={handleSaveWithStatus(false)}
              loading={isUpdating}
              sx={{ mr: 1 }}
            >
              Aggiorna
            </LoadingButton>

            <LoadingButton 
              type="button"
              variant="contained" 
              color="success"
              onClick={handleSaveWithStatus(true)}
              loading={isCompletingUpdate}
            >
              Aggiorna e completa
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>

      {/* Modal di conferma modifiche importo */}
      <Dialog
        open={showAmountChangeConfirm}
        onClose={handleCancelAmountChange}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Conferma Modifiche Importo
        </DialogTitle>
        <DialogContent>
          {amountChangeInfo && (
            <Box sx={{ mt: 1 }}>
              {(() => {
                if (amountChangeInfo.signChanged && amountChangeInfo.amountChanged) {
                  return (
                    <Typography>
                      Stai modificando l&apos;importo da <strong>€{amountChangeInfo.originalAmount.toFixed(2)} ({amountChangeInfo.originalSign})</strong> 
                      {' '}a <strong>€{amountChangeInfo.newAmount.toFixed(2)} ({amountChangeInfo.newSign})</strong>.
                    </Typography>
                  );
                }
                if (amountChangeInfo.signChanged) {
                  return (
                    <Typography>
                      Stai cambiando il segno dell&apos;importo da <strong>{amountChangeInfo.originalSign}</strong> 
                      {' '}a <strong>{amountChangeInfo.newSign}</strong> (€{amountChangeInfo.originalAmount.toFixed(2)}).
                    </Typography>
                  );
                }
                return (
                  <Typography>
                    Stai modificando l&apos;importo da <strong>€{amountChangeInfo.originalAmount.toFixed(2)}</strong> 
                    {' '}a <strong>€{amountChangeInfo.newAmount.toFixed(2)}</strong>.
                  </Typography>
                );
              })()}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Vuoi procedere con questa modifica?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAmountChange} color="inherit">
            Annulla
          </Button>
          <LoadingButton 
            onClick={handleConfirmAmountChange}
            variant="contained"
            color="primary"
            loading={isUpdating || isCompletingUpdate}
          >
            Conferma e Salva
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

PrimaNotaQuickEditForm.propTypes = {
  transaction: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
