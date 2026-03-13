import { getBearerToken, getSupabaseAdmin, parseJsonBody, verifyJwt } from '../_lib/auth.js';

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
    sss: Number(payload.sss ?? payload.sssEe ?? payload.sss_ee ?? 0),
    pagibig: Number(payload.pagibig ?? payload.pagibigEe ?? payload.pagibig_ee ?? 0),
    philhealth: Number(payload.philhealth ?? payload.philhealthEe ?? payload.philhealth_ee ?? 0),
    eeshare: Number(payload.eeTotal ?? payload.ee_total ?? payload.eeShare ?? payload.eeshare ?? 0),
    ershare: Number(payload.erTotal ?? payload.er_total ?? payload.erShare ?? payload.ershare ?? 0),
    sss_number: payload.sssNumber ? String(payload.sssNumber).trim() : null,
    pagibig_number: payload.pagibigNumber ? String(payload.pagibigNumber).trim() : null,
    philhealth_number: payload.philhealthNumber ? String(payload.philhealthNumber).trim() : null,
    salary_per_day: Number(payload.salaryPerDay ?? payload.salary_per_day ?? 0) || 0,
    status: payload.status ? String(payload.status).trim() : 'employed',
    photo_url: payload.photoUrl ? String(payload.photoUrl) : (payload.photo_url ? String(payload.photo_url) : null),
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

function maskText(value) {
  const text = String(value || '');
  if (text.length <= 2) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(1, text.length - 3))}${text.slice(-1)}`;
}

function maskEmployeesForViewer(list) {
  return list.map((emp) => ({
    ...emp,
    name: maskText(emp.name),
    designation: maskText(emp.designation || '-'),
    sss: 0,
    pagibig: 0,
    philhealth: 0,
    eeshare: 0,
    ershare: 0,
    ee_total: 0,
    er_total: 0,
    sss_ee: 0,
    sss_er: 0,
    pagibig_ee: 0,
    pagibig_er: 0,
    philhealth_ee: 0,
    philhealth_er: 0,
    sss_number: null,
    pagibig_number: null,
    philhealth_number: null,
    photo_url: null,
  }));
}

function buildEmployeeKey(employee) {
  const name = String(employee?.name || '').trim();
  const designation = String(employee?.designation || '').trim();
  return `${name}||${designation}`;
}

function mergeEmployeeValues(employee, values) {
  if (!values) return employee;
  return {
    ...employee,
    ee_total: values.ee_total ?? employee.ee_total,
    er_total: values.er_total ?? employee.er_total,
    sss_ee: values.sss_ee ?? employee.sss_ee,
    sss_er: values.sss_er ?? employee.sss_er,
    pagibig_ee: values.pagibig_ee ?? employee.pagibig_ee,
    pagibig_er: values.pagibig_er ?? employee.pagibig_er,
    philhealth_ee: values.philhealth_ee ?? employee.philhealth_ee,
    philhealth_er: values.philhealth_er ?? employee.philhealth_er,
  };
}

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const supabaseAdmin = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Employees GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch employees.' });
    }

    const { data: valuesRows, error: valuesError } = await supabaseAdmin
      .from('employee_values')
      .select('*')
      .order('effective_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (valuesError) {
      console.error('Employee values GET error:', valuesError);
      return res.status(500).json({ message: 'Failed to fetch employee values.' });
    }

    const valuesByKey = new Map();
    (valuesRows || []).forEach((row) => {
      const key = `${String(row.employee_name || '').trim()}||${String(row.employee_designation || '').trim()}`;
      if (!valuesByKey.has(key)) {
        valuesByKey.set(key, row);
      }
    });

    const merged = (employees || []).map((emp) => {
      const key = buildEmployeeKey(emp);
      return mergeEmployeeValues(emp, valuesByKey.get(key));
    });

    const result = user.role === 'viewer' ? maskEmployeesForViewer(merged) : merged;
    return res.status(200).json({ data: result });
  }

  if (req.method === 'POST') {
    if (user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewer role is read-only.' });
    }
    const body = parseJsonBody(req);
    const newEmployee = toDbEmployee(body);

    if (!newEmployee.name) {
      return res.status(400).json({ message: 'Employee name is required.' });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .ilike('name', newEmployee.name)
      .ilike('designation', newEmployee.designation)
      .limit(1);

    if (existingError) {
      console.error('Employees POST duplicate check error:', existingError);
      return res.status(500).json({ message: 'Failed to validate employee.' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'Employee record already exists.' });
    }

    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert([newEmployee])
      .select('*')
      .single();

    if (error) {
      console.error('Employees POST error:', error);
      return res.status(500).json({ message: 'Failed to create employee.' });
    }

    const valuesPayload = toEmployeeValues(body);
    if (valuesPayload) {
      const { error: valuesError } = await supabaseAdmin
        .from('employee_values')
        .insert([{
          ...valuesPayload,
          employee_name: data.name,
          employee_designation: data.designation || '',
        }]);

      if (valuesError) {
        console.error('Employees POST values error:', valuesError);
        await supabaseAdmin.from('employees').delete().eq('id', data.id);
        return res.status(500).json({ message: 'Failed to create employee values.' });
      }
    }

    return res.status(201).json({ data });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
