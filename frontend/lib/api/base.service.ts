/**
 * Base API Service
 * 
 * Provides consistent error handling, authentication, and request methods
 * for all API services in the application.
 * 
 * @example
 * ```typescript
 * export class ProfilesService extends BaseApiService {
 *   async list(token: string) {
 *     return this.get<ProfileListResponse[]>('/api/profiles', token);
 *   }
 * }
 * ```
 */

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
  code?: string;
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly detail?: string;
  public readonly code?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = error.status;
    this.detail = error.detail;
    this.code = error.code;
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiException);
    }
  }

  /**
   * Check if error is due to authentication failure
   */
  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Base API Service providing common HTTP methods and error handling
 */
export abstract class BaseApiService {
  protected readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  /**
   * Build full URL with query parameters
   */
  protected buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Build request headers
   */
  protected buildHeaders(token: string, additionalHeaders?: Record<string, string>): HeadersInit {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
  }

  /**
   * Handle API response and errors
   */
  protected async handleResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Handle successful responses
    if (response.ok) {
      try {
        return await response.json();
      } catch (error) {
        // Response might be empty or invalid JSON
        return undefined as T;
      }
    }

    // Handle error responses
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetail: string | undefined;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
        errorDetail = errorMessage;
      }
      
      if (errorData.code) {
        errorCode = errorData.code;
      }
    } catch {
      // Could not parse error response
      errorDetail = await response.text().catch(() => undefined);
    }

    throw new ApiException({
      status: response.status,
      message: errorMessage,
      detail: errorDetail,
      code: errorCode,
    });
  }

  /**
   * GET request
   */
  protected async get<T>(
    path: string,
    token: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers = this.buildHeaders(token);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  protected async post<T, D = unknown>(
    path: string,
    token: string,
    data?: D,
    additionalHeaders?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(token, additionalHeaders);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  protected async put<T, D = unknown>(
    path: string,
    token: string,
    data: D
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(token);

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  protected async patch<T, D = unknown>(
    path: string,
    token: string,
    data: D
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(token);

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  protected async delete<T = void>(
    path: string,
    token: string
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(token);

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file with FormData
   */
  protected async upload<T>(
    path: string,
    token: string,
    formData: FormData
  ): Promise<T> {
    const url = this.buildUrl(path);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}
