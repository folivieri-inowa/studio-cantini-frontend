'use client';

import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { fileFormat } from 'src/components/file-thumbnail';
import { useSettingsContext } from 'src/components/settings';
import { useTable, getComparator } from 'src/components/table';

import FileManagerGridView from '../file-manager-grid-view';
import { useGetFileManager } from '../../../api/file-manager';
import FileManagerFiltersResult from '../file-manager-filters-result';
// ----------------------------------------------------------------------

const defaultFilters = {
  name: '',
  type: [],
};

// ----------------------------------------------------------------------

export default function FileManagerView() {
  const table = useTable({ defaultRowsPerPage: 10 });
  const { db } = useSettingsContext();

  const { fileManager } = useGetFileManager(db)

  if (fileManager) {
    console.log("fileManager", fileManager);
  }

  const settings = useSettingsContext();

  const openDateRange = useBoolean();

  const upload = useBoolean();

  const [tableData, setTableData] = useState(fileManager);

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters
  });
   const dataInPage = dataFiltered.slice(
     table.page * table.rowsPerPage,
     table.page * table.rowsPerPage + table.rowsPerPage
   );

   const canReset =
     !!filters.name || !!filters.type.length || (!!filters.startDate && !!filters.endDate);

   const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

   const handleFilters = useCallback(
     (name, value) => {
       table.onResetPage();
       setFilters((prevState) => ({
         ...prevState,
         [name]: value,
       }));
     },
     [table]
   );

   const handleResetFilters = useCallback(() => {
     setFilters(defaultFilters);
   }, []);

  const renderFilters = (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-end', md: 'center' }}
    >
      {/* <FileManagerFilters
        openDateRange={openDateRange.value}
        onCloseDateRange={openDateRange.onFalse}
        onOpenDateRange={openDateRange.onTrue}
        //
        filters={filters}
        onFilters={handleFilters}
        //
        dateError={dateError}
        typeOptions={FILE_TYPE_OPTIONS}
      /> */}
    </Stack>
  );

  const renderResults = (
    <FileManagerFiltersResult
      filters={filters}
      // onResetFilters={handleResetFilters}
      //
      // canReset={canReset}
      // onFilters={handleFilters}
      //
      // results={dataFiltered.length}
    />
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Archivio File</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            onClick={upload.onTrue}
          >
            Carica File
          </Button>
        </Stack>

        <Stack
          spacing={2.5}
          sx={{
            my: { xs: 3, md: 5 },
          }}
        >
          {renderFilters}

          {canReset && renderResults}
        </Stack>

        {notFound ? (
          <EmptyContent
            filled
            title="No Data"
            sx={{
              py: 10,
            }}
          />
        ) : (
          <FileManagerGridView
            fileManager={fileManager}
            table={table}
            data={tableData}
            dataFiltered={dataFiltered}
          />
        )}
      </Container>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, type } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (file) => file.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type.length) {
    inputData = inputData.filter((file) => type.includes(fileFormat(file.type)));
  }

  return inputData;
}
