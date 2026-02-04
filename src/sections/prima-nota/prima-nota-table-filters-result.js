import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import Iconify from '../../components/iconify';

// ----------------------------------------------------------------------

export default function PrimaNotaTableFiltersResult({
  filters,
  onFilters,
  //
  onResetFilters,
  //
  results,
  publishOptions,
  ownersOptions,
  categoriesOptions,
  subjectsOptions = [],
  detailsOptions = [],
  ...other
}) {
  const handleRemoveStatus = (inputValue) => {
    const newValue = filters.status.filter((item) => item !== inputValue);
    onFilters('status', newValue);
  };

  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          Risultati trovati
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!(filters.status?.length) && (
          <Block label="Stato:">
            {filters.status.map((item) => (
              <Chip
                key={item}
                label={publishOptions?.find((i) => i.value === item)?.label || item}
                size="small"
                onDelete={() => handleRemoveStatus(item)}
              />
            ))}
          </Block>
        )}

        {!!(filters.owner?.length) && (
          <Block label="Conto corrente:">
            {filters.owner.map((item) => (
              <Chip
                key={item}
                label={ownersOptions?.find((i) => i.id === item)?.name || item}
                size="small"
              // onDelete={() => handleRemoveStatus(item)}
              />
            ))}
          </Block>
        )}

        {!!(filters.categories?.length) && (
          <Block label="Categoria:">
            {filters.categories.map((item) => (
              <Chip
                key={item}
                label={categoriesOptions?.find((i) => i.id === item)?.name || item}
                size="small"
              // onDelete={() => handleRemoveStatus(item)}
              />
            ))}
          </Block>
        )}

        {!!(filters.subjects?.length) && (
          <Block label="Soggetto:">
            {filters.subjects.map((item) => (
              <Chip
                key={item}
                label={subjectsOptions?.find((i) => i.id === item)?.name || item}
                size="small"
              />
            ))}
          </Block>
        )}

        {!!(filters.details?.length) && (
          <Block label="Dettaglio:">
            {filters.details.map((item) => (
              <Chip
                key={item}
                label={detailsOptions?.find((i) => i.id === item)?.name || item}
                size="small"
              />
            ))}
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Annulla
        </Button>
      </Stack>
    </Stack>
  );
}

PrimaNotaTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
  publishOptions: PropTypes.object,
  ownersOptions: PropTypes.object,
  categoriesOptions: PropTypes.object,
  subjectsOptions: PropTypes.array,
  detailsOptions: PropTypes.array,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
};
