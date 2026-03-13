import React, { useEffect, useMemo, useState } from 'react';
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


// Function to generate PDF receipt for contribution totals
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
  doc.text('Contribution Totals Receipt', pageWidth / 2, 32, { align: 'center' });
  
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
  doc.text('Contribution Totals', 20, 102);
  
  // Table Headers
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('Description', 20, 115);
  doc.text('Amount', pageWidth - 40, 115, { align: 'right' });
  
  // Table content
  doc.setFont(undefined, 'normal');
  doc.text('Employee Total (EE)', 20, 125);
  doc.text(masked ? maskedText : formatPeso(getEeShare(employee)), pageWidth - 40, 125, { align: 'right' });
  
  doc.text('Employer Total (ER)', 20, 135);
  doc.text(masked ? maskedText : formatPeso(getErShare(employee)), pageWidth - 40, 135, { align: 'right' });
  
  // Divider
  doc.setDrawColor(100);
  doc.line(20, 142, pageWidth - 20, 142);
  
  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total ER Share', 20, 152);
  doc.text(masked ? maskedText : formatPeso(getErShare(employee)), pageWidth - 40, 152, { align: 'right' });
  
  // Footer
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('This receipt is for contribution records.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
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
const EmployeeTable = ({ employees, loading, isViewer, onSelect, onHistory }) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-300">Loading employee data...</div>;
  }

  if (!employees || employees.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-300">No employee data available</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Total</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Total</th>
            <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total Payments</th>
            <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">History</th>
            <th className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                {isViewer ? '***' : emp.name}
              </td>
              <td className="px-4 py-3 font-semibold text-[#10b981]">{isViewer ? '***' : formatPeso(getEeShare(emp))}</td>
              <td className="px-4 py-3 font-semibold text-[#3b82f6]">{isViewer ? '***' : formatPeso(getErShare(emp))}</td>
              <td className="px-4 py-3 font-bold text-[#dc2626]">{isViewer ? '***' : formatPeso(getEeShare(emp) + getErShare(emp))}</td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => onHistory?.(emp)}
                  className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-3 py-1 rounded font-semibold transition-colors text-xs"
                >
                  <i className="bi bi-clock-history mr-1" aria-hidden="true" />
                  History
                </button>
              </td>
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
  const { employees, loading, valuesLoading, fetchEmployeeValues } = useEmployees();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [valuesHistory, setValuesHistory] = useState([]);
  const [valuesError, setValuesError] = useState(null);
  const [valuesOffset, setValuesOffset] = useState(0);
  const [valuesHasMore, setValuesHasMore] = useState(false);
  const valuesPageSize = 10;

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

  useEffect(() => {
    let active = true;
    if (!selectedEmployee) {
      setValuesHistory([]);
      setValuesError(null);
      setValuesOffset(0);
      setValuesHasMore(false);
      return () => {};
    }

    const loadValues = async () => {
      const result = await fetchEmployeeValues(selectedEmployee, {
        limit: valuesPageSize,
        offset: 0,
      });
      if (!active) return;
      if (!result.success) {
        setValuesError(result.error || 'Failed to load values.');
        setValuesHistory([]);
        setValuesHasMore(false);
        return;
      }
      setValuesError(null);
      const rows = result.data || [];
      setValuesHistory(rows);
      setValuesHasMore(rows.length === valuesPageSize);
    };

    loadValues();
    return () => {
      active = false;
    };
  }, [selectedEmployee, fetchEmployeeValues]);

  const handleLoadMoreValues = async () => {
    if (!selectedEmployee) return;
    const nextOffset = valuesOffset + valuesPageSize;
    const result = await fetchEmployeeValues(selectedEmployee, {
      limit: valuesPageSize,
      offset: nextOffset,
    });
    if (!result.success) {
      setValuesError(result.error || 'Failed to load values.');
      return;
    }
    const rows = result.data || [];
    setValuesHistory((prev) => [...prev, ...rows]);
    setValuesOffset(nextOffset);
    setValuesHasMore(rows.length === valuesPageSize);
  };

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
      <section className="bg-white p-4 md:p-8 rounded-lg shadow-md dark:bg-gray-900 dark:text-gray-100 flex flex-col max-h-[calc(100vh-260px)] overflow-hidden">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 dark:text-gray-100">Employee Directory</h3>
            <p className="text-gray-600 text-xs md:text-sm dark:text-gray-300">Recently active employees</p>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {loading && <LoadingOverlay message="Loading employees..." />}

          <EmployeeTable
            employees={employees}
            loading={loading}
            isViewer={isViewer}
            onSelect={(emp) => setSelectedEmployee(emp)}
            onHistory={(emp) => setSelectedEmployee(emp)}
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

              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Values History</h4>
                {valuesLoading && (
                  <p className="text-xs text-gray-500 dark:text-gray-300">Loading values...</p>
                )}
                {valuesError && (
                  <p className="text-xs text-red-600 dark:text-red-300">{valuesError}</p>
                )}
                {!valuesLoading && !valuesError && valuesHistory.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-300">No values history yet.</p>
                )}
                {!valuesLoading && valuesHistory.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-300">
                          <th className="py-2">Date</th>
                          <th className="py-2">EE Total</th>
                          <th className="py-2">ER Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valuesHistory.map((row) => (
                          <tr key={row.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="py-2">{row.effective_date || '-'}</td>
                            <td className="py-2">{isViewer ? '***' : formatPeso(row.ee_total)}</td>
                            <td className="py-2">{isViewer ? '***' : formatPeso(row.er_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {!valuesLoading && valuesHasMore && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleLoadMoreValues}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
