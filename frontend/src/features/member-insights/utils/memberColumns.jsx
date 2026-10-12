import { Link } from 'react-router-dom';

import Avatar from '../../../components/Avatar';
import { formatDateTime } from '../../../utils/formatDate';

const EMPTY = <span className="text-[#9aa0b4]">—</span>;

const countLink =
  'inline-block min-w-8 rounded-lg bg-[#fde6d6] px-2.5 py-1 text-center font-semibold tabular-nums text-[#b04a4f] hover:underline';

/**
 * The member table's columns, in order. `extra` columns are the less important ones: they can be hidden with the
 * table's "more columns" button. `sortKey` is the server-side sort name (none = not sortable).
 * `cell(member, ctx)` returns the cell content; `ctx.appsQuery` carries the selected period into the Apps links.
 */
export const MEMBER_COLUMNS = [
  {
    id: 'createdAt',
    label: 'Created At',
    sortKey: 'createdAt',
    tdClass: 'whitespace-nowrap text-[#3a3f55]',
    cell: (m) => formatDateTime(m.createdAt),
  },
  {
    id: 'member',
    label: 'Member',
    sortKey: 'name',
    cell: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={m.name ?? '#'} />
        {m.name ? <span className="font-semibold">{m.name}</span> : <span className="font-normal text-[#9aa0b4]">Unnamed member</span>}
      </div>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    sortKey: 'mobile',
    tdClass: 'tabular-nums text-[#3a3f55]',
    cell: (m) => m.mobile ?? EMPTY,
  },
  {
    id: 'trusts',
    label: 'Members In Trust',
    cell: (m) =>
      m.trustCount > 0 ? (
        <Link to={`/member-insights/${m.id}/trusts`} title="View all trusts" className={countLink}>
          {m.trustCount}
        </Link>
      ) : (
        <span className="text-[#9aa0b4]">0</span>
      ),
  },
  {
    id: 'apps',
    label: 'Apps Created',
    sortKey: 'appCount',
    tdClass: 'tabular-nums text-[#3a3f55]',
    cell: (m, { appsQuery }) =>
      m.appCount > 0 ? (
        <Link to={`/member-insights/${m.id}/apps${appsQuery}`} title="View apps created" className={countLink}>
          {m.appCount}
        </Link>
      ) : (
        EMPTY
      ),
  },
  {
    id: 'lastApp',
    label: 'Last App Created',
    sortKey: 'lastAppCreated',
    extra: true,
    tdClass: 'whitespace-nowrap text-[#3a3f55]',
    cell: (m) => (m.lastAppCreatedAt ? formatDateTime(m.lastAppCreatedAt) : EMPTY),
  },
  {
    id: 'managerActivity',
    label: 'App Manager Activity',
    sortKey: 'managerActivity',
    tdClass: 'tabular-nums',
    cell: (m, { appsQuery }) =>
      m.managerActivity > 0 ? (
        <Link
          to={`/member-insights/${m.id}/apps${appsQuery}`}
          title="View the apps and their activity"
          className="font-semibold text-[#b04a4f] hover:underline"
        >
          {m.managerActivity.toLocaleString('en-IN')}
        </Link>
      ) : (
        EMPTY
      ),
  },
  {
    id: 'actions',
    label: 'App Actions',
    sortKey: 'actionCount',
    extra: true,
    tdClass: 'font-semibold tabular-nums',
    cell: (m) => (m.actionCount > 0 ? m.actionCount.toLocaleString('en-IN') : EMPTY),
  },
  {
    id: 'lastAction',
    label: 'App Last Action Taken',
    sortKey: 'lastAction',
    extra: true,
    tdClass: 'whitespace-nowrap text-[#3a3f55]',
    cell: (m) => (m.lastActionAt ? formatDateTime(m.lastActionAt) : EMPTY),
  },
  { id: 'email', label: 'Email', extra: true, tdClass: 'text-[#3a3f55]', cell: (m) => m.email ?? EMPTY },
  { id: 'company', label: 'Company', extra: true, tdClass: 'text-[#3a3f55]', cell: (m) => m.companyName ?? EMPTY },
  {
    id: 'app',
    label: 'App',
    extra: true,
    cell: (m) => (
      <span
        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
          m.appDownloaded ? 'bg-[#dff3e5] text-[#1f6b34]' : 'bg-gray-100 text-[#5b627a]'
        }`}
      >
        {m.appDownloaded ? 'Downloaded' : 'Not yet'}
      </span>
    ),
  },
];

export const EXTRA_COLUMN_COUNT = MEMBER_COLUMNS.filter((c) => c.extra).length;

/** The label of the hidden (extra) column the table is sorted by, or null when the sort column is on screen. */
export const hiddenSortLabel = (sortKey, showExtra) =>
  showExtra ? null : MEMBER_COLUMNS.find((c) => c.extra && c.sortKey === sortKey)?.label ?? null;
