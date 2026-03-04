import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
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

  const addEmployee = async (employeeData) => {
    try {
      let photoUrl = null;
      
      // Upload photo if provided
      if (employeeData.photoFile) {
        const file = employeeData.photoFile;
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(`public/${fileName}`, file);

        if (uploadError) {
          console.warn('Photo upload failed:', uploadError);
        } else {
          const { data } = supabase.storage
            .from('employee-photos')
            .getPublicUrl(`public/${fileName}`);
          photoUrl = data.publicUrl;
        }
      }

      // Prepare employee data (remove file from data object)
      const { photoFile } = employeeData;
      const newEmployee = {
        name: employeeData.name,
        designation: employeeData.designation || '',
        sss: parseFloat(employeeData.sss) || 0,
        pagibig: parseFloat(employeeData.pagibig) || 0,
        philhealth: parseFloat(employeeData.philhealth) || 0,
        eeshare: parseFloat(employeeData.eeShare) || 0,
        ershare: parseFloat(employeeData.erShare) || 0
      };

      console.log('Adding employee:', newEmployee);

      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from insert');
      }

      console.log('Employee added successfully:', data[0]);
      setEmployees((prev) => [...prev, data[0]]);
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding employee:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      let photoUrl = updates.photoUrl;
      
      // Upload new photo if provided
      if (updates.photoFile) {
        const file = updates.photoFile;
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(`public/${fileName}`, file);

        if (uploadError) {
          console.warn('Photo upload failed:', uploadError);
        } else {
          const { data } = supabase.storage
            .from('employee-photos')
            .getPublicUrl(`public/${fileName}`);
          photoUrl = data.publicUrl;
        }
      }

      // Prepare update data (remove file from data object)
      const { photoFile } = updates;
      const updateData = {
        name: updates.name,
        designation: updates.designation || '',
        sss: parseFloat(updates.sss) || 0,
        pagibig: parseFloat(updates.pagibig) || 0,
        philhealth: parseFloat(updates.philhealth) || 0,
        eeshare: parseFloat(updates.eeShare) || 0,
        ershare: parseFloat(updates.erShare) || 0
      };

      console.log('Updating employee:', updateData);

      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from update');
      }

      console.log('Employee updated successfully:', data[0]);
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? data[0] : emp)));
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
    refetch: fetchEmployees
  };
};
