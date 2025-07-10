'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Chip,
  Alert,
  Table,
  Button,
  Dialog,
  Switch,
  Tooltip,
  Snackbar,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function DatabaseManagement() {
  const { user } = useAuthContext();
  
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDb, setEditingDb] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const [formData, setFormData] = useState({
    db_key: '',
    db_name: '',
    description: '',
    is_active: true,
  });

  const backendUrl = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';

  // Carica i database
  const fetchDatabases = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/v1/databases/all`, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDatabases(data.databases);
      } else {
        showSnackbar('Errore nel caricamento dei database', 'error');
      }
    } catch (error) {
      console.error('Errore nel caricamento dei database:', error);
      showSnackbar('Errore di connessione al server', 'error');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, user?.accessToken, showSnackbar]);

  useEffect(() => {
    if (user?.accessToken) {
      fetchDatabases();
    }
  }, [user, fetchDatabases]);

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleOpenDialog = (database = null) => {
    if (database) {
      setEditingDb(database);
      setFormData({
        db_key: database.db_key,
        db_name: database.db_name,
        description: database.description || '',
        is_active: database.is_active,
      });
    } else {
      setEditingDb(null);
      setFormData({
        db_key: '',
        db_name: '',
        description: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDb(null);
    setFormData({
      db_key: '',
      db_name: '',
      description: '',
      is_active: true,
    });
  };

  const handleSaveDatabase = async () => {
    try {
      const url = editingDb 
        ? `${backendUrl}/v1/databases/update/${editingDb.id}`
        : `${backendUrl}/v1/databases/create`;
        
      const method = editingDb ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSnackbar(
          editingDb ? 'Database aggiornato con successo' : 'Database creato con successo',
          'success'
        );
        handleCloseDialog();
        fetchDatabases();
      } else {
        showSnackbar(data.message || 'Errore nel salvataggio', 'error');
      }
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      showSnackbar('Errore di connessione al server', 'error');
    }
  };

  const handleDeleteDatabase = async (database) => {
    if (!window.confirm(`Sei sicuro di voler disattivare il database "${database.db_name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/v1/databases/delete/${database.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Database disattivato con successo', 'success');
        fetchDatabases();
      } else {
        showSnackbar(data.message || 'Errore nella disattivazione', 'error');
      }
    } catch (error) {
      console.error('Errore nella disattivazione:', error);
      showSnackbar('Errore di connessione al server', 'error');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Database</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuovo Database
        </Button>
      </Box>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Chiave</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Data Creazione</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              if (loading) {
                return (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Caricamento...
                    </TableCell>
                  </TableRow>
                );
              }
              
              if (databases.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nessun database trovato
                    </TableCell>
                  </TableRow>
                );
              }
              
              return databases.map((database) => (
                <TableRow key={database.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {database.db_key}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {database.db_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {database.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={database.is_active ? 'Attivo' : 'Inattivo'}
                      color={database.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(database.created_at).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Modifica">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(database)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Disattiva">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDatabase(database)}
                        disabled={!database.is_active}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog per creazione/modifica database */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDb ? 'Modifica Database' : 'Nuovo Database'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Chiave Database"
              value={formData.db_key}
              onChange={(e) => handleInputChange('db_key', e.target.value)}
              placeholder="es. db3, client_name"
              disabled={!!editingDb}
              helperText="Identificativo unico del database (non modificabile dopo la creazione)"
              fullWidth
            />
            <TextField
              label="Nome Database"
              value={formData.db_name}
              onChange={(e) => handleInputChange('db_name', e.target.value)}
              placeholder="es. Studio Rossi"
              fullWidth
            />
            <TextField
              label="Descrizione"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrizione opzionale del database"
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
              }
              label="Database attivo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleSaveDatabase} 
            variant="contained"
            disabled={!formData.db_key || !formData.db_name}
          >
            {editingDb ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
