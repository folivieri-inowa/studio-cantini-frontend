import axios from 'axios';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  prima_nota: {
    list: '/api/prima-nota/list',
    filtered_list: '/api/prima-nota/filtered_list',
    details: '/api/prima-nota/details',
    import_history: '/api/prima-nota/import-history',
    import_details: '/api/prima-nota/import-history/details',
    undo_import: '/api/prima-nota/undo-import',
  },
  owner: {
    list: '/api/owner/list'
  },
  category: {
    list: '/api/category/list'
  },
  subject: {
    list: '/api/subject/list'
  },
  detail: {
    list: '/api/detail/list'
  },
  file_manager: {
    list: '/api/file-manager/list',
    fileInfo: '/api/file-manager/file-info',
    upload: '/api/file-manager/upload',
    delete: '/api/file-manager/delete',
  },

  // ----------------------------------------------------------------------
  report: {
    master: '/api/report/master/',
    category: {
      details: '/api/report/category/details',
      subject: {
        details: '/api/report/category/subject/details',
      }
    }
  },
  // ----------------------------------------------------------------------
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
