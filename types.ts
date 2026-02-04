
export interface FormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  globalSatisfaction: number;
  orgQuality: number;
  logistics: number;
  timing: number;
  relevance: number;
  clarity: number;
  interest: number;
  positivePoints: string;
  improvements: string;
  recommendation: 'Oui' | 'Non' | 'Peut-être' | '';
  nps: number;
  optInContact: boolean;
}

export enum FormStatus {
  IDLE = 'IDLE',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
