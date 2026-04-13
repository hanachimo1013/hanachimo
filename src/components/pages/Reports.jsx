import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEmployees } from '../../hooks/useEmployees';
import { formatPeso, getEeShare, getErShare } from '../../utils/formatters';
import LoadingOverlay from '../ui/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const insuranceReportRef = useRef(null);
  const salaryReportRef = useRef(null);
  const { employees, loading } = useEmployees();
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  const normalizedEmployees = useMemo(
    () =>
      employees.map((emp) => ({
        ...emp,
        eeShare: getEeShare(emp),
        erShare: getErShare(emp),
        sss_ee: emp.sss_ee ?? 0,
        pagibig_ee: emp.pagibig_ee ?? 0,
        philhealth_ee: emp.philhealth_ee ?? 0,
      })),
    [employees]
  );

  // Calculate totals and distribution
  const calculateInsuranceReport = () => {
    const totals = {
      sss: normalizedEmployees.reduce((sum, emp) => sum + (emp.sss_ee || 0), 0),
      pagibig: normalizedEmployees.reduce((sum, emp) => sum + (emp.pagibig_ee || 0), 0),
      philhealth: normalizedEmployees.reduce((sum, emp) => sum + (emp.philhealth_ee || 0), 0),
    };
    
    const totalPayments = Object.values(totals).reduce((a, b) => a + b, 0);
    
    return { totals, totalPayments };
  };

  const calculateSalaryReport = () => {
    const eeTotal = normalizedEmployees.reduce((sum, emp) => sum + (emp.eeShare || 0), 0);
    const erTotal = normalizedEmployees.reduce((sum, emp) => sum + (emp.erShare || 0), 0);
    const totalPayments = eeTotal + erTotal;

    return { eeTotal, erTotal, totalPayments };
  };

  // Helper for PDF to avoid symbol issues
  const formatPdfPhp = (value) => `PHP ${(Number(value) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Print Insurance Report (Browser Print)
  const printInsuranceReport = () => {
    if (isViewer) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Insurance Totals Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { bg-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BDLAG UTILITY</h1>
            <h2>Insurance Totals Report</h2>
            <p>Generated: ${new Date().toLocaleDateString('en-PH')}</p>
          </div>
          ${insuranceReportRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Print Salary Report (Browser Print)
  const printSalaryReport = () => {
    if (isViewer) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contribution Totals Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { bg-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BDLAG UTILITY</h1>
            <h2>Contribution Totals Report</h2>
            <p>Generated: ${new Date().toLocaleDateString('en-PH')}</p>
          </div>
          ${salaryReportRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate Insurance Payment PDF Report
  const generateInsurancePaymentReport = async () => {
    if (isViewer) return;
    const { totals, totalPayments } = calculateInsuranceReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Insurance Totals Report', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 20, 38);
    
    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Insurance Type', 'Total Amount', 'Percentage']],
      body: [
        ['SSS', formatPdfPhp(totals.sss), `${((totals.sss / (totalPayments || 1)) * 100).toFixed(1)}%`],
        ['PAG-IBIG', formatPdfPhp(totals.pagibig), `${((totals.pagibig / (totalPayments || 1)) * 100).toFixed(1)}%`],
        ['PhilHealth', formatPdfPhp(totals.philhealth), `${((totals.philhealth / (totalPayments || 1)) * 100).toFixed(1)}%`],
      ],
      foot: [['Grand Total', formatPdfPhp(totalPayments), '100%']],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
    });

    // Employee Breakdown Section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Employee-wise Breakdown', 20, finalY);

    const tableData = normalizedEmployees.map(emp => [
      emp.name,
      formatPdfPhp(emp.sss_ee),
      formatPdfPhp(emp.pagibig_ee),
      formatPdfPhp(emp.philhealth_ee),
      formatPdfPhp(emp.sss_ee + emp.pagibig_ee + emp.philhealth_ee)
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Employee Name', 'SSS', 'PAG-IBIG', 'PhilHealth', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });
    
    const pdfUrl = doc.output('bloburi');
    window.open(pdfUrl);
  };

  // Generate Salary Distribution PDF Report
  const generateSalaryDistributionReport = () => {
    if (isViewer) return;
    const { eeTotal, erTotal, totalPayments } = calculateSalaryReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Contribution Totals Distribution Report', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 20, 38);
    
    // Summary Table
    autoTable(doc, {
      startY: 45,
      head: [['Category', 'Total Amount', 'Share %']],
      body: [
        ['Employee Total (EE)', formatPdfPhp(eeTotal), `${((eeTotal / (totalPayments || 1)) * 100).toFixed(1)}%`],
        ['Employer Total (ER)', formatPdfPhp(erTotal), `${((erTotal / (totalPayments || 1)) * 100).toFixed(1)}%`],
      ],
      foot: [['Grand Total', formatPdfPhp(totalPayments), '100%']],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 },
    });

    // Employee Breakdown Section
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Employee Breakdown', 20, finalY);

    const tableData = normalizedEmployees.map(emp => [
      emp.name,
      formatPdfPhp(emp.eeShare),
      formatPdfPhp(emp.erShare),
      formatPdfPhp(emp.eeShare + emp.erShare)
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Employee Name', 'EE Total', 'ER Total', 'Grand Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });
    
    const pdfUrl = doc.output('bloburi');
    window.open(pdfUrl);
  };

  const { totals, totalPayments } = calculateInsuranceReport();
  const salaryData = calculateSalaryReport();
  const maskedTotals = isViewer
    ? { sss: 0, pagibig: 0, philhealth: 0, totalPayments: 1 }
    : { ...totals, totalPayments };
  const maskedSalaryData = isViewer
    ? { eeTotal: 0, erTotal: 0, totalPayments: 1 }
    : salaryData;

  if (loading) {
    return (
      <div className="glass-card p-6 md:p-8 flex flex-col relative">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Reports</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Generate and view insurance and salary distribution reports</p>
        </div>
        <div className="h-64 rounded-xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light)' }} />
        <LoadingOverlay message="Loading reports..." />
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>No employee data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 md:p-6 flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Reports</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generate and view insurance and salary distribution reports</p>
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
          <div 
            onClick={() => setSelectedReport('insurance')}
            className="glass-subtle rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer flex flex-col text-center"
          >
            <div className="mb-3 flex justify-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--accent-blue)' }}>
                <i className="bi bi-clipboard2-pulse" aria-hidden="true" />
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Insurance Totals Report</h3>
            <p className="text-sm mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>Overall total and detailed distribution of SSS, PAG-IBIG, and PhilHealth</p>
            <button className="btn-apple self-center px-5 py-2 text-white text-sm rounded-xl" style={{ background: 'var(--accent-blue)' }}>View Report</button>
          </div>

          <div 
            onClick={() => setSelectedReport('salary')}
            className="glass-subtle rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer flex flex-col text-center"
          >
            <div className="mb-3 flex justify-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--accent-green)' }}>
                <i className="bi bi-cash-coin" aria-hidden="true" />
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Contribution Totals Report</h3>
            <p className="text-sm mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>Employee and employer totals breakdown</p>
            <button className="btn-apple self-center px-5 py-2 text-white text-sm rounded-xl" style={{ background: 'var(--accent-green)' }}>View Report</button>
          </div>
        </div>
      ) : selectedReport === 'insurance' ? (
        <div className="mb-8">
          <button onClick={() => setSelectedReport(null)} className="btn-apple px-4 py-2 rounded-xl text-sm font-medium mb-6" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
            <i className="bi bi-arrow-left mr-2" aria-hidden="true" /> Back to Reports
          </button>
          
          <div ref={insuranceReportRef}>
            <h3 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Insurance Totals Report</h3>
            
            <div className="glass-subtle rounded-2xl p-6 mb-6">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Overall Insurance Totals</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(maskedTotals.totalPayments)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-3">
              <div className="glass-subtle rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-1 dark:text-gray-400">SSS</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{isViewer ? '***' : formatPeso(maskedTotals.sss)}</p>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-3 dark:bg-gray-700">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(totals.sss / (totalPayments || 1) * 100)}%` }} />
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <p className="text-gray-500 text-sm mb-1 dark:text-gray-400">PAG-IBIG</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{isViewer ? '***' : formatPeso(maskedTotals.pagibig)}</p>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-3 dark:bg-gray-700">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${(totals.pagibig / (totalPayments || 1) * 100)}%` }} />
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <p className="text-gray-500 text-sm mb-1 dark:text-gray-400">PhilHealth</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{isViewer ? '***' : formatPeso(maskedTotals.philhealth)}</p>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-3 dark:bg-gray-700">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(totals.philhealth / (totalPayments || 1) * 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Employee</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">SSS</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PAG-IBIG</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PhilHealth</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{isViewer ? '***' : formatPeso(emp.sss_ee)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{isViewer ? '***' : formatPeso(emp.pagibig_ee)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{isViewer ? '***' : formatPeso(emp.philhealth_ee)}</td>
                      <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{isViewer ? '***' : formatPeso(emp.sss_ee + emp.pagibig_ee + emp.philhealth_ee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[350px]">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Insurance Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'SSS', value: totals.sss },
                        { name: 'PAG-IBIG', value: totals.pagibig },
                        { name: 'PhilHealth', value: totals.philhealth }
                      ]}
                      cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} fill="#8884d8" dataKey="value"
                    >
                      <Cell fill="#3b82f6" /><Cell fill="#10b981" /><Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[350px]">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">By Employee</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? [] : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Bar dataKey="sss_ee" stackId="a" fill="#3b82f6" name="SSS" />
                    <Bar dataKey="pagibig_ee" stackId="a" fill="#10b981" name="PAG-IBIG" />
                    <Bar dataKey="philhealth_ee" stackId="a" fill="#8b5cf6" name="PhilHealth" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={printInsuranceReport} className="btn-apple px-5 py-2 text-sm rounded-xl font-medium" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
              Print Report
            </button>
            <button onClick={generateInsurancePaymentReport} className="btn-apple px-5 py-2 text-sm text-white rounded-xl font-semibold" style={{ background: 'var(--accent-blue)' }}>
              Download PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <button onClick={() => setSelectedReport(null)} className="btn-apple px-4 py-2 rounded-xl text-sm font-medium mb-6" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
            <i className="bi bi-arrow-left mr-2" aria-hidden="true" /> Back to Reports
          </button>
          
          <div ref={salaryReportRef}>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Contribution Totals Report</h3>
            
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-lg shadow-sm mb-6 dark:from-gray-800 dark:to-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-emerald-700 text-sm mb-1 dark:text-emerald-300">EE Total</p>
                  <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-100">{isViewer ? '***' : formatPeso(maskedSalaryData.eeTotal)}</p>
                </div>
                <div>
                  <p className="text-blue-700 text-sm mb-1 dark:text-blue-300">ER Total</p>
                  <p className="text-3xl font-bold text-blue-800 dark:text-blue-100">{isViewer ? '***' : formatPeso(maskedSalaryData.erTotal)}</p>
                </div>
                <div>
                  <p className="text-red-700 text-sm mb-1 dark:text-red-300">Grand Total</p>
                  <p className="text-3xl font-bold text-red-800 dark:text-red-100">{isViewer ? '***' : formatPeso(maskedSalaryData.totalPayments)}</p>
                </div>
              </div>
            </div>

            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Employee</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Share</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Share</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors dark:border-gray-800 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{isViewer ? '***' : formatPeso(emp.eeShare)}</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">{isViewer ? '***' : formatPeso(emp.erShare)}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100">{isViewer ? '***' : formatPeso(emp.eeShare + emp.erShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[350px]">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">EE vs ER Share</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'EE', value: salaryData.eeTotal },
                        { name: 'ER', value: salaryData.erTotal }
                      ]}
                      cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} fill="#8884d8" dataKey="value"
                    >
                      <Cell fill="#10b981" /><Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700 min-h-[350px]">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">By Employee</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? [] : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Bar dataKey="eeShare" fill="#10b981" name="EE Total" />
                    <Bar dataKey="erShare" fill="#3b82f6" name="ER Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={printSalaryReport} className="btn-apple px-5 py-2 text-sm rounded-xl font-medium" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
              Print Report
            </button>
            <button onClick={generateSalaryDistributionReport} className="btn-apple px-5 py-2 text-sm text-white rounded-xl font-semibold" style={{ background: 'var(--accent-green)' }}>
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
