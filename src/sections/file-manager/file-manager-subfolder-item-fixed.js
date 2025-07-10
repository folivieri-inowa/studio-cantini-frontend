import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

// Simple folder icon component
const FolderIcon = ({ sx = {} }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      color: 'primary.main',
      ...sx
    }}
  >
    <Typography variant="h4">📁</Typography>
  </Box>
);

FolderIcon.propTypes = {
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

export default function FileManagerSubfolderItem({ subfolder, onOpen, sx = {} }) {
  const { name, type, fileCount = 0, subfolderCount = 0 } = subfolder || {};
  
  return (
    <Card sx={{ ...sx }}>
      <CardActionArea
        onClick={onOpen}
        sx={{
          p: 2.5,
          borderRadius: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <FolderIcon
          sx={{
            mb: 2.5,
          }}
        />

        <Typography variant="subtitle2" noWrap>
          {name || 'Cartella senza nome'}
        </Typography>
        
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5 }}>
          {fileCount > 0 && `${fileCount} file${fileCount > 1 ? 's' : ''}`}
          {fileCount > 0 && subfolderCount > 0 && ', '}
          {subfolderCount > 0 && `${subfolderCount} cartell${subfolderCount > 1 ? 'e' : 'a'}`}
          {fileCount === 0 && subfolderCount === 0 && 'Vuoto'}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

FileManagerSubfolderItem.propTypes = {
  subfolder: PropTypes.object,
  onOpen: PropTypes.func,
  sx: PropTypes.object,
};
