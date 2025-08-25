'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import DetailsQuickView from '../details-quick-view';
import { useBoolean } from '../../../../hooks/use-boolean';
import axios, { endpoints } from '../../../../utils/axios';
import { useGetReportCategory } from '../../../../api/report';
import { capitalizeCase } from '../../../../utils/change-case';
import { useSettingsContext } from '../../../../components/settings';
import CategoryAverageExpenseSubject from '../category-average-expense-subject';
import EcommerceMultiYearSales from '../../e-commerce/ecommerce-multi-year-sales';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

export default function CategoryDetailsView({ categoryId }) {
  const [detailsData, setDetailsData] = useState(null);
  const quickView = useBoolean();
  const settings = useSettingsContext();

  const ownerId = settings.owner ? settings.owner.id : null;
  const { year } = settings;

  const { reportCategory, reportCategoryLoading } = useGetReportCategory(categoryId, ownerId, year, settings.db);

  if (reportCategoryLoading) {return null}

  const getSubjectDetails = async (props) => {
    const response = await axios.post(endpoints.report.category.subject.details, props);
    if (response && response.data) {
      setDetailsData(response.data);
      quickView.onTrue();
    }
  }

  const getChartData = (monthlyTotals, currentYear, previousYear) => {
    if (!monthlyTotals) return [];

    const currentYearIncome = Array(12).fill(0);
    const currentYearExpense = Array(12).fill(0);
    const previousYearIncome = Array(12).fill(0);
    const previousYearExpense = Array(12).fill(0);

    Object.entries(monthlyTotals).forEach(([month, data]) => {
      const monthIndex = parseInt(month, 10) - 1; // Convert to 0-based index
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

  // La funzione getYearlySalesData è stata rimossa perché ora utilizziamo getChartData
  // per uniformare la rappresentazione dei dati in tutti i grafici
  
  // Funzione per adattare i dati di getChartData al formato richiesto da EcommerceMultiYearSales
  const adaptChartDataForMultiYear = (chartData, currentYear, previousYear) => {
    if (!chartData || chartData.length === 0) return { categories: [], series: [] };
    
    // Separare i dati per anno
    const currentYearData = chartData.filter(item => 
      item.name.includes(`${currentYear}`)
    );
    
    const previousYearData = chartData.filter(item => 
      item.name.includes(`${previousYear}`)
    );
    
    // Create categories array (months)
    const categories = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    
    // Costruire le serie nel formato richiesto da EcommerceMultiYearSales
    const series = [];
    
    // Anno corrente
    if (currentYearData.length > 0) {
      series.push({
        year: currentYear.toString(),
        data: currentYearData
      });
    }
    
    // Anno precedente
    if (previousYearData.length > 0) {
      series.push({
        year: previousYear.toString(),
        data: previousYearData
      });
    }
    
    return { categories, series };
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack
        divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}
        spacing={3}
        sx={{ mb: 5 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Stack direction="column" spacing={3}>
            <Typography variant="h4" component="div">
              Report relativo alla categoria: &#34;{capitalizeCase(reportCategory.categoryName)}&#34;
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1" component="div">
                Dati relativi all&#39;anno {year},
              </Typography>
              <Typography variant="body1" component="div">
                conto di riferimento {reportCategory.owner.id === 'all-accounts' ? 'Tutti i conti' : `${capitalizeCase(reportCategory.owner.name)} | ${reportCategory.owner.cc}`}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={12}>
          <CategoryAverageExpenseSubject
            title="Riepilogo spese per soggetto"
            tableData={reportCategory} // Popoliamo la tabella con i dati API
            tableLabels={[
              { id: "expand", label: "" },
              { id: "subject", label: "Soggetto" },
              { id: "averageExpense", label: "Media spese mensile (€)", align: 'right' },
              { id: "totalExpense", label: "Uscite (€)", align: 'right'},
              { id: "totalIncome", label: "Entrate (€)", align: 'right'},
              { id: "difference", label: "Delta (€)", align: 'right'},
              { id: "actions", label: ""}
            ]}
            onViewRow={async (prop) => {
              await getSubjectDetails(prop)
            }}
          />

          <DetailsQuickView
            data={detailsData}
            open={quickView.value}
            onClose={quickView.onFalse}
          />
        </Grid>
        
        <Grid size={12}>
          <Stack direction='column' spacing={3}>
            <Grid size={12}>
              <ChartColumnMultiple
                title="Entrate/Uscite per anno confrontate con l'anno precedente"
                categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                series={getChartData(reportCategory.monthlyTotals, year, year - 1)}
                colors={['#00C853', '#FF3D00', '#2196F3', '#FFEB3B']}
              />
            </Grid>

            <Grid size={12} sx={{ mt: 3 }}>
              <EcommerceMultiYearSales
                title="Andamento annuale entrate/uscite"
                subheader="Confronto dettagliato entrate e uscite per anno"
                chart={{
                  colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
                  ...adaptChartDataForMultiYear(
                    getChartData(reportCategory.monthlyTotals, year, year - 1),
                    year,
                    year - 1
                  ),
                }}
              />
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

CategoryDetailsView.propTypes = {
  categoryId: PropTypes.string
}
