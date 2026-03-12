import React, { useMemo, useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import EmployeeForm from './EmployeeForm';
import EmployeeTable from './EmployeeTable';
import LoadingOverlay from './LoadingOverlay';
import { useAuth } from '../context/AuthContext';

const maskText = (value) => {
  const text = String(value || '');
  if (text.length <= 2) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(1, text.length - 3))}${text.slice(-1)}`;
};

const maskNumber = () => '***';

const viewButtons = [
  { view: 'table', icon: 'bi-table', label: 'Table View' },
  { view: 'grid', icon: 'bi-grid-3x3-gap', label: 'Card View' },
];

const sortButtons = [
  { sort: 'alpha', icon: 'bi-sort-alpha-down', label: 'Alphabetical' },
  { sort: 'number', icon: 'bi-sort-numeric-down', label: 'Number' },
];

export default function Employees() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
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

  const handleEdit = (employee) => {
    if (isViewer) return;
    setEditingEmployee(employee);
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

  return (
    <section className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden p-4 md:p-8 dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 dark:text-gray-100">Employee Management</h2>
        <p className="text-xs md:text-base text-gray-600 dark:text-gray-300">Manage and view all employees in the system</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg dark:bg-red-900/40 dark:border-red-700">
          <p className="text-red-700 font-semibold dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {viewButtons.map(({ view, icon, label }) => (
            <button key={view} onClick={() => setViewMode(view)} className={`px-4 py-2 rounded-lg font-semibold transition-all ${viewMode === view ? 'bg-[#10b981] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              <i className={`bi ${icon} mr-2`} aria-hidden="true" />
              {label}
            </button>
          ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={handleFormCancel}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-4xl px-4 animate-fade-scale"
          >
            <EmployeeForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              initialData={editingEmployee}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="overflow-y-auto flex-1 relative">
          {loading && <LoadingOverlay message="Loading employees..." />}
          <EmployeeTable
            employees={displayEmployees}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="overflow-y-auto flex-1 relative">
          {loading && <LoadingOverlay message="Loading employees..." />}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-300">Loading employees...</p>
            </div>
          ) : !displayEmployees || displayEmployees.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-300">No employees found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  isViewer={isViewer}
                  maskText={maskText}
                  maskNumber={maskNumber}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
