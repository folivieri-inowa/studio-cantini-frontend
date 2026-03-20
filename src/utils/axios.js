import axios from 'axios';

import { HOST_API } from '../config-global';

// ----------------------------------------------------------------------

// Usa path relativi per evitare problemi CORS con domini multipli
const axiosInstance = axios.create({ baseURL: '' });

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
    month_transactions: '/api/transaction/month_transactions',
    details: '/api/prima-nota/details',
    import_history: '/api/prima-nota/import-history',
    import_details: '/api/prima-nota/import-history/details',
    undo_import: '/api/prima-nota/undo-import',
    toggle_stats_exclusion: '/api/prima-nota/toggle-stats-exclusion',
  },
  category_exclusion: {
    toggle: '/api/category-exclusion/toggle',
    list: '/api/category-exclusion/list',
    reset: '/api/category-exclusion/reset',
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
  anomalie: {
    analysis: '/api/anomalie/analysis',
    stats: '/api/anomalie/stats',
    filtri: '/api/anomalie/filtri',
  },

  // ----------------------------------------------------------------------
  report: {
    master: '/api/report/master/',
    base: '/api/reports',
    category: {
      details: '/api/report/category/details',
      monthBreakdown: '/api/report/category/month-breakdown',
      subject: {
        details: '/api/report/category/subject/details',
        chart: '/api/report/category/subject/details/chart',
      }
    },
    // Nuovi endpoint per il raggruppamento
    categoriesSubjects: '/api/report/categories-subjects',
    groupAggregation: '/api/report/group-aggregation',
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
  archive: {
    documents: '/api/archive/documents',
    document: (id) => `/api/archive/documents/${id}`,
    upload: '/api/archive/upload',
    search: '/api/archive/search',
    stats: '/api/archive/stats',
    delete: (id) => `/api/archive/documents/${id}`,
    retry: (id) => `/api/archive/documents/${id}/retry`,
    clearAll: '/api/archive/documents/clear-all',
    folders: '/api/archive/folders',
    breadcrumb: '/api/archive/breadcrumb',
    chat: {
      sessions: '/api/archive/chat/sessions',
      session: (id) => `/api/archive/chat/sessions/${id}`,
      messages: (id) => `/api/archive/chat/sessions/${id}/messages`,
    },
  },
};
