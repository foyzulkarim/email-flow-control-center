
import { DashboardStats, EmailJob, EmailTarget, EmailProvider, SubmitEmailRequest, SuppressionEntry, ChartData } from "@/types/api";

const API_BASE_URL = "http://localhost:3001/api";

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Use the default error message if parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle the server's response format: { success: true, data: ... }
      if (data.success && data.data !== undefined) {
        return data.data;
      }
      
      // Return the data directly if it doesn't follow the expected format
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getChartData(type: 'volume' | 'providers', days: number = 7): Promise<ChartData[]> {
    return this.request<ChartData[]>(`/dashboard/chart/${type}?days=${days}`);
  }

  // Email job endpoints
  async getEmailJobs(page: number = 1, limit: number = 20, status?: string): Promise<{jobs: EmailJob[], total: number}> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    const response = await this.request<{
      jobs: EmailJob[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/email/jobs?${params}`);
    
    return {
      jobs: response.jobs,
      total: response.pagination.total
    };
  }

  async getEmailJob(id: string): Promise<EmailJob> {
    return this.request<EmailJob>(`/email/job/${id}`);
  }

  async getEmailJobTargets(jobId: string): Promise<EmailTarget[]> {
    return this.request<EmailTarget[]>(`/email/job/${jobId}/targets`);
  }

  async submitEmailJob(data: SubmitEmailRequest): Promise<{jobId: string, message: string}> {
    const response = await this.request<{
      jobId: string;
      totalRecipients: number;
      validRecipients: number;
      suppressedRecipients: number;
    }>('/email/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Transform the response to match the expected format
    return {
      jobId: response.jobId,
      message: `Email job submitted successfully. ${response.validRecipients} of ${response.totalRecipients} recipients will receive the email.`
    };
  }

  // Provider endpoints
  async getProviders(): Promise<EmailProvider[]> {
    return this.request<EmailProvider[]>('/provider/list');
  }

  async createProvider(data: {
    name: string;
    type: 'brevo' | 'mailerlite';
    apiKey: string;
    dailyQuota: number;
  }): Promise<EmailProvider> {
    return this.request<EmailProvider>('/provider/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProviderStatus(id: string, enabled: boolean): Promise<void> {
    await this.request(`/provider/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: enabled }),
    });
  }

  async resetProviderQuota(id: string): Promise<void> {
    await this.request(`/provider/${id}/reset-quota`, {
      method: 'POST',
    });
  }

  // Suppression list endpoints
  async getSuppressionList(page: number = 1, limit: number = 50): Promise<{entries: SuppressionEntry[], total: number}> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request<{entries: SuppressionEntry[], total: number}>(`/suppression/list?${params}`);
  }

  async addSuppressionEntry(email: string, reason: string, notes?: string): Promise<void> {
    await this.request('/suppression/add', {
      method: 'POST',
      body: JSON.stringify({ email, reason, notes }),
    });
  }

  async removeSuppressionEntry(id: string): Promise<void> {
    await this.request(`/suppression/remove/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
