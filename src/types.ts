export type PackagingType = 'bolsa_plastica' | 'bolsa_papel' | 'frasco' | 'otro';

export interface PackagingInfo {
  type: PackagingType;
  otherText: string;
  isClosed: boolean;
}

export interface SeizureItem {
  id: string;
  description: string;
  findingPlace: string;
  quantity: string;
  observations: string;
}

export interface Witness {
  name: string;
  dni: string;
}

export interface OfficerInfo {
  name: string;
  role: string;
  department: string;
}

export interface CustodyTransfer {
  id: string;
  stageTitle: string;
  entrega: OfficerInfo;
  recibe: OfficerInfo;
  evidenceState: string;
  dateTime: string;
}

export interface ForensicCaseData {
  cuij: string;
  caseInfo: string;
  seizureDateTime: string;
  seizureLocation: string;
  items: SeizureItem[];
  photoDataUrl?: string;
  photoDataUrl2?: string;
  customLogo?: string;
  packaging: PackagingInfo;
  witnesses: [Witness, Witness];
  officer: OfficerInfo;
  transfers: CustodyTransfer[];
}
