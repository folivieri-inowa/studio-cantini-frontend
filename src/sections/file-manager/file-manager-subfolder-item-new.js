import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import FileThumbnail from 'src/components/file-thumbnail';

// ----------------------------------------------------------------------

export default function FileManagerSubfolderItem({ subfolder, onOpen, sx }) {
  // Estrazione più robusta delle proprietà con valori di default
  const { name, type } = subfolder;
  
  // Conteggio file e cartelle con controlli di sicurezza
  const fileCount = subfolder.files?.length || subfolder.fileCount || 0;
  const subfolderCount = subfolder.subfolder?.length || subfolder.subfolderCount || 0;
  
  // Logging per debug
  console.log(`Rendering subfolder: ${name}, files:`, fileCount, ', subfolders:', subfolderCount);
  
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
        <FileThumbnail
          file={type || 'folder'}
          sx={{
            width: 36,
            height: 36,
            color: 'primary.main',
            mb: 2.5,
          }}
        />

        <Typography variant="subtitle2" noWrap>
          {name}
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
