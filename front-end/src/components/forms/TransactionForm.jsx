import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../../api/axios';
import { toast } from 'react-toastify';

const INITIAL = {
  type            : 'expense',
  amount          : '',
  category_id     : '',
  description     : '',
  transaction_date: new Date().toISOString().split('T')[0],
  notes           : '',
};

const TransactionForm = ({ initial = null, onSubmit, onCancel, loading = false }) => {
  const [form,       setForm]       = useState(initial ? {
    type            : initial.type,
    amount          : String(initial.amount),
    category_id     : String(initial.category_id),
    description     : initial.description || '',
    transaction_date: initial.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes           : initial.notes || '',
  } : INITIAL);

  const [categories, setCategories] = useState([]);
  const [errors,     setErrors]     = useState({});
  const [catLoading, setCatLoading] = useState(true);

  // Load categories filtered by current type
  useEffect(() => {
    const load = async () => {
      setCatLoading(true);
      try {
        const { data } = await categoriesAPI.getAll({ type: form.type });
        setCategories(data.data.categories);
        // Reset category if it doesn't match new type
        if (form.category_id) {
          const match = data.data.categories.find(c => String(c.id) === String(form.category_id));
          if (!match) setForm(prev => ({ ...prev, category_id: '' }));
        }
      } catch {
        toast.error('Failed to load categories.');
      } finally {
        setCatLoading(false);
      }
    };
    load();
  }, [form.type]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e = {};
    if (!form.type)             e.type     = 'Type is required.';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Enter a valid positive amount.';
    if (!form.category_id)      e.category_id = 'Please select a category.';
    if (!form.transaction_date) e.transaction_date = 'Date is required.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTypeSwitch = (type) => {
    setForm(prev => ({ ...prev, type, category_id: '' }));
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      type            : form.type,
      amount          : parseFloat(form.amount),
      category_id     : parseInt(form.category_id, 10),
      description     : form.description.trim(),
      transaction_date: form.transaction_date,
      notes           : form.notes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['expense', 'income'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeSwitch(t)}
            style={{
              flex        : 1,
              padding     : '10px',
              borderRadius: 'var(--radius-md)',
              border      : `1px solid ${form.type === t
                ? (t === 'income' ? 'var(--color-income)' : 'var(--color-expense)')
                : 'var(--color-border)'}`,
              background  : form.type === t
                ? (t === 'income' ? 'var(--color-income-bg)' : 'var(--color-expense-bg)')
                : 'var(--color-bg-input)',
              color       : form.type === t
                ? (t === 'income' ? 'var(--color-income)' : 'var(--color-expense)')
                : 'var(--color-text-secondary)',
              fontWeight  : 600,
              fontSize    : 'var(--text-sm)',
              cursor      : 'pointer',
              transition  : 'all var(--transition-fast)',
              textTransform: 'capitalize',
            }}
          >
            {t === 'income' ? '💰 Income' : '💸 Expense'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="amount">
            Amount <span className="required">*</span>
          </label>
          <input
            id="amount" name="amount" type="number"
            min="0.01" step="0.01"
            className={`form-input${errors.amount ? ' form-input--error' : ''}`}
            placeholder="0.00"
            value={form.amount}
            onChange={handleChange}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)' }}
          />
          {errors.amount && <span className="form-error">⚠ {errors.amount}</span>}
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="category_id">
            Category <span className="required">*</span>
          </label>
          <select
            id="category_id" name="category_id"
            className={`form-select${errors.category_id ? ' form-select--error' : ''}`}
            value={form.category_id}
            onChange={handleChange}
            disabled={catLoading}
          >
            <option value="">{catLoading ? 'Loading categories…' : 'Select a category'}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && <span className="form-error">⚠ {errors.category_id}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <input
            id="description" name="description" type="text"
            className="form-input"
            placeholder="e.g. Grocery shopping at Carrefour"
            value={form.description}
            onChange={handleChange}
            maxLength={500}
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="transaction_date">
            Date <span className="required">*</span>
          </label>
          <input
            id="transaction_date" name="transaction_date" type="date"
            className={`form-input${errors.transaction_date ? ' form-input--error' : ''}`}
            value={form.transaction_date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.transaction_date && <span className="form-error">⚠ {errors.transaction_date}</span>}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label" htmlFor="notes">Notes</label>
          <textarea
            id="notes" name="notes"
            className="form-textarea"
            placeholder="Optional additional details…"
            value={form.notes}
            onChange={handleChange}
            maxLength={1000}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{
              background  : form.type === 'income' ? 'var(--color-income)' : 'var(--color-accent)',
              borderColor : form.type === 'income' ? 'var(--color-income)' : 'var(--color-accent)',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Saving…
              </>
            ) : initial ? 'Save Changes' : `Add ${form.type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </div>

      </div>
    </form>
  );
};

export default TransactionForm;