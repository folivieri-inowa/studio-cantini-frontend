import PropTypes from 'prop-types';
import { useState } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DeleteIcon from '@mui/icons-material/Delete';

import { useRouter } from 'src/routes/hooks';

import { useSnackbar } from 'src/components/snackbar';

import axios from '../../utils/axios';
import { paths } from '../../routes/paths';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function SubjectNewEditForm({ currentSubject, onUpdate, redirect }) {
  const [name, setName] = useState('');
  const [metadata, setMetadata] = useState([]); // Gestisce i campi dinamici
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const {db} = useSettingsContext();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();


  const onSubmit = async () => {
    setLoading(true);
    try {
      const data = { name, metadata };

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: responseData, status } = await axios.post('/api/subject/create', { ...data, db });
      if (status === 200) {
        if (onUpdate) {
          onUpdate(responseData.data.data);
        }
        if (redirect) router.push(paths.dashboard.subject.root);
        enqueueSnackbar(currentSubject ? 'Aggiornamento completato' : 'Soggetto salvato correttamente!');
      }else{
        enqueueSnackbar('Si è verificato un errore, riprovare');
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Funzione per aggiungere nuovi campi
  const handleAddMetadata = () => {
    setMetadata([...metadata, { key: '', value: '' }]);
  };

  // Funzione per rimuovere un campo
  const handleRemoveMetadata = (index) => {
    const newMetadata = metadata.filter((_, i) => i !== index);
    setMetadata(newMetadata);
  };

  const handleChange = (event) => {
    if (event.target.checked) {
      setChecked(event.target.checked);
      handleAddMetadata();
    } else {
      setChecked(event.target.checked);
      setMetadata([]);
    }
  };

  const handleMetadataChange = (index, field, value) => {
    setMetadata((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card sx={{ p: 3 }}>
          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
            <TextField
              name="name"
              label="Nome completo"
              onChange={(e) => setName(e.target.value)}
            />

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
                <Typography>Altri dati da memorizzare?</Typography>
                <Switch
                  checked={checked}
                  onChange={handleChange}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </Stack>
              {checked && (
                <Button variant="contained" onClick={handleAddMetadata} size="small">
                  <AddIcon /> Aggiungi
                </Button>
              )}
            </Stack>

            {checked &&
              metadata.map((meta, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <TextField
                    name={`metadata[${index}].key`}
                    label={`Chiave ${index + 1}`}
                    value={meta.key}
                    onChange={(e) => handleMetadataChange(index, 'key', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    name={`metadata[${index}].value`}
                    label={`Valore ${index + 1}`}
                    value={meta.value}
                    onChange={(e) => handleMetadataChange(index, 'value', e.target.value)}
                    fullWidth
                  />
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveMetadata(index)}
                    aria-label="Rimuovi campo"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
          </Stack>

          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton
              type="button"
              variant="contained"
              loading={loading}
              onClick={onSubmit}
            >
              Salva
            </LoadingButton>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

SubjectNewEditForm.propTypes = {
  currentSubject: PropTypes.object,
  onUpdate: PropTypes.func,
  redirect: PropTypes.bool,
};
