'use client';

import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from '../../../components/iconify';
import { fCurrencyEur } from '../../../utils/format-number';

export default function GroupAggregationModalWorking({ 
  open, 
  onClose, 
  data, 
  categories = [], 
  loading, 
  error 
}) {
  const [currentTab, setCurrentTab] = useState('overview');
  const [searchFilter, setSearchFilter] = useState('');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Funzione per formattare le valute in stile europeo e gestire valori null/undefined
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return fCurrencyEur(0);
    }
    return fCurrencyEur(value);
  };

  // Funzione per gestire valori numerici null/undefined (per contatori, etc.)
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    return value;
  };

  const renderOverview = () => {
    if (!data?.stats) return null;

    const { stats } = data;

    return (
      <Stack spacing={3}>
        {/* Statistiche Generali */}
        <Card>
          <CardHeader 
            title="Statistiche Generali" 
            subheader={`Gruppo: ${data.groupName || 'Senza nome'}`}
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h4" color="primary">
                    {formatNumber(stats.totalTransactions)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transazioni Totali
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(stats.totalIncome)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entrate Totali
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(stats.totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uscite Totali
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Stack spacing={1} alignItems="center">
                  <Typography 
                    variant="h4" 
                    color={formatNumber(stats.totalAmount) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(stats.totalAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Netto
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Periodo e Media */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Periodo" />
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Dal:
                    </Typography>
                    <Typography variant="body2">
                      {stats.dateRange.from ? new Date(stats.dateRange.from).toLocaleDateString('it-IT') : 'N/A'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Al:
                    </Typography>
                    <Typography variant="body2">
                      {stats.dateRange.to ? new Date(stats.dateRange.to).toLocaleDateString('it-IT') : 'N/A'}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="Media per Transazione" />
              <CardContent>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h5" color="info.main">
                    {formatCurrency(stats.averageAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Importo Medio
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Selezione */}
        <Card>
          <CardHeader title="Filtri Applicati" />
          <CardContent>
            <Stack spacing={2}>
              {data.selectedCategoriesWithNames && data.selectedCategoriesWithNames.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Categorie Selezionate:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {data.selectedCategoriesWithNames.map((category) => (
                      <Chip 
                        key={category.id} 
                        label={category.name} 
                        variant="outlined" 
                        color="primary" 
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              {data.selectedSubjectsWithNames && data.selectedSubjectsWithNames.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Soggetti Selezionati:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {data.selectedSubjectsWithNames.map((subject) => (
                      <Chip 
                        key={subject.id} 
                        label={subject.name} 
                        variant="outlined" 
                        color="secondary" 
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              {data.selectedDetailsWithNames && data.selectedDetailsWithNames.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Dettagli Selezionati:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {data.selectedDetailsWithNames.map((detail) => (
                      <Chip 
                        key={detail.id} 
                        label={detail.name} 
                        variant="outlined" 
                        color="info" 
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  };

  const renderCategoriesBreakdown = () => {
    if (!data?.stats?.categoryBreakdown) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Categoria</TableCell>
              <TableCell align="right">Transazioni</TableCell>
              <TableCell align="right">Entrate</TableCell>
              <TableCell align="right">Uscite</TableCell>
              <TableCell align="right">Totale</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.stats.categoryBreakdown.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {category.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label={formatNumber(category.count)} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(category.income)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(category.expenses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={formatNumber(category.total) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(category.total)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSubjectsBreakdown = () => {
    if (!data?.stats?.subjectBreakdown || data.stats.subjectBreakdown.length === 0) {
      return (
        <Alert severity="info">
          Nessun soggetto trovato per i filtri selezionati.
        </Alert>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Soggetto</TableCell>
              <TableCell align="right">Transazioni</TableCell>
              <TableCell align="right">Entrate</TableCell>
              <TableCell align="right">Uscite</TableCell>
              <TableCell align="right">Totale</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.stats.subjectBreakdown.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {subject.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label={formatNumber(subject.count)} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(subject.income)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(subject.expenses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={formatNumber(subject.total) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(subject.total)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderOwnersBreakdown = () => {
    if (!data?.stats?.ownerBreakdown) return null;

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Proprietario</TableCell>
              <TableCell align="right">Transazioni</TableCell>
              <TableCell align="right">Entrate</TableCell>
              <TableCell align="right">Uscite</TableCell>
              <TableCell align="right">Totale</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.stats.ownerBreakdown.map((owner) => (
              <TableRow key={owner.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {owner.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label={formatNumber(owner.count)} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(owner.income)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(owner.expenses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={formatNumber(owner.total) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(owner.total)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDetailsBreakdown = () => {
    if (!data?.stats?.detailBreakdown || data.stats.detailBreakdown.length === 0) {
      return (
        <Alert severity="info">
          Nessun dettaglio disponibile per la selezione corrente.
        </Alert>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dettaglio</TableCell>
              <TableCell align="right">Transazioni</TableCell>
              <TableCell align="right">Entrate</TableCell>
              <TableCell align="right">Uscite</TableCell>
              <TableCell align="right">Totale</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.stats.detailBreakdown.map((detail) => (
              <TableRow key={detail.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {detail.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip label={formatNumber(detail.count)} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(detail.income)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error.main">
                    {formatCurrency(detail.expenses)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={formatNumber(detail.total) >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(detail.total)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTransactions = () => {
    if (!data?.transactions || data.transactions.length === 0) {
      return (
        <Alert severity="info">
          Nessuna transazione trovata per i filtri selezionati.
        </Alert>
      );
    }

    // Filtra le transazioni in base alla ricerca
    const filteredTransactions = data.transactions.filter((transaction) => {
      const searchTerm = searchFilter.toLowerCase();
      const description = (transaction.description || '').toLowerCase();
      const amount = Math.abs(parseFloat(transaction.amount) || 0).toString();
      const categoryName = (transaction.categoryname || '').toLowerCase();
      const subjectName = (transaction.subjectname || '').toLowerCase();
      const detailName = (transaction.detailname || '').toLowerCase();
      const ownerName = (transaction.ownername || '').toLowerCase();
      
      return description.includes(searchTerm) || 
             amount.includes(searchTerm) ||
             categoryName.includes(searchTerm) ||
             subjectName.includes(searchTerm) ||
             detailName.includes(searchTerm) ||
             ownerName.includes(searchTerm);
    });

    return (
      <Stack spacing={2}>
        {/* Campo di ricerca */}
        <TextField
          fullWidth
          size="small"
          placeholder="Cerca per descrizione, importo, categoria, soggetto..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Iconify icon="eva:search-fill" width={20} height={20} />
              </Box>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        <Typography variant="body2" color="text.secondary">
          Visualizzate {Math.min(filteredTransactions.length, 100)} transazioni 
          {searchFilter && ` (filtrate da ${data.transactions.length})`} 
          {` di ${data.stats.totalTransactions} totali`}
        </Typography>
        
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Soggetto</TableCell>
                <TableCell>Dettaglio</TableCell>
                <TableCell>Proprietario</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell align="right">Importo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.slice(0, 100).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(transaction.date).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.categoryname}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.subjectname || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.detailname || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {transaction.ownername}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                      {transaction.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color={parseFloat(transaction.amount) >= 0 ? "success.main" : "error.main"}
                    >
                      {formatCurrency(parseFloat(transaction.amount))}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Risultati Aggregazione Categorie
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ p: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Elaborazione dati in corso...
            </Typography>
          </Stack>
        )}
        
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Errore: {error}
            </Alert>
          </Box>
        )}
        
        {data && !loading && (
          <Box sx={{ height: '100%' }}>
            <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
              <Tab label="Panoramica" value="overview" />
              <Tab label="Per Categoria" value="categories" />
              <Tab label="Per Soggetto" value="subjects" />
              <Tab label="Per Proprietario" value="owners" />
              <Tab label="Dettagli" value="details" />
              <Tab label="Transazioni" value="transactions" />
            </Tabs>
            
            <Box sx={{ p: 3, height: 'calc(100% - 48px)', overflow: 'auto' }}>
              {currentTab === 'overview' && renderOverview()}
              {currentTab === 'categories' && renderCategoriesBreakdown()}
              {currentTab === 'subjects' && renderSubjectsBreakdown()}
              {currentTab === 'owners' && renderOwnersBreakdown()}
              {currentTab === 'details' && renderDetailsBreakdown()}
              {currentTab === 'transactions' && renderTransactions()}
            </Box>
          </Box>
        )}
        
        {!loading && !error && !data && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">
              Nessun dato disponibile per la visualizzazione
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GroupAggregationModalWorking.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.object,
  categories: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
