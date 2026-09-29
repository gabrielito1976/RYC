import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  MapPin,
  Camera,
  Plus,
  Trash2,
  Package,
  Users,
  UserCheck,
  Shield,
  ArrowRightLeft,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Building2,
  BadgeAlert,
  HelpCircle,
} from 'lucide-react';
import {
  ForensicCaseData,
  SeizureItem,
  PackagingType,
} from '../types';
import { saveStoredOfficer } from '../utils/storage';

interface ForensicFormProps {
  caseData: ForensicCaseData;
  onChange: (updated: ForensicCaseData) => void;
  onGeneratePDF: () => void;
  isGenerating: boolean;
}

export const ForensicForm: React.FC<ForensicFormProps> = ({
  caseData,
  onChange,
  onGeneratePDF,
  isGenerating,
}) => {
  const [showTransfers, setShowTransfers] = useState(false);
  const [officerSavedFeedback, setOfficerSavedFeedback] = useState(false);

  // Field updater
  const updateField = <K extends keyof ForensicCaseData>(key: K, value: ForensicCaseData[K]) => {
    onChange({
      ...caseData,
      [key]: value,
    });
  };

  // Seizure item handlers (Max 2 elements per official Rótulo form)
  const handleAddItem = () => {
    if (caseData.items.length >= 2) return;
    const newItem: SeizureItem = {
      id: '2',
      description: '',
      findingPlace: caseData.seizureLocation || '',
      quantity: '1',
      observations: '',
    };
    updateField('items', [...caseData.items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof SeizureItem, value: string) => {
    const updated = caseData.items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateField('items', updated);
  };

  const handleRemoveItem = (index: number) => {
    if (caseData.items.length <= 1) {
      updateField('items', [
        { id: '1', description: '', findingPlace: '', quantity: '1', observations: '' },
      ]);
      return;
    }
    updateField(
      'items',
      caseData.items.filter((_, idx) => idx !== index)
    );
  };

  // Photo handler supporting slot 1 and slot 2 with downscaling
  const handlePhotoUpload = (slot: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetField = slot === 1 ? 'photoDataUrl' : 'photoDataUrl2';
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            updateField(targetField, optimizedDataUrl);
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas optimization fallback:', canvasErr);
        }
        updateField(targetField, rawDataUrl);
      };
      img.onerror = () => {
        updateField(targetField, rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Packaging handler
  const handlePackagingTypeChange = (type: PackagingType) => {
    updateField('packaging', {
      ...caseData.packaging,
      type,
    });
  };

  // Save officer info persistently
  const handleSaveOfficer = () => {
    if (caseData.officer.name.trim()) {
      saveStoredOfficer(caseData.officer);
      setOfficerSavedFeedback(true);
      setTimeout(() => setOfficerSavedFeedback(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner Informativo Reglamentario */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
          <p className="font-semibold text-blue-950 dark:text-blue-100">
            Formularios 
          </p>
          <p className="mt-0.5 text-blue-800 dark:text-blue-300">
            Genera el <strong>Rótulo de Elementos Secuestrados</strong> y el <strong>Formulario de Cadena de Custodia</strong> en 2 páginas con espacio para firma.
          </p>
        </div>
      </div>

      {/* 1. SECCIÓN: IDENTIFICACIÓN DEL CASO Y ACTUACIÓN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
            1. Identificación
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CUIJ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nº de CUIJ <span className="text-slate-400 font-normal">(Para uso interno de la Fiscalía)</span>
            </label>
            <input
              type="text"
              value={caseData.cuij}
              onChange={(e) => updateField('cuij', e.target.value)}
              placeholder="Ej: 21-08123456-7"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition font-mono"
            />
          </div>

          {/* Fecha y Hora del secuestro */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha y Hora del secuestro
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={caseData.seizureDateTime}
                onChange={(e) => updateField('seizureDateTime', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Lugar del secuestro */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Lugar del secuestro
          </label>
          <div className="relative">
            <input
              type="text"
              value={caseData.seizureLocation}
              onChange={(e) => updateField('seizureLocation', e.target.value)}
              placeholder="Ej: Calle San Martín 1540 - En habitación principal"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Datos que permitan identificar el caso */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Datos que permitan identificar el caso
          </label>
          <textarea
            rows={2}
            value={caseData.caseInfo}
            onChange={(e) => updateField('caseInfo', e.target.value)}
            placeholder="Ej: S/ ROBO CALIFICADO EN POBLADO Y EN BANDA - IMPUTADO: PÉREZ, JUAN - COMISARÍA 2DA"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition resize-y"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Detalle la carátula, expediente, comisaría interventora o datos procesales del caso.
          </p>
        </div>
      </div>

      {/* 2. SECCIÓN: ELEMENTOS SECUESTRADOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
              2. Elementos Secuestrados
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {caseData.items.length} de 2 elementos
            </span>
            {caseData.items.length < 2 && (
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar 2º Elemento</span>
              </button>
            )}
          </div>
        </div>

        {/* Guía de Referencias Reglamentarias */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Referencias reglamentarias del Rótulo:
          </p>
          <p>• <strong>(1) Descripción:</strong> Detallar caracteres, peso, medida, tamaño, color, especie, estado.</p>
          <p>• <strong>(2) Lugar del hallazgo:</strong> Debe ser minucioso y detallado.</p>
          <p>• <strong>(3) Observaciones:</strong> Referenciar fotos tomadas, restos biológicos y cadena de custodia.</p>
        </div>

        <div className="space-y-4">
          {caseData.items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  Elemento Secuestrado #{index + 1}
                </span>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer font-medium"
                    title="Eliminar este segundo elemento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar 2º elemento</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Descripción (1) */}
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción (1) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    placeholder="Ej: Teléfono celular Samsung Galaxy A52, color negro, pantalla rota en esquina superior derecha"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition resize-y"
                  />
                </div>

                {/* Lugar del hallazgo (2) */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lugar del hallazgo (2)
                  </label>
                  <textarea
                    rows={2}
                    value={item.findingPlace}
                    onChange={(e) => handleUpdateItem(index, 'findingPlace', e.target.value)}
                    placeholder="Ej: Sobre la mesa ratona del living"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition resize-y"
                  />
                </div>

                {/* Cantidad */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition text-center"
                  />
                </div>
              </div>

              {/* Observaciones (3) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones (3)
                </label>
                <input
                  type="text"
                  value={item.observations}
                  onChange={(e) => handleUpdateItem(index, 'observations', e.target.value)}
                  placeholder="Ej: Se registra fotografía; presenta funda de silicona transparente y tarjeta SIM colocada"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
                />
              </div>
            </div>
          ))}

          {/* Pregunta interactiva para agregar el segundo elemento */}
          {caseData.items.length === 1 && (
            <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition">
              <div>
                <p className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ¿Desea agregar un segundo elemento secuestrado?
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  El formulario de rótulo oficial cuenta con lugar para 2 elementos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Sí, agregar 2º elemento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECCIÓN: FOTOGRAFÍA DEL SECUESTRO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
              3. Fotografías del Secuestro (Rótulo)
            </h2>
          </div>
          {caseData.photoDataUrl && caseData.photoDataUrl2 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800">
              2 fotos (una al lado de la otra)
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          En el recuadro del Rótulo hay lugar para <strong>dos fotografías colocadas una al lado de la otra</strong> (o una sola fotografía centrada si adjunta una). Si no adjunta fotos, el recuadro se imprimirá despejado para fijar copias fotográficas físicas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot 1: Fotografía 1 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                Fotografía 1 {caseData.items.length > 1 ? '(Elemento #1)' : ''}
              </span>
              {caseData.photoDataUrl && (
                <button
                  type="button"
                  onClick={() => updateField('photoDataUrl', undefined)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded transition cursor-pointer"
                  title="Eliminar Fotografía 1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>

            {caseData.photoDataUrl ? (
              <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-48 flex items-center justify-center">
                <img
                  src={caseData.photoDataUrl}
                  alt="Fotografía 1 del secuestro"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/40 text-center h-48">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Cargar Fotografía 1
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tomar foto o subir de galería
                  </p>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Subir / Capturar</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(1, e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Slot 2: Fotografía 2 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                Fotografía 2 {caseData.items.length > 1 ? '(Elemento #2)' : '(Segunda toma)'}
              </span>
              {caseData.photoDataUrl2 && (
                <button
                  type="button"
                  onClick={() => updateField('photoDataUrl2', undefined)}
                  className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded transition cursor-pointer"
                  title="Eliminar Fotografía 2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </div>

            {caseData.photoDataUrl2 ? (
              <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-48 flex items-center justify-center">
                <img
                  src={caseData.photoDataUrl2}
                  alt="Fotografía 2 del secuestro"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/40 text-center h-48">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Cargar Fotografía 2
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Saldrá al lado de la Fotografía 1
                  </p>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Subir / Capturar</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(2, e)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {caseData.photoDataUrl && caseData.photoDataUrl2 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-900 dark:text-blue-200 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Confirmado:</strong> Las dos fotografías están cargadas y se renderizarán una al lado de la otra dentro del recuadro del Rótulo de Elementos Secuestrados.
            </span>
          </div>
        )}
      </div>

      {/* 4. SECCIÓN: EMBALAJE REGLAMENTARIO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
            4. Embalaje (Marque con una cruz lo que corresponda)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'bolsa_plastica' as PackagingType, label: 'Bolsa Plástica' },
            { id: 'bolsa_papel' as PackagingType, label: 'Bolsa/Sobre de Papel' },
            { id: 'frasco' as PackagingType, label: 'Frasco' },
            { id: 'otro' as PackagingType, label: 'Otro' },
          ].map((type) => {
            const isSelected = caseData.packaging.type === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handlePackagingTypeChange(type.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <span>{type.label}</span>
                {isSelected && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                    [ X ] Seleccionado
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {caseData.packaging.type === 'otro' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Especificar tipo de embalaje ("Otro")
            </label>
            <input
              type="text"
              value={caseData.packaging.otherText}
              onChange={(e) =>
                updateField('packaging', { ...caseData.packaging, otherText: e.target.value })
              }
              placeholder="Ej: Caja de cartón precintada"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
          </div>
        )}

        {/* ¿Está cerrado? */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              ¿Está cerrado?
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Corrobora el precintado o sellado hermético del contenedor antes del traslado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateField('packaging', { ...caseData.packaging, isClosed: true })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                caseData.packaging.isClosed
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              Sí (Cerrado)
            </button>
            <button
              type="button"
              onClick={() => updateField('packaging', { ...caseData.packaging, isClosed: false })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                !caseData.packaging.isClosed
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
              }`}
            >
              No (Abierto)
            </button>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN: TESTIGOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
            5. Testigos de Actuación
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Testigo 1 */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Testigo 1)
            </span>
            <input
              type="text"
              value={caseData.witnesses[0]?.name || ''}
              onChange={(e) => {
                const w = [...caseData.witnesses] as [any, any];
                w[0] = { ...w[0], name: e.target.value };
                updateField('witnesses', w);
              }}
              placeholder="Nombre y Apellido completo"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
            <input
              type="text"
              value={caseData.witnesses[0]?.dni || ''}
              onChange={(e) => {
                const w = [...caseData.witnesses] as [any, any];
                w[0] = { ...w[0], dni: e.target.value };
                updateField('witnesses', w);
              }}
              placeholder="DNI / Documento"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition font-mono"
            />
          </div>

          {/* Testigo 2 */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Testigo 2)
            </span>
            <input
              type="text"
              value={caseData.witnesses[1]?.name || ''}
              onChange={(e) => {
                const w = [...caseData.witnesses] as [any, any];
                w[1] = { ...w[1], name: e.target.value };
                updateField('witnesses', w);
              }}
              placeholder="Nombre y Apellido completo"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
            <input
              type="text"
              value={caseData.witnesses[1]?.dni || ''}
              onChange={(e) => {
                const w = [...caseData.witnesses] as [any, any];
                w[1] = { ...w[1], dni: e.target.value };
                updateField('witnesses', w);
              }}
              placeholder="DNI / Documento"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition font-mono"
            />
          </div>
        </div>
      </div>

      {/* 6. SECCIÓN: FUNCIONARIO RECOLECTOR Y FIRMA FÍSICA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
              6. Funcionario que Efectuó la Recolección
            </h2>
          </div>
          <button
            type="button"
            onClick={handleSaveOfficer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition active:scale-95 cursor-pointer"
            title="Guardar como perfil predeterminado para próximos secuestros"
          >
            {officerSavedFeedback ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">¡Guardado!</span>
              </>
            ) : (
              <span>Recordar mis datos</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre y Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={caseData.officer.name}
              onChange={(e) =>
                updateField('officer', { ...caseData.officer, name: e.target.value })
              }
              placeholder="Ej: Insp. Rodríguez, Lucas"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Función / Cargo
            </label>
            <input
              type="text"
              value={caseData.officer.role}
              onChange={(e) =>
                updateField('officer', { ...caseData.officer, role: e.target.value })
              }
              placeholder="Ej: Perito Balístico / Sumariante"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repartición
            </label>
            <input
              type="text"
              value={caseData.officer.department}
              onChange={(e) =>
                updateField('officer', { ...caseData.officer, department: e.target.value })
              }
              placeholder="Ej: AIC - Región 2 / Comisaría 2da"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-hidden transition"
            />
          </div>
        </div>

        {/* Aviso de Firma Física Ológrafa */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <BadgeAlert className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Firma Manual:</strong> El formulario generado incluye el recuadro impreso <strong>"Firma:"</strong> para la rúbrica ológrafa física y colocación del sello al momento de la impresión.
          </span>
        </div>
      </div>

      {/* 7. SECCIÓN OPCIONAL: CADENA DE CUSTODIA (TRAMOS DE TRASPASO) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
                7. Tramos de Cadena de Custodia
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El formulario de 2 páginas incluye automáticamente el primer tramo (recolector) y los renglones de entrega y recepción.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTransfers(!showTransfers)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
          >
            {showTransfers ? 'Ocultar detalles' : 'Ver / Cargar receptor'}
          </button>
        </div>

        {showTransfers && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tramo 1: Recibe evidencia del Funcionario Recolector
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={caseData.transfers[0]?.recibe?.name || ''}
                  onChange={(e) => {
                    const tr = [...caseData.transfers];
                    if (!tr[0]) return;
                    tr[0] = {
                      ...tr[0],
                      recibe: { ...tr[0].recibe, name: e.target.value },
                    };
                    updateField('transfers', tr);
                  }}
                  placeholder="Nombre y Apellido receptor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
                <input
                  type="text"
                  value={caseData.transfers[0]?.recibe?.role || ''}
                  onChange={(e) => {
                    const tr = [...caseData.transfers];
                    if (!tr[0]) return;
                    tr[0] = {
                      ...tr[0],
                      recibe: { ...tr[0].recibe, role: e.target.value },
                    };
                    updateField('transfers', tr);
                  }}
                  placeholder="Función / Cargo receptor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
                <input
                  type="text"
                  value={caseData.transfers[0]?.recibe?.department || ''}
                  onChange={(e) => {
                    const tr = [...caseData.transfers];
                    if (!tr[0]) return;
                    tr[0] = {
                      ...tr[0],
                      recibe: { ...tr[0].recibe, department: e.target.value },
                    };
                    updateField('transfers', tr);
                  }}
                  placeholder="Repartición receptora"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Estado general de la especie / evidencia (observaciones):
                </label>
                <input
                  type="text"
                  value={caseData.transfers[0]?.evidenceState || ''}
                  onChange={(e) => {
                    const tr = [...caseData.transfers];
                    if (!tr[0]) return;
                    tr[0] = {
                      ...tr[0],
                      evidenceState: e.target.value,
                    };
                    updateField('transfers', tr);
                  }}
                  placeholder="Ej: Envasado y rotulado en condiciones, precinto intacto"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTÓN FLOTANTE / PRINCIPAL PARA GENERAR PDF */}
      <div className="sticky bottom-4 z-30 pt-2">
        <button
          type="button"
          onClick={onGeneratePDF}
          disabled={isGenerating}
          className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base sm:text-lg shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Confeccionando Formularios...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-6 h-6" />
              <span>Generar Rótulo y Formulario</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
