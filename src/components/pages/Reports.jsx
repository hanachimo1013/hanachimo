import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
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
      })),
    [employees]
  );

  // Calculate totals and distribution
  const calculateInsuranceReport = () => {
    const totals = {
      sss: normalizedEmployees.reduce((sum, emp) => sum + (emp.sss || 0), 0),
      pagibig: normalizedEmployees.reduce((sum, emp) => sum + (emp.pagibig || 0), 0),
      philhealth: normalizedEmployees.reduce((sum, emp) => sum + (emp.philhealth || 0), 0),
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

  // Print Insurance Report
  const printInsuranceReport = () => {
    if (isViewer) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(insuranceReportRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Print Salary Report
  const printSalaryReport = () => {
    if (isViewer) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(salaryReportRef.current.innerHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate Insurance Payment PDF Report
  const generateInsurancePaymentReport = async () => {
    if (isViewer) return;
    const { totals, totalPayments } = calculateInsuranceReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Insurance Payment Report', pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 20, 45);
    
    // Divider
    doc.setDrawColor(200);
    doc.line(20, 50, pageWidth - 20, 50);
    
    // Overall Total
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Overall Total Insurance Payments', 20, 62);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Total: ${formatPeso(totalPayments)}`, 30, 72);
    
    // Divider
    doc.line(20, 80, pageWidth - 20, 80);
    
    // Detailed Distribution
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Detailed Payment Distribution', 20, 90);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let yPosition = 105;
    
    const distributions = [
      { name: 'SSS', amount: totals.sss, percentage: ((totals.sss / totalPayments) * 100).toFixed(2) },
      { name: 'PAG-IBIG', amount: totals.pagibig, percentage: ((totals.pagibig / totalPayments) * 100).toFixed(2) },
      { name: 'PhilHealth', amount: totals.philhealth, percentage: ((totals.philhealth / totalPayments) * 100).toFixed(2) },
    ];
    
    distributions.forEach((dist) => {
      doc.text(`${dist.name}:`, 30, yPosition);
      doc.text(`${formatPeso(dist.amount)} (${dist.percentage}%)`, 80, yPosition);
      yPosition += 10;
    });
    
    // Employee Breakdown Table
    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Employee-wise Breakdown', 20, yPosition);
    
    yPosition += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Employee', 20, yPosition);
    doc.text('SSS', 60, yPosition);
    doc.text('PAG-IBIG', 85, yPosition);
    doc.text('PhilHealth', 115, yPosition);
    doc.text('Total', 150, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    normalizedEmployees.forEach((emp) => {
      const empTotal = emp.sss + emp.pagibig + emp.philhealth;
      doc.text(emp.name.substring(0, 15), 20, yPosition);
      doc.text(formatPeso(emp.sss), 60, yPosition);
      doc.text(formatPeso(emp.pagibig), 85, yPosition);
      doc.text(formatPeso(emp.philhealth), 115, yPosition);
      doc.text(formatPeso(empTotal), 150, yPosition);
      yPosition += 7;
    });
    
    // Open in new window for printing
    const pdfUrl = doc.output('bloburi');
    window.open(pdfUrl);
  };

  // Generate Salary Distribution PDF Report
  const generateSalaryDistributionReport = () => {
    if (isViewer) return;
    const { eeTotal, erTotal, totalPayments } = calculateSalaryReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('BDLAG UTILITY', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Salary and Share Distribution Report', pageWidth / 2, 32, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString()}`, 20, 45);
    
    // Divider
    doc.setDrawColor(200);
    doc.line(20, 50, pageWidth - 20, 50);
    
    // Overall Summary
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Overall Summary', 20, 62);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Employee Share (EE) Total: ${formatPeso(eeTotal)}`, 30, 72);
    doc.text(`Employer Share (ER) Total: ${formatPeso(erTotal)}`, 30, 82);
    doc.text(`Grand Total: ${formatPeso(totalPayments)}`, 30, 95);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const eePercentage = ((eeTotal / totalPayments) * 100).toFixed(2);
    const erPercentage = ((erTotal / totalPayments) * 100).toFixed(2);
    doc.text(`EE: ${eePercentage}% | ER: ${erPercentage}%`, 30, 105);
    
    // Divider
    doc.line(20, 112, pageWidth - 20, 112);
    
    // Employee Details Table
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Employee Details', 20, 122);
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    let yPosition = 132;
    doc.text('Employee', 20, yPosition);
    doc.text('EE Share', 70, yPosition);
    doc.text('ER Share', 110, yPosition);
    doc.text('Total', 150, yPosition);
    
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    
    normalizedEmployees.forEach((emp) => {
      doc.text(emp.name.substring(0, 18), 20, yPosition);
      doc.text(formatPeso(emp.eeShare), 70, yPosition);
      doc.text(formatPeso(emp.erShare), 110, yPosition);
      doc.text(formatPeso(emp.eeShare + emp.erShare), 150, yPosition);
      yPosition += 7;
    });
    
    // Open in new window for printing
    const pdfUrl = doc.output('bloburi');
    window.open(pdfUrl);
  };

  const { totals, totalPayments } = calculateInsuranceReport();
  const salaryData = calculateSalaryReport();
  const maskedTotals = isViewer
    ? { sss: 0, pagibig: 0, philhealth: 0, totalPayments: 0 }
    : { sss: totals.sss, pagibig: totals.pagibig, philhealth: totals.philhealth, totalPayments };
  const maskedSalaryData = isViewer
    ? { eeTotal: 0, erTotal: 0, totalPayments: 0 }
    : salaryData;

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md flex flex-col relative dark:bg-gray-900 dark:text-gray-100">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 dark:text-gray-100">Reports</h2>
          <p className="text-gray-600 dark:text-gray-300">Generate and view insurance and salary distribution reports</p>
        </div>
        <div className="h-64 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
        <LoadingOverlay message="Loading reports..." />
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 text-lg">No employee data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md flex flex-col dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 dark:text-gray-100">Reports</h2>
        <p className="text-gray-600 dark:text-gray-300">Generate and view insurance and salary distribution reports</p>
      </div>

      {!selectedReport ? (
        <>
          {/* Report Selection Grid */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 sm:gap-6">
            <div 
              onClick={() => setSelectedReport('insurance')}
              className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#d97706] hover:shadow-lg transition-all cursor-pointer flex flex-col text-center dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex justify-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                  <i className="bi bi-clipboard2-pulse" aria-hidden="true" />
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-gray-100">Insurance Payment Report</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1 dark:text-gray-300">Overall total and detailed distribution of SSS, PAG-IBIG, and PhilHealth</p>
              <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg font-medium transition-all">
                <i className="bi bi-graph-up mr-2" aria-hidden="true" />
                View Report
              </button>
            </div>

            <div 
              onClick={() => setSelectedReport('salary')}
              className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#d97706] hover:shadow-lg transition-all cursor-pointer flex flex-col text-center dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex justify-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-300">
                  <i className="bi bi-cash-coin" aria-hidden="true" />
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 dark:text-gray-100">Salary Distribution Report</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1 dark:text-gray-300">Employee and Employer share breakdown with totals</p>
              <button className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-all">
                <i className="bi bi-graph-up-arrow mr-2" aria-hidden="true" />
                View Report
              </button>
            </div>
          </div>
        </>
      ) : selectedReport === 'insurance' ? (
        <>
          {/* Insurance Payment Report */}
          <div ref={insuranceReportRef} className="mb-8">
            <button
              onClick={() => setSelectedReport(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all mb-4"
            >
              <i className="bi bi-arrow-left mr-2" aria-hidden="true" />
              Back to Reports
            </button>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Insurance Payment Report</h3>
            
            {/* Overall Total */}
            <div className="bg-gradient-to-r from-[#f2dede] to-[#fce4ec] p-6 rounded-lg shadow-md mb-6 dark:from-gray-800 dark:to-gray-900">
              <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">Overall Total Insurance Payments</p>
              <p className="text-4xl font-bold text-[#dc2626] dark:text-red-300">{isViewer ? '***' : formatPeso(maskedTotals.totalPayments)}</p>
            </div>

            {/* Distribution Breakdown */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <div className="bg-blue-50 border-l-4 border-[#3b82f6] p-6 rounded dark:bg-gray-800">
                <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">SSS</p>
                <p className="text-2xl font-bold text-[#3b82f6] dark:text-blue-300">{isViewer ? '***' : formatPeso(maskedTotals.sss)}</p>
                <p className="text-xs text-gray-600 mt-2 dark:text-gray-300">({isViewer ? '0.0' : ((totals.sss / totalPayments) * 100).toFixed(1)}%)</p>
              </div>
              <div className="bg-green-50 border-l-4 border-[#10b981] p-6 rounded dark:bg-gray-800">
                <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">PAG-IBIG</p>
                <p className="text-2xl font-bold text-[#10b981] dark:text-emerald-300">{isViewer ? '***' : formatPeso(maskedTotals.pagibig)}</p>
                <p className="text-xs text-gray-600 mt-2 dark:text-gray-300">({isViewer ? '0.0' : ((totals.pagibig / totalPayments) * 100).toFixed(1)}%)</p>
              </div>
              <div className="bg-purple-50 border-l-4 border-[#8b5cf6] p-6 rounded dark:bg-gray-800">
                <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">PhilHealth</p>
                <p className="text-2xl font-bold text-[#8b5cf6] dark:text-purple-300">{isViewer ? '***' : formatPeso(maskedTotals.philhealth)}</p>
                <p className="text-xs text-gray-600 mt-2 dark:text-gray-300">({isViewer ? '0.0' : ((totals.philhealth / totalPayments) * 100).toFixed(1)}%)</p>
              </div>
            </div>

            {/* Employee Details Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#e6a891] bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Employee</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">SSS</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PAG-IBIG</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PhilHealth</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{isViewer ? '***' : formatPeso(emp.sss)}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{isViewer ? '***' : formatPeso(emp.pagibig)}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{isViewer ? '***' : formatPeso(emp.philhealth)}</td>
                      <td className="px-4 py-3 font-bold text-[#dc2626]">{isViewer ? '***' : formatPeso((emp.sss || 0) + (emp.pagibig || 0) + (emp.philhealth || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 mb-6 mt-6 md:grid-cols-2 md:gap-6">
              {/* Pie Chart */}
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm min-h-[340px]">
                <h4 className="font-bold text-gray-800 mb-4">Distribution by Insurance Type</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'SSS', value: totals.sss },
                        { name: 'PAG-IBIG', value: totals.pagibig },
                        { name: 'PhilHealth', value: totals.philhealth }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm min-h-[340px]">
                <h4 className="font-bold text-gray-800 mb-4">Employee Contributions</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? normalizedEmployees.map((emp) => ({ ...emp, sss: 0, pagibig: 0, philhealth: 0, name: '***' })) : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Legend />
                    <Bar dataKey="sss" stackId="a" fill="#3b82f6" name="SSS" />
                    <Bar dataKey="pagibig" stackId="a" fill="#10b981" name="PAG-IBIG" />
                    <Bar dataKey="philhealth" stackId="a" fill="#8b5cf6" name="PhilHealth" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={printInsuranceReport}
                disabled={isViewer}
                title={isViewer ? 'You are in viewing mode' : undefined}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                <i className="bi bi-printer mr-2" aria-hidden="true" />
                Print Report
              </button>
              <button
                onClick={generateInsurancePaymentReport}
                disabled={isViewer}
                title={isViewer ? 'You are in viewing mode' : undefined}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                <i className="bi bi-download mr-2" aria-hidden="true" />
                Download PDF Report
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Salary Distribution Report */}
          <div ref={salaryReportRef} className="mb-8">
            <button
              onClick={() => setSelectedReport(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all mb-4"
            >
              <i className="bi bi-arrow-left mr-2" aria-hidden="true" />
              Back to Reports
            </button>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 dark:text-white">Salary Distribution Report</h3>
            
            {/* Overall Summary */}
            <div className="bg-gradient-to-r from-[#f2dede] to-[#fce4ec] p-6 rounded-lg shadow-md mb-6 dark:from-gray-800 dark:to-gray-900">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">Employee Share (EE) Total</p>
                  <p className="text-2xl font-bold text-[#10b981] dark:text-emerald-300">{isViewer ? '***' : formatPeso(maskedSalaryData.eeTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">Employer Share (ER) Total</p>
                  <p className="text-2xl font-bold text-[#3b82f6] dark:text-blue-300">{isViewer ? '***' : formatPeso(maskedSalaryData.erTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">Grand Total</p>
                  <p className="text-2xl font-bold text-[#dc2626] dark:text-red-300">{isViewer ? '***' : formatPeso(maskedSalaryData.totalPayments)}</p>
                </div>
              </div>
            </div>

            {/* Share Distribution */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div className="bg-green-50 border-l-4 border-[#10b981] p-6 rounded dark:bg-gray-800">
                <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">EE Share Percentage</p>
                <p className="text-3xl font-bold text-[#10b981] dark:text-emerald-300">{isViewer ? '0.0%' : ((salaryData.eeTotal / salaryData.totalPayments) * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-[#3b82f6] p-6 rounded dark:bg-gray-800">
                <p className="text-gray-600 text-sm mb-2 dark:text-gray-300">ER Share Percentage</p>
                <p className="text-3xl font-bold text-[#3b82f6] dark:text-blue-300">{isViewer ? '0.0%' : ((salaryData.erTotal / salaryData.totalPayments) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Employee Details Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#e6a891] bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Employee</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Share</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Share</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3 text-[#10b981] font-semibold">{isViewer ? '***' : formatPeso(emp.eeShare)}</td>
                      <td className="px-4 py-3 text-[#3b82f6] font-semibold">{isViewer ? '***' : formatPeso(emp.erShare)}</td>
                      <td className="px-4 py-3 font-bold text-[#dc2626]">{isViewer ? '***' : formatPeso(emp.eeShare + emp.erShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 mb-6 mt-6 md:grid-cols-2 md:gap-6">
              {/* Pie Chart */}
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm min-h-[340px]">
                <h4 className="font-bold text-gray-800 mb-4">EE vs ER Share Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                  <Pie
                    data={[
                      { name: 'EE Share', value: isViewer ? 0 : salaryData.eeTotal },
                      { name: 'ER Share', value: isViewer ? 0 : salaryData.erTotal }
                    ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm min-h-[340px]">
                <h4 className="font-bold text-gray-800 mb-4">Employee Share Comparison</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? normalizedEmployees.map((emp) => ({ ...emp, eeShare: 0, erShare: 0, name: '***' })) : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Legend />
                    <Bar dataKey="eeShare" fill="#10b981" name="EE Share" />
                    <Bar dataKey="erShare" fill="#3b82f6" name="ER Share" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={printSalaryReport}
                disabled={isViewer}
                title={isViewer ? 'You are in viewing mode' : undefined}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                <i className="bi bi-printer mr-2" aria-hidden="true" />
                Print Report
              </button>
              <button
                onClick={generateSalaryDistributionReport}
                disabled={isViewer}
                title={isViewer ? 'You are in viewing mode' : undefined}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                <i className="bi bi-download mr-2" aria-hidden="true" />
                Download PDF Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
