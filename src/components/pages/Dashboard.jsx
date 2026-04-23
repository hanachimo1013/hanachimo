import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEmployees } from '../../hooks/useEmployees';
import EmployeeCard from '../employee/EmployeeCard';
import { formatPeso, getEeShare, getErShare } from '../../utils/formatters';
import LoadingOverlay from '../ui/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';

const StatusCard = ({ title, value, color }) => (
  <div className="glass-card p-5 md:p-6 flex flex-col items-center justify-center min-h-28 md:h-36 hover:shadow-lg transition-shadow">
    <span className="text-[11px] md:text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{title}</span>
    <span className="text-2xl md:text-3xl font-bold break-words text-center" style={{ color: color || 'var(--accent-blue)' }}>{value}</span>
  </div>
);


// Function to generate PDF receipt for contribution totals
const generateEmployerReceipt = (employee, masked) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maskedText = '***';
  
  const formatPdfPhp = (value) => `PHP ${(Number(value) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.setFont(undefined, 'bold');
  doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('Contribution Totals Receipt', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Date: ${new Date().toLocaleDateString('en-PH')}`, 20, 40);
  doc.text(`Receipt No: ${Math.floor(Math.random() * 100000)}`, 20, 45);
  
  // Employee Info Table
  autoTable(doc, {
    startY: 55,
    body: [
      ['Employee ID', masked ? maskedText : (employee.id || '-')],
      ['Employee Name', masked ? maskedText : (employee.name || '-')],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
    margin: { left: 20 },
  });

  // Totals Table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Description', 'Amount']],
    body: [
      ['Employee Total (EE)', masked ? maskedText : formatPdfPhp(getEeShare(employee))],
      ['Employer Total (ER)', masked ? maskedText : formatPdfPhp(getErShare(employee))],
    ],
    foot: [['Grand Total', masked ? maskedText : formatPdfPhp(getEeShare(employee) + getErShare(employee))]],
    theme: 'striped',
    headStyles: { fillColor: [0, 122, 255] },
    footStyles: { fillColor: [0, 122, 255] },
    margin: { left: 20, right: 20 },
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('This receipt is for contribution records.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Open in new window
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
const EmployeeTable = ({ employees, loading, isViewer, onHistory }) => {
  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>Loading employee data…</div>;
  }

  if (!employees || employees.length === 0) {
    return <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No employee data available</div>;
  }

  return (
    <div className="overflow-x-auto md:h-full md:overflow-y-auto touch-pan-x custom-scrollbar glass-card" style={{ borderRadius: '14px' }}>
      <table className="w-full text-sm min-w-[1000px] apple-table">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">EE Total</th>
            <th className="px-4 py-3 text-left">ER Total</th>
            <th className="px-4 py-3 text-left">Total Payments</th>
            <th className="px-4 py-3 text-center">History</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                {isViewer ? '***' : emp.name}
              </td>
              <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent-green)' }}>{isViewer ? '***' : formatPeso(getEeShare(emp))}</td>
              <td className="px-4 py-3 font-semibold" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(getErShare(emp))}</td>
              <td className="px-4 py-3 font-bold" style={{ color: 'var(--accent-red)' }}>{isViewer ? '***' : formatPeso(getEeShare(emp) + getErShare(emp))}</td>
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
                <button
                  onClick={() => generateEmployerReceipt(emp, isViewer)}
                  disabled={isViewer}
                  title={isViewer ? 'You are in viewing mode' : undefined}
                  className="btn-apple px-3 py-1.5 text-xs text-white rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--accent-green)' }}
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
      sss: employees.reduce((sum, emp) => sum + (emp.sss_ee ?? 0), 0),
      pagibig: employees.reduce((sum, emp) => sum + (emp.pagibig_ee ?? 0), 0),
      philhealth: employees.reduce((sum, emp) => sum + (emp.philhealth_ee ?? 0), 0),
      eeShare: employees.reduce((sum, emp) => sum + getEeShare(emp), 0),
      erShare: employees.reduce((sum, emp) => sum + getErShare(emp), 0),
    };
  }, [employees]);

  useEffect(() => {
    let active = true;

    const loadValues = async () => {
      if (!selectedEmployee) return;

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

    if (selectedEmployee) {
      loadValues();
    } else {
       // Reset state locally avoiding synchronous effect update when possible,
       // but here we just leave it for when it's closed.
    }

    return () => {
      active = false;
    };
  }, [selectedEmployee, fetchEmployeeValues]);

  // Derived state to manage clearing selectedEmployee values history
  const [prevSelectedEmployee, setPrevSelectedEmployee] = useState(selectedEmployee);
  if (selectedEmployee !== prevSelectedEmployee) {
    setPrevSelectedEmployee(selectedEmployee);
    if (!selectedEmployee) {
      setValuesHistory([]);
      setValuesError(null);
      setValuesOffset(0);
      setValuesHasMore(false);
    }
  }

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
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Total Payments</h2>
        <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>(to be paid)</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusCard title="Total EE Share" value={isViewer ? '***' : formatPeso(totals.eeShare)} color="var(--accent-green)" />
        <StatusCard title="Total ER Share" value={isViewer ? '***' : formatPeso(totals.erShare)} color="var(--accent-blue)" />
      </div>

      {/* Employee List */}
      <section className="glass-card p-4 md:p-6 flex flex-col md:max-h-[calc(100vh-260px)] md:overflow-hidden min-h-0">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Employee Directory</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Recently active employees</p>
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
          {loading && <LoadingOverlay message="Loading employees..." />}

          <EmployeeTable
            employees={employees}
            loading={loading}
            isViewer={isViewer}
            onHistory={(emp) => setSelectedEmployee(emp)}
          />
        </div>
      </section>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y pt-6 pb-24 md:items-center animate-fade-in px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedEmployee(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg animate-fade-scale">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Employee Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="btn-apple px-3 py-1.5 text-xs rounded-lg"
                  style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
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

              <div className="mt-5">
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Values History</h4>
                {valuesLoading && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading values…</p>
                )}
                {valuesError && (
                  <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{valuesError}</p>
                )}
                {!valuesLoading && !valuesError && valuesHistory.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No values history yet.</p>
                )}
                {!valuesLoading && valuesHistory.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs apple-table">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <th className="py-2 text-left">Date</th>
                          <th className="py-2 text-left">EE Total</th>
                          <th className="py-2 text-left">ER Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {valuesHistory.map((row) => (
                          <tr key={row.id} style={{ borderTop: '1px solid var(--border-light)' }}>
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
                      className="btn-apple px-3 py-1.5 text-xs font-medium rounded-lg"
                      style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
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
