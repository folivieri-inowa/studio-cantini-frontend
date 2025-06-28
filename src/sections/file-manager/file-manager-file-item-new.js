import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { fData } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import FileThumbnail from 'src/components/file-thumbnail';
// ----------------------------------------------------------------------

export default function FileManagerFileItem({ file, onOpen, sx }) {
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
      jpg: 'jpg',
      jpeg: 'jpg',
      png: 'png',
      gif: 'gif',
      svg: 'svg',
      
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <FileThumbnail 
          file={getFileType(file.name)} 
          sx={{ width: 40, height: 40, mx: 'auto' }}
        />

        <Typography
          noWrap
          variant="subtitle2"
          sx={{ width: 1, mt: 1.5, mb: 0.5 }}
        >
          {file.name}
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
          {file.size ? (
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
              {file.type?.toUpperCase() || 'FILE'}
            </Typography>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

FileManagerFileItem.propTypes = {
  file: PropTypes.object,
  onOpen: PropTypes.func,
  sx: PropTypes.object,
};
