import React, { useEffect, useRef, useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import EmployeeCard from './EmployeeCard';
import { formatPeso, getEeShare, getErShare, getPhotoUrl } from '../utils/formatters';
import LoadingOverlay from './LoadingOverlay';

const EmployeeForm = ({ onSubmit, onCancel, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      designation: '',
      sss: '',
      pagibig: '',
      philhealth: '',
      eeShare: '',
      erShare: '',
      photoUrl: ''
    }
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photoUrl || null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        designation: initialData.designation || '',
        sss: initialData.sss || '',
        pagibig: initialData.pagibig || '',
        philhealth: initialData.philhealth || '',
        eeShare: initialData.eeShare || '',
        erShare: initialData.erShare || '',
        photoUrl: initialData.photoUrl || ''
      });
      setPhotoPreview(initialData.photoUrl || null);
      setPhotoFile(null);
    } else {
      setFormData({
        name: '',
        designation: '',
        sss: '',
        pagibig: '',
        philhealth: '',
        eeShare: '',
        erShare: '',
        photoUrl: ''
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const sss = parseFloat(formData.sss) || 0;
    const pagibig = parseFloat(formData.pagibig) || 0;
    const philhealth = parseFloat(formData.philhealth) || 0;
    const eeShare = sss + pagibig + philhealth;
    setFormData((prev) => ({
      ...prev,
      eeShare: eeShare.toFixed(2)
    }));
  }, [formData.sss, formData.pagibig, formData.philhealth]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sss: parseFloat(formData.sss) || 0,
      pagibig: parseFloat(formData.pagibig) || 0,
      philhealth: parseFloat(formData.philhealth) || 0,
      eeShare: parseFloat(formData.eeShare) || 0,
      erShare: parseFloat(formData.erShare) || 0,
      photoFile
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border-2 border-[#e6a891] mb-8 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-800 mb-6 dark:text-gray-100">
        {initialData ? 'Edit Employee' : 'Add New Employee'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="Employee name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">Designation (Work) *</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="e.g., Software Engineer, Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">SSS (PHP)</label>
          <input
            type="number"
            name="sss"
            value={formData.sss}
            onChange={handleInputChange}
            step="0.01"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">PAG-IBIG (PHP)</label>
          <input
            type="number"
            name="pagibig"
            value={formData.pagibig}
            onChange={handleInputChange}
            step="0.01"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">PhilHealth (PHP)</label>
          <input
            type="number"
            name="philhealth"
            value={formData.philhealth}
            onChange={handleInputChange}
            step="0.01"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">EE Share (Employee) (PHP) *</label>
          <input
            type="number"
            name="eeShare"
            value={formData.eeShare}
            step="0.01"
            required
            readOnly
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 cursor-not-allowed"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">ER Share (Employer) (PHP) *</label>
          <input
            type="number"
            name="erShare"
            value={formData.erShare}
            onChange={handleInputChange}
            step="0.01"
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          />
          {photoPreview && (
            <div className="mt-4 flex justify-center">
              <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-lg object-cover border-2 border-[#bc7676]" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all"
          disabled={isLoading}
        >
          <i className="bi bi-x-circle mr-2" aria-hidden="true" />
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-all disabled:opacity-50"
          disabled={isLoading}
        >
          <i className="bi bi-save mr-2" aria-hidden="true" />
          {isLoading ? 'Saving...' : initialData ? 'Update Employee' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
};

const EmployeeTable = ({ employees, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-300">Loading employees...</p>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-300">No employees found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#e6a891] bg-gray-50 dark:bg-gray-800">
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Photo</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">Designation</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">SSS</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PAG-IBIG</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">PhilHealth</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">EE Share</th>
            <th className="px-2 md:px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">ER Share</th>
            <th className="px-2 md:px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-gray-200 hover:bg-[#fce4ec] transition-colors dark:border-gray-700 dark:hover:bg-gray-800/60">
              <td className="px-2 md:px-4 py-3">
                {getPhotoUrl(emp) ? (
                  <img src={getPhotoUrl(emp)} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#bc7676] flex items-center justify-center text-white text-xs font-bold">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-2 md:px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{emp.name}</td>
              <td className="px-2 md:px-4 py-3 text-gray-700 text-xs md:text-sm dark:text-gray-300">{emp.designation || '-'}</td>
              <td className="px-2 md:px-4 py-3 text-gray-700 dark:text-gray-200">{formatPeso(emp.sss)}</td>
              <td className="px-2 md:px-4 py-3 text-gray-700 dark:text-gray-200">{formatPeso(emp.pagibig)}</td>
              <td className="hidden md:table-cell px-4 py-3 text-gray-700 dark:text-gray-200">{formatPeso(emp.philhealth)}</td>
              <td className="px-2 md:px-4 py-3 text-[#10b981] font-semibold">{formatPeso(getEeShare(emp))}</td>
              <td className="px-2 md:px-4 py-3 text-[#3b82f6] font-semibold">{formatPeso(getErShare(emp))}</td>
              <td className="px-2 md:px-4 py-3 text-center">
                <button
                  onClick={() => onEdit(emp)}
                  className="px-2 py-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded text-xs font-semibold mr-2 transition-all"
                >
                  <i className="bi bi-pencil-square mr-1" aria-hidden="true" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(emp.id)}
                  className="px-2 py-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded text-xs font-semibold transition-all"
                >
                  <i className="bi bi-trash mr-1" aria-hidden="true" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function Employees() {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const formRef = useRef(null);

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
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = (employeeId) => {
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
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-[#10b981] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="bi bi-table mr-2" aria-hidden="true" />
            Table View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-[#10b981] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <i className="bi bi-grid-3x3-gap mr-2" aria-hidden="true" />
            Card View
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="self-start md:self-auto px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-all"
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
            ref={formRef}
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
            employees={employees}
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
          ) : !employees || employees.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-300">No employees found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
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
