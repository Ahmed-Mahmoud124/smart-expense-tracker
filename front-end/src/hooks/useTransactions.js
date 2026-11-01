import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../api/axios';
import { toast } from 'react-toastify';

const DEFAULT_FILTERS = {
  page      : 1,
  limit     : 20,
  type      : '',
  category_id: '',
  start_date : '',
  end_date   : '',
  search     : '',
  sort_by    : 'transaction_date',
  sort_order : 'DESC',
};

export const useTransactions = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [filters,      setFilters]      = useState({ ...DEFAULT_FILTERS, ...initialFilters });

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (overrideFilters = {}) => {
    setLoading(true);
    setError(null);

    const activeFilters = { ...filters, ...overrideFilters };

    // Strip empty values before sending
    const cleanParams = Object.fromEntries(
      Object.entries(activeFilters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    try {
      const { data } = await transactionsAPI.getAll(cleanParams);
      setTransactions(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load transactions.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Fetch summary ──────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async (params = {}) => {
    try {
      const { data } = await transactionsAPI.getSummary(params);
      setSummary(data.data.summary);
    } catch {
      // Non-critical — fail silently
    }
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────
  const createTransaction = useCallback(async (formData) => {
    try {
      const { data } = await transactionsAPI.create(formData);
      toast.success('Transaction added successfully.');
      await fetchTransactions();
      return { success: true, transaction: data.data.transaction };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create transaction.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, [fetchTransactions]);

  // ── Update ─────────────────────────────────────────────────────────────────
  const updateTransaction = useCallback(async (id, formData) => {
    try {
      const { data } = await transactionsAPI.update(id, formData);

      // Optimistic list update
      setTransactions(prev =>
        prev.map(t => t.id === id ? data.data.transaction : t)
      );

      toast.success('Transaction updated successfully.');
      return { success: true, transaction: data.data.transaction };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update transaction.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    try {
      await transactionsAPI.delete(id);

      // Optimistic removal
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted.');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete transaction.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Update filters & reset to page 1 ──────────────────────────────────────
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Auto-fetch when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    pagination,
    summary,
    loading,
    error,
    filters,
    fetchTransactions,
    fetchSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateFilters,
    resetFilters,
    goToPage,
  };
};