import React, { useState, useEffect } from 'react';
import { X, Info, Code2, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [clickCount, setClickCount] = useState(0);
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);

  // Reset clicks when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClickCount(0);
      setIsEasterEggOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEasterEggClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 3) {
      setIsEasterEggOpen(true);
      setClickCount(0);
    }
  };

  const libraries = [
    { name: 'React 19', desc: 'Biblioteca para interfaces de usuario declarativas y reactivas' },
    { name: 'TypeScript', desc: 'Tipado estático seguro y verificación estricta de datos' },
    { name: 'Tailwind CSS v4', desc: 'Framework de diseño utilitario con soporte dark/light mode' },
    { name: 'Vite', desc: 'Entorno de compilación y empaquetado web ultrarrápido' },
    { name: 'jsPDF & AutoTable', desc: 'Motor vectorial de generación de PDFs forenses reglamentarios' },
    { name: 'Lucide React', desc: 'Conjunto completo de iconografía moderna y accesible' },
    { name: 'Capacitor', desc: 'Integración nativa para dispositivos móviles y compartición directa' },
    { name: 'IndexedDB / Storage API', desc: 'Persistencia local segura sin servidor externo' },
  ];

  return (
    <>
      {/* Main About Dialog */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  Acerca de
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sistema de Rótulo y Cadena de Custodia
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300">
            {/* App brief */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Aplicación</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                Herramienta para la generación del <strong>Rótulo de Elementos Secuestrados</strong> y el <strong>Formulario de Cadena de Custodia</strong> en formato PDF.
              </p>
            </div>

            {/* Libraries Section */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Librerías y Tecnologías Utilizadas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {libraries.map((lib) => (
                  <div
                    key={lib.name}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
                  >
                    <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {lib.name}
                    </p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {lib.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer & Easter Egg trigger */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Desarrollado por </span>
              <button
                type="button"
                onClick={handleEasterEggClick}
                className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted underline-offset-2 transition cursor-pointer active:scale-95"
                title="Gabriel Dellavitta 2026"
              >
                Gabriel Dellavitta 2026
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Easter Egg Lightbox Modal */}
      {isEasterEggOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsEasterEggOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsEasterEggOpen(false)}
              className="absolute -top-10 sm:-top-12 right-0 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 rounded-full transition cursor-pointer"
              title="Cerrar Easter Egg"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Easter Egg Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Easter Egg Desbloqueado</span>
            </div>

            {/* Image Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black max-h-[75vh] flex items-center justify-center">
              <img
                src="https://imagenes.hobbyconsolas.com/files/image_990_auto/uploads/imagenes/2024/12/12/6903fa64ab1de.jpeg"
                alt="Easter Egg Gabriel Dellavitta"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Click to close hint */}
            <p className="text-white/60 text-xs mt-3 select-none">
              Haz clic fuera de la imagen o en la cruz para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  );
};
