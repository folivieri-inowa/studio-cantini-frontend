import useSWR from 'swr';

import axios from '../utils/axios';

// ----------------------------------------------------------------------

export function useGetCashFlow(filters = {}) {
  const apiUrl = '/api/cash-flow/list';

  const fetcher = async () => {
    const response = await axios.post(apiUrl, { filters });
    return response.data;
  };

  const { data, isLoading, error, mutate } = useSWR(
    `cash-flow-list-${JSON.stringify(filters)}`,
    fetcher,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  return {
    cashFlow: data?.data || [],
    cashFlowLoading: isLoading,
    cashFlowError: error,
    cashFlowEmpty: !isLoading && !(data?.data?.length),
    cashFlowMutate: mutate,
  };
}

// ----------------------------------------------------------------------

export function useGetCashFlowDetails(id) {
  const fetcher = async () => {
    const response = await axios.post('/api/cash-flow/details', { id });
    return response.data;
  };

  const { data, isLoading, error, mutate } = useSWR(
    id ? `cash-flow-details-${id}` : null,
    fetcher,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  return {
    cashFlowItem: data?.data || null,
    cashFlowItemLoading: isLoading,
    cashFlowItemError: error,
    cashFlowItemMutate: mutate,
  };
}

// ----------------------------------------------------------------------
// Withdrawal CRUD

export async function createCashFlow(itemData) {
  const response = await axios.post('/api/cash-flow/create', itemData);
  return response.data;
}

export async function updateCashFlow(id, itemData) {
  const response = await axios.post('/api/cash-flow/update', { id, ...itemData });
  return response.data;
}

export async function deleteCashFlow(id) {
  const response = await axios.post('/api/cash-flow/delete', { id });
  return response.data;
}

export async function updateCashFlowStatus(id, status) {
  const response = await axios.post('/api/cash-flow/update-status', { id, status });
  return response.data;
}

// ----------------------------------------------------------------------
// Expense CRUD

export async function createExpense(expenseData) {
  const response = await axios.post('/api/cash-flow/expense/create', expenseData);
  return response.data;
}

export async function updateExpense(id, expenseData) {
  const response = await axios.post('/api/cash-flow/expense/update', { id, ...expenseData });
  return response.data;
}

export async function deleteExpense(id) {
  const response = await axios.post('/api/cash-flow/expense/delete', { id });
  return response.data;
}

// ----------------------------------------------------------------------
// Attachment management

export async function uploadExpenseAttachment(formData) {
  const response = await axios.post('/api/cash-flow/expense/upload-attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteExpenseAttachment(id) {
  const response = await axios.post('/api/cash-flow/expense/delete-attachment', { id });
  return response.data;
}
