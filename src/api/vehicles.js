import useSWR from 'swr';

import axios from '../utils/axios';

// ----------------------------------------------------------------------

const BASE = '/api/vehicles';

// ─── VEICOLI ──────────────────────────────────────────────────────────────────

export function useGetVehicles(filters = {}) {
  const fetcher = async () => {
    const res = await axios.post(`${BASE}/list`, { filters });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    `vehicles-list-${JSON.stringify(filters)}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    vehicles: data?.data || [],
    vehiclesLoading: isLoading,
    vehiclesError: error,
    vehiclesEmpty: !isLoading && !(data?.data?.length),
    vehiclesMutate: mutate,
  };
}

export function useGetVehicleDetails(id) {
  const fetcher = async () => {
    if (!id) return null;
    const res = await axios.post(`${BASE}/details`, { id });
    return res.data;
  };
  const { data, isLoading, isValidating, error, mutate } = useSWR(
    id ? `vehicle-details-${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    vehicle: data?.data || null,
    vehicleLoading: isLoading || isValidating,
    vehicleError: error,
    vehicleMutate: mutate,
  };
}

export async function getVehicles(filters = {}) {
  const res = await axios.post(`${BASE}/list`, { filters });
  return res.data;
}

export async function getVehicleDetails(id) {
  const res = await axios.post(`${BASE}/details`, { id });
  return res.data;
}

export async function createVehicle(vehicle) {
  const res = await axios.post(`${BASE}/create`, { vehicle });
  return res.data;
}

export async function updateVehicle(id, vehicle) {
  const res = await axios.post(`${BASE}/update`, { id, vehicle });
  return res.data;
}

export async function deleteVehicle(id) {
  const res = await axios.post(`${BASE}/delete`, { id });
  return res.data;
}

// ─── DOCUMENTI ────────────────────────────────────────────────────────────────

export function useGetVehicleDocuments(vehicleId) {
  const fetcher = async () => {
    if (!vehicleId) return null;
    const res = await axios.post(`${BASE}/documents/list`, { vehicle_id: vehicleId });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    vehicleId ? `vehicle-documents-${vehicleId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    documents: data?.data || [],
    documentsLoading: isLoading,
    documentsError: error,
    documentsMutate: mutate,
  };
}

export async function getVehicleDocuments(vehicleId) {
  const res = await axios.post(`${BASE}/documents/list`, { vehicle_id: vehicleId });
  return res.data;
}

export async function createVehicleDocument(document) {
  const res = await axios.post(`${BASE}/documents/create`, { document });
  return res.data;
}

export async function deleteVehicleDocument(id) {
  const res = await axios.post(`${BASE}/documents/delete`, { id });
  return res.data;
}

export async function uploadVehicleDocument(vehicleId, category, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(
    `${BASE}/documents/upload?vehicle_id=${vehicleId}&category=${category}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
}

// ─── MANUTENZIONI ─────────────────────────────────────────────────────────────

export function useGetVehicleMaintenance(vehicleId) {
  const fetcher = async () => {
    if (!vehicleId) return null;
    const res = await axios.post(`${BASE}/maintenance/list`, { vehicle_id: vehicleId });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    vehicleId ? `vehicle-maintenance-${vehicleId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    maintenance: data?.data || [],
    maintenanceLoading: isLoading,
    maintenanceError: error,
    maintenanceMutate: mutate,
  };
}

export async function getVehicleMaintenance(vehicleId) {
  const res = await axios.post(`${BASE}/maintenance/list`, { vehicle_id: vehicleId });
  return res.data;
}

export async function createVehicleMaintenance(maintenance) {
  const res = await axios.post(`${BASE}/maintenance/create`, { maintenance });
  return res.data;
}

export async function updateVehicleMaintenance(id, maintenance) {
  const res = await axios.post(`${BASE}/maintenance/update`, { id, maintenance });
  return res.data;
}

export async function deleteVehicleMaintenance(id) {
  const res = await axios.post(`${BASE}/maintenance/delete`, { id });
  return res.data;
}

// ─── PNEUMATICI ───────────────────────────────────────────────────────────────

export function useGetVehicleTires(vehicleId) {
  const fetcher = async () => {
    if (!vehicleId) return null;
    const res = await axios.post(`${BASE}/tires/list`, { vehicle_id: vehicleId });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    vehicleId ? `vehicle-tires-${vehicleId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    tires: data?.data || [],
    tiresLoading: isLoading,
    tiresError: error,
    tiresMutate: mutate,
  };
}

export async function getVehicleTires(vehicleId) {
  const res = await axios.post(`${BASE}/tires/list`, { vehicle_id: vehicleId });
  return res.data;
}

export async function createVehicleTire(tire) {
  const res = await axios.post(`${BASE}/tires/create`, { tire });
  return res.data;
}

export async function updateVehicleTire(id, tire) {
  const res = await axios.post(`${BASE}/tires/update`, { id, tire });
  return res.data;
}

export async function deleteVehicleTire(id) {
  const res = await axios.post(`${BASE}/tires/delete`, { id });
  return res.data;
}

// ─── SINISTRI ─────────────────────────────────────────────────────────────────

export function useGetVehicleIncidents(vehicleId) {
  const fetcher = async () => {
    if (!vehicleId) return null;
    const res = await axios.post(`${BASE}/incidents/list`, { vehicle_id: vehicleId });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    vehicleId ? `vehicle-incidents-${vehicleId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    incidents: data?.data || [],
    incidentsLoading: isLoading,
    incidentsError: error,
    incidentsMutate: mutate,
  };
}

export async function getVehicleIncidents(vehicleId) {
  const res = await axios.post(`${BASE}/incidents/list`, { vehicle_id: vehicleId });
  return res.data;
}

export async function createVehicleIncident(incident) {
  const res = await axios.post(`${BASE}/incidents/create`, { incident });
  return res.data;
}

export async function updateVehicleIncident(id, incident) {
  const res = await axios.post(`${BASE}/incidents/update`, { id, incident });
  return res.data;
}

export async function deleteVehicleIncident(id) {
  const res = await axios.post(`${BASE}/incidents/delete`, { id });
  return res.data;
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

export function useGetVehicleTimeline(vehicleId) {
  const fetcher = async () => {
    if (!vehicleId) return null;
    const res = await axios.post(`${BASE}/timeline`, { vehicle_id: vehicleId });
    return res.data;
  };
  const { data, isLoading, error, mutate } = useSWR(
    vehicleId ? `vehicle-timeline-${vehicleId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    timeline: data?.data || [],
    timelineLoading: isLoading,
    timelineError: error,
    timelineMutate: mutate,
  };
}

export async function getVehicleTimeline(vehicleId) {
  const res = await axios.post(`${BASE}/timeline`, { vehicle_id: vehicleId });
  return res.data;
}

// ─── POLIZZE ──────────────────────────────────────────────────────────────────

export function useGetVehiclePolicies(vehicleId) {
  const fetcher = () => axios.post(`${BASE}/policies/list`, { vehicleId }).then(r => r.data);
  const { data, isLoading, mutate } = useSWR(vehicleId ? `vehicle-policies-${vehicleId}` : null, fetcher, { revalidateOnFocus: false });
  return { policies: data?.data || [], policiesLoading: isLoading, policiesMutate: mutate };
}

export const createVehiclePolicy = (policy) => axios.post(`${BASE}/policies/create`, { policy }).then(r => r.data);
export const updateVehiclePolicy = (id, policy) => axios.post(`${BASE}/policies/update`, { id, policy }).then(r => r.data);
export const deleteVehiclePolicy = (id) => axios.post(`${BASE}/policies/delete`, { id }).then(r => r.data);

// ─── TASSE ────────────────────────────────────────────────────────────────────

export function useGetVehicleTaxes(vehicleId) {
  const fetcher = () => axios.post(`${BASE}/taxes/list`, { vehicleId }).then(r => r.data);
  const { data, isLoading, mutate } = useSWR(vehicleId ? `vehicle-taxes-${vehicleId}` : null, fetcher, { revalidateOnFocus: false });
  return { taxes: data?.data || [], taxesLoading: isLoading, taxesMutate: mutate };
}

export const calculateVehicleBollo = (kw, region) => axios.post(`${BASE}/taxes/calculate`, { kw, region }).then(r => r.data);
export const createVehicleTax = (tax) => axios.post(`${BASE}/taxes/create`, { tax }).then(r => r.data);
export const updateVehicleTax = (id, tax) => axios.post(`${BASE}/taxes/update`, { id, tax }).then(r => r.data);
export const deleteVehicleTax = (id) => axios.post(`${BASE}/taxes/delete`, { id }).then(r => r.data);

// ─── ZTL ──────────────────────────────────────────────────────────────────────

export function useGetVehicleZtl(vehicleId) {
  const fetcher = () => axios.post(`${BASE}/ztl/list`, { vehicleId }).then(r => r.data);
  const { data, isLoading, mutate } = useSWR(vehicleId ? `vehicle-ztl-${vehicleId}` : null, fetcher, { revalidateOnFocus: false });
  return { ztlList: data?.data || [], ztlLoading: isLoading, ztlMutate: mutate };
}

export const createVehicleZtl = (ztl) => axios.post(`${BASE}/ztl/create`, { ztl }).then(r => r.data);
export const updateVehicleZtl = (id, ztl) => axios.post(`${BASE}/ztl/update`, { id, ztl }).then(r => r.data);
export const deleteVehicleZtl = (id) => axios.post(`${BASE}/ztl/delete`, { id }).then(r => r.data);

// ─── CONTRAVVENZIONI ──────────────────────────────────────────────────────────

export function useGetVehicleFines(vehicleId) {
  const fetcher = () => axios.post(`${BASE}/fines/list`, { vehicleId }).then(r => r.data);
  const { data, isLoading, mutate } = useSWR(vehicleId ? `vehicle-fines-${vehicleId}` : null, fetcher, { revalidateOnFocus: false });
  return { fines: data?.data || [], finesLoading: isLoading, finesMutate: mutate };
}

export const createVehicleFine = (fine) => axios.post(`${BASE}/fines/create`, { fine }).then(r => r.data);
export const updateVehicleFine = (id, fine) => axios.post(`${BASE}/fines/update`, { id, fine }).then(r => r.data);
export const deleteVehicleFine = (id) => axios.post(`${BASE}/fines/delete`, { id }).then(r => r.data);
