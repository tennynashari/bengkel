import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchOutlets = () => api.get('/outlets');
export const getOutlets = fetchOutlets;
export const fetchServices = () => api.get('/services');
export const fetchBays = (outletId) => api.get(`/bays?outletId=${outletId || ''}`);

// Pit / Bay CRUD
export const createBay = (data) => api.post('/bays', data);
export const updateBay = (id, data) => api.put(`/bays/${id}`, data);
export const deleteBay = (id) => api.delete(`/bays/${id}`);

// Service CRUD
export const createService = (data) => api.post('/services', data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const deleteService = (id) => api.delete(`/services/${id}`);

// Bookings
export const createBooking = (bookingData) => api.post('/bookings', bookingData);
export const trackBooking = (code) => api.get(`/bookings/track/${code}`);
export const fetchAllBookings = (params) => api.get('/bookings', { params });
export const updateBookingStatus = (id, data) => api.put(`/bookings/${id}/status`, data);
export const saveInspection = (id, data) => api.post(`/bookings/${id}/inspection`, data);
export const addProgress = (id, data) => api.post(`/bookings/${id}/progress`, data);
export const loginAdmin = (credentials) => api.post('/auth/login', credentials);

// Mechanics CRUD
export const fetchMechanics = (outletId) => api.get(`/mechanics?outletId=${outletId || ''}`);
export const createMechanic = (data) => api.post('/mechanics', data);
export const updateMechanic = (id, data) => api.put(`/mechanics/${id}`, data);
export const deleteMechanic = (id) => api.delete(`/mechanics/${id}`);

export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

export const uploadPaymentProof = (bookingId, paymentProof) => 
  api.post(`/bookings/${bookingId}/payment-proof`, { payment_proof: paymentProof });

export const updateOutlet = (outletId, data) => 
  api.put(`/outlets/${outletId}`, data);


export const createOutlet = async (data) => {
  const response = await api.post('/outlets', data);
  return response.data;
};

export const deleteOutlet = async (id) => {
  const response = await api.delete(`/outlets/${id}`);
  return response.data;
};

export const fetchServicesByOutlet = async (outletId) => {
  const response = await api.get('/services', { params: { outletId } });
  return response.data;
};


// User Management API
export const fetchUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put('/users/' + id, data);
export const deleteUser = (id) => api.delete('/users/' + id);

export const loginUser = (email, password) => api.post('/auth/login', { email, password }).then(res => res.data);
