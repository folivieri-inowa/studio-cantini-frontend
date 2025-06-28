import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

// Utility functions for formatting
const fData = (size) => {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

const fDate = (date) => {
  if (!date) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(date).toLocaleDateString('it-IT', options);
};

// Simple FileThumbnail component
const FileThumbnail = ({ file, sx = {} }) => {
  // Map file types to icons
  let icon = '📄'; // Default document
  
  if (file === 'pdf') icon = '📕';
  if (file === 'word' || file === 'doc' || file === 'docx') icon = '📘';
  if (file === 'excel' || file === 'xls' || file === 'xlsx' || file === 'csv') icon = '📊';
  if (file === 'image' || file === 'jpg' || file === 'png' || file === 'gif') icon = '🖼️';
  if (file === 'video') icon = '🎬';
  if (file === 'audio') icon = '🎵';
  if (file === 'zip') icon = '🗂️';
  if (file === 'folder') icon = '📁';
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        ...sx
      }}
    >
      <Typography variant="h4">{icon}</Typography>
    </Box>
  );
};

FileThumbnail.propTypes = {
  file: PropTypes.string,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

export default function FileManagerFileItem({ file, onOpen, sx = {} }) {
  const getFileType = (fileName) => {
    if (!fileName) return 'file';
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Mapping comuni di estensioni
    const fileTypeMap = {
      // Documenti
      pdf: 'pdf',
      doc: 'word',
      docx: 'word',
      txt: 'txt',
      rtf: 'rtf',
      
      // Fogli di calcolo
      xls: 'excel',
      xlsx: 'excel',
      csv: 'csv',
      
      // Immagini
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      svg: 'image',
      
      // Audio/Video
      mp3: 'audio',
      wav: 'audio',
      mp4: 'video',
      mov: 'video',
      avi: 'video',
      
      // Archivi
      zip: 'zip',
      rar: 'zip',
      tar: 'zip',
      '7z': 'zip',
      
      // Altri
      ppt: 'ppt',
      pptx: 'ppt',
    };
    
    return fileTypeMap[extension] || 'file';
  };

  const renderIcon = (
    <FileThumbnail 
      file={getFileType(file?.name)} 
      sx={{ width: 40, height: 40, mx: 'auto' }}
    />
  );

  const renderText = (
    <>
      <Typography
        noWrap
        variant="subtitle2"
        sx={{ width: 1, mt: 1.5, mb: 0.5 }}
      >
        {file?.name || 'File senza nome'}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        sx={{
          typography: 'caption',
          color: 'text.disabled',
          justifyContent: 'center',
          px: 1,
        }}
      >
        {file?.size ? (
          <>
            {fData(file.size)}
            {file.modifiedDate && (
              <>
                <Box
                  component="span"
                  sx={{
                    mx: 0.75,
                    width: 2,
                    height: 2,
                    flexShrink: 0,
                    borderRadius: '50%',
                    bgcolor: 'currentColor',
                  }}
                />
                {fDate(file.modifiedDate)}
              </>
            )}
          </>
        ) : (
          <Typography variant="caption">
            {file?.type?.toUpperCase() || 'FILE'}
          </Typography>
        )}
      </Stack>
    </>
  );

  return (
    <Card
      sx={{
        width: 1,
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
          bgcolor: 'unset',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {renderIcon}
        {renderText}
      </CardActionArea>
    </Card>
  );
}

FileManagerFileItem.propTypes = {
  file: PropTypes.object,
  onOpen: PropTypes.func,
  sx: PropTypes.object,
};
