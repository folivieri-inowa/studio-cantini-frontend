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
import FileManagerFolderItem from './file-manager-folder-item';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import FileManagerFileItem from './file-manager-file-item';
import FileManagerFileItemList from './file-manager-file-item-list';

// ----------------------------------------------------------------------

export default function FileManagerSubfolderItem({
  folder,
  open,
  //
  onClose,
  ...other
}) {

  console.log("FileManagerSubfolderItem", folder);

  const { name, type, subfolder } = folder;

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
            file={type}
            sx={{ width: 64, height: 64 }}
            imgSx={{ borderRadius: 1 }}
          />

          <Typography variant="subtitle1" sx={{ wordBreak: 'break-all' }}>
            {name}
          </Typography>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box
            gap={3}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
          >
            {subfolder.filter((i) => i.type === 'folder').map((i) => FileManagerSubfolderItemList(i))}
          </Box>
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

const FileManagerSubfolderItemList = (item) => {
  const { name, files, fileCount } = item;

  const details = useBoolean();

  const renderIcon = (
    <Box
      onClick={details.onTrue}
      component="img"
      src="/assets/icons/files/ic_folder.svg"
      sx={{ width: 36, height: 36 }}
    />
  );

  const renderText = (
    <ListItemText
      onClick={details.onTrue}
      primary={name}
      secondary={
        <>
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
          {fileCount} files
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
          display: 'inline-flex',
        },
      }}
    />
  );

  return (
    <>
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
        }}
      >
        <Box>{renderIcon}</Box>

        {renderText}
      </Stack>


     <FileManagerFileItemList
        files={files}
        open={details.value}
        onClose={details.onFalse}
      />
    </>
  );
};

FileManagerSubfolderItem.propTypes = {
  folder: PropTypes.object,
  item: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
