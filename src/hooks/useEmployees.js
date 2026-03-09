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
    photoUrl: input.photoUrl || null,
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

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees,
  };
};
