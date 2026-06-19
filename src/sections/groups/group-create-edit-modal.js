'use client';

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';

import { useSnackbar } from 'src/components/snackbar';

import { useGetCategories } from '../../api/category';
import { createGroup, updateGroup } from '../../api/groups';

export default function GroupCreateEditModal({ open, onClose, editGroup, db }) {
  const { enqueueSnackbar } = useSnackbar();
  const { categories, categoriesLoading } = useGetCategories(db);

  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when opening for create or editing a different group
  useEffect(() => {
    if (open) {
      if (editGroup) {
        setName(editGroup.name || '');
        // editGroup.items is only present when fetched with full details.
        // When coming from the list page, we need to fetch the full group.
        // For simplicity in edit from list, we fetch the full group on demand.
        if (editGroup.items) {
          setSelectedCategories(
            editGroup.items.map(item => ({
              id: item.category_id,
              name: item.category_name,
            }))
          );
        } else {
          setSelectedCategories([]);
          // Fetch full details — done via the parent or we can lazy-load
          fetchGroupDetails();
        }
      } else {
        setName('');
        setSelectedCategories([]);
      }
      setErrors({});
    }
  }, [open, editGroup]);

  const fetchGroupDetails = useCallback(async () => {
    if (!editGroup?.id || !db) return;
    try {
      const { default: axios } = await import('src/utils/axios');
      const res = await axios.get(`/api/groups/${editGroup.id}`, { params: { db } });
      if (res.data?.data?.items) {
        setSelectedCategories(
          res.data.data.items.map(item => ({
            id: item.category_id,
            name: item.category_name,
          }))
        );
      }
    } catch (e) { /* ignore — will show empty */ }
  }, [editGroup, db]);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Il nome è obbligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        db,
        items: selectedCategories.map(c => ({ category_id: c.id })),
      };

      if (editGroup) {
        await updateGroup(editGroup.id, payload);
        enqueueSnackbar('Gruppo aggiornato con successo', { variant: 'success' });
      } else {
        await createGroup(payload);
        enqueueSnackbar('Gruppo creato con successo', { variant: 'success' });
      }
      onClose(true);
    } catch (error) {
      const msg = error.response?.data?.error || 'Errore durante il salvataggio';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }));

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editGroup ? `Modifica ${editGroup.name}` : 'Nuovo Gruppo'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Nome gruppo"
          value={name}
          onChange={e => setName(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          sx={{ mt: 1, mb: 3 }}
        />

        <Autocomplete
          multiple
          options={categoryOptions}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedCategories}
          onChange={(_, newValue) => setSelectedCategories(newValue)}
          loading={categoriesLoading}
          loadingText="Caricamento categorie..."
          noOptionsText="Nessuna categoria trovata"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categorie"
              placeholder="Seleziona categorie..."
            />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...rest } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={option.name}
                  size="small"
                  variant="soft"
                  {...rest}
                />
              );
            })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Annulla</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {editGroup ? 'Aggiorna' : 'Crea'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GroupCreateEditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editGroup: PropTypes.object,
  db: PropTypes.string.isRequired,
};
