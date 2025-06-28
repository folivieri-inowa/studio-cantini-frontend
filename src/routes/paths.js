import { paramCase } from 'src/utils/change-case';

import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',
  docs: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',
  zoneUI: 'https://mui.com/store/items/zone-landing-page/',
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
  freeUI: 'https://mui.com/store/items/minimal-dashboard-free/',
  figma:
    'https://www.figma.com/file/hjxMnGUJCjY7pX8lQbS7kn/%5BPreview%5D-Minimal-Web.v5.4.0?type=design&node-id=0-1&mode=design&t=2fxnS70DuiTLGzND-0',
  product: {
    root: `/product`,
    checkout: `/product/checkout`,
    details: (id) => `/product/${id}`,
    demo: {
      details: `/product/${MOCK_ID}`,
    },
  },
  post: {
    root: `/post`,
    details: (title) => `/post/${paramCase(title)}`,
    demo: {
      details: `/post/${paramCase(MOCK_TITLE)}`,
    },
  },
  // AUTH
  auth: {
    amplify: {
      login: `${ROOTS.AUTH}/amplify/login`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      register: `${ROOTS.AUTH}/amplify/register`,
      newPassword: `${ROOTS.AUTH}/amplify/new-password`,
      forgotPassword: `${ROOTS.AUTH}/amplify/forgot-password`,
    },
    jwt: {
      login: `${ROOTS.AUTH}/jwt/login`,
      register: `${ROOTS.AUTH}/jwt/register`,
    },
    firebase: {
      login: `${ROOTS.AUTH}/firebase/login`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      register: `${ROOTS.AUTH}/firebase/register`,
      forgotPassword: `${ROOTS.AUTH}/firebase/forgot-password`,
    },
    auth0: {
      login: `${ROOTS.AUTH}/auth0/login`,
    },
  },
  authDemo: {
    classic: {
      login: `${ROOTS.AUTH_DEMO}/classic/login`,
      register: `${ROOTS.AUTH_DEMO}/classic/register`,
      forgotPassword: `${ROOTS.AUTH_DEMO}/classic/forgot-password`,
      newPassword: `${ROOTS.AUTH_DEMO}/classic/new-password`,
      verify: `${ROOTS.AUTH_DEMO}/classic/verify`,
    },
    modern: {
      login: `${ROOTS.AUTH_DEMO}/modern/login`,
      register: `${ROOTS.AUTH_DEMO}/modern/register`,
      forgotPassword: `${ROOTS.AUTH_DEMO}/modern/forgot-password`,
      newPassword: `${ROOTS.AUTH_DEMO}/modern/new-password`,
      verify: `${ROOTS.AUTH_DEMO}/modern/verify`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    blank: `${ROOTS.DASHBOARD}/blank`,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    master: {
      category: {
        details: (data) => `${ROOTS.DASHBOARD}/master/category/${data.id}`
      },
    },
    prima_nota: {
      root: `${ROOTS.DASHBOARD}/prima-nota`,
      new: `${ROOTS.DASHBOARD}/prima-nota/new`,
      details: (id) => `${ROOTS.DASHBOARD}/prima-nota/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/prima-nota/${id}/edit`,
    },
    owner: {
      root: `${ROOTS.DASHBOARD}/owner`,
      new: `${ROOTS.DASHBOARD}/owner/new`,
      details: (id) => `${ROOTS.DASHBOARD}/owner/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/owner/${id}/edit`,
    },
    category: {
      root: `${ROOTS.DASHBOARD}/category`,
      new: `${ROOTS.DASHBOARD}/category/new`,
      details: (data) => `${ROOTS.DASHBOARD}/category/${data.id}?owner=${data.owner}&year=${data.year}`,
      edit: (id) => `${ROOTS.DASHBOARD}/category/${id}/edit`,
    },
    subject: {
      root: `${ROOTS.DASHBOARD}/subject`,
      new: `${ROOTS.DASHBOARD}/subject/new`,
      details: (id) => `${ROOTS.DASHBOARD}/subject/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/subject/${id}/edit`,
    },
    scadenziario: {
      root: `${ROOTS.DASHBOARD}/scadenziario`,
      new: `${ROOTS.DASHBOARD}/scadenziario/new`,
      details: (id) => `${ROOTS.DASHBOARD}/scadenziario/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/scadenziario/${id}/edit`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      cards: `${ROOTS.DASHBOARD}/user/cards`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      account: `${ROOTS.DASHBOARD}/user/account`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit`,
      },
    }
  },
};
