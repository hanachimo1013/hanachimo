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

const getInitialState = (initialData) => ({
  name: initialData?.name || '',
  designation: initialData?.designation || '',
  sss: initialData?.sss || '',
  pagibig: initialData?.pagibig || '',
  philhealth: initialData?.philhealth || '',
  eeShare: initialData?.eeShare || '',
  erShare: initialData?.erShare || '',
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

  // Effect to auto-calculate EE Share
  useEffect(() => {
    const sss = parseFloat(formData.sss) || 0;
    const pagibig = parseFloat(formData.pagibig) || 0;
    const philhealth = parseFloat(formData.philhealth) || 0;
    const totalEeShare = sss + pagibig + philhealth;
    setFormData((prev) => ({
      ...prev,
      eeShare: totalEeShare > 0 ? totalEeShare.toFixed(2) : '',
    }));
  }, [formData.sss, formData.pagibig, formData.philhealth]);

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
      sss: parseFloat(formData.sss) || 0,
      pagibig: parseFloat(formData.pagibig) || 0,
      philhealth: parseFloat(formData.philhealth) || 0,
      eeShare: parseFloat(formData.eeShare) || 0,
      erShare: parseFloat(formData.erShare) || 0,
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
        <FormField label="SSS (PHP)" type="number" name="sss" value={formData.sss} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PAG-IBIG (PHP)" type="number" name="pagibig" value={formData.pagibig} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="PhilHealth (PHP)" type="number" name="philhealth" value={formData.philhealth} onChange={handleInputChange} step="0.01" placeholder="0.00" />
        <FormField label="EE Share (Employee) (PHP)" type="number" name="eeShare" value={formData.eeShare} required readOnly placeholder="Auto-calculated" />
        <FormField label="ER Share (Employer) (PHP)" type="number" name="erShare" value={formData.erShare} onChange={handleInputChange} step="0.01" required placeholder="0.00" />

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
