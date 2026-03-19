'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

import { paths } from '../../../../routes/paths';
import { useRouter } from '../../../../routes/hooks';
import DetailsQuickView from '../details-quick-view';
import { useBoolean } from '../../../../hooks/use-boolean';
import axios, { endpoints } from '../../../../utils/axios';
import { useGetReportCategory } from '../../../../api/report';
import { capitalizeCase } from '../../../../utils/change-case';
import { useSettingsContext } from '../../../../components/settings';
import CategoryChartToggle from '../category-chart-toggle';
import CategorySubjectTable from '../category-subject-table';
import MasterMonthlyTrendChart from '../../master/master-monthly-trend-chart';
import MonthBreakdownDialog from '../month-breakdown-dialog';

// ----------------------------------------------------------------------

export default function CategoryDetailsView({ categoryId }) {
  const [detailsData, setDetailsData] = useState(null);
  const quickView = useBoolean();
  const settings = useSettingsContext();
  const router = useRouter();

  const [exclusions, setExclusions] = useState([]);
  const [breakdownMonth, setBreakdownMonth] = useState(null);
  const breakdownDialog = useBoolean();

  const ownerId = settings.owner ? settings.owner.id : null;
  const { year } = settings;

  const searchParams = useSearchParams();
  const selectedMonth = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
  const compareYearsParam = searchParams.get('compareYears');
  const initShowIncome = searchParams.get('showIncome') !== 'false';
  const initShowExpense = searchParams.get('showExpense') !== 'false';

  const { reportCategory, reportCategoryLoading } = useGetReportCategory(categoryId, ownerId, year, settings.db, selectedMonth);

  if (reportCategoryLoading) {return null}

  const showPrevYear = compareYearsParam
    ? compareYearsParam.split(',').map(Number).includes(Number(reportCategory?.prevYear))
    : true;

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

  const monthlyExpenseTrendData = (() => {
    if (!reportCategory.monthlyTotals) return [];
    const data = Object.entries(reportCategory.monthlyTotals)
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([, d]) => parseFloat(d.expense.toFixed(2)));
    return [{ name: `Uscite ${year}`, data }];
  })();

  const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  // Recalculate monthlyTotals subtracting excluded items
  const getAdjustedExpenseData = (monthlyTotals, excls) => {
    if (!monthlyTotals || excls.length === 0) {
      // Same shape as monthlyExpenseTrendData
      const data = Object.entries(monthlyTotals)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
        .map(([, d]) => parseFloat(d.expense.toFixed(2)));
      return [{ name: `Uscite ${year}`, data }];
    }
    const adjusted = {};
    Object.entries(monthlyTotals).forEach(([m, d]) => {
      adjusted[m] = { ...d };
    });
    excls.forEach(exc => {
      if (adjusted[exc.month]) {
        adjusted[exc.month].expense = Math.max(0, adjusted[exc.month].expense - exc.amount);
      }
    });
    const data = Object.entries(adjusted)
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([, d]) => parseFloat(d.expense.toFixed(2)));
    return [{ name: `Uscite ${year}`, data }];
  };

  const adjustedExpenseData = getAdjustedExpenseData(reportCategory.monthlyTotals, exclusions);

  const handleBarClick = (monthIndex) => {
    setBreakdownMonth(monthIndex + 1); // convert 0-based to 1-based
    breakdownDialog.onTrue();
  };

  const handleToggleExclusion = (exc) => {
    setExclusions(prev => {
      const key = `${exc.subjectId}:${exc.detailId}:${exc.month}`;
      const exists = prev.find(e => `${e.subjectId}:${e.detailId}:${e.month}` === key);
      if (exists) {
        return prev.filter(e => `${e.subjectId}:${e.detailId}:${e.month}` !== key);
      }
      return [...prev, exc];
    });
  };

  const handleRemoveExclusion = (exc) => {
    const key = `${exc.subjectId}:${exc.detailId}:${exc.month}`;
    setExclusions(prev => prev.filter(e => `${e.subjectId}:${e.detailId}:${e.month}` !== key));
  };

  const handleResetExclusions = () => setExclusions([]);

  const handleChipClick = (exc) => {
    setBreakdownMonth(exc.month);
    breakdownDialog.onTrue();
  };

  // Monthly average from ORIGINAL data (not adjusted) — used for anomaly threshold
  const originalMonthlyAvg = (() => {
    if (!reportCategory.monthlyTotals) return 0;
    const values = Object.values(reportCategory.monthlyTotals)
      .map(d => parseFloat(d.expense))
      .filter(v => v > 0);
    return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  })();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack
        divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}
        spacing={3}
        sx={{ mb: 5 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Tooltip title="Torna alla dashboard">
            <IconButton onClick={() => router.push(paths.dashboard.root)}>
              <ArrowBackIosNewIcon />
            </IconButton>
          </Tooltip>
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
          <CategorySubjectTable
            reportCategory={reportCategory}
            selectedMonth={selectedMonth}
            showPrevYear={showPrevYear}
            initShowIncome={initShowIncome}
            initShowExpense={initShowExpense}
            db={settings.db}
            owner={settings.owner ? settings.owner.id : 'all-accounts'}
            year={settings.year}
            exclusions={exclusions}
            onViewRow={async (prop) => {
              await getSubjectDetails({ ...prop, db: settings.db, owner: settings.owner ? settings.owner.id : 'all-accounts', year: settings.year });
            }}
          />

          <DetailsQuickView
            data={detailsData}
            open={quickView.value}
            onClose={quickView.onFalse}
          />
        </Grid>

        <Grid size={12}>
          <MasterMonthlyTrendChart
            title="Andamento mensile uscite"
            subheader={`Media spese mensili — anno ${year}`}
            series={adjustedExpenseData}
            categories={MONTHS}
            colors={['#FF4842']}
            onBarClick={handleBarClick}
            exclusions={exclusions}
            onRemoveExclusion={handleRemoveExclusion}
            onResetExclusions={handleResetExclusions}
            onChipClick={handleChipClick}
          />
          <MonthBreakdownDialog
            open={breakdownDialog.value}
            onClose={breakdownDialog.onFalse}
            month={breakdownMonth}
            year={year}
            category={categoryId}
            db={settings.db}
            owner={settings.owner ? settings.owner.id : 'all-accounts'}
            exclusions={exclusions}
            onToggleExclusion={handleToggleExclusion}
            monthlyAvg={originalMonthlyAvg}
          />
        </Grid>

        <Grid size={12}>
          <CategoryChartToggle
            barSeries={getChartData(reportCategory.monthlyTotals, year, year - 1)}
            barCategories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
            barColors={['#00C853', '#FF3D00', '#2196F3', '#FFEB3B']}
            areaChart={{
              colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
              ...adaptChartDataForMultiYear(
                getChartData(reportCategory.monthlyTotals, year, year - 1),
                year,
                year - 1
              ),
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

CategoryDetailsView.propTypes = {
  categoryId: PropTypes.string
}
