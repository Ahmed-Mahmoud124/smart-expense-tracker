import React, { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { categoriesAPI } from '../api/axios';
import Modal from '../components/common/Modal';
import TransactionForm from '../components/forms/TransactionForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

const fmt = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

const Transactions = () => {
  const {
    transactions, pagination, loading, filters,
    createTransaction, updateTransaction, deleteTransaction,
    updateFilters, resetFilters, goToPage,
    fetchSummary, summary,
  } = useTransactions();

  const [categories,   setCategories]   = useState([]);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const currency = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')).currency : 'USD';

  // Load all categories for filter dropdown
  useEffect(() => {
    categoriesAPI.getAll()
      .then(r => setCategories(r.data.data.categories))
      .catch(() => {});
  }, []);

  // Fetch summary for visible period
  useEffect(() => {
    fetchSummary({
      start_date: filters.start_date || undefined,
      end_date  : filters.end_date   || undefined,
    });
  }, [fetchSummary, filters.start_date, filters.end_date]);

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (tx)  => { setEditTarget(tx); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSubmit = async (formData) => {
    setSubmitLoading(true);
    const result = editTarget
      ? await updateTransaction(editTarget.id, formData)
      : await createTransaction(formData);
    setSubmitLoading(false);
    if (result.success) closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            {pagination ? `${pagination.total} total records` : 'Manage your income & expenses'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn--primary" onClick={openCreate}>
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={{
          display      : 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap          : 16,
        }}>
          {[
            { label: 'Total Income',   value: fmt(summary.total_income,   currency), color: 'var(--color-income)'  },
            { label: 'Total Expenses', value: fmt(summary.total_expense,  currency), color: 'var(--color-expense)' },
            { label: 'Net Balance',    value: fmt(summary.net_balance,    currency),
              color: summary.net_balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' },
            { label: 'Transactions',   value: summary.transaction_count,  color: 'var(--color-info)'    },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search description or notes…"
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
            />
          </div>

          {/* Type */}
          <div style={{ flex: '0 1 140px' }}>
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={e => updateFilters({ type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category */}
          <div style={{ flex: '0 1 180px' }}>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.category_id}
              onChange={e => updateFilters({ category_id: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label">From</label>
            <input
              type="date" className="form-input"
              value={filters.start_date}
              onChange={e => updateFilters({ start_date: e.target.value })}
            />
          </div>
          <div style={{ flex: '0 1 150px' }}>
            <label className="form-label">To</label>
            <input
              type="date" className="form-input"
              value={filters.end_date}
              onChange={e => updateFilters({ end_date: e.target.value })}
            />
          </div>

          {/* Reset */}
          <button className="btn btn--secondary" onClick={resetFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <LoadingSpinner size="md" text="Loading transactions…" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">💳</div>
            <div className="empty-state__title">No transactions found</div>
            <div className="empty-state__text">
              {Object.values(filters).some(v => v && v !== 1 && v !== 20 && v !== 'transaction_date' && v !== 'DESC')
                ? 'Try adjusting your filters.'
                : 'Add your first transaction to get started.'}
            </div>
            <button className="btn btn--primary" onClick={openCreate}>Add Transaction</button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.description || '—'}</div>
                      {tx.notes && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{tx.notes.slice(0, 60)}{tx.notes.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 28, height: 28,
                          borderRadius: 'var(--radius-sm)',
                          background: tx.category_color + '22',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', flexShrink: 0,
                        }}>
                          {tx.category_icon}
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)' }}>{tx.category_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge--${tx.type}`}>
                        {tx.type === 'income' ? '↑' : '↓'} {tx.type}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`amount amount--${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, currency)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEdit(tx)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDeleteTarget(tx)}
                          title="Delete"
                          style={{ color: 'var(--color-expense)' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'space-between',
            padding       : '16px 20px',
            borderTop     : '1px solid var(--color-border)',
            flexWrap      : 'wrap',
            gap           : 12,
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn--secondary btn--sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => goToPage(pagination.page - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    className={`btn btn--sm ${pagination.page === pg ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => goToPage(pg)}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                className="btn btn--secondary btn--sm"
                disabled={!pagination.hasNextPage}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Transaction' : 'Add Transaction'}
        size="md"
      >
        <TransactionForm
          initial={editTarget}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          loading={submitLoading}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Transaction"
        size="sm"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn--danger"    onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Are you sure you want to delete this transaction?
        </p>
        {deleteTarget && (
          <div style={{
            marginTop   : 16,
            padding     : '12px 16px',
            background  : 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border      : '1px solid var(--color-border)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {deleteTarget.description || deleteTarget.category_name}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {deleteTarget.type === 'income' ? '+' : '-'}
              {fmt(deleteTarget.amount, currency)} · {new Date(deleteTarget.transaction_date).toLocaleDateString()}
            </div>
          </div>
        )}
        <p style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          This action cannot be undone.
        </p>
      </Modal>

    </div>
  );
};

export default Transactions;