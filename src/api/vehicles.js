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
  const { data, isLoading, error, mutate } = useSWR(
    id ? `vehicle-details-${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    vehicle: data?.data || null,
    vehicleLoading: isLoading,
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
