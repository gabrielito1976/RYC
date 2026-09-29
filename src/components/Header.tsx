import React, { useState } from 'react';
import { Moon, Sun, RotateCcw, Image as ImageIcon, Info } from 'lucide-react';
import { MPALogo } from './MPALogo';
import { LogoManagerModal } from './LogoManagerModal';
import { AboutModal } from './AboutModal';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onResetForm: () => void;
  customLogo: string | null;
  onUpdateLogo: (newLogo: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onResetForm,
  customLogo,
  onUpdateLogo,
}) => {
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 dark:bg-slate-950 text-white shadow-md border-b border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 select-none cursor-pointer group"
              onClick={() => setIsLogoModalOpen(true)}
              title="Haz clic para ver o cambiar el logotipo oficial"
            >
              <div className="relative">
                <MPALogo
                  className="w-12 h-6 sm:w-14 sm:h-7 rounded shadow-xs group-hover:opacity-90 transition"
                  customSrc={customLogo || undefined}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-sm sm:text-base tracking-tight leading-none group-hover:text-blue-300 transition">
                    Cadena de Custodia
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-400/30 leading-none">
                    MPA
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-none">
                  Rótulo de Secuestro y Formulario 
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Logo Manager Button */}
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Cargar o cambiar el logotipo oficial"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Logo Oficial</span>
              </button>

              {/* Reset Form */}
              <button
                type="button"
                onClick={onResetForm}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Limpiar formulario para iniciar uno nuevo"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Nuevo / Limpiar</span>
              </button>

              {/* Dark / Light Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
                title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              >
                {theme === 'dark' ? (
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Claro</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-blue-300" />
                    <span className="hidden sm:inline">Oscuro</span>
                  </div>
                )}
              </button>

              {/* Acerca de */}
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Acerca de esta aplicación"
              >
                <Info className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Acerca de</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logo Manager Modal */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogo={customLogo}
        onUpdateLogo={onUpdateLogo}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </>
  );
};

