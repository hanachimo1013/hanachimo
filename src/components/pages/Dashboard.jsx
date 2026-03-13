import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { useEmployees } from '../../hooks/useEmployees';
import EmployeeCard from '../employee/EmployeeCard';
import { formatPeso, getEeShare, getErShare } from '../../utils/formatters';
import LoadingOverlay from '../ui/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';

const StatusCard = ({ title, value }) => (
  <div className="bg-[#f2dede] p-4 md:p-6 rounded shadow-md flex flex-col items-center justify-center min-h-32 md:h-40 hover:shadow-lg transition-shadow dark:bg-gray-800">
    <span className="text-xs md:text-sm font-semibold text-gray-600 mb-2 dark:text-gray-300">{title}</span>
    <span className="text-2xl md:text-4xl font-bold text-[#bc7676] mb-1 break-words text-center dark:text-emerald-300">{value}</span>
  </div>
);


// Function to generate PDF receipt for employer share
const generateEmployerReceipt = (employee, masked) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maskedText = '***';
  
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
  doc.text(`Employee ID: ${masked ? maskedText : employee.id}`, 20, 78);
  doc.text(`Employee Name: ${masked ? maskedText : employee.name}`, 20, 85);
  
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
  doc.text(masked ? maskedText : formatPeso(getEeShare(employee)), pageWidth - 40, 125, { align: 'right' });
  
  doc.text('Employer Share (ER)', 20, 135);
  doc.text(masked ? maskedText : formatPeso(getErShare(employee)), pageWidth - 40, 135, { align: 'right' });
  
  // Divider
  doc.setDrawColor(100);
  doc.line(20, 142, pageWidth - 20, 142);
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total Employer Share', 20, 152);
  doc.text(masked ? maskedText : formatPeso(getErShare(employee)), pageWidth - 40, 152, { align: 'right' });
  
  // Footer
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('This receipt is for employer contribution records.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Open in new window and print
  const pdfUrl = doc.output('bloburi');
  window.open(pdfUrl);
};

const maskText = (value) => {
  const text = String(value || '');
  if (text.length <= 2) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(1, text.length - 3))}${text.slice(-1)}`;
};

const maskNumber = () => '***';

// Employee Table Component
const EmployeeTable = ({ employees, loading, isViewer, onSelect }) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-300">Loading employee data...</div>;
  }

  if (!employees || employees.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-300">No employee data available</div>;
  }

  return (
    <div className="h-125">
      <table className="w-full text-sm block overflow-auto max-h-[500px]">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Share (Employee)</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Share (Employer)</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total Payments</th>
            <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(emp)}
                    className="text-left font-semibold text-[#b45309] hover:text-[#92400e] underline decoration-dotted underline-offset-4"
                  >
                    {isViewer ? '***' : emp.name}
                  </button>
                ) : (
                  isViewer ? '***' : emp.name
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-[#10b981]">{isViewer ? '***' : formatPeso(getEeShare(emp))}</td>
              <td className="px-4 py-3 font-semibold text-[#3b82f6]">{isViewer ? '***' : formatPeso(getErShare(emp))}</td>
              <td className="px-4 py-3 font-bold text-[#dc2626]">{isViewer ? '***' : formatPeso(getEeShare(emp) + getErShare(emp))}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => generateEmployerReceipt(emp, isViewer)}
                  disabled={isViewer}
                  title={isViewer ? 'You are in viewing mode' : undefined}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1 rounded font-semibold transition-colors text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="bi bi-receipt mr-1" aria-hidden="true" />
                  Receipt
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
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const { employees, loading } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const totals = useMemo(() => {
    if (!employees || employees.length === 0) {
      return { sss: 0, pagibig: 0, philhealth: 0, eeShare: 0, erShare: 0 };
    }
    
    return {
      sss: employees.reduce((sum, emp) => sum + (emp.sss || 0), 0),
      pagibig: employees.reduce((sum, emp) => sum + (emp.pagibig || 0), 0),
      philhealth: employees.reduce((sum, emp) => sum + (emp.philhealth || 0), 0),
      eeShare: employees.reduce((sum, emp) => sum + getEeShare(emp), 0),
      erShare: employees.reduce((sum, emp) => sum + getErShare(emp), 0),
    };
  }, [employees]);

  return (
    <>
        <div>
            <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-2 dark:text-gray-100">Total Payments</h2>
            <p className="text-center text-sm md:text-base text-gray-600 dark:text-gray-300">(to be paid)</p>
        </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <StatusCard title="Total EE Share" value={isViewer ? '***' : formatPeso(totals.eeShare)}/>
        <StatusCard title="Total ER Share" value={isViewer ? '***' : formatPeso(totals.erShare)}/>
      </div>

      {/* Employee List */}
      <section className="bg-white p-4 md:p-8 rounded-lg shadow-md dark:bg-gray-900 dark:text-gray-100">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 dark:text-gray-100">Employee Directory</h3>
            <p className="text-gray-600 text-xs md:text-sm dark:text-gray-300">Recently active employees</p>
          </div>
        </div>

        <div className="relative">
          {loading && <LoadingOverlay message="Loading employees..." />}

          <EmployeeTable
            employees={employees}
            loading={loading}
            isViewer={isViewer}
            onSelect={(emp) => setSelectedEmployee(emp)}
          />
        </div>
      </section>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y pt-6 pb-24 md:items-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedEmployee(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg px-4 animate-fade-scale">
            <div className="bg-white rounded-xl border-2 border-[#e6a891] shadow-xl p-4 dark:bg-gray-900 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Employee Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                >
                  Close
                </button>
              </div>
              <EmployeeCard
                employee={selectedEmployee}
                isViewer={isViewer}
                maskText={maskText}
                maskNumber={maskNumber}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}