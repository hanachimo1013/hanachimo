import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

const EmployeeTable = ({ employees, loading, onEdit, onDelete }) => {
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-50 dark:bg-gray-800">
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Photo</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Designation</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">SSS</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PAG-IBIG</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PhilHealth</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Share</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Share</th>
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
                {emp.__maskedNumber ?? formatPeso(emp.sss)}
              </td>
              <td className="px-2 md:px-4 py-3 text-gray-700 dark:text-gray-200">
                {emp.__maskedNumber ?? formatPeso(emp.pagibig)}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-gray-700 dark:text-gray-200">
                {emp.__maskedNumber ?? formatPeso(emp.philhealth)}
              </td>
              <td className="px-2 md:px-4 py-3 text-[#10b981] font-semibold">
                {emp.__maskedNumber ?? formatPeso(getEeShare(emp))}
              </td>
              <td className="px-2 md:px-4 py-3 text-[#3b82f6] font-semibold">
                {emp.__maskedNumber ?? formatPeso(getErShare(emp))}
              </td>
              <td className="px-2 md:px-4 py-3 text-center">
                <button onClick={() => onEdit(emp)} disabled={emp.__readOnly} className="px-2 py-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded text-xs font-semibold mr-2 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                  <i className="bi bi-pencil-square mr-1" aria-hidden="true" />
                  Edit
                </button>
                <button onClick={() => onDelete(emp.id)} disabled={emp.__readOnly} className="px-2 py-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50">
                  <i className="bi bi-trash mr-1" aria-hidden="true" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
