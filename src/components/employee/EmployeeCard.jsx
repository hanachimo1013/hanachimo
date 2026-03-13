import React from 'react';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../../utils/formatters';

export default function EmployeeCard({ employee, onEdit, onDelete, isViewer, maskText, maskNumber }) {
  const name = isViewer ? maskText(employee.name) : employee.name;
  const designation = isViewer ? maskText(employee.designation || 'Employee') : (employee.designation || 'Employee');
  const maskedValue = isViewer ? maskNumber() : null;

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-[#e6a891] p-4 hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-700">
      {/* Header with photo and name */}
      <div className="flex items-center gap-4 mb-4">
        {getPhotoUrl(employee) ? (
          <img
            src={getPhotoUrl(employee)}
            alt={employee.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#bc7676]"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#bc7676] flex items-center justify-center text-white text-2xl font-bold">
            {employee.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{designation}</p>
        </div>
      </div>

      {/* Employee Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
          <p className="text-xs text-gray-600 font-semibold dark:text-gray-300">SSS</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{maskedValue || formatPeso(employee.sss)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
          <p className="text-xs text-gray-600 font-semibold dark:text-gray-300">PAG-IBIG</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{maskedValue || formatPeso(employee.pagibig)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
          <p className="text-xs text-gray-600 font-semibold dark:text-gray-300">PhilHealth</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{maskedValue || formatPeso(employee.philhealth)}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg dark:bg-gray-800">
          <p className="text-xs text-gray-600 font-semibold dark:text-gray-300">Total Contributions</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {maskedValue || formatPeso((employee.sss || 0) + (employee.pagibig || 0) + (employee.philhealth || 0))}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-semibold">EE Share</p>
          <p className="text-sm font-bold text-blue-700">{maskedValue || formatPeso(getEeShare(employee))}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-semibold">ER Share</p>
          <p className="text-sm font-bold text-green-700">{maskedValue || formatPeso(getErShare(employee))}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {onEdit && onDelete && (
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            disabled={isViewer}
            className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="bi bi-pencil-square mr-2" aria-hidden="true" />
            Edit
          </button>
          <button
            onClick={() => onDelete(employee.id)}
            disabled={isViewer}
            className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="bi bi-trash mr-2" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
