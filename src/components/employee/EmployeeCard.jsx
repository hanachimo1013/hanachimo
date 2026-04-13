import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

export default function EmployeeCard({ employee, onEdit, onDelete, isViewer, maskText, maskNumber }) {
  const name = isViewer ? maskText(employee.name) : employee.name;
  const designation = isViewer ? maskText(employee.designation || 'Employee') : (employee.designation || 'Employee');
  const maskedValue = isViewer ? maskNumber() : null;

  return (
    <div className="glass-card p-5 transition-shadow hover:shadow-lg">
      {/* Header with photo and name */}
      <div className="flex items-center gap-4 mb-4">
        {getPhotoUrl(employee) ? (
          <img
            src={getPhotoUrl(employee)}
            alt={employee.name}
            className="w-14 h-14 rounded-full object-cover shadow-md"
            style={{ border: '2px solid var(--glass-border)' }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md" style={{ background: 'var(--accent-blue)' }}>
            {employee.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{designation}</p>
        </div>
      </div>

      {/* Employee Details Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="glass-subtle rounded-xl p-3">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>SSS</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{maskedValue || formatPeso(employee.sss_ee ?? 0)}</p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>PAG-IBIG</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{maskedValue || formatPeso(employee.pagibig_ee ?? 0)}</p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>PhilHealth</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{maskedValue || formatPeso(employee.philhealth_ee ?? 0)}</p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Total</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {maskedValue || formatPeso(
              (employee.sss_ee ?? 0) +
              (employee.pagibig_ee ?? 0) +
              (employee.philhealth_ee ?? 0)
            )}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(0, 122, 255, 0.08)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'var(--accent-blue)' }}>EE Total</p>
          <p className="text-sm font-bold" style={{ color: 'var(--accent-blue)' }}>{maskedValue || formatPeso(getEeShare(employee))}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(52, 199, 89, 0.08)' }}>
          <p className="text-[11px] font-medium" style={{ color: 'var(--accent-green)' }}>ER Total</p>
          <p className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>{maskedValue || formatPeso(getErShare(employee))}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {onEdit && onDelete && (
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            disabled={isViewer}
            className="btn-apple flex-1 py-2 text-white text-sm rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent-blue)' }}
          >
            <i className="bi bi-pencil-square mr-2" aria-hidden="true" />
            Edit
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            disabled={isViewer}
            className="btn-apple flex-1 py-2 text-white text-sm rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent-red)' }}
          >
            <i className="bi bi-trash mr-2" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
