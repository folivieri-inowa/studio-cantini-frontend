import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useTranslate();

  const data = useMemo(
    () => [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('Report'),
        items: [
          {
            title: t('Master'),
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
          },
          {
            title: t('File Manager'),
            path: paths.dashboard.fileManager,
            icon: ICONS.folder,
          },
          {
            title: t('Scadenziario'),
            path: paths.dashboard.scadenziario.root,
            icon: ICONS.calendar,
          },
          /* {
            title: t('ecommerce'),
            path: paths.dashboard.general.ecommerce,
            icon: ICONS.ecommerce,
          },
          {
            title: t('analytics'),
            path: paths.dashboard.general.analytics,
            icon: ICONS.analytics,
          },
          {
            title: t('banking'),
            path: paths.dashboard.general.banking,
            icon: ICONS.banking,
          },
          {
            title: t('booking'),
            path: paths.dashboard.general.booking,
            icon: ICONS.booking,
          },
          {
            title: t('file'),
            path: paths.dashboard.general.file,
            icon: ICONS.file,
          }, */
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('inserimento dati'),
        roles: ['admin', 'manager'],
        items: [
          // PRODUCT
          {
            title: t('prima nota'),
            roles: ['admin', 'manager'],
            path: paths.dashboard.prima_nota.root,
            icon: ICONS.order,
            children: [
              { title: t('elenco'), path: paths.dashboard.prima_nota.root },
              { title: t('nuova'), path: paths.dashboard.prima_nota.new },
            ],
          },
          {
            title: t('categorie'),
            roles: ['admin', 'manager'],
            path: paths.dashboard.category.root,
            icon: ICONS.job,
            children: [
              { title: t('elenco'), path: paths.dashboard.category.root },
              { title: t('nuovo'), path: paths.dashboard.category.new },
            ],
          },
          {
            title: t('Conti Correnti'),
            roles: ['admin', 'manager'],
            path: paths.dashboard.owner.root,
            icon: ICONS.invoice,
            children: [
              { title: t('elenco'), path: paths.dashboard.owner.root },
              { title: t('nuovo'), path: paths.dashboard.owner.new },
            ],
          },
          /* {
            title: t('soggetti'),
            path: paths.dashboard.subject.root,
            icon: ICONS.user,
            children: [
              { title: t('elenco'), path: paths.dashboard.subject.root },
              { title: t('nuovo'), path: paths.dashboard.subject.new },
            ],
          }, */
        ],
      },
    ],
    [t]
  );

  return data;
}
