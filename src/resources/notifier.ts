import axios, { AxiosInstance } from 'axios';

export interface RegisterRequest {
  wa: string;
  push_token: string;
  expiry_sec?: number;
}

export interface IssueRequest {
  wa: string;
  count?: number;
  ttl_sec?: number;
}

export interface AttachNotifyRequest {
  mbox_id: string; // base64
  epoch: number;
  notify: {
    wa: string;
    issuer_key_id?: string;
    tokens: string[];
    expire_at?: number;
    coalesce_window_ms?: number;
  };
}

export class NotifierClient {
  private http: AxiosInstance;
  private spoolUrl?: string;

  constructor(baseUrl: string, opts?: { timeoutMs?: number; spoolUrl?: string }) {
    this.http = axios.create({ baseURL: baseUrl, timeout: opts?.timeoutMs ?? 3000 });
    this.spoolUrl = opts?.spoolUrl;
  }

  async register(req: RegisterRequest): Promise<void> {
    await this.http.post('/v1/register', req);
  }

  async issue(req: IssueRequest): Promise<string[]> {
    const { data } = await this.http.post('/v1/issue', req);
    // data.tokens = [{ token: string }]
    return Array.isArray(data.tokens) ? data.tokens.map((t: any) => t.token) : [];
  }

  async attachNotify(descriptor: AttachNotifyRequest): Promise<void> {
    if (!this.spoolUrl) throw new Error('spoolUrl not configured');
    await axios.post(`${this.spoolUrl}/v1/attach-notify`, descriptor, { timeout: 3000 });
  }
}


