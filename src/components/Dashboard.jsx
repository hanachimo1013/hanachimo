import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';

// Sub-component for the Status Cards
const StatusCard = ({ title, value }) => (
  <div className="bg-[#f2dede] p-4 md:p-6 rounded shadow-md flex flex-col items-center justify-center min-h-32 md:h-40 hover:shadow-lg transition-shadow">
    <span className="text-xs md:text-sm font-semibold text-gray-600 mb-2">{title}</span>
    <span className="text-2xl md:text-4xl font-bold text-[#bc7676] mb-1 break-words text-center">{value}</span>
  </div>
);

const formatPeso = (value) => `₱${(value || 0).toLocaleString('en-PH')}`;
const getEeShare = (employee) => employee?.eeshare ?? employee?.eeShare ?? 0;
const getErShare = (employee) => employee?.ershare ?? employee?.erShare ?? 0;

// Function to generate PDF receipt for employer share
const generateEmployerReceipt = (employee) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Employer Share Receipt', pageWidth / 2, 32, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('en-PH')}`, 20, 45);
  doc.text(`Receipt No: ${Math.floor(Math.random() * 100000)}`, 20, 52);
  
  // Divider
  doc.setDrawColor(200);
  doc.line(20, 58, pageWidth - 20, 58);
  
  // Employee Information
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Employee Information', 20, 68);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Employee ID: ${employee.id}`, 20, 78);
  doc.text(`Employee Name: ${employee.name}`, 20, 85);
  
  // Divider
  doc.line(20, 92, pageWidth - 20, 92);
  
  // Payment Details
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Employer Share Details', 20, 102);
  
  // Table Headers
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('Description', 20, 115);
  doc.text('Amount', pageWidth - 40, 115, { align: 'right' });
  
  // Table content
  doc.setFont(undefined, 'normal');
  doc.text('Employee Share (EE)', 20, 125);
  doc.text(formatPeso(getEeShare(employee)), pageWidth - 40, 125, { align: 'right' });
  
  doc.text('Employer Share (ER)', 20, 135);
  doc.text(formatPeso(getErShare(employee)), pageWidth - 40, 135, { align: 'right' });
  
  // Divider
  doc.setDrawColor(100);
  doc.line(20, 142, pageWidth - 20, 142);
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total Employer Share', 20, 152);
  doc.text(formatPeso(getErShare(employee)), pageWidth - 40, 152, { align: 'right' });
  
  // Footer
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('This receipt is for employer contribution records.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Open in new window and print
  const pdfUrl = doc.output('bloburi');
  window.open(pdfUrl);
};

// Employee Table Component
const EmployeeTable = ({ employees, loading }) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading employee data...</div>;
  }

  if (!employees || employees.length === 0) {
    return <div className="text-center py-8 text-gray-500">No employee data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-100">
            <th className="px-4 py-3 text-left font-bold text-gray-700">ID</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">EE Share (Employee)</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">ER Share (Employer)</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700">Total Payments</th>
            <th className="px-4 py-3 text-center font-bold text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors">
              <td className="px-4 py-3 text-gray-700">{emp.id}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
              <td className="px-4 py-3 text-gray-800 font-semibold text-[#10b981]">{formatPeso(getEeShare(emp))}</td>
              <td className="px-4 py-3 text-gray-800 font-semibold text-[#3b82f6]">{formatPeso(getErShare(emp))}</td>
              <td className="px-4 py-3 text-gray-800 font-bold text-[#dc2626]">{formatPeso(getEeShare(emp) + getErShare(emp))}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => generateEmployerReceipt(emp)}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1 rounded font-semibold transition-colors text-xs"
                >
                  📄 Receipt
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function Dashboard() {
  const { employees, loading } = useEmployees();
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const totals = useMemo(() => {
    if (!employees || employees.length === 0) return { sss: 0, pagibig: 0, philhealth: 0 };
    
    return {
      sss: employees.reduce((sum, emp) => sum + (emp.sss || 0), 0),
      pagibig: employees.reduce((sum, emp) => sum + (emp.pagibig || 0), 0),
      philhealth: employees.reduce((sum, emp) => sum + (emp.philhealth || 0), 0),
    };
  }, [employees]);

  return (
    <>
        <div>
            <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-2">Total Payments</h2>
            <p className="text-center text-sm md:text-base text-gray-600">(to be paid)</p>
        </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <StatusCard title="SSS" value={formatPeso(totals.sss)}/>
        <StatusCard title="PAG-IBIG" value={formatPeso(totals.pagibig)}/>
        <StatusCard title="PhilHealth" value={formatPeso(totals.philhealth)}/>
      </div>

      {/* Employee List */}
      <section className="bg-white p-4 md:p-8 rounded-lg shadow-md">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Employee Directory</h3>
            <p className="text-gray-600 text-xs md:text-sm">Recently active employees</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#10b981] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#10b981] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎴 Cards
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && <EmployeeTable employees={employees} loading={loading} />}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading employee data...</div>
            ) : !employees || employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No employee data available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                  <div key={emp.id}>
                    <EmployeeCard employee={emp} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
