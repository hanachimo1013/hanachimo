import React, { useState, useEffect } from 'react';

// A small reusable component for form fields to reduce repetition.
const FormField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">{label}{props.required && ' *'}</label>
    <input
      {...props}
      className={`w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 ${props.readOnly ? 'cursor-not-allowed' : ''}`}
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">{label}{props.required && ' *'}</label>
    <select
      {...props}
      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
    >
      {children}
    </select>
  </div>
);

const getInitialState = (initialData) => ({
  name: initialData?.name || '',
  designation: initialData?.designation || '',
  sssNumber: initialData?.sss_number || initialData?.sssNumber || '',
  pagibigNumber: initialData?.pagibig_number || initialData?.pagibigNumber || '',
  philhealthNumber: initialData?.philhealth_number || initialData?.philhealthNumber || '',
  sssEe: initialData?.sss_ee || initialData?.sssEe || '',
  sssEr: initialData?.sss_er || initialData?.sssEr || '',
  pagibigEe: initialData?.pagibig_ee || initialData?.pagibigEe || '',
  pagibigEr: initialData?.pagibig_er || initialData?.pagibigEr || '',
  philhealthEe: initialData?.philhealth_ee || initialData?.philhealthEe || '',
  philhealthEr: initialData?.philhealth_er || initialData?.philhealthEr || '',
  salaryPerDay: initialData?.salary_per_day || initialData?.salaryPerDay || '',
  status: initialData?.status || 'employed',
  eeTotal: initialData?.ee_total || initialData?.eeTotal || initialData?.eeShare || '',
  erTotal: initialData?.er_total || initialData?.erTotal || initialData?.erShare || '',
  photoUrl: initialData?.photoUrl || '',
});

export default function EmployeeForm({ onSubmit, onCancel, initialData = null, isLoading = false }) {
  const [formData, setFormData] = useState(getInitialState(initialData));
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photoUrl || null);

  // Effect to reset form when initialData changes (e.g., from edit to add)
  useEffect(() => {
    setFormData(getInitialState(initialData));
    setPhotoPreview(initialData?.photoUrl || null);
    setPhotoFile(null);
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Effect to auto-calculate EE/ER totals
  useEffect(() => {
    const sssEe = parseFloat(formData.sssEe) || 0;
    const pagibigEe = parseFloat(formData.pagibigEe) || 0;
    const philhealthEe = parseFloat(formData.philhealthEe) || 0;
    const sssEr = parseFloat(formData.sssEr) || 0;
    const pagibigEr = parseFloat(formData.pagibigEr) || 0;
    const philhealthEr = parseFloat(formData.philhealthEr) || 0;
    const totalEeShare = sssEe + pagibigEe + philhealthEe;
    const totalErShare = sssEr + pagibigEr + philhealthEr;
    setFormData((prev) => ({
      ...prev,
      eeTotal: totalEeShare > 0 ? totalEeShare.toFixed(2) : '',
      erTotal: totalErShare > 0 ? totalErShare.toFixed(2) : '',
    }));
  }, [
    formData.sssEe,
    formData.pagibigEe,
    formData.philhealthEe,
    formData.sssEr,
    formData.pagibigEr,
    formData.philhealthEr,
  ]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      sssEe: parseFloat(formData.sssEe) || 0,
      sssEr: parseFloat(formData.sssEr) || 0,
      pagibigEe: parseFloat(formData.pagibigEe) || 0,
      pagibigEr: parseFloat(formData.pagibigEr) || 0,
      philhealthEe: parseFloat(formData.philhealthEe) || 0,
      philhealthEr: parseFloat(formData.philhealthEr) || 0,
      eeTotal: parseFloat(formData.eeTotal) || 0,
      erTotal: parseFloat(formData.erTotal) || 0,
      salaryPerDay: parseFloat(formData.salaryPerDay) || 0,
      photoFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border-2 border-[#e6a891] dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-xl font-bold text-gray-800 mb-6 dark:text-gray-100">
        {initialData ? 'Edit Employee' : 'Add New Employee'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Employee name" />
        <FormField label="Designation (Work)" name="designation" value={formData.designation} onChange={handleInputChange} required placeholder="e.g., Software Engineer" />
        <FormField label="SSS Number" name="sssNumber" value={formData.sssNumber} onChange={handleInputChange} placeholder="SSS number" />
        <FormField label="PAG-IBIG Number" name="pagibigNumber" value={formData.pagibigNumber} onChange={handleInputChange} placeholder="PAG-IBIG number" />
        <FormField label="PhilHealth Number" name="philhealthNumber" value={formData.philhealthNumber} onChange={handleInputChange} placeholder="PhilHealth number" />
        <FormField label="SSS EE (PHP)" type="number" name="sssEe" value={formData.sssEe} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="SSS ER (PHP)" type="number" name="sssEr" value={formData.sssEr} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PAG-IBIG EE (PHP)" type="number" name="pagibigEe" value={formData.pagibigEe} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PAG-IBIG ER (PHP)" type="number" name="pagibigEr" value={formData.pagibigEr} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PhilHealth EE (PHP)" type="number" name="philhealthEe" value={formData.philhealthEe} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PhilHealth ER (PHP)" type="number" name="philhealthEr" value={formData.philhealthEr} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="Salary Per Day (PHP)" type="number" name="salaryPerDay" value={formData.salaryPerDay} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <SelectField label="Employee Status" name="status" value={formData.status} onChange={handleInputChange}>
          <option value="employed">employed</option>
          <option value="suspended">suspended</option>
          <option value="removed">removed</option>
        </SelectField>
        <FormField label="EE Share (Auto) (PHP)" type="number" name="eeTotal" value={formData.eeTotal} required readOnly placeholder="Auto-calculated" />
        <FormField label="ER Share (Auto) (PHP)" type="number" name="erTotal" value={formData.erTotal} required readOnly placeholder="Auto-calculated" />

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-black mb-2 dark:text-gray-200">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#d97706] focus:outline-none text-black bg-white dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
          {photoPreview && (
            <div className="mt-4 flex justify-center">
              <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-lg object-cover border-2 border-[#bc7676]" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8 justify-end">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all" disabled={isLoading}>
          <i className="bi bi-x-circle mr-2" aria-hidden="true" />
          Cancel
        </button>
        <button type="submit" className="px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-semibold transition-all disabled:opacity-50" disabled={isLoading}>
          <i className="bi bi-save mr-2" aria-hidden="true" />
          {isLoading ? 'Saving...' : (initialData ? 'Update Employee' : 'Add Employee')}
        </button>
      </div>
    </form>
  );
}
