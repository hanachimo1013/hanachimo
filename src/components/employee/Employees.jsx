import React, { useEffect, useMemo, useState } from 'react';
import { useEmployees } from '../../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import EmployeeTable from './EmployeeTable';
import LoadingOverlay from '../ui/LoadingOverlay';
import Toast from '../ui/Toast';
import ConfirmModal from '../ui/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { formatPeso } from '../../utils/formatters';

const maskText = (value) => {
  const text = String(value || '');
  if (text.length <= 2) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(1, text.length - 3))}${text.slice(-1)}`;
};

const maskNumber = () => '***';

const sortButtons = [
  { sort: 'alpha', icon: 'bi-sort-alpha-down', label: 'Alphabetical' },
  { sort: 'number', icon: 'bi-sort-numeric-down', label: 'Number' },
];

export default function Employees() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const { employees, loading, valuesLoading, addEmployee, updateEmployee, deleteEmployee, fetchEmployeeValues } = useEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [notification, setNotification] = useState(null);
  const [valuesHistory, setValuesHistory] = useState([]);
  const [valuesError, setValuesError] = useState(null);
  const [valuesOffset, setValuesOffset] = useState(0);
  const [valuesHasMore, setValuesHasMore] = useState(false);
  const valuesPageSize = 10;
  const [sortMode, setSortMode] = useState('alpha');
  const [sortDir, setSortDir] = useState('asc');
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, confirmText, confirmColor, action }

  const sortedEmployees = useMemo(() => {
    const list = Array.isArray(employees) ? [...employees] : [];
    const direction = sortDir === 'asc' ? 1 : -1;

    if (sortMode === 'alpha') {
      return list.sort((a, b) => {
        const nameA = (a?.name || '').toLowerCase();
        const nameB = (b?.name || '').toLowerCase();
        return nameA.localeCompare(nameB) * direction;
      });
    }

    return list.sort((a, b) => {
      const numberA = Number(a?.id || 0);
      const numberB = Number(b?.id || 0);
      return (numberA - numberB) * direction;
    });
  }, [employees, sortDir, sortMode]);

  const displayEmployees = useMemo(() => {
    if (!isViewer) return sortedEmployees;
    return sortedEmployees.map((emp) => ({
      ...emp,
      __maskedName: maskText(emp.name),
      __maskedDesignation: maskText(emp.designation || '-'),
      __maskedNumber: maskNumber(),
      __readOnly: true,
    }));
  }, [isViewer, sortedEmployees]);

  // Called when the user clicks submit on the form — shows confirmation first
  const [pendingFormData, setPendingFormData] = useState(null);

  const handleFormSubmit = (formData) => {
    setPendingFormData(formData);
    setConfirmAction({
      title: editingEmployee ? 'Update Employee' : 'Add Employee',
      message: editingEmployee
        ? `Are you sure you want to update ${editingEmployee.name || 'this employee'}?`
        : 'Are you sure you want to add this employee?',
      confirmText: editingEmployee ? 'Update' : 'Add',
      confirmColor: editingEmployee ? 'var(--accent-blue)' : 'var(--accent-green)',
      action: async () => {
        setIsSubmitting(true);
        setError(null);
        try {
          let result;
          if (editingEmployee) {
            result = await updateEmployee(editingEmployee.id, formData);
          } else {
            result = await addEmployee(formData);
          }

          if (!result.success) {
            setError(result.error || 'Failed to save employee');
            return;
          }

          setShowForm(false);
          setEditingEmployee(null);
          setPendingFormData(null);
          setNotification({
            message: editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!',
            type: 'success'
          });
        } catch (err) {
          console.error('Error saving employee:', err);
          setNotification({
            message: err.message || 'An error occurred while saving',
            type: 'error'
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleEdit = async (employee) => {
    if (isViewer) return;
    const values = employee;
    setEditingEmployee({
      ...employee,
      sssNumber: employee.sss_number ?? employee.sssNumber ?? '',
      pagibigNumber: employee.pagibig_number ?? employee.pagibigNumber ?? '',
      philhealthNumber: employee.philhealth_number ?? employee.philhealthNumber ?? '',
      sssEe: values?.sss_ee ?? employee.sss_ee ?? employee.sssEe ?? '',
      sssEr: values?.sss_er ?? employee.sss_er ?? employee.sssEr ?? '',
      pagibigEe: values?.pagibig_ee ?? employee.pagibig_ee ?? employee.pagibigEe ?? '',
      pagibigEr: values?.pagibig_er ?? employee.pagibig_er ?? employee.pagibigEr ?? '',
      philhealthEe: values?.philhealth_ee ?? employee.philhealth_ee ?? employee.philhealthEe ?? '',
      philhealthEr: values?.philhealth_er ?? employee.philhealth_er ?? employee.philhealthEr ?? '',
      salaryPerDay: employee.salary_per_day ?? employee.salaryPerDay ?? '',
      status: employee.status ?? 'employed',
      eeTotal: values?.ee_total ?? employee.ee_total ?? employee.eeTotal ?? employee.eeShare ?? '',
      erTotal: values?.er_total ?? employee.er_total ?? employee.erTotal ?? employee.erShare ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = (employeeId) => {
    if (isViewer) return;
    const emp = employees.find(e => e.id === employeeId);
    setConfirmAction({
      title: 'Delete Employee',
      message: `Are you sure you want to permanently delete ${emp?.name || 'this employee'}? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'var(--accent-red)',
      action: async () => {
        const result = await deleteEmployee(employeeId);
        if (!result.success) {
          setNotification({
            message: result.error || 'Failed to delete employee',
            type: 'error'
          });
        } else {
          setNotification({
            message: 'Employee deleted successfully!',
            type: 'success'
          });
        }
      },
    });
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

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
    <section className="glass-card flex-1 flex flex-col md:overflow-hidden p-4 md:p-6">
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>Employee Management</h2>
        <p className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>Manage and view all employees in the system</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {sortButtons.map(({ sort, icon, label }) => (
            <button key={sort} onClick={() => setSortMode(sort)} className="btn-apple px-4 py-2 rounded-xl text-sm font-medium" style={sortMode === sort ? { background: 'var(--accent-blue)', color: '#fff' } : { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}>
              <i className={`bi ${icon} mr-2`} aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="btn-apple px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
          >
            <i className={`bi ${sortDir === 'asc' ? 'bi-sort-down' : 'bi-sort-up'} mr-2`} aria-hidden="true" />
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => (isViewer ? null : setShowForm(true))}
            disabled={isViewer}
            className="btn-apple self-start md:self-auto px-5 py-2 text-white text-sm rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent-green)' }}
          >
            <i className="bi bi-person-plus mr-2" aria-hidden="true" />
            Add New Employee
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y pt-6 pb-24 md:items-center animate-fade-in px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md animate-fade-in"
            onClick={handleFormCancel}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl animate-fade-scale">
            {error && (
              <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255, 59, 48, 0.08)', border: '1px solid rgba(255, 59, 48, 0.15)' }}>
                <p className="font-medium text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>
              </div>
            )}
            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain">
              <EmployeeForm
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                initialData={editingEmployee}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        {loading && <LoadingOverlay message="Loading employees..." />}
        
        {/* Desktop View: Table */}
        <div className="hidden md:block h-full">
          <EmployeeTable
            employees={displayEmployees}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={(emp) => setSelectedEmployee(emp)}
            onHistory={(emp) => setSelectedEmployee(emp)}
          />
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
          {displayEmployees.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onHistory={() => setSelectedEmployee(emp)}
              isViewer={isViewer}
              maskText={maskText}
              maskNumber={maskNumber}
            />
          ))}
          {!loading && displayEmployees.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }}>No employees found</p>
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y pt-6 pb-24 md:items-center animate-fade-in px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedEmployee(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg animate-fade-scale">
            <div className="glass-card p-5 bg-white dark:bg-[#1c1c1e] shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Employee Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="btn-apple h-8 w-8 flex items-center justify-center rounded-full"
                  style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'SSS Number', value: isViewer ? '***' : (selectedEmployee.sss_number || selectedEmployee.sssNumber || '-') },
                  { label: 'PAG-IBIG Number', value: isViewer ? '***' : (selectedEmployee.pagibig_number || selectedEmployee.pagibigNumber || '-') },
                  { label: 'PhilHealth Number', value: isViewer ? '***' : (selectedEmployee.philhealth_number || selectedEmployee.philhealthNumber || '-') },
                  { label: 'SSS EE', value: isViewer ? '***' : formatPeso(selectedEmployee.sss_ee) },
                  { label: 'SSS ER', value: isViewer ? '***' : formatPeso(selectedEmployee.sss_er) },
                  { label: 'PAG-IBIG EE', value: isViewer ? '***' : formatPeso(selectedEmployee.pagibig_ee) },
                  { label: 'PAG-IBIG ER', value: isViewer ? '***' : formatPeso(selectedEmployee.pagibig_er) },
                  { label: 'PhilHealth EE', value: isViewer ? '***' : formatPeso(selectedEmployee.philhealth_ee) },
                  { label: 'PhilHealth ER', value: isViewer ? '***' : formatPeso(selectedEmployee.philhealth_er) },
                  { label: 'Salary Per Day', value: isViewer ? '***' : formatPeso(selectedEmployee.salary_per_day || selectedEmployee.salaryPerDay || 0) },
                  { label: 'Status', value: isViewer ? '***' : (selectedEmployee.status || 'employed') },
                ].map(({ label, value }) => (
                  <div key={label} className="glass-subtle rounded-xl p-3">
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Values History</h4>
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
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
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
                    
                    {/* Mobile List View */}
                    <div className="sm:hidden space-y-2">
                      {valuesHistory.map((row) => (
                        <div key={row.id} className="glass-subtle p-3 rounded-xl flex justify-between items-center text-xs">
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.effective_date || '-'}</span>
                          <div className="text-right">
                            <p style={{ color: 'var(--accent-green)' }}>EE: {isViewer ? '***' : formatPeso(row.ee_total)}</p>
                            <p style={{ color: 'var(--accent-blue)' }}>ER: {isViewer ? '***' : formatPeso(row.er_total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
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

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          confirmColor={confirmAction.confirmColor}
          onCancel={() => { setConfirmAction(null); setPendingFormData(null); }}
          onConfirm={async () => {
            setConfirmAction(null);
            await confirmAction.action();
          }}
        />
      )}
    </section>
  );
}
