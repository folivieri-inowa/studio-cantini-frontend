'use client';

import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from '../../../components/iconify';
import { capitalizeCase } from '../../../utils/change-case';
import { useGetCategoryDetails } from '../../../api/category-details';
import DetailsQuickView from '../category/details-quick-view';
import DetailsTransactionsQuickView from '../category/details-transactions-quick-view';
import EcommerceMultiYearSales from '../e-commerce/ecommerce-multi-year-sales';
import CategoryDetailsSubjectTable from './category-details-subject-table';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

export default function CategoryDetailsModal({ 
  open, 
  onClose, 
  categoryId,
  categoryName,
  settings
}) {
  // Stato per gestire le modal dei dettagli
  const [detailsQuickView, setDetailsQuickView] = useState({
    open: false,
    data: null
  });
  
  const [transactionsQuickView, setTransactionsQuickView] = useState({
    open: false,
    data: null
  });

  // Usa l'hook per recuperare i dati delle categorie
  const { categoryDetails, categoryDetailsLoading, categoryDetailsError } = useGetCategoryDetails(
    open ? categoryId : null,
    open ? settings : null
  );

  const loading = categoryDetailsLoading;
  const error = categoryDetailsError?.message || null;
  const reportData = categoryDetails;

  const getChartData = (monthlyTotals, currentYear, previousYear) => {
    if (!monthlyTotals) return [];

    const currentYearIncome = Array(12).fill(0);
    const currentYearExpense = Array(12).fill(0);
    const previousYearIncome = Array(12).fill(0);
    const previousYearExpense = Array(12).fill(0);

    Object.entries(monthlyTotals).forEach(([month, data]) => {
      const monthIndex = parseInt(month, 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        currentYearIncome[monthIndex] = parseFloat(data.income.toFixed(2));
        currentYearExpense[monthIndex] = parseFloat(data.expense.toFixed(2));
        previousYearIncome[monthIndex] = parseFloat(data.prevIncome.toFixed(2));
        previousYearExpense[monthIndex] = parseFloat(data.prevExpense.toFixed(2));
      }
    });

    return [
      {
        name: `Entrate ${currentYear}`,
        data: currentYearIncome,
      },
      {
        name: `Uscite ${currentYear}`,
        data: currentYearExpense,
      },
      {
        name: `Entrate ${previousYear}`,
        data: previousYearIncome,
      },
      {
        name: `Uscite ${previousYear}`,
        data: previousYearExpense,
      },
    ];
  };

  const adaptChartDataForMultiYear = (chartData, currentYear, previousYear) => {
    if (!chartData || chartData.length === 0) return { categories: [], series: [] };
    
    const currentYearData = chartData.filter(item => 
      item.name.includes(`${currentYear}`)
    );
    
    const previousYearData = chartData.filter(item => 
      item.name.includes(`${previousYear}`)
    );
    
    const categories = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    
    const series = [];
    
    if (currentYearData.length > 0) {
      series.push({
        year: currentYear.toString(),
        data: currentYearData
      });
    }
    
    if (previousYearData.length > 0) {
      series.push({
        year: previousYear.toString(),
        data: previousYearData
      });
    }
    
    return { categories, series };
  };

  const handleViewSubjectDetails = async (subjectData) => {
    // L'icona "occhio" del soggetto dovrebbe aprire il modal delle transazioni
    // Non il modal dei dettagli, perché non abbiamo un dettaglio specifico
    console.log('handleViewSubjectDetails chiamato con dati:', subjectData);
    console.log('Reindirizzando verso il modal delle transazioni');
    
    // Reindirizza verso il modal delle transazioni
    setTransactionsQuickView({
      open: true,
      data: subjectData
    });
  };

  const handleViewDetails = async (detailsData) => {
    // Apre la modal delle transazioni per il dettaglio specifico
    console.log('handleViewDetails chiamato con dati:', detailsData);
    console.log('Struttura detailsData:', Object.keys(detailsData || {}));
    
    setTransactionsQuickView({
      open: true,
      data: detailsData
    });
  };

  const handleCloseDetailsQuickView = () => {
    setDetailsQuickView({
      open: false,
      data: null
    });
  };

  const handleCloseTransactionsQuickView = () => {
    setTransactionsQuickView({
      open: false,
      data: null
    });
  };

  const currentYear = settings?.year || new Date().getFullYear();
  const previousYear = currentYear - 1;

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
            Dettagli Categoria: {capitalizeCase(reportData?.categoryName || categoryName || 'Categoria')}
          </Typography>
          <Button onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </Button>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ p: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Caricamento dettagli categoria...
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
        
        {reportData && !loading && (
          <Stack spacing={3}>
            {/* Informazioni Categoria */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" component="div">
                    Report relativo alla categoria: &quot;{capitalizeCase(reportData?.categoryName || categoryName || 'Categoria')}&quot;
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" component="div">
                      Dati relativi all&apos;anno {currentYear},
                    </Typography>
                    <Typography variant="body2" component="div">
                      conto di riferimento {settings?.owner?.id === 'all-accounts' ? 'Tutti i conti' : `${capitalizeCase(settings?.owner?.name || 'Conto')}`}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabella Riepilogo Soggetti */}
            {reportData && reportData.averageMonthlyCosts && reportData.averageMonthlyCosts.length > 0 && (
              <CategoryDetailsSubjectTable
                title="Riepilogo spese per soggetto"
                tableData={reportData}
                tableLabels={[
                  { id: "expand", label: "" },
                  { id: "subject", label: "Soggetto" },
                  { id: "averageExpense", label: "Media spese mensile (€)", align: 'right' },
                  { id: "totalExpense", label: "Uscite (€)", align: 'right'},
                  { id: "totalIncome", label: "Entrate (€)", align: 'right'},
                  { id: "difference", label: "Delta (€)", align: 'right'},
                  { id: "actions", label: ""}
                ]}
                onViewRow={handleViewSubjectDetails}
                onViewDetails={handleViewDetails}
                categoryId={categoryId}
                settings={settings}
              />
            )}

            {/* Grafici */}
            {reportData && reportData.monthlyTotals && (
              <Grid container spacing={3}>
                <Grid size={12}>
                  <ChartColumnMultiple
                    title="Entrate/Uscite per anno confrontate con l'anno precedente"
                    categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                    series={getChartData(reportData.monthlyTotals, currentYear, previousYear)}
                    colors={['#00C853', '#FF3D00', '#2196F3', '#FFEB3B']}
                  />
                </Grid>

                <Grid size={12}>
                  <EcommerceMultiYearSales
                    title="Andamento annuale entrate/uscite"
                    subheader="Confronto dettagliato entrate e uscite per anno"
                    chart={{
                      colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
                      ...adaptChartDataForMultiYear(
                        getChartData(reportData.monthlyTotals, currentYear, previousYear),
                        currentYear,
                        previousYear
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>

    {/* Modal per i dettagli del soggetto */}
    <DetailsQuickView
      data={detailsQuickView.data}
      open={detailsQuickView.open}
      onClose={handleCloseDetailsQuickView}
    />

    {/* Modal per le transazioni del dettaglio */}
    <DetailsTransactionsQuickView
      data={transactionsQuickView.data}
      open={transactionsQuickView.open}
      onClose={handleCloseTransactionsQuickView}
    />
  </>
  );
}

CategoryDetailsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  categoryId: PropTypes.string,
  categoryName: PropTypes.string,
  settings: PropTypes.object,
};
