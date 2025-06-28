import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

// ----------------------------------------------------------------------

export default function FileManagerEmptyFolder({ title = "Cartella senza nome", subtitle = "Vuoto", sx = {}, onOpen }) {
  // Componente icona cartella vuota
  const renderIcon = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        color: 'text.disabled',
        mb: 2.5
      }}
    >
      <Typography variant="h4">📂</Typography>
    </Box>
  );

  return (
    <Card
      sx={{
        opacity: 0.72,
        boxShadow: 0,
        bgcolor: 'background.default',
        border: (theme) => `solid 1px ${theme.palette.divider}`,
        ...sx,
      }}
    >
      <CardActionArea
        onClick={onOpen}
        sx={{
          p: 2.5,
          borderRadius: 2,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          color: 'text.disabled'
        }}
      >
        {renderIcon}
        <Typography
          noWrap
          variant="subtitle2"
          sx={{ width: 1, mb: 0.5, color: 'text.disabled' }}
        >
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {subtitle}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

FileManagerEmptyFolder.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  sx: PropTypes.object,
  onOpen: PropTypes.func,
};
