import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import { useSnackbar } from 'src/components/snackbar';

import axios, { endpoints } from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

const STATUS_VALUES = [{name:'In Revisione', value:'pending'}, {name:'Completata', value:'completed'}, {name:'Da Controllare', value:'toCheck'}];
const PAYMENT_METHODS = ['Bonifico', 'Carte di Credito', 'Cbill', 'F24', 'PayPal', 'Addebito Diretto SEPA', 'POS', 'Altro'];

export default function PrimaNotaMultipleQuickEditForm({ transactions, open, onClose, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Verifichiamo se tutte le transazioni selezionate sono in stato 'pending'
  // Se tutte sono in 'pending', manteniamo lo stato, altrimenti usiamo 'completed' di default
  const allPending = transactions?.every(transaction => transaction.status === 'pending');
  const [status, setStatus] = useState(allPending ? 'pending' : 'completed');
  const [paymentType, setPaymentType] = useState(null);

  const { db } = useSettingsContext();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Create an array to store all requests
        const response = await axios.get(endpoints.category.list, { params: { db } });
        if (response.status === 200) {
          setCategoryList(response.data.data);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, []);

  const { enqueueSnackbar } = useSnackbar();

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (selectedCategory !== null && selectedSubject === null) {
        enqueueSnackbar('E\' necessario specificare anche un soggetto', { variant: 'warning' });
        setIsLoading(false);
        return; // Interrompo l'esecuzione della funzione
      }

      const data = {
        transactions,
        db,
        category: selectedCategory,
        subject: selectedSubject,
        details: selectedDetail,
        status,
        paymentType
      };

      const response = await axios.post('/api/prima-nota/edit-multi', data);

      if (response.data.data.status === 200) {
        enqueueSnackbar('Transazioni aggiornate con successo', { variant: 'success' });
        onUpdate();
        onClose();
        setSelectedCategory(null);
        setSelectedSubject(null);
        setSelectedDetail(null);
        setStatus('completed');
        setPaymentType('');
      } else {
        enqueueSnackbar('Errore durante l\'aggiornamento delle transazioni', { variant: 'error' });
      }

      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCategoryChange = async (newValue) => {
    setSelectedCategory(newValue.id);
    const response = await axios.post(endpoints.subject.list, { db, categoryId: newValue.id });
    if (response.status === 200) {
      setSubjectList(response.data.data);
    }
  };

  const handleSubjectChange = async (newValue) => {
    setSelectedSubject(newValue.id);
    const response = await axios.post(endpoints.detail.list, { db, subjectId: newValue.id });
    if (response.status === 200) {
      setDetailsList(response.data.data);
    }
  };

  const handleDetailsChange = (newValue) => {
    setSelectedDetail(newValue.id);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handlePaymentTypeChange = (event) => {
    setPaymentType(event.target.value);
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
      sx={{
        minHeight: '200px',
      }}
    >
      <DialogTitle>Modifica multipla</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={2} sx={{ width: '100%', mb: { xs: 3, md: 0 } }}>
        <FormControl sx={{ mt: 2 }}>
          <InputLabel>Stato</InputLabel>
          <Select
            name="status"
            label="Stato"
            InputLabelProps={{ shrink: true }}
            onChange={handleStatusChange}
            sx={{ maxWidth: '100%' }}
            defaultValue={status}
            value={status}
            variant='outlined'
          >
            {STATUS_VALUES.map((statusValue, index) => (
              <MenuItem key={`status-${index}`} value={statusValue.value}>
                {statusValue.name}
              </MenuItem>
            ))}
          </Select>
          </FormControl>

          <Autocomplete
            name="category"
            label="Categoria"
            options={categoryList}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option; // Nel caso option sia una stringa
              const category = categoryList.find((cat) => cat.id === option.id);
              return category ? category.name : '';
            }}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            onChange={async (event, newValue) => {
              await handleCategoryChange(newValue);
            }}
            renderOption={(props, option) => (
              <li
                {...props}
                key={option.id}
                style={{ fontWeight: option.id === 'new' ? 'bold' : 'normal' }}
              >
                {option.name}
              </li>
            )}
            sx={{ minWidth: '33%' }}
            renderInput={(params) => (
              <TextField {...params} label="Categoria" placeholder="Seleziona una categoria" />
            )}
          />

          <Autocomplete
            name="subcategory"
            label="Sottocategoria"
            options={subjectList}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option; // Nel caso option sia una stringa
              const subject = subjectList.find((cat) => cat.id === option.id);
              return subject ? subject.name : '';
            }}
            isOptionEqualToValue={(option, val) => option?.id === val?.id}
            onChange={async (event, newValue) => {
              await handleSubjectChange(newValue);
            }}
            disabled={subjectList.length === 0}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            sx={{ minWidth: '33%' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Soggetto"
                placeholder="Seleziona una soggetto"
              />
            )}
          />

          <Autocomplete
            name="details"
            label="Dettagli"
            options={detailsList}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option; // Nel caso option sia una stringa
              const detail = detailsList.find((cat) => cat.id === option.id);
              return detail ? detail.name : '';
            }}
            isOptionEqualToValue={(option, val) => option?.id === val?.id}
            onChange={(event, newValue) => {
              handleDetailsChange(newValue);
            }}
            disabled={detailsList.length === 0}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name}
              </li>
            )}
            sx={{ minWidth: '33%' }}
            renderInput={(params) => (
              <TextField {...params} label="Dettagli" placeholder="Seleziona un dettaglio" />
            )}
          />

          <FormControl>
            <InputLabel>Metodo di Pagamento</InputLabel>
            <Select
              name="paymentType"
              label="Metodo di pagamento"
              InputLabelProps={{ shrink: true }}
              onChange={handlePaymentTypeChange}
              sx={{ maxWidth: '100%' }}
              defaultValue={paymentType}
              value={paymentType}
              variant="outlined"
            >
              {PAYMENT_METHODS.map((method, index) => (
                <MenuItem key={`payment-${index}`} value={method}>
                  {method}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Annulla
        </Button>

        <LoadingButton type="button" variant="contained" loading={isLoading} onClick={onSubmit}>
          Aggiorna
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

PrimaNotaMultipleQuickEditForm.propTypes = {
  transactions: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
