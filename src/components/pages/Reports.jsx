import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEmployees } from '../../hooks/useEmployees';
import { formatPeso, getEeShare, getErShare } from '../../utils/formatters';
import LoadingOverlay from '../ui/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';

const ACTION_COLORS = {
  CREATE: 'var(--accent-green)',
  UPDATE: 'var(--accent-blue)',
  DELETE: 'var(--accent-red)',
  VALUE_CHANGE: 'var(--accent-purple)',
};

const ACTION_ICONS = {
  CREATE: 'bi-plus-circle-fill',
  UPDATE: 'bi-pencil-fill',
  DELETE: 'bi-trash-fill',
  VALUE_CHANGE: 'bi-arrow-repeat',
};

function formatLogDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const insuranceReportRef = useRef(null);
  const salaryReportRef = useRef(null);
  const { employees, loading, fetchSystemLogs, fetchEmployeeValues } = useEmployees();
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsOffset, setLogsOffset] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const LOGS_LIMIT = 20;

  const loadLogs = useCallback(async (offset = 0, append = false) => {
    setLogsLoading(true);
    const result = await fetchSystemLogs({ limit: LOGS_LIMIT, offset });
    if (result.success) {
      const newLogs = result.data || [];
      setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
      setHasMoreLogs(newLogs.length >= LOGS_LIMIT);
      setLogsOffset(offset + newLogs.length);
    }
    setLogsLoading(false);
  }, [fetchSystemLogs]);

  // Load logs when switching to logs view
  useEffect(() => {
    if (selectedReport === 'logs') {
      loadLogs(0, false);
    }
  }, [selectedReport, loadLogs]);

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

  const formatPdfPhp = (value) => `PHP ${(Number(value) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ──────────────────────────────────────────────
  // Helper: append Values History pages to a jsPDF doc
  // ──────────────────────────────────────────────
  const appendValuesHistory = async (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('Values History', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Past contribution records per employee', pageWidth / 2, 28, { align: 'center' });

    let currentY = 38;

    for (const emp of normalizedEmployees) {
      const result = await fetchEmployeeValues(emp, { limit: 50 });
      const history = result.success ? (result.data || []) : [];
      if (history.length === 0) continue;

      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'bold');
      doc.text(`${emp.name}  (${emp.designation || '—'})`, 20, currentY);
      currentY += 3;

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'EE Total', 'ER Total', 'SSS (EE)', 'PAG-IBIG (EE)', 'PhilHealth (EE)']],
        body: history.map(row => [
          row.effective_date || '—',
          formatPdfPhp(row.ee_total),
          formatPdfPhp(row.er_total),
          formatPdfPhp(row.sss_ee),
          formatPdfPhp(row.pagibig_ee),
          formatPdfPhp(row.philhealth_ee),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 110], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        margin: { left: 20, right: 20 },
        didDrawPage: () => {
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }
  };

  // ──────────────────────────────────────────────
  // UNIFIED: Generate PDF (Insurance)
  // ──────────────────────────────────────────────
  const generateInsurancePdf = async () => {
    if (isViewer) return;
    const { totals, totalPayments } = calculateInsuranceReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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
      headStyles: { fillColor: [0, 122, 255] },
      footStyles: { fillColor: [0, 122, 255] },
      margin: { left: 20, right: 20 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Employee-wise Breakdown', 20, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Employee Name', 'SSS', 'PAG-IBIG', 'PhilHealth', 'Total']],
      body: normalizedEmployees.map(emp => [
        emp.name,
        formatPdfPhp(emp.sss_ee),
        formatPdfPhp(emp.pagibig_ee),
        formatPdfPhp(emp.philhealth_ee),
        formatPdfPhp(emp.sss_ee + emp.pagibig_ee + emp.philhealth_ee)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Append values history
    await appendValuesHistory(doc);

    const pdfUrl = doc.output('bloburi');
    window.open(pdfUrl);
  };

  // ──────────────────────────────────────────────
  // UNIFIED: Generate PDF (Contribution Totals)
  // ──────────────────────────────────────────────
  const generateContributionPdf = async () => {
    if (isViewer) return;
    const { eeTotal, erTotal, totalPayments } = calculateSalaryReport();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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

    autoTable(doc, {
      startY: 45,
      head: [['Category', 'Total Amount', 'Share %']],
      body: [
        ['Employee Total (EE)', formatPdfPhp(eeTotal), `${((eeTotal / (totalPayments || 1)) * 100).toFixed(1)}%`],
        ['Employer Total (ER)', formatPdfPhp(erTotal), `${((erTotal / (totalPayments || 1)) * 100).toFixed(1)}%`],
      ],
      foot: [['Grand Total', formatPdfPhp(totalPayments), '100%']],
      theme: 'striped',
      headStyles: { fillColor: [52, 199, 89] },
      footStyles: { fillColor: [52, 199, 89] },
      margin: { left: 20, right: 20 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text('Employee Breakdown', 20, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Employee Name', 'EE Total', 'ER Total', 'Grand Total']],
      body: normalizedEmployees.map(emp => [
        emp.name,
        formatPdfPhp(emp.eeShare),
        formatPdfPhp(emp.erShare),
        formatPdfPhp(emp.eeShare + emp.erShare)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Append values history
    await appendValuesHistory(doc);

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

  // ──────────────────────────────────────────────
  // RENDER: Logs view
  // ──────────────────────────────────────────────
  const renderLogsView = () => (
    <div className="mb-8">
      <button onClick={() => setSelectedReport(null)} className="btn-apple px-4 py-2 rounded-xl text-sm font-medium mb-6" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
        <i className="bi bi-arrow-left mr-2" aria-hidden="true" /> Back to Reports
      </button>

      <h3 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>System Logs</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Activity history of employee records and system changes
      </p>

      {logsLoading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="google-dots">
            <span /><span /><span /><span />
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-subtle rounded-2xl p-10 text-center">
          <i className="bi bi-clock-history text-3xl mb-3 block" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No activity logs yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Logs will appear here when employee records are created, updated, or deleted.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="glass-subtle rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all">
                <div className="shrink-0 mt-0.5">
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white text-xs"
                    style={{ background: ACTION_COLORS[log.action] || 'var(--text-tertiary)' }}
                  >
                    <i className={`bi ${ACTION_ICONS[log.action] || 'bi-record'}`} aria-hidden="true" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ background: `color-mix(in srgb, ${ACTION_COLORS[log.action] || 'gray'} 15%, transparent)`, color: ACTION_COLORS[log.action] || 'var(--text-tertiary)' }}>
                      {log.action}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {log.entity_type}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {isViewer ? '***' : (log.entity_name || 'System')}
                  </p>
                  {log.details && Object.keys(log.details).length > 0 && !isViewer && (
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {Object.entries(log.details).slice(0, 4).map(([key, val]) => (
                        <span key={key}>{key.replace(/_/g, ' ')}: <strong style={{ color: 'var(--text-secondary)' }}>{String(val)}</strong></span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatLogDate(log.created_at)}</p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>by {isViewer ? '***' : log.performed_by}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMoreLogs && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => loadLogs(logsOffset, true)}
                disabled={logsLoading}
                className="btn-apple px-5 py-2 text-sm rounded-xl font-medium"
                style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
              >
                {logsLoading ? (
                  <span className="google-dots google-dots--button"><span /><span /><span /><span /></span>
                ) : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="glass-card p-4 md:p-6 flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Reports</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generate and view insurance and salary distribution reports</p>
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Insurance Report Card */}
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

          {/* Contribution Report Card */}
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

          {/* System Logs Card */}
          <div 
            onClick={() => setSelectedReport('logs')}
            className="glass-subtle rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer flex flex-col text-center"
          >
            <div className="mb-3 flex justify-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: 'rgba(175, 82, 222, 0.1)', color: 'var(--accent-purple)' }}>
                <i className="bi bi-clock-history" aria-hidden="true" />
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>System Logs</h3>
            <p className="text-sm mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>Activity history of employee records and system changes</p>
            <button className="btn-apple self-center px-5 py-2 text-white text-sm rounded-xl" style={{ background: 'var(--accent-purple)' }}>View Logs</button>
          </div>
        </div>

      ) : selectedReport === 'logs' ? (
        renderLogsView()

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
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>SSS</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(maskedTotals.sss)}</p>
                <div className="w-full h-2 rounded-full mt-3" style={{ background: 'var(--border-light)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${(totals.sss / (totalPayments || 1) * 100)}%`, background: 'var(--accent-blue)' }} />
                </div>
              </div>
              <div className="glass-subtle rounded-xl p-5">
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>PAG-IBIG</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>{isViewer ? '***' : formatPeso(maskedTotals.pagibig)}</p>
                <div className="w-full h-2 rounded-full mt-3" style={{ background: 'var(--border-light)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${(totals.pagibig / (totalPayments || 1) * 100)}%`, background: 'var(--accent-green)' }} />
                </div>
              </div>
              <div className="glass-subtle rounded-xl p-5">
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>PhilHealth</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>{isViewer ? '***' : formatPeso(maskedTotals.philhealth)}</p>
                <div className="w-full h-2 rounded-full mt-3" style={{ background: 'var(--border-light)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${(totals.philhealth / (totalPayments || 1) * 100)}%`, background: 'var(--accent-purple)' }} />
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm apple-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">SSS</th>
                    <th className="px-4 py-3 text-left">PAG-IBIG</th>
                    <th className="px-4 py-3 text-left">PhilHealth</th>
                    <th className="px-4 py-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{isViewer ? '***' : formatPeso(emp.sss_ee)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{isViewer ? '***' : formatPeso(emp.pagibig_ee)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{isViewer ? '***' : formatPeso(emp.philhealth_ee)}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(emp.sss_ee + emp.pagibig_ee + emp.philhealth_ee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
              <div className="glass-subtle rounded-2xl p-4 min-h-[350px]">
                <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Insurance Distribution</h4>
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
                      <Cell fill="#007AFF" /><Cell fill="#34C759" /><Cell fill="#AF52DE" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-subtle rounded-2xl p-4 min-h-[350px]">
                <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>By Employee</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? [] : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Bar dataKey="sss_ee" stackId="a" fill="#007AFF" name="SSS" />
                    <Bar dataKey="pagibig_ee" stackId="a" fill="#34C759" name="PAG-IBIG" />
                    <Bar dataKey="philhealth_ee" stackId="a" fill="#AF52DE" name="PhilHealth" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Single Generate PDF button */}
          <div className="flex justify-center">
            <button onClick={generateInsurancePdf} className="btn-apple px-6 py-2.5 text-sm text-white rounded-xl font-semibold" style={{ background: 'var(--accent-blue)' }}>
              <i className="bi bi-file-earmark-pdf mr-2" aria-hidden="true" />
              Generate PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <button onClick={() => setSelectedReport(null)} className="btn-apple px-4 py-2 rounded-xl text-sm font-medium mb-6" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
            <i className="bi bi-arrow-left mr-2" aria-hidden="true" /> Back to Reports
          </button>
          
          <div ref={salaryReportRef}>
            <h3 className="text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Contribution Totals Report</h3>
            
            <div className="glass-subtle rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>EE Total</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>{isViewer ? '***' : formatPeso(maskedSalaryData.eeTotal)}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>ER Total</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(maskedSalaryData.erTotal)}</p>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Grand Total</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--accent-red)' }}>{isViewer ? '***' : formatPeso(maskedSalaryData.totalPayments)}</p>
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm apple-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">EE Share</th>
                    <th className="px-4 py-3 text-left">ER Share</th>
                    <th className="px-4 py-3 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{isViewer ? '***' : emp.name}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent-green)' }}>{isViewer ? '***' : formatPeso(emp.eeShare)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--accent-blue)' }}>{isViewer ? '***' : formatPeso(emp.erShare)}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{isViewer ? '***' : formatPeso(emp.eeShare + emp.erShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
              <div className="glass-subtle rounded-2xl p-4 min-h-[350px]">
                <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>EE vs ER Share</h4>
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
                      <Cell fill="#34C759" /><Cell fill="#007AFF" />
                    </Pie>
                    <Tooltip formatter={(value) => formatPeso(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-subtle rounded-2xl p-4 min-h-[350px]">
                <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>By Employee</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isViewer ? [] : normalizedEmployees}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatPeso(value)} />
                    <Bar dataKey="eeShare" fill="#34C759" name="EE Total" />
                    <Bar dataKey="erShare" fill="#007AFF" name="ER Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Single Generate PDF button */}
          <div className="flex justify-center">
            <button onClick={generateContributionPdf} className="btn-apple px-6 py-2.5 text-sm text-white rounded-xl font-semibold" style={{ background: 'var(--accent-green)' }}>
              <i className="bi bi-file-earmark-pdf mr-2" aria-hidden="true" />
              Generate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
