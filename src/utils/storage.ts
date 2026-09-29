import { ForensicCaseData, OfficerInfo } from '../types';

const STORAGE_KEYS = {
  DRAFT: 'forensic_case_draft_v3',
  OFFICER: 'forensic_saved_officer_v3',
  THEME: 'forensic_app_theme_v3',
  CUSTOM_LOGO: 'forensic_custom_logo_v1',
};

export const DEFAULT_OFFICER: OfficerInfo = {
  name: '',
  role: '',
  department: '',
};

export function getDefaultForensicCase(): ForensicCaseData {
  const savedOfficer = getStoredOfficer();
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    cuij: '',
    caseInfo: '',
    seizureDateTime: formattedDate,
    seizureLocation: '',
    items: [
      {
        id: '1',
        description: '',
        findingPlace: '',
        quantity: '1',
        observations: '',
      },
    ],
    photoDataUrl: undefined,
    photoDataUrl2: undefined,
    packaging: {
      type: 'bolsa_plastica',
      otherText: '',
      isClosed: true,
    },
    witnesses: [
      { name: '', dni: '' },
      { name: '', dni: '' },
    ],
    officer: savedOfficer || { ...DEFAULT_OFFICER },
    transfers: [
      {
        id: 'tr-1',
        stageTitle: 'FUNCIONARIO QUE EFECTUÓ LA RECOLECCIÓN - ENTREGA',
        entrega: savedOfficer || { ...DEFAULT_OFFICER },
        recibe: { name: '', role: '', department: '' },
        evidenceState: 'Envasado y rotulado en condiciones',
        dateTime: formattedDate,
      },
    ],
  };
}

export function getStoredOfficer(): OfficerInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFICER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredOfficer(officer: OfficerInfo): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OFFICER, JSON.stringify(officer));
  } catch (err) {
    console.warn('Error saving officer:', err);
  }
}

export function getStoredDraft(): ForensicCaseData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading draft:', err);
  }
  return getDefaultForensicCase();
}

export function saveStoredDraft(data: ForensicCaseData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving draft:', err);
  }
}

export function clearStoredDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  } catch (err) {
    console.warn('Error clearing draft:', err);
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    // fallback
  }
  return 'light';
}

export function saveStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function getStoredCustomLogo(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_LOGO);
  } catch {
    return null;
  }
}

export function saveStoredCustomLogo(logoDataUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_LOGO, logoDataUrl);
  } catch (err) {
    console.warn('Error saving custom logo:', err);
  }
}

export function clearStoredCustomLogo(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_LOGO);
  } catch (err) {
    console.warn('Error clearing custom logo:', err);
  }
}
