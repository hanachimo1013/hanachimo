import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

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
    <div className="overflow-x-auto md:h-full md:overflow-y-auto touch-pan-x custom-scrollbar glass-card" style={{ borderRadius: '14px' }}>
      <table className="w-full text-sm min-w-[1000px] apple-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <th className="px-3 md:px-4 py-3 text-left">Photo</th>
            <th className="px-3 md:px-4 py-3 text-left">Name</th>
            <th className="px-3 md:px-4 py-3 text-left">Designation</th>
            <th className="px-3 md:px-4 py-3 text-left">SSS</th>
            <th className="px-3 md:px-4 py-3 text-left">PAG-IBIG</th>
            <th className="hidden md:table-cell px-4 py-3 text-left">PhilHealth</th>
            <th className="px-3 md:px-4 py-3 text-left">EE Total</th>
            <th className="px-3 md:px-4 py-3 text-left">ER Total</th>
            <th className="px-3 md:px-4 py-3 text-center">History</th>
            <th className="px-3 md:px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td className="px-3 md:px-4 py-3">
                {getPhotoUrl(emp) ? (
                  <img src={getPhotoUrl(emp)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: 'var(--accent-blue)' }}>
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-3 md:px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                {emp.__maskedName ?? emp.name}
              </td>
              <td className="px-3 md:px-4 py-3 text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {emp.__maskedDesignation ?? (emp.designation || '-')}
              </td>
              <td className="px-3 md:px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                {emp.__maskedNumber ?? formatPeso(emp.sss_ee ?? 0)}
              </td>
              <td className="px-3 md:px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                {emp.__maskedNumber ?? formatPeso(emp.pagibig_ee ?? 0)}
              </td>
              <td className="hidden md:table-cell px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                {emp.__maskedNumber ?? formatPeso(emp.philhealth_ee ?? 0)}
              </td>
              <td className="px-3 md:px-4 py-3 font-semibold" style={{ color: 'var(--accent-green)' }}>
                {emp.__maskedNumber ?? formatPeso(getEeShare(emp))}
              </td>
              <td className="px-3 md:px-4 py-3 font-semibold" style={{ color: 'var(--accent-blue)' }}>
                {emp.__maskedNumber ?? formatPeso(getErShare(emp))}
              </td>
              <td className="px-3 md:px-4 py-3 text-center">
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
              <td className="px-3 md:px-4 py-3 text-center">
                <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-center">
                  <button
                    onClick={() => onEdit(emp)}
                    disabled={emp.__readOnly}
                    className="btn-apple w-full sm:w-auto px-3 py-1.5 text-xs text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: 'var(--accent-blue)' }}
                  >
                    <i className="bi bi-pencil-square mr-1" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(emp.id)}
                    disabled={emp.__readOnly}
                    className="btn-apple w-full sm:w-auto px-3 py-1.5 text-xs text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
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
  );
};

export default EmployeeTable;
