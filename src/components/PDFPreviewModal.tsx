import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  FileStack,
  FileCheck,
  Printer,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { ForensicCaseData } from '../types';
import { saveOrSharePdf, downloadPdfBlob } from '../utils/fileDownloader';
import { MPALogo } from './MPALogo';

interface PDFPreviewModalProps {
  pdfUrl: string;
  pdfDataUrl?: string;
  pdfBlob: Blob | null;
  filename: string;
  caseData?: ForensicCaseData | null;
  onClose: () => void;
  onCreateNextDuo?: (source: ForensicCaseData) => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  pdfUrl,
  pdfDataUrl,
  pdfBlob,
  filename,
  caseData,
  onClose,
  onCreateNextDuo,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showViewer, setShowViewer] = useState(true);

  // URL for viewing and downloading
  const activeBlobUrl = useMemo(() => {
    return pdfUrl || (pdfBlob ? URL.createObjectURL(pdfBlob) : pdfDataUrl || '');
  }, [pdfUrl, pdfBlob, pdfDataUrl]);

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (pdfBlob) {
      const ok = downloadPdfBlob(pdfBlob, filename, pdfDataUrl);
      if (ok) {
        setFeedback({ text: '¡Descarga del archivo PDF iniciada!', type: 'success' });
      } else {
        setFeedback({ text: 'Iniciando descarga alternativa...', type: 'info' });
      }
    } else if (activeBlobUrl) {
      const link = document.createElement('a');
      link.href = activeBlobUrl;
      link.download = filename;
      link.click();
      setFeedback({ text: '¡Descarga del archivo PDF iniciada!', type: 'success' });
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleShareOrSave = async () => {
    if (!pdfBlob) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await saveOrSharePdf(pdfDataUrl || '', pdfBlob, filename);
      if (result.success) {
        setFeedback({ text: result.message, type: 'success' });
      } else {
        setFeedback({
          text: result.message || 'No se pudo abrir el menú compartir directo. Usa "Descargar PDF" o "Pantalla completa".',
          type: 'info',
        });
      }
    } catch {
      setFeedback({
        text: 'Aviso al compartir: Usa el botón "Descargar PDF" para guardarlo en tu dispositivo.',
        type: 'info',
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('embedded-pdf-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.print();
        return;
      } catch {
        // fallback
      }
    }
    if (activeBlobUrl) {
      window.open(activeBlobUrl, '_blank');
    }
  };

  const witnessesList = [
    caseData?.witnesses?.[0]?.name,
    caseData?.witnesses?.[1]?.name,
  ].filter(Boolean);

  const fileSizeKB = pdfBlob ? Math.round(pdfBlob.size / 1024) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl transition-colors my-auto">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <MPALogo className="w-14 h-7 rounded shadow-xs shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                ¡Documento Generado!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Rótulo de Secuestro & Formulario de Cadena de Custodia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Action Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Archivo PDF Listo
                </p>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {filename}
                </p>
              </div>
              {fileSizeKB > 0 && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 self-start sm:self-auto border border-emerald-200 dark:border-emerald-800/50">
                  {fileSizeKB} KB • Listo
                </span>
              )}
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Button 1: Direct HTML Download with programmatic fallback */}
              <a
                href={activeBlobUrl}
                download={filename}
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 cursor-pointer no-underline text-center"
                title="Descargar archivo PDF al almacenamiento del dispositivo"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Descargar PDF</span>
              </a>

              {/* Button 2: Native Share (WhatsApp, Drive, Gmail) */}
              <button
                type="button"
                onClick={handleShareOrSave}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer disabled:opacity-50 text-center"
                title="Compartir por WhatsApp, Gmail, Drive o abrir en app nativa"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Compartir / Enviar</span>
              </button>

              {/* Button 3: Direct Full Screen */}
              <a
                href={activeBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setFeedback({ text: 'Abriendo PDF en visor nativo a pantalla completa...', type: 'info' });
                  setTimeout(() => setFeedback(null), 3000);
                }}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer no-underline text-center border border-slate-300 dark:border-slate-600"
                title="Abrir en pantalla completa o pestaña nueva"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Pantalla completa</span>
              </a>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <Smartphone className="w-3.5 h-3.5 shrink-0 text-blue-500" />
              <span>
                <strong>En celulares:</strong> Usa <strong>Descargar PDF</strong> para guardarlo en tus archivos o <strong>Compartir</strong> para enviarlo por WhatsApp.
              </span>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`text-xs px-3.5 py-2 rounded-xl text-center font-medium animate-fade-in shadow-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : feedback.type === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Embedded PDF Viewer */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 space-y-2">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Visualización del Documento
                </span>
                <button
                  type="button"
                  onClick={() => setShowViewer(!showViewer)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showViewer ? '(Ocultar visor)' : '(Mostrar visor)'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                  title="Imprimir documento"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <a
                  href={activeBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir afuera</span>
                </a>
              </div>
            </div>

            {showViewer && activeBlobUrl && (
              <div className="relative w-full h-80 sm:h-96 rounded-xl border border-slate-300 dark:border-slate-700 bg-white overflow-hidden shadow-inner">
                <iframe
                  id="embedded-pdf-frame"
                  src={activeBlobUrl}
                  title="Vista previa del PDF generado"
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>

          {/* Workflow Prompt: Confeccionar otro secuestro con mismos datos */}
          {caseData && onCreateNextDuo && (
            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl shrink-0 mt-0.5">
                  <FileStack className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    ¿Confeccionar otro secuestro para este mismo caso?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Conserva automáticamente el mismo CUIJ, domicilio, testigos y datos del funcionario para registrar el siguiente elemento.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/90 rounded-xl p-3 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span><strong>Nº CUIJ:</strong> {caseData.cuij || 'Sin CUIJ'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    <strong>Lugar:</strong> {caseData.seizureLocation || 'Mismo lugar'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    <strong>Testigos:</strong>{' '}
                    {witnessesList.length > 0 ? witnessesList.join(' y ') : 'Mismos testigos'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">
                    <strong>Funcionario:</strong>{' '}
                    {caseData.officer?.name || 'Mismo funcionario'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Listo, volver al formulario
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateNextDuo(caseData);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Siguiente Secuestro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
