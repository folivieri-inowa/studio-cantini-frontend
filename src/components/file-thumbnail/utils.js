// ----------------------------------------------------------------------

// Define more types here
const FORMAT_PDF = ['pdf'];
const FORMAT_TEXT = ['txt'];
const FORMAT_PHOTOSHOP = ['psd'];
const FORMAT_WORD = ['doc', 'docx'];
const FORMAT_EXCEL = ['xls', 'xlsx'];
const FORMAT_ZIP = ['zip', 'rar', 'iso'];
const FORMAT_ILLUSTRATOR = ['ai', 'esp'];
const FORMAT_POWERPOINT = ['ppt', 'pptx'];
const FORMAT_AUDIO = ['wav', 'aif', 'mp3', 'aac'];
const FORMAT_IMG = ['jpg', 'jpeg', 'gif', 'bmp', 'png', 'svg'];
const FORMAT_VIDEO = ['m4v', 'avi', 'mpg', 'mp4', 'webm'];

const iconUrl = (icon) => `/assets/icons/files/${icon}.svg`;

// ----------------------------------------------------------------------

export function fileFormat(fileUrl) {
  let format;
  const fileType = fileTypeByUrl(fileUrl);

  if (FORMAT_TEXT.includes(fileType)) {
    format = 'txt';
  } else if (FORMAT_ZIP.includes(fileType)) {
    format = 'zip';
  } else if (FORMAT_AUDIO.includes(fileType)) {
    format = 'audio';
  } else if (FORMAT_IMG.includes(fileType)) {
    format = 'image';
  } else if (FORMAT_VIDEO.includes(fileType)) {
    format = 'video';
  } else if (FORMAT_WORD.includes(fileType)) {
    format = 'word';
  } else if (FORMAT_EXCEL.includes(fileType)) {
    format = 'excel';
  } else if (FORMAT_POWERPOINT.includes(fileType)) {
    format = 'powerpoint';
  } else if (FORMAT_PDF.includes(fileType)) {
    format = 'pdf';
  } else if (FORMAT_PHOTOSHOP.includes(fileType)) {
    format = 'photoshop';
  } else if (FORMAT_ILLUSTRATOR.includes(fileType)) {
    format = 'illustrator';
  } else {
    format = fileType;
  }

  return format;
}

// ----------------------------------------------------------------------

export function fileThumb(fileUrl) {
  let thumb;

  switch (fileFormat(fileUrl)) {
    case 'folder':
      thumb = iconUrl('ic_folder');
      break;
    case 'txt':
      thumb = iconUrl('ic_txt');
      break;
    case 'zip':
      thumb = iconUrl('ic_zip');
      break;
    case 'audio':
      thumb = iconUrl('ic_audio');
      break;
    case 'video':
      thumb = iconUrl('ic_video');
      break;
    case 'word':
      thumb = iconUrl('ic_word');
      break;
    case 'excel':
      thumb = iconUrl('ic_excel');
      break;
    case 'powerpoint':
      thumb = iconUrl('ic_power_point');
      break;
    case 'pdf':
      thumb = iconUrl('ic_pdf');
      break;
    case 'photoshop':
      thumb = iconUrl('ic_pts');
      break;
    case 'illustrator':
      thumb = iconUrl('ic_ai');
      break;
    case 'image':
      thumb = iconUrl('ic_img');
      break;
    default:
      thumb = iconUrl('ic_file');
  }
  return thumb;
}

// ----------------------------------------------------------------------

export function fileTypeByUrl(fileUrl = '') {
  return (fileUrl && fileUrl.split('.').pop()) || '';
}

// ----------------------------------------------------------------------

export function fileNameByUrl(fileUrl) {
  return fileUrl.split('/').pop();
}

// ----------------------------------------------------------------------

export function fileData(file) {
  // Url
  if (typeof file === 'string') {
    return {
      key: file,
      preview: file,
      name: fileNameByUrl(file),
      type: fileTypeByUrl(file),
    };
  }

  // File
  return {
    key: file.preview,
    name: file.name,
    size: file.size,
    path: file.path,
    type: file.type,
    preview: file.preview,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
  };
}
