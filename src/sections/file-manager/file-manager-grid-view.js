import PropTypes from 'prop-types';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useBoolean } from 'src/hooks/use-boolean';

import FileManagerPanel from './file-manager-panel';
import FileManagerFileItem from './file-manager-file-item';
import FileManagerFolderItem from './file-manager-folder-item';

// ----------------------------------------------------------------------

export default function FileManagerGridView({
  table,
  data,
  dataFiltered,
  onDeleteItem,
}) {
  const { selected, onSelectRow: onSelectItem } = table;

  const containerRef = useRef(null);

  const folders = useBoolean();

  return (
    <Box ref={containerRef}>
      <FileManagerPanel
        title="Categorie"
        subTitle={`${data.filter((item) => item.type === 'folder').length} Cartelle`}
        // onOpen={newFolder.onTrue}
        collapse={folders.value}
        onCollapse={folders.onToggle}
      />

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
        {dataFiltered
          .filter((i) => i.type === 'folder')
          .map((folder) => (
            <FileManagerFolderItem key={folder.name} folder={folder} sx={{ maxWidth: 'auto' }} />
          ))}
      </Box>

      {/* <Box
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        gap={3}
      >
        {dataFiltered
          .filter((i) => i.type !== 'folder')
          .map((file) => (
            <FileManagerFileItem
              key={file.id}
              file={file}
              selected={selected.includes(file.id)}
              onSelect={() => onSelectItem(file.id)}
              onDelete={() => onDeleteItem(file.id)}
              sx={{ maxWidth: 'auto' }}
            />
          ))}
      </Box> */}
    </Box>
  );
}

FileManagerGridView.propTypes = {
  data: PropTypes.array,
  dataFiltered: PropTypes.array,
  onDeleteItem: PropTypes.func,
  table: PropTypes.object,
};
