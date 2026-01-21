import apiClient from './client';

export const adminApi = {
  // User management
  getUsers: async (params = {}) => {
    const response = await apiClient.get('/auth/admin/users/', { params });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await apiClient.get(`/auth/admin/users/${id}/`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await apiClient.post('/auth/admin/users/', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: any) => {
    const response = await apiClient.put(`/auth/admin/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await apiClient.delete(`/auth/admin/users/${id}/`);
    return response.data;
  },

  setPassword: async (id: number, password: string) => {
    const response = await apiClient.post(`/auth/admin/users/${id}/set_password/`, { password });
    return response.data;
  },

  assignRoles: async (id: number, roles: string[]) => {
    const response = await apiClient.post(`/auth/admin/users/${id}/assign_roles/`, { roles });
    return response.data;
  },

  // Product management (using existing catalog endpoints with admin permissions)
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/catalog/products/', { params });
    return response.data;
  },

  getProduct: async (id: number) => {
    const response = await apiClient.get(`/catalog/products/${id}/`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await apiClient.post('/catalog/products/', productData, {
      headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  updateProduct: async (id: number, productData: any) => {
    const response = await apiClient.put(`/catalog/products/${id}/`, productData, {
      headers: productData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteProduct: async (id: number) => {
    const response = await apiClient.delete(`/catalog/products/${id}/`);
    return response.data;
  },

  // Category management
  getCategories: async (params = {}) => {
    const response = await apiClient.get('/catalog/categories/', { params });
    return response.data;
  },

  getCategory: async (id: number) => {
    const response = await apiClient.get(`/catalog/categories/${id}/`);
    return response.data;
  },

  createCategory: async (categoryData: any) => {
    const response = await apiClient.post('/catalog/categories/', categoryData);
    return response.data;
  },

  updateCategory: async (id: number, categoryData: any) => {
    const response = await apiClient.put(`/catalog/categories/${id}/`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/catalog/categories/${id}/`);
    return response.data;
  },

  // Tag management
  getTags: async (params = {}) => {
    const response = await apiClient.get('/catalog/tags/', { params });
    return response.data;
  },

  getTag: async (id: number) => {
    const response = await apiClient.get(`/catalog/tags/${id}/`);
    return response.data;
  },

  createTag: async (tagData: any) => {
    const response = await apiClient.post('/catalog/tags/', tagData);
    return response.data;
  },

  updateTag: async (id: number, tagData: any) => {
    const response = await apiClient.put(`/catalog/tags/${id}/`, tagData);
    return response.data;
  },

  deleteTag: async (id: number) => {
    const response = await apiClient.delete(`/catalog/tags/${id}/`);
    return response.data;
  },

  // Device management
  getDevices: async (params = {}) => {
    const response = await apiClient.get('/clinic/devices/', { params });
    return response.data;
  },

  getDevice: async (id: number) => {
    const response = await apiClient.get(`/clinic/devices/${id}/`);
    return response.data;
  },

  createDevice: async (deviceData: any) => {
    const response = await apiClient.post('/clinic/devices/', deviceData);
    return response.data;
  },

  updateDevice: async (id: number, deviceData: any) => {
    const response = await apiClient.put(`/clinic/devices/${id}/`, deviceData);
    return response.data;
  },

  deleteDevice: async (id: number) => {
    const response = await apiClient.delete(`/clinic/devices/${id}/`);
    return response.data;
  },

  // Room management
  getRooms: async (params = {}) => {
    const response = await apiClient.get('/clinic/rooms/', { params });
    return response.data;
  },

  getRoom: async (id: number) => {
    const response = await apiClient.get(`/clinic/rooms/${id}/`);
    return response.data;
  },

  createRoom: async (roomData: any) => {
    const response = await apiClient.post('/clinic/rooms/', roomData);
    return response.data;
  },

  updateRoom: async (id: number, roomData: any) => {
    const response = await apiClient.put(`/clinic/rooms/${id}/`, roomData);
    return response.data;
  },

  deleteRoom: async (id: number) => {
    const response = await apiClient.delete(`/clinic/rooms/${id}/`);
    return response.data;
  },

  // Feedback management
  getFeedbacks: async (params?: {
    page?: number;
    rating?: number;
    staff?: number;
    room?: number;
    date_from?: string;
    date_to?: string;
  }) => {
    const response = await apiClient.get('/feedbacks/', { params });
    return response.data;
  },

  getFeedbackStats: async () => {
    const response = await apiClient.get('/feedbacks/stats/');
    return response.data;
  },

  // Inventory management
  getInventoryBalances: async (params = {}) => {
    const response = await apiClient.get('/inventory/balances/', { params });
    return response.data;
  },

  receiveStock: async (data: { product_id: number; quantity: number; note?: string }) => {
    const response = await apiClient.post('/inventory/stock/receipt', data);
    return response.data;
  },

  adjustStock: async (data: { product_id: number; delta: number; note?: string }) => {
    const response = await apiClient.post('/inventory/stock/adjust', data);
    return response.data;
  },

  getInventoryMovements: async (params = {}) => {
    const response = await apiClient.get('/inventory/movements/', { params });
    return response.data;
  },

  // Dashboard stats
  getDashboardStats: async () => {
    const response = await apiClient.get('/orders/dashboard/stats/');
    return response.data;
  },

  // Patient/Client management
  getPatients: async (params = {}) => {
    const response = await apiClient.get('/clinic/patients/', { params });
    return response.data;
  },

  getPatient: async (id: number) => {
    const response = await apiClient.get(`/clinic/patients/${id}/`);
    return response.data;
  },

  getPatientDetails: async (id: number) => {
    const response = await apiClient.get(`/clinic/patients/${id}/full_details/`);
    return response.data;
  },

  getPatientOrders: async (id: number) => {
    const response = await apiClient.get(`/clinic/patients/${id}/orders/`);
    return response.data;
  },

  getPatientFeedbacks: async (id: number) => {
    const response = await apiClient.get(`/clinic/patients/${id}/feedbacks/`);
    return response.data;
  },

  getPatientAssignments: async (id: number) => {
    const response = await apiClient.get(`/clinic/patients/${id}/assignments/`);
    return response.data;
  },
};
