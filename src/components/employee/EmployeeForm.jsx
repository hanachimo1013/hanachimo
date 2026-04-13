import React, { useState } from 'react';

// A small reusable component for form fields to reduce repetition.
const FormField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}{props.required && ' *'}</label>
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all ${props.readOnly ? 'cursor-not-allowed opacity-60' : ''}`}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}{props.required && ' *'}</label>
    <select
      {...props}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
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

  const [prevInitialData, setPrevInitialData] = useState(initialData);

  // Sync state when initialData changes
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData(getInitialState(initialData));
    setPhotoPreview(initialData?.photoUrl || null);
    setPhotoFile(null);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-calculate EE/ER totals
  const sssEe = parseFloat(formData.sssEe) || 0;
  const pagibigEe = parseFloat(formData.pagibigEe) || 0;
  const philhealthEe = parseFloat(formData.philhealthEe) || 0;
  const sssEr = parseFloat(formData.sssEr) || 0;
  const pagibigEr = parseFloat(formData.pagibigEr) || 0;
  const philhealthEr = parseFloat(formData.philhealthEr) || 0;

  const totalEeShare = sssEe + pagibigEe + philhealthEe;
  const totalErShare = sssEr + pagibigEr + philhealthEr;

  const derivedEeTotal = totalEeShare > 0 ? totalEeShare.toFixed(2) : '';
  const derivedErTotal = totalErShare > 0 ? totalErShare.toFixed(2) : '';

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
      eeTotal: parseFloat(derivedEeTotal) || 0,
      erTotal: parseFloat(derivedErTotal) || 0,
      salaryPerDay: parseFloat(formData.salaryPerDay) || 0,
      photoFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
        {initialData ? 'Edit Employee' : 'Add New Employee'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <FormField label="EE Share (Auto) (PHP)" type="number" name="eeTotal" value={derivedEeTotal} required readOnly placeholder="Auto-calculated" />
        <FormField label="ER Share (Auto) (PHP)" type="number" name="erTotal" value={derivedErTotal} required readOnly placeholder="Auto-calculated" />

        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }} />
          {photoPreview && (
            <div className="mt-4 flex justify-center">
              <img src={photoPreview} alt="Preview" className="w-28 h-28 rounded-xl object-cover shadow-md" style={{ border: '2px solid var(--glass-border)' }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-8 justify-end">
        <button type="button" onClick={onCancel} className="btn-apple px-5 py-2.5 text-sm font-medium rounded-xl" style={{ background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-apple px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50" style={{ background: 'var(--accent-green)' }} disabled={isLoading}>
          {isLoading ? 'Saving…' : (initialData ? 'Update Employee' : 'Add Employee')}
        </button>
      </div>
    </form>
  );
}
