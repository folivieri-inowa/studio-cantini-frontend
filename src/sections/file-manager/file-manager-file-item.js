import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import TextMaxLine from 'src/components/text-max-line';
import FileThumbnail from 'src/components/file-thumbnail';
// ----------------------------------------------------------------------

function getFileTypeFromUrl(url) {
  // Estrai l'estensione del file dall'URL
  const extension = url.split('.').pop();

  // Mappa delle estensioni ai tipi di file
  const fileTypes = {
    xlsx: 'Excel',
    xls: 'Excel',
    docx: 'Word',
    doc: 'Word',
    pdf: 'PDF',
    txt: 'Text',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    mp4: 'Video',
    mp3: 'Audio',
    // Aggiungi altri tipi di file se necessario
  };

  // Restituisci il tipo di file o "Unknown" se non trovato
  return fileTypes[extension] || 'Unknown';
}

export default function FileManagerFileItem({ file, sx, ...other }) {
  const checkbox = useBoolean();

  const details = useBoolean();

  const renderIcon = <FileThumbnail file={getFileTypeFromUrl(file.name)} sx={{ width: 36, height: 36 }} />;

  const renderText = (
    <>
      <TextMaxLine
        persistent
        variant="subtitle2"
        onClick={details.onTrue}
        sx={{ width: 1, mt: 2, mb: 0.5 }}
      >
        {file.name}
      </TextMaxLine>

      <Stack
        direction="row"
        alignItems="center"
        sx={{
          maxWidth: 0.99,
          whiteSpace: 'nowrap',
          typography: 'caption',
          color: 'text.disabled',
        }}
      >
        {fData(file.size)}

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
        <Typography noWrap component="span" variant="caption">
          {fDateTime(file.modifiedAt)}
        </Typography>
      </Stack>
    </>
  );

  const renderAvatar = (
    <AvatarGroup
      max={3}
      sx={{
        mt: 1,
        [`& .${avatarGroupClasses.avatar}`]: {
          width: 24,
          height: 24,
          '&:first-of-type': {
            fontSize: 12,
          },
        },
      }}
    >
      {file.shared?.map((person) => (
        <Avatar key={person.id} alt={person.name} src={person.avatarUrl} />
      ))}
    </AvatarGroup>
  );

  return (
    <Stack
      component={Paper}
      variant="outlined"
      alignItems="flex-start"
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: 'unset',
        cursor: 'pointer',
        position: 'relative',
        ...sx,
      }}
      {...other}
    >
      <Box onMouseEnter={checkbox.onTrue} onMouseLeave={checkbox.onFalse}>
        {renderIcon}
      </Box>

      {renderText}

      {renderAvatar}
    </Stack>
  );
}

FileManagerFileItem.propTypes = {
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  sx: PropTypes.object,
};
