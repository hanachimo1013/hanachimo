import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

export const useEmployees = () => {
  const [employees, setEmployees] = useState([
    // Fallback data - replace with Supabase data
    { id: 1, name: 'John Doe', sss: 1250, pagibig: 500, philhealth: 300, eeShare: 8500, erShare: 12750 },
    { id: 2, name: 'Jane Smith', sss: 1100, pagibig: 450, philhealth: 280, eeShare: 7200, erShare: 10800 },
    { id: 3, name: 'Mike Johnson', sss: 1000, pagibig: 400, philhealth: 250, eeShare: 6500, erShare: 9750 },
    { id: 4, name: 'Sarah Williams', sss: 1050, pagibig: 425, philhealth: 265, eeShare: 7000, erShare: 10500 },
    { id: 5, name: 'Tom Brown', sss: 1300, pagibig: 520, philhealth: 310, eeShare: 8800, erShare: 13200 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*');

      if (error) {
        console.error('Supabase error:', error);
        console.log('Using fallback employee data');
        // Will use fallback data set in state
      } else if (data && data.length > 0) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Will use fallback data
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employee) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select();

      if (error) throw error;
      setEmployees([...employees, data[0]]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      setEmployees(employees.map(emp => emp.id === id ? data[0] : emp));
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error updating employee:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEmployees(employees.filter(emp => emp.id !== id));
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
    refetch: fetchEmployees
  };
};
