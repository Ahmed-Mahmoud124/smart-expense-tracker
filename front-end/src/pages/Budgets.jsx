import React, { useState, useEffect, useCallback } from 'react';
import { budgetsAPI } from '../api/axios';
import Modal from '../components/common/Modal';
import BudgetForm from '../components/forms/BudgetForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const fmt = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(0)}`;
  }
};

const getProgressColor = (pct) => {
  if (pct >= 100) return 'var(--color-expense)';
  if (pct >= 80)  return 'var(--color-warning)';
  return 'var(--color-income)';
};

const BudgetCard = ({ budget, currency, onEdit, onDelete }) => {
  const pct   = Math.min(budget.percentage_used, 100);
  const color = getProgressColor(budget.percentage_used);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{budget.name}</span>
            {budget.is_exceeded && <span className="badge badge--danger">Exceeded</span>}
            {!budget.is_exceeded && budget.alert_triggered && <span className="badge badge--warning">⚠ Alert</span>}
            {!budget.is_active   && <span className="badge badge--neutral">Inactive</span>}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {budget.category_name
              ? `${budget.category_icon || '📦'} ${budget.category_name}`
              : '📊 All Categories'
            } · {budget.period}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onEdit(budget)} title="Edit">✏️</button>
          <button className="btn btn--ghost btn--icon btn--sm" onClick={() => onDelete(budget)} title="Delete" style={{ color: 'var(--color-expense)' }}>🗑️</button>
        </div>
      </div>

      {/* Amount display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>Spent</div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>
            {fmt(budget.spent, currency)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>Limit</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
            {fmt(budget.amount, currency)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            {fmt(budget.remaining >= 0 ? budget.remaining : 0, currency)} remaining
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
            {budget.percentage_used.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>

      {/* Date range */}
      <div style={{
        display      : 'flex',
        justifyContent: 'space-between',
        fontSize     : 'var(--text-xs)',
        color        : 'var(--color-text-muted)',
        paddingTop   : 8,
        borderTop    : '1px solid var(--color-border-subtle)',
        fontFamily   : 'var(--font-mono)',
      }}>
        <span>{new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>→</span>
        <span>{new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
    </div>
  );
};

const Budgets = () => {
  const [budgets,      setBudgets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const currency = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')).currency : 'USD';

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await budgetsAPI.getAll();
      setBudgets(data.data);
    } catch {
      toast.error('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (b)  => { setEditTarget(b);  setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    try {
      if (editTarget) {
        await budgetsAPI.update(editTarget.id, formData);
        toast.success('Budget updated successfully.');
      } else {
        await budgetsAPI.create(formData);
        toast.success('Budget created successfully.');
      }
      closeModal();
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await budgetsAPI.delete(deleteTarget.id);
      toast.success('Budget deleted.');
      setBudgets(prev => prev.filter(b => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete budget.');
    }
  };

  const active   = budgets.filter(b => b.is_active);
  const inactive = budgets.filter(b => !b.is_active);
  const alerts   = active.filter(b => b.alert_triggered || b.is_exceeded);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} · {alerts.length} alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn--primary" onClick={openCreate}>+ New Budget</button>
        </div>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div style={{
          background   : 'var(--color-warning-bg)',
          border       : '1px solid var(--color-warning)',
          borderRadius : 'var(--radius-lg)',
          padding      : '14px 18px',
          display      : 'flex',
          alignItems   : 'center',
          gap          : 12,
          fontSize     : 'var(--text-sm)',
          color        : 'var(--color-warning)',
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <strong>{alerts.length} budget{alerts.length > 1 ? 's have' : ' has'} reached the alert threshold.</strong>
          {alerts.filter(b => b.is_exceeded).length > 0 && (
            <span style={{ color: 'var(--color-expense)' }}>
              {alerts.filter(b => b.is_exceeded).length} exceeded!
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <LoadingSpinner size="lg" text="Loading budgets…" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎯</div>
          <div className="empty-state__title">No budgets yet</div>
          <div className="empty-state__text">Create your first budget to start tracking your spending limits.</div>
          <button className="btn btn--primary" onClick={openCreate}>Create Budget</button>
        </div>
      ) : (
        <>
          {/* Active budgets */}
          {active.length > 0 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16 }}>
                Active Budgets <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 400 }}>({active.length})</span>
              </h2>
              <div className="grid-3">
                {active.map(b => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    currency={currency}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive budgets */}
          {inactive.length > 0 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16 }}>
                Past Budgets <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 400 }}>({inactive.length})</span>
              </h2>
              <div className="grid-3">
                {inactive.map(b => (
                  <BudgetCard
                    key={b.id}
                    budget={b}
                    currency={currency}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Budget' : 'Create Budget'}
        size="lg"
      >
        <BudgetForm
          initial={editTarget}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={submitLoading}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Budget"
        size="sm"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn--danger"    onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>

    </div>
  );
};

export default Budgets;