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
    mbox_id: string;
    epoch: number;
    notify: {
        wa: string;
        issuer_key_id?: string;
        tokens: string[];
        expire_at?: number;
        coalesce_window_ms?: number;
    };
}
export declare class NotifierClient {
    private http;
    private spoolUrl?;
    constructor(baseUrl: string, opts?: {
        timeoutMs?: number;
        spoolUrl?: string;
    });
    register(req: RegisterRequest): Promise<void>;
    issue(req: IssueRequest): Promise<string[]>;
    attachNotify(descriptor: AttachNotifyRequest): Promise<void>;
}
//# sourceMappingURL=notifier.d.ts.map