import React from 'react';
import { useEmployees } from '../hooks/useEmployees';

const EmployeeTable = ({ employees, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading employees...</p>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">No employees found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6a891]">
            <th className="px-4 py-3 text-left font-bold text-gray-700">ID</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">SSS</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">PAG-IBIG</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">PhilHealth</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">EE Share</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">ER Share</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors">
              <td className="px-4 py-3 text-gray-700">{emp.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
              <td className="px-4 py-3 text-gray-700">₱{emp.sss?.toLocaleString('en-PH') || 0}</td>
              <td className="px-4 py-3 text-gray-700">₱{emp.pagibig?.toLocaleString('en-PH') || 0}</td>
              <td className="px-4 py-3 text-gray-700">₱{emp.philhealth?.toLocaleString('en-PH') || 0}</td>
              <td className="px-4 py-3 text-[#10b981] font-semibold">₱{emp.eeShare?.toLocaleString('en-PH') || 0}</td>
              <td className="px-4 py-3 text-[#3b82f6] font-semibold">₱{emp.erShare?.toLocaleString('en-PH') || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function Employees() {
  const { employees, loading } = useEmployees();

  return (
    <section className="bg-white p-8 rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-1">Employee Management</h2>
        <p className="text-gray-600">Manage and view all employees in the system</p>
      </div>
      <div className="overflow-y-auto flex-1">
        <EmployeeTable employees={employees} loading={loading} />
      </div>
    </section>
  );
}
