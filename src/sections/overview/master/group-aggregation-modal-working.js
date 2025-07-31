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
import MasterTransaction from './master-transaction';
import { fCurrencyEur } from '../../../utils/format-number';
import CategoryDetailsModal from './category-details-modal';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

export default function GroupAggregationModalWorking({ 
  open, 
  onClose, 
  data, 
  categories = [], 
  loading, 
  error,
  settings 
}) {
  const [currentTab, setCurrentTab] = useState('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryDetailModal, setCategoryDetailModal] = useState({
    open: false,
    categoryData: null,
    categoryName: null,
    categoryId: null
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCategoryClick = (categoryData) => {
    setCategoryDetailModal({
      open: true,
      categoryData,
      categoryName: categoryData.name,
      categoryId: categoryData.id
    });
  };

  const handleCloseCategoryDetail = () => {
    setCategoryDetailModal({
      open: false,
      categoryData: null,
      categoryName: null,
      categoryId: null
    });
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
                    {formatCurrency(stats.totalTransactions > 0 ? stats.totalExpenses / 12 : 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Spesa Media Mensile
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

        {/* Periodo */}
        <Card>
          <CardHeader title="Periodo" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Dal:
                  </Typography>
                  <Typography variant="body2">
                    {stats.dateRange.from ? new Date(stats.dateRange.from).toLocaleDateString('it-IT') : 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Al:
                  </Typography>
                  <Typography variant="body2">
                    {stats.dateRange.to ? new Date(stats.dateRange.to).toLocaleDateString('it-IT') : 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

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
      
      // Prepara diverse rappresentazioni dell'importo per supportare sia virgola che punto
      const amountWithComma = amount.replace('.', ','); // Converte 123.45 in 123,45
      const amountFormatted = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(Math.abs(parseFloat(transaction.amount) || 0)).toLowerCase(); // Formato completo con €
      
      const categoryName = (transaction.categoryname || '').toLowerCase();
      const subjectName = (transaction.subjectname || '').toLowerCase();
      const detailName = (transaction.detailname || '').toLowerCase();
      const ownerName = (transaction.ownername || '').toLowerCase();
      
      return description.includes(searchTerm) || 
             amount.includes(searchTerm) ||
             amountWithComma.includes(searchTerm) ||
             amountFormatted.includes(searchTerm) ||
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

  const renderAnalysis = () => {
    if (!data?.stats) return null;

    // Trasforma i dati del breakdown delle categorie per MasterTransaction
    const getCategorySummary = () => {
      if (!data.stats.categoryBreakdown) return [];

      return data.stats.categoryBreakdown.map((category) => ({
        id: category.id,
        category: category.name,
        income: formatNumber(category.income),
        expense: formatNumber(category.expenses), 
        difference: formatNumber(category.income - category.expenses),
        averageCost: formatNumber(category.count > 0 ? category.expenses / category.count : 0),
        totalExpense: formatNumber(category.expenses),
      }));
    };

    // Prepara i dati per il grafico (usando gli stessi dati del breakdown)
    const getChartData = () => {
      if (!data.stats.categoryBreakdown) return [];

      return [
        {
          name: 'Entrate',
          data: data.stats.categoryBreakdown.map(cat => formatNumber(cat.income)),
        },
        {
          name: 'Uscite', 
          data: data.stats.categoryBreakdown.map(cat => formatNumber(cat.expenses)),
        },
      ];
    };

    const getChartCategories = () => {
      if (!data.stats.categoryBreakdown) return [];
      return data.stats.categoryBreakdown.map(cat => cat.name);
    };

    return (
      <Stack spacing={3}>
        {/* Tabella Riepilogo per Categorie */}
        <MasterTransaction
          title="Riepilogo per Categorie"
          tableData={getCategorySummary()}
          tableLabels={[
            { id: 'category', label: 'Categoria' },
            { id: 'income', label: 'Entrate', align: 'right' },
            { id: 'expense', label: 'Uscite', align: 'right' },
            { id: 'averageCost', label: 'Media per Transazione', align: 'right' },
            { id: 'totalExpense', label: 'Totale Uscite', align: 'right' },
            { id: 'difference', label: 'Differenza', align: 'right' },
          ]}
          handleViewRow={(categoryId) => {
            const categoryData = data.stats.categoryBreakdown.find(cat => cat.id === categoryId);
            if (categoryData) {
              handleCategoryClick(categoryData);
            }
          }}
        />

        {/* Grafico */}
        {data.stats.categoryBreakdown && data.stats.categoryBreakdown.length > 0 && (
          <ChartColumnMultiple
            title="Entrate/Uscite per Categoria"
            categories={getChartCategories()}
            series={getChartData()}
          />
        )}
      </Stack>
    );
  };

  return (
    <>
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
                <Tab label="Analisi" value="analysis" />
                <Tab label="Transazioni" value="transactions" />
              </Tabs>
              
              <Box sx={{ p: 3, height: 'calc(100% - 48px)', overflow: 'auto' }}>
                {currentTab === 'overview' && renderOverview()}
                {currentTab === 'analysis' && renderAnalysis()}
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

      {/* Modal Dettagli Categoria - Componente separato */}
      <CategoryDetailsModal
        open={categoryDetailModal.open}
        onClose={handleCloseCategoryDetail}
        categoryId={categoryDetailModal.categoryId}
        categoryName={categoryDetailModal.categoryName}
        settings={settings}
      />
    </>
  );
}

GroupAggregationModalWorking.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.object,
  categories: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  settings: PropTypes.object,
};
