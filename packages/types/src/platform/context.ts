export interface ExecutionContext {
  module?: string;
  user?: string;
  companyId?: string;
  companyName?: string;
  [key: string]: unknown;
}
