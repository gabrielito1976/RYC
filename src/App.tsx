import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ForensicForm } from './components/ForensicForm';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { ForensicCaseData } from './types';
import {
  getStoredDraft,
  saveStoredDraft,
  clearStoredDraft,
  getDefaultForensicCase,
  getStoredTheme,
  saveStoredTheme,
  getStoredCustomLogo,
  saveStoredCustomLogo,
  clearStoredCustomLogo,
} from './utils/storage';
import { generateForensicPDF } from './utils/pdfGenerator';
import { downloadPdfBlob } from './utils/fileDownloader';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());
  const [customLogo, setCustomLogo] = useState<string | null>(() => getStoredCustomLogo());
  const [caseData, setCaseData] = useState<ForensicCaseData>(() => {
    const draft = getStoredDraft();
    const storedLogo = getStoredCustomLogo();
    if (storedLogo && !draft.customLogo) {
      return { ...draft, customLogo: storedLogo };
    }
    return draft;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{
    pdfUrl: string;
    pdfDataUrl: string;
    pdfBlob: Blob | null;
    filename: string;
  } | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Autosave draft on any case data change
  useEffect(() => {
    saveStoredDraft(caseData);
  }, [caseData]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleResetForm = () => {
    if (
      window.confirm(
        '¿Desea limpiar el formulario para iniciar un nuevo documento?\nSe borrarán los datos ingresados actualmente (el perfil del funcionario se mantendrá).'
      )
    ) {
      clearStoredDraft();
      const defaultCase = getDefaultForensicCase();
      if (customLogo) {
        defaultCase.customLogo = customLogo;
      }
      setCaseData(defaultCase);
    }
  };

  const handleUpdateLogo = (newLogo: string | null) => {
    if (newLogo) {
      saveStoredCustomLogo(newLogo);
      setCustomLogo(newLogo);
      setCaseData((prev) => ({ ...prev, customLogo: newLogo }));
    } else {
      clearStoredCustomLogo();
      setCustomLogo(null);
      setCaseData((prev) => {
        const copy = { ...prev };
        delete copy.customLogo;
        return copy;
      });
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const result = await generateForensicPDF(caseData);

      // Descarga directa inmediata para que el usuario reciba su archivo sin demoras
      try {
        downloadPdfBlob(result.blob, result.filename, result.dataUrl);
      } catch (dlErr) {
        console.warn('Auto download error:', dlErr);
      }

      setPreviewData({
        pdfUrl: result.url,
        pdfDataUrl: result.dataUrl,
        pdfBlob: result.blob,
        filename: result.filename,
      });
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      alert(`Ocurrió un error al generar el documento PDF: ${err?.message || 'Error inesperado'}. Por favor revise los datos ingresados.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Workflow: Confeccionar siguiente secuestro (mismo caso)
  const handleCreateNextDuo = (source: ForensicCaseData) => {
    const nextCase: ForensicCaseData = {
      cuij: source.cuij,
      caseInfo: source.caseInfo,
      seizureDateTime: source.seizureDateTime,
      seizureLocation: source.seizureLocation,
      items: [
        {
          id: String(Date.now()),
          description: '',
          findingPlace: source.seizureLocation || '',
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
      witnesses: source.witnesses,
      officer: source.officer,
      transfers: source.transfers,
    };

    setCaseData(nextCase);
    saveStoredDraft(nextCase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onResetForm={handleResetForm}
        customLogo={customLogo}
        onUpdateLogo={handleUpdateLogo}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <ForensicForm
          caseData={caseData}
          onChange={setCaseData}
          onGeneratePDF={handleGeneratePDF}
          isGenerating={isGenerating}
        />
      </main>

      {/* PDF Compiled Modal */}
      {previewData && (
        <PDFPreviewModal
          pdfUrl={previewData.pdfUrl}
          pdfDataUrl={previewData.pdfDataUrl}
          pdfBlob={previewData.pdfBlob}
          filename={previewData.filename}
          caseData={caseData}
          onClose={() => setPreviewData(null)}
          onCreateNextDuo={handleCreateNextDuo}
        />
      )}
    </div>
  );
}

export default App;
