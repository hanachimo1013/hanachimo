import { getBearerToken, getSupabaseAdmin, parseJsonBody, verifyJwt } from '../_lib/auth.js';
import { logSystemEvent } from '../_lib/logger.js';

function getAuthenticatedUser(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Missing or invalid authorization token.' });
    return null;
  }

  try {
    return verifyJwt(token);
  } catch {
    res.status(401).json({ message: 'Session expired or invalid token.' });
    return null;
  }
}

function toDbEmployee(payload) {
  return {
    name: String(payload.name || '').trim(),
    designation: String(payload.designation || '').trim(),
    sss_number: payload.sssNumber ? String(payload.sssNumber).trim() : null,
    pagibig_number: payload.pagibigNumber ? String(payload.pagibigNumber).trim() : null,
    philhealth_number: payload.philhealthNumber ? String(payload.philhealthNumber).trim() : null,
    salary_per_day: Number(payload.salaryPerDay ?? payload.salary_per_day ?? 0) || 0,
    status: payload.status ? String(payload.status).trim() : 'employed',
    photo_url: payload.photoUrl ? String(payload.photoUrl) : null,
  };
}

function toEmployeeValues(payload) {
  const values = {
    ee_total: Number(payload.eeTotal ?? payload.ee_total ?? payload.eeShare ?? payload.eeshare ?? 0),
    er_total: Number(payload.erTotal ?? payload.er_total ?? payload.erShare ?? payload.ershare ?? 0),
    sss_ee: Number(payload.sssEe ?? payload.sss_ee ?? 0),
    sss_er: Number(payload.sssEr ?? payload.sss_er ?? 0),
    pagibig_ee: Number(payload.pagibigEe ?? payload.pagibig_ee ?? 0),
    pagibig_er: Number(payload.pagibigEr ?? payload.pagibig_er ?? 0),
    philhealth_ee: Number(payload.philhealthEe ?? payload.philhealth_ee ?? 0),
    philhealth_er: Number(payload.philhealthEr ?? payload.philhealth_er ?? 0),
  };

  const hasValues = [
    values.ee_total,
    values.er_total,
    values.sss_ee,
    values.sss_er,
    values.pagibig_ee,
    values.pagibig_er,
    values.philhealth_ee,
    values.philhealth_er,
  ].some((value) => Number(value) > 0);

  if (!hasValues) return null;

  if (payload.effectiveDate) {
    values.effective_date = String(payload.effectiveDate);
  } else if (payload.effective_date) {
    values.effective_date = String(payload.effective_date);
  }

  return values;
}

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const id = Number(req.query?.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid employee id.' });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (req.method === 'PATCH') {
    if (user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewer role is read-only.' });
    }
    const body = parseJsonBody(req);
    const updateData = toDbEmployee(body);

    if (!updateData.name) {
      return res.status(400).json({ message: 'Employee name is required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Employees PATCH error:', error);
      return res.status(500).json({ message: 'Failed to update employee.' });
    }

    const valuesPayload = toEmployeeValues(body);
    if (valuesPayload) {
      const { error: valuesError } = await supabaseAdmin
        .from('employee_values')
        .upsert([{
          ...valuesPayload,
          employee_name: data.name,
          employee_designation: data.designation || '',
        }], { onConflict: 'employee_name,employee_designation' });

      if (valuesError) {
        console.error('Employees PATCH values error:', valuesError);
        return res.status(500).json({ message: 'Failed to create employee values.' });
      }
    }

    // Log the update
    logSystemEvent({
      action: 'UPDATE',
      entity_type: 'employee',
      entity_name: data.name,
      details: { id, designation: data.designation, salary_per_day: data.salary_per_day, status: data.status, values_updated: !!valuesPayload },
      performed_by: user.name || user.username,
    });

    return res.status(200).json({ data });
  }

  if (req.method === 'DELETE') {
    if (user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewer role is read-only.' });
    }

    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('name, designation')
      .eq('id', id)
      .single();

    if (fetchError || !employee) {
      console.error('Employees DELETE fetch error:', fetchError);
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const { error: valuesError } = await supabaseAdmin
      .from('employee_values')
      .delete()
      .eq('employee_name', employee.name)
      .eq('employee_designation', employee.designation);

    if (valuesError) {
      console.error('Employees DELETE values error:', valuesError);
      return res.status(500).json({ message: 'Failed to delete employee values.' });
    }

    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Employees DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete employee.' });
    }

    // Log the deletion
    logSystemEvent({
      action: 'DELETE',
      entity_type: 'employee',
      entity_name: employee.name,
      details: { id, designation: employee.designation },
      performed_by: user.name || user.username,
    });

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ message: 'Method not allowed.' });
}
