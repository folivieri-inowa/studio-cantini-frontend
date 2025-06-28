import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';

// Utility functions for formatting
const fData = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / (1024 ** i)).toFixed(2)} ${units[i]}`;
};

// ----------------------------------------------------------------------

export default function FileManagerFolderItem({
  folder,
  sx,
  onOpen,
  ...other
}) {
  // Conteggio file e sottocartelle
  const fileCount = folder.files?.length || folder.fileCount || 0;
  const subfolderCount = folder.subfolder?.length || folder.subfolderCount || 0;

  // Logging per debug
  console.log(`Rendering folder: ${folder.name}, files:`, fileCount, ', subfolders:', subfolderCount);

  const renderIcon = <Box onClick={onOpen} component="img" src="/assets/icons/files/ic_folder.svg" sx={{ width: 36, height: 36 }} />

  const renderText = (
    <ListItemText
      onClick={onOpen}
      primary={folder.name}
      secondary={
        <>
          {fileCount > 0 && `${fileCount} file${fileCount > 1 ? 's' : ''}`}
          
          {fileCount > 0 && subfolderCount > 0 && (
            <Box
              component="span"
              sx={{
                mx: 0.75,
                width: 2,
                height: 2,
                borderRadius: '50%',
                bgcolor: 'currentColor',
              }}
            />
          )}
          
          {subfolderCount > 0 && `${subfolderCount} cartell${subfolderCount > 1 ? 'e' : 'a'}`}
          
          {fileCount === 0 && subfolderCount === 0 && 'Vuoto'}
        </>
      }
      slotProps={{
        primary: {
          noWrap: true,
          typography: 'subtitle1',
        },
        secondary: {
          mt: 0.5,
          component: 'span',
          alignItems: 'center',
          typography: 'caption',
          color: 'text.disabled',
          flexDirection: 'row',
          display: 'inline-flex',
        },
      }}
    />
  );

  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      alignItems="flex-start"
      sx={{
        p: 2.5,
        maxWidth: 222,
        borderRadius: 2,
        bgcolor: 'unset',
        cursor: 'pointer',
        position: 'relative',
        ...sx,
      }}
      onClick={onOpen}
      {...other}
    >
      <Box>
        {renderIcon}
      </Box>

      {renderText}
    </Stack>
  );
}

FileManagerFolderItem.propTypes = {
  folder: PropTypes.object,
  onOpen: PropTypes.func,
  sx: PropTypes.object,
};
