import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import FileThumbnail, { fileFormat } from 'src/components/file-thumbnail';

import FileManagerShareDialog from './file-manager-share-dialog';
import FileManagerInvitedItem from './file-manager-invited-item';

// ----------------------------------------------------------------------

export default function FileManagerFileDetails({
  item,
  open,
  //
  onClose,
  ...other
}) {

  console.log('FileManagerFileDetails', item);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        backdrop: { invisible: false },
      }}
      PaperProps={{
        sx: { width: '90%' },
      }}
      {...other}
    >
      <Scrollbar sx={{ height: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
          <Typography variant="h6"> Categoria </Typography>
        </Stack>

        <Stack
          spacing={2.5}
          justifyContent="center"
          sx={{
            p: 2.5,
            bgcolor: 'background.neutral',
          }}
        >
          <FileThumbnail
            imageView
            file={item.name}
            sx={{ width: 64, height: 64 }}
            imgSx={{ borderRadius: 1 }}
          />

          <Typography variant="subtitle1" sx={{ wordBreak: 'break-all' }}>
            aa
          </Typography>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Scrollbar>

      <Box sx={{ p: 2.5 }}>
        <Button
          fullWidth
          variant="soft"
          color="error"
          size="large"
          startIcon={<Iconify icon="solar:close-circle-bold" />}
          onClick={onClose}
        >
          Chiudi
        </Button>
      </Box>
    </Drawer>
  );
}

FileManagerFileDetails.propTypes = {
  item: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
