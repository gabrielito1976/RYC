import React from 'react';
import { MPA_LOGO_BASE64 } from '../utils/mpaLogoBase64';
import { getStoredCustomLogo } from '../utils/storage';

export interface MPALogoProps {
  className?: string;
  customSrc?: string;
}

export const MPALogo: React.FC<MPALogoProps> = ({ className = 'w-16 h-8', customSrc }) => {
  const logoSrc = customSrc || getStoredCustomLogo() || MPA_LOGO_BASE64;

  return (
    <img
      src={logoSrc}
      alt="Logo MPA - Ministerio Público de la Acusación"
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
};

