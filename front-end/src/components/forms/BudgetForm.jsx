import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../../api/axios';
import { toast } from 'react-toastify';

const PERIODS = [
  { value: 'weekly',    label: 'Weekly'    },
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly'    },
  { value: 'custom',    label: 'Custom'    },
];

const getDateRange = (period) => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const day   = now.getDate();

  const fmt = (d) => d.toISOString().split('T')[0];

  switch (period) {
    case 'weekly': {
      const start = new Date(now); start.setDate(day - now.getDay());
      const end   = new Date(start); end.setDate(start.getDate() + 6);
      return { start_date: fmt(start), end_date: fmt(end) };
    }
    case 'monthly':
      return {
        start_date: fmt(new Date(year, month, 1)),
        end_date  : fmt(new Date(year, month + 1, 0)),
      };
    case 'quarterly': {
      const q = Math.floor(month / 3);
      return {
        start_date: fmt(new Date(year, q * 3, 1)),
        end_date  : fmt(new Date(year, q * 3 + 3, 0)),
      };
    }
    case 'yearly':
      return {
        start_date: fmt(new Date(year, 0, 1)),
        end_date  : fmt(new Date(year, 11, 31)),
      };
    default:
      return { start_date: fmt(now), end_date: '' };
  }
};

const INITIAL = {
  name           : '',
  amount         : '',
  period         : 'monthly',
  category_id    : '',
  start_date     : getDateRange('monthly').start_date,
  end_date       : getDateRange('monthly').end_date,
  alert_threshold: 80,
  notes          : '',
};

const BudgetForm = ({ initial = null, onSubmit, onCancel, loading = false }) => {
  const [form,       setForm]       = useState(initial ? {
    name           : initial.name,
    amount         : String(initial.amount),
    period         : initial.period,
    category_id    : initial.category_id ? String(initial.category_id) : '',
    start_date     : initial.start_date?.split('T')[0] || '',
    end_date       : initial.end_date?.split('T')[0]   || '',
    alert_threshold: initial.alert_threshold ?? 80,
    notes          : initial.notes || '',
  } : INITIAL);

  const [categories, setCategories] = useState([]);
  const [errors,     setErrors]     = useState({});

  useEffect(() => {
    categoriesAPI.getAll({ type: 'expense' })
      .then(r => setCategories(r.data.data.categories))
      .catch(() => toast.error('Failed to load categories.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    const range  = getDateRange(period);
    setForm(prev => ({ ...prev, period, ...range }));
    setErrors(prev => ({ ...prev, start_date: '', end_date: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name       = 'Budget name is required.';
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = 'Enter a valid positive amount.';
    if (!form.start_date)       e.start_date = 'Start date is required.';
    if (!form.end_date)         e.end_date   = 'End date is required.';
    if (form.start_date && form.end_date && form.end_date <= form.start_date)
      e.end_date = 'End date must be after start date.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      name           : form.name.trim(),
      amount         : parseFloat(form.amount),
      period         : form.period,
      category_id    : form.category_id ? parseInt(form.category_id, 10) : null,
      start_date     : form.start_date,
      end_date       : form.end_date,
      alert_threshold: parseFloat(form.alert_threshold),
      notes          : form.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="bname">
            Budget Name <span className="required">*</span>
          </label>
          <input
            id="bname" name="name" type="text"
            className={`form-input${errors.name ? ' form-input--error' : ''}`}
            placeholder="e.g. Monthly Food Budget"
            value={form.name}
            onChange={handleChange}
            maxLength={100}
          />
          {errors.name && <span className="form-error">⚠ {errors.name}</span>}
        </div>

        {/* Amount + Period */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="bamount">
              Amount <span className="required">*</span>
            </label>
            <input
              id="bamount" name="amount" type="number"
              min="0.01" step="0.01"
              className={`form-input${errors.amount ? ' form-input--error' : ''}`}
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            {errors.amount && <span className="form-error">⚠ {errors.amount}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="period">Period</label>
            <select
              id="period" name="period"
              className="form-select"
              value={form.period}
              onChange={handlePeriodChange}
            >
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Category (optional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="bcategory">
            Category <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — leave blank for overall budget)</span>
          </label>
          <select
            id="bcategory" name="category_id"
            className="form-select"
            value={form.category_id}
            onChange={handleChange}
          >
            <option value="">All Expense Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="start_date">
              Start Date <span className="required">*</span>
            </label>
            <input
              id="start_date" name="start_date" type="date"
              className={`form-input${errors.start_date ? ' form-input--error' : ''}`}
              value={form.start_date}
              onChange={handleChange}
            />
            {errors.start_date && <span className="form-error">⚠ {errors.start_date}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="end_date">
              End Date <span className="required">*</span>
            </label>
            <input
              id="end_date" name="end_date" type="date"
              className={`form-input${errors.end_date ? ' form-input--error' : ''}`}
              value={form.end_date}
              onChange={handleChange}
              min={form.start_date}
            />
            {errors.end_date && <span className="form-error">⚠ {errors.end_date}</span>}
          </div>
        </div>

        {/* Alert threshold */}
        <div className="form-group">
          <label className="form-label" htmlFor="alert_threshold">
            Alert Threshold — <span style={{ color: 'var(--color-warning)', fontFamily: 'var(--font-mono)' }}>
              {form.alert_threshold}%
            </span>
          </label>
          <input
            id="alert_threshold" name="alert_threshold"
            type="range" min="10" max="100" step="5"
            value={form.alert_threshold}
            onChange={handleChange}
            style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <span>10%</span><span>Alert when spending reaches this %</span><span>100%</span>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="bnotes">Notes</label>
          <textarea
            id="bnotes" name="notes"
            className="form-textarea"
            placeholder="Optional notes about this budget…"
            value={form.notes}
            onChange={handleChange}
            maxLength={500}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Saving…
              </>
            ) : initial ? 'Save Changes' : 'Create Budget'}
          </button>
        </div>

      </div>
    </form>
  );
};

export default BudgetForm;