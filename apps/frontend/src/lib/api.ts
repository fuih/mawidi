import axios from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "/api/v1";

export const getImageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: "csrf_token",
  xsrfHeaderName: "X-CSRF-Token",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Manually extract and set CSRF token for cross-origin local dev
api.interceptors.request.use((config) => {
  const match = document.cookie.match(new RegExp('(^| )csrf_token=([^;]+)'));
  if (match && match[2]) {
    config.headers['X-CSRF-Token'] = match[2];
  }
  return config;
});

// Intercept 401 responses to refresh token or logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Do not intercept 401s for login requests
    if (originalRequest.url?.includes('/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Since the backend handles tokens securely in httpOnly cookies, 
      // we don't extract them manually. If refresh fails, we logout.
      
      return new Promise(function (resolve, reject) {
        axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then(() => {
            processQueue(null, null);
            resolve(api(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            import("./authStore").then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
            });
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // Format Pydantic 422 Validation Errors globally so React doesn't crash on object rendering
    if (error.response?.status === 422 && Array.isArray(error.response.data?.detail)) {
      error.response.data.detail = error.response.data.detail
        .map((err: any) => {
          const field = err.loc?.[err.loc.length - 1] || 'Champ';
          let customMsg = err.msg;
          
          if (err.type === 'string_pattern_mismatch') {
            if (field.includes('phone')) customMsg = "Numéro de téléphone invalide. Veuillez utiliser le format algérien valide.";
            else if (field.includes('name') || field.includes('nom')) customMsg = "Ce champ ne doit contenir que des lettres, des espaces ou des tirets.";
            else customMsg = "Format invalide.";
          } else if (err.type === 'string_too_short') {
            customMsg = "Ce champ est trop court.";
          }

          // Format field name
          const fieldNameMap: Record<string, string> = {
            first_name: "Prénom",
            last_name: "Nom",
            patient_name: "Nom du patient",
            patient_phone: "Téléphone du patient",
            phone: "Téléphone",
            email: "Email"
          };
          const cleanField = fieldNameMap[field as string] || field;

          return `${cleanField} : ${customMsg}`;
        })
        .join(" | ");
    }

    return Promise.reject(error);
  }
);

export default api;
