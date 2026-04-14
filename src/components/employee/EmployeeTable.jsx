import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

const MobileCard = ({ emp, onEdit, onDelete, onHistory }) => (
  <div className="glass-subtle rounded-2xl p-4">
    {/* Header */}
    <div className="flex items-center gap-3 mb-3">
      {getPhotoUrl(emp) ? (
        <img src={getPhotoUrl(emp)} alt={emp.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: '2px solid var(--glass-border)' }} />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0" style={{ background: 'var(--accent-blue)' }}>
          {emp.name?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{emp.__maskedName ?? emp.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{emp.__maskedDesignation ?? (emp.designation || '—')}</p>
      </div>
    </div>

    {/* Stats grid — 3 columns */}
    <div className="grid grid-cols-3 gap-1.5 mb-3">
      {[
        { label: 'SSS', value: emp.__maskedNumber ?? formatPeso(emp.sss_ee ?? 0) },
        { label: 'PAG-IBIG', value: emp.__maskedNumber ?? formatPeso(emp.pagibig_ee ?? 0) },
        { label: 'PhilHealth', value: emp.__maskedNumber ?? formatPeso(emp.philhealth_ee ?? 0) },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-lg p-2 text-center" style={{ background: 'var(--surface-primary)' }}>
          <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
        </div>
      ))}
    </div>

    {/* EE / ER totals */}
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(52, 199, 89, 0.08)' }}>
        <p className="text-[10px] font-medium" style={{ color: 'var(--accent-green)' }}>EE Total</p>
        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent-green)' }}>{emp.__maskedNumber ?? formatPeso(getEeShare(emp))}</p>
      </div>
      <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(0, 122, 255, 0.08)' }}>
        <p className="text-[10px] font-medium" style={{ color: 'var(--accent-blue)' }}>ER Total</p>
        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--accent-blue)' }}>{emp.__maskedNumber ?? formatPeso(getErShare(emp))}</p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onHistory?.(emp)}
        className="btn-apple flex-1 py-2 text-xs text-white rounded-lg"
        style={{ background: 'var(--accent-teal)' }}
      >
        <i className="bi bi-clock-history mr-1" aria-hidden="true" />History
      </button>
      <button
        onClick={() => onEdit(emp)}
        disabled={emp.__readOnly}
        className="btn-apple flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40"
        style={{ background: 'var(--accent-blue)' }}
      >
        <i className="bi bi-pencil-square mr-1" aria-hidden="true" />Edit
      </button>
      <button
        onClick={() => onDelete(emp.id)}
        disabled={emp.__readOnly}
        className="btn-apple flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40"
        style={{ background: 'var(--accent-red)' }}
      >
        <i className="bi bi-trash mr-1" aria-hidden="true" />Delete
      </button>
    </div>
  </div>
);

const EmployeeTable = ({ employees, loading, onEdit, onDelete, onHistory }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>Loading employees…</p>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>No employees found</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: card list ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {employees.map((emp) => (
          <MobileCard key={emp.id} emp={emp} onEdit={onEdit} onDelete={onDelete} onHistory={onHistory} />
        ))}
      </div>

      {/* ── Desktop: scrollable table ── */}
      <div className="hidden md:block overflow-x-auto md:h-full md:overflow-y-auto custom-scrollbar glass-card" style={{ borderRadius: '14px' }}>
        <table className="w-full text-sm min-w-[1000px] apple-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Designation</th>
              <th className="px-4 py-3 text-left">SSS</th>
              <th className="px-4 py-3 text-left">PAG-IBIG</th>
              <th className="px-4 py-3 text-left">PhilHealth</th>
              <th className="px-4 py-3 text-left">EE Total</th>
              <th className="px-4 py-3 text-left">ER Total</th>
              <th className="px-4 py-3 text-center">History</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td className="px-4 py-3">
                  {getPhotoUrl(emp) ? (
                    <img src={getPhotoUrl(emp)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: 'var(--accent-blue)' }}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {emp.__maskedName ?? emp.name}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {emp.__maskedDesignation ?? (emp.designation || '-')}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                  {emp.__maskedNumber ?? formatPeso(emp.sss_ee ?? 0)}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                  {emp.__maskedNumber ?? formatPeso(emp.pagibig_ee ?? 0)}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                  {emp.__maskedNumber ?? formatPeso(emp.philhealth_ee ?? 0)}
                </td>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent-green)' }}>
                  {emp.__maskedNumber ?? formatPeso(getEeShare(emp))}
                </td>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent-blue)' }}>
                  {emp.__maskedNumber ?? formatPeso(getErShare(emp))}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onHistory?.(emp)}
                    className="btn-apple px-3 py-1.5 text-xs text-white rounded-lg"
                    style={{ background: 'var(--accent-teal)' }}
                  >
                    <i className="bi bi-clock-history mr-1" aria-hidden="true" />
                    History
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onEdit(emp)}
                      disabled={emp.__readOnly}
                      className="btn-apple px-3 py-1.5 text-xs text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: 'var(--accent-blue)' }}
                    >
                      <i className="bi bi-pencil-square mr-1" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(emp.id)}
                      disabled={emp.__readOnly}
                      className="btn-apple px-3 py-1.5 text-xs text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ background: 'var(--accent-red)' }}
                    >
                      <i className="bi bi-trash mr-1" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default EmployeeTable;
