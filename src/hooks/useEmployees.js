import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';

function toApiPayload(input) {
  return {
    name: input.name,
    designation: input.designation || '',
    sss: Number(input.sss) || 0,
    pagibig: Number(input.pagibig) || 0,
    philhealth: Number(input.philhealth) || 0,
    eeShare: Number(input.eeShare) || 0,
    erShare: Number(input.erShare) || 0,
    sssNumber: input.sssNumber || input.sss_number || null,
    pagibigNumber: input.pagibigNumber || input.pagibig_number || null,
    philhealthNumber: input.philhealthNumber || input.philhealth_number || null,
    salaryPerDay: Number(input.salaryPerDay ?? input.salary_per_day ?? 0) || 0,
    status: input.status || null,
    effectiveDate: input.effectiveDate || input.effective_date || null,
    eeTotal: Number(input.eeTotal ?? input.ee_total ?? input.eeShare ?? input.eeshare ?? 0) || 0,
    erTotal: Number(input.erTotal ?? input.er_total ?? input.erShare ?? input.ershare ?? 0) || 0,
    sssEe: Number(input.sssEe ?? input.sss_ee ?? 0) || 0,
    sssEr: Number(input.sssEr ?? input.sss_er ?? 0) || 0,
    pagibigEe: Number(input.pagibigEe ?? input.pagibig_ee ?? 0) || 0,
    pagibigEr: Number(input.pagibigEr ?? input.pagibig_er ?? 0) || 0,
    philhealthEe: Number(input.philhealthEe ?? input.philhealth_ee ?? 0) || 0,
    philhealthEr: Number(input.philhealthEr ?? input.philhealth_er ?? 0) || 0,
    photoUrl: input.photoUrl || input.photo_url || null,
  };
}

async function parseApiResponse(response) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status}).`);
  }

  return payload;
}

export const useEmployees = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [valuesLoading, setValuesLoading] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    if (!token) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    return parseApiResponse(response);
  }, [token]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await request('/api/employees');
      setEmployees(payload?.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!token) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    fetchEmployees();
  }, [token, fetchEmployees]);

  const addEmployee = async (employeeData) => {
    try {
      const payload = await request('/api/employees', {
        method: 'POST',
        body: JSON.stringify(toApiPayload(employeeData)),
      });

      setEmployees((prev) => [...prev, payload.data]);
      return { success: true, data: payload.data };
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      const payload = await request(`/api/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(toApiPayload(updates)),
      });

      setEmployees((prev) => prev.map((emp) => (emp.id === id ? payload.data : emp)));
      return { success: true, data: payload.data };
    } catch (err) {
      console.error('Error updating employee:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await request(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting employee:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchEmployeeValues = useCallback(async (employee, options = {}) => {
    const name = employee?.name;
    const designation = employee?.designation ?? '';
    const limit = Number(options.limit || 10);
    const offset = Number(options.offset || 0);

    if (!name) {
      return { success: false, error: 'Employee name is required.' };
    }

    try {
      setValuesLoading(true);
      const query = new URLSearchParams({
        name: String(name),
        designation: String(designation),
        limit: String(limit),
        offset: String(offset),
      });
      const payload = await request(`/api/employee-values?${query.toString()}`);
      return { success: true, data: payload?.data || [] };
    } catch (err) {
      console.error('Error fetching employee values:', err);
      return { success: false, error: err.message };
    } finally {
      setValuesLoading(false);
    }
  }, [request]);

  return {
    employees,
    loading,
    valuesLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeValues,
    refetch: fetchEmployees,
  };
};
