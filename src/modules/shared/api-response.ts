export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: { total: number; page: number; limit: number };
};

export function ok<T>(data: T, meta?: ApiResponse<T>["meta"]): ApiResponse<T> {
  return { success: true, data, error: null, meta };
}

export function fail<T>(error: string): ApiResponse<T> {
  return { success: false, data: null, error };
}
