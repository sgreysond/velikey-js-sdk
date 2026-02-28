import { UnsupportedOperationError } from '../errors';

export class DiagnosticsResource {
  async runCheck(): Promise<never> {
    throw new UnsupportedOperationError('diagnostics.runCheck', 'GET /api/health');
  }

  async getSystemInfo(): Promise<never> {
    throw new UnsupportedOperationError('diagnostics.getSystemInfo', 'GET /api/health');
  }

  async testConnectivity(): Promise<never> {
    throw new UnsupportedOperationError('diagnostics.testConnectivity', 'GET /api/healthz');
  }
}
