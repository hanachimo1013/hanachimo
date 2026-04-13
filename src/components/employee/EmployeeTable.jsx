import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

const EmployeeTable = ({ employees, loading, onEdit, onDelete, onHistory }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Loading employees...</p>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-300">No employees found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto overflow-y-auto custom-scrollbar border rounded-lg dark:border-gray-700">
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-50 dark:bg-gray-800">
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Photo</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Designation</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">SSS</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PAG-IBIG</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PhilHealth</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Total</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Total</th>
            <th className="px-2 md:px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">History</th>
            <th className="px-2 md:px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
              <td className="px-2 md:px-4 py-3">
                {getPhotoUrl(emp) ? (
                  <img src={getPhotoUrl(emp)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#bc7676] flex items-center justify-center text-white text-xs font-bold">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-2 md:px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                {emp.__maskedName ?? emp.name}
              </td>
              <td className="px-2 md:px-4 py-3 text-gray-700 text-xs md:text-sm dark:text-gray-300">
                {emp.__maskedDesignation ?? (emp.designation || '-')}
              </td>
              <td className="px-2 md:px-4 py-3 text-gray-700 dark:text-gray-200">
                {emp.__maskedNumber ?? formatPeso(emp.sss_ee ?? 0)}
              </td>
              <td className="px-2 md:px-4 py-3 text-gray-700 dark:text-gray-200">
                {emp.__maskedNumber ?? formatPeso(emp.pagibig_ee ?? 0)}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-gray-700 dark:text-gray-200">
                {emp.__maskedNumber ?? formatPeso(emp.philhealth_ee ?? 0)}
              </td>
              <td className="px-2 md:px-4 py-3 text-[#10b981] font-semibold">
                {emp.__maskedNumber ?? formatPeso(getEeShare(emp))}
              </td>
              <td className="px-2 md:px-4 py-3 text-[#3b82f6] font-semibold">
                {emp.__maskedNumber ?? formatPeso(getErShare(emp))}
              </td>
              <td className="px-2 md:px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => onHistory?.(emp)}
                  className="px-2 py-1 bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded text-xs font-semibold transition-all"
                >
                  <i className="bi bi-clock-history mr-1" aria-hidden="true" />
                  History
                </button>
              </td>
              <td className="px-2 md:px-4 py-3 text-center">
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
                  <button
                    onClick={() => onEdit(emp)}
                    disabled={emp.__readOnly}
                    className="w-full sm:w-auto px-3 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <i className="bi bi-pencil-square mr-1" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(emp.id)}
                    disabled={emp.__readOnly}
                    className="w-full sm:w-auto px-3 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
