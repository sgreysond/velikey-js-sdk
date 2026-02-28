import { UnsupportedOperationError } from '../errors';

export class ComplianceResource {
  async getReport(): Promise<never> {
    throw new UnsupportedOperationError('compliance.getReport', 'unsupported in public Axis API');
  }

  async listFrameworks(): Promise<never> {
    throw new UnsupportedOperationError('compliance.listFrameworks', 'unsupported in public Axis API');
  }

  async runAssessment(): Promise<never> {
    throw new UnsupportedOperationError('compliance.runAssessment', 'unsupported in public Axis API');
  }
}
