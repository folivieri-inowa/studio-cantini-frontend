'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useSettingsContext } from 'src/components/settings';

import DetailsQuickView from '../details-quick-view';
import GlobalWidgetSummary from '../global-widget-summary';
import { useBoolean } from '../../../../hooks/use-boolean';
import axios, { endpoints } from '../../../../utils/axios';
import CategorySummaryTable from '../category-summary-table';
import { useGetReportCategory } from '../../../../api/report';
import CategoryAverageExpenseSubject from '../category-average-expense-subject';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

export default function CategoryDetailsView({ categoryId }) {
  const [detailsData, setDetailsData] = useState(null);
  const quickView = useBoolean();
  const settings = useSettingsContext();

  const ownerId = settings.owner.id;
  const { year } = settings;

  const { reportCategory, reportCategoryLoading } = useGetReportCategory(categoryId, ownerId, year, settings.db);

  if (reportCategoryLoading) {return null}

  const calculatePercentageChange = (monthlyTotals) => {
    const currentMonth = new Date().getMonth() + 1; // Mese corrente (1-based)
    const currentIncome = monthlyTotals[currentMonth]?.income || 0;
    const prevIncome = monthlyTotals[currentMonth]?.prevIncome || 0;

    if (prevIncome === 0) return 0; // Evita divisioni per zero

    return ((currentIncome - prevIncome) / prevIncome) * 100;
  };

  const getGlobalIncome = (monthlyTotals) => Object.keys(monthlyTotals).map((month) => ({
      x: `Mese ${month}`,
      y: monthlyTotals[month].income,
    }));

  const getGlobalExpense = (monthlyTotals) => Object.keys(monthlyTotals).map((month) => ({
      x: `Mese ${month}`,
      y: monthlyTotals[month].expense,
    }));

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
              Report relativo alla categoria: &#34;{reportCategory.categoryName}&#34;
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1" component="div">
                Dati relativi all&#39;anno {year},
              </Typography>
              <Typography variant="body1" component="div">
                conto di riferimento {reportCategory.owner.name} | {reportCategory.owner.cc}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <GlobalWidgetSummary
              title="Entrate"
              icon="eva:diagonal-arrow-left-down-fill"
              percent={calculatePercentageChange(reportCategory.monthlyTotals)}
              total={reportCategory.totalIncome}
              chart={{ series: getGlobalIncome(reportCategory.monthlyTotals) }}
            />

            <GlobalWidgetSummary
              title="Uscite"
              color="warning"
              icon="eva:diagonal-arrow-right-up-fill"
              percent={calculatePercentageChange(reportCategory.monthlyTotals)}
              total={reportCategory.totalExpense}
              chart={{ series: getGlobalExpense(reportCategory.monthlyTotals) }}
            />
          </Stack>
        </Grid>
        <Grid size={12}>
          <Stack direction='column' spacing={3}>
            <Grid size={12}>
              <CategorySummaryTable
                title="Riepilogo dati per soggetto"
                tableData={reportCategory.summaryTable} // Popoliamo la tabella con i dati API
                tableLabels={[
                  { id: "subject", label: "Soggetto" },
                  { id: "income", label: "Entrate (€)" },
                  { id: "expense", label: "Uscite (€)" },
                  { id: "difference", label: "Delta (€)" }
                ]}
              />
            </Grid>

            <Grid size={12}>
              <ChartColumnMultiple
                title="Entrate/Uscite per anno confrontate con l'anno precedente"
                categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                series={getChartData(reportCategory.monthlyTotals, year, year - 1)}
              />
            </Grid>

            <Grid size={12}>
              <CategoryAverageExpenseSubject
                title="Media spese mensile e totale annuale per soggetto"
                tableData={reportCategory} // Popoliamo la tabella con i dati API
                tableLabels={[
                  { id: "", label: "" },
                  { id: "subject", label: "Soggetto" },
                  { id: "averageExpense", label: "Media spese mensile (€)", align: 'right' },
                  { id: "totalExpense", label: "Totale spesa annuale (€)", align: 'right'},
                  { id: "", label: ""}
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
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

CategoryDetailsView.propTypes = {
  categoryId: PropTypes.string
}
