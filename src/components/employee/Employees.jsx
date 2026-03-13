import React, { useEffect, useMemo, useState } from 'react';
import { useEmployees } from '../../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import EmployeeTable from './EmployeeTable';
import LoadingOverlay from '../ui/LoadingOverlay';
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
  const [valuesHistory, setValuesHistory] = useState([]);
  const [valuesError, setValuesError] = useState(null);
  const [valuesOffset, setValuesOffset] = useState(0);
  const [valuesHasMore, setValuesHasMore] = useState(false);
  const valuesPageSize = 10;
  const [sortMode, setSortMode] = useState('alpha');
  const [sortDir, setSortDir] = useState('asc');

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

  const handleFormSubmit = async (formData) => {
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
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err.message || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (employee) => {
    if (isViewer) return;

    let values = null;
    const result = await fetchEmployeeValues(employee, { limit: 1, offset: 0 });
    if (result.success && result.data?.length) {
      values = result.data[0];
    }

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
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(employeeId);
    }
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
    <section className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden p-4 md:p-8 dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 dark:text-gray-100">Employee Management</h2>
        <p className="text-xs md:text-base text-gray-600 dark:text-gray-300">Manage and view all employees in the system</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {sortButtons.map(({ sort, icon, label }) => (
            <button key={sort} onClick={() => setSortMode(sort)} className={`px-4 py-2 rounded-lg font-semibold transition-all ${sortMode === sort ? 'bg-[#f59e0b] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              <i className={`bi ${icon} mr-2`} aria-hidden="true" />
              {label}
            </button>
          ))}
          <button
            onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-4 py-2 rounded-lg font-semibold transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <i className={`bi ${sortDir === 'asc' ? 'bi-sort-down' : 'bi-sort-up'} mr-2`} aria-hidden="true" />
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => (isViewer ? null : setShowForm(true))}
            disabled={isViewer}
            className="self-start md:self-auto px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="bi bi-person-plus mr-2" aria-hidden="true" />
            Add New Employee
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain touch-pan-y pt-6 pb-24 md:items-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={handleFormCancel}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl px-4 animate-fade-scale">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg dark:bg-red-900/40 dark:border-red-700">
                <p className="text-red-700 font-semibold dark:text-red-200">{error}</p>
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

      <div className="relative max-h-[calc(100vh-320px)] overflow-auto touch-pan-y overscroll-contain">
        {loading && <LoadingOverlay message="Loading employees..." />}
        <EmployeeTable
          employees={displayEmployees}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelect={(emp) => setSelectedEmployee(emp)}
          onHistory={(emp) => setSelectedEmployee(emp)}
        />
      </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">SSS Number</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : (selectedEmployee.sss_number || selectedEmployee.sssNumber || '-')}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PAG-IBIG Number</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : (selectedEmployee.pagibig_number || selectedEmployee.pagibigNumber || '-')}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PhilHealth Number</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : (selectedEmployee.philhealth_number || selectedEmployee.philhealthNumber || '-')}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">SSS EE</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.sss_ee)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">SSS ER</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.sss_er)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PAG-IBIG EE</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.pagibig_ee)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PAG-IBIG ER</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.pagibig_er)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PhilHealth EE</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.philhealth_ee)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">PhilHealth ER</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.philhealth_er)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">Salary Per Day</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : formatPeso(selectedEmployee.salary_per_day || selectedEmployee.salaryPerDay || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-300">Status</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {isViewer ? '***' : (selectedEmployee.status || 'employed')}
                  </p>
                </div>
              </div>

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
    </section>
  );
}
