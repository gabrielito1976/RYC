import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface DownloadResult {
  success: boolean;
  message: string;
  method: 'capacitor' | 'web-share' | 'blob' | 'new-tab' | 'failed';
  uri?: string;
  error?: any;
}

/**
 * Converts a Blob to a pure base64 string (without the data URL prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = (reader.result as string) || '';
      const b64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(b64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Reliable file download using programmatic Blob Object URL with DataURI fallback
 */
export function downloadPdfBlob(blob: Blob, filename: string, dataUrl?: string): boolean {
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore
        }
      }, 120000);
    }, 1500);

    return true;
  } catch (err) {
    console.warn('downloadPdfBlob with ObjectURL failed, trying fallback:', err);
    if (dataUrl) {
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 1500);
        return true;
      } catch (err2) {
        console.error('DataURL download also failed:', err2);
      }
    }
    return false;
  }
}

/**
 * Directly opens the generated PDF in a new browser tab
 */
export function openPdfInNewTab(blob: Blob): boolean {
  try {
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 1000);
    }
    return true;
  } catch (err) {
    console.error('openPdfInNewTab error:', err);
    return false;
  }
}

/**
 * Checks if the Web Share API with files is genuinely available and permissible
 */
export function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [file] }));
  } catch {
    return false;
  }
}

/**
 * Native Android/iOS share, Web Share API with real files, and robust fallbacks.
 */
export async function saveOrSharePdf(
  dataUrl: string,
  blob: Blob,
  filename: string
): Promise<DownloadResult> {
  // 1. STRATEGY 1: NATIVE ANDROID / CAPACITOR (Installed APK)
  if (Capacitor.isNativePlatform()) {
    try {
      let base64Data = '';
      if (dataUrl && dataUrl.includes(',')) {
        base64Data = dataUrl.split(',')[1];
      } else if (dataUrl && !dataUrl.startsWith('data:')) {
        base64Data = dataUrl;
      } else {
        base64Data = await blobToBase64(blob);
      }

      // Write to device Cache directory
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Pass files array so Android uses FileProvider for WhatsApp, Gmail, etc.
      await Share.share({
        title: filename,
        text: `Documento: ${filename}`,
        files: [writeResult.uri],
        url: writeResult.uri,
        dialogTitle: 'Guardar o Compartir PDF',
      });

      return {
        success: true,
        message: '¡Documento abierto en el sistema para guardar o compartir!',
        method: 'capacitor',
        uri: writeResult.uri,
      };
    } catch (capErr: any) {
      console.warn('Capacitor native share warning:', capErr);
      return {
        success: false,
        message: 'Aviso al compartir en Android: ' + (capErr?.message || 'Error nativo'),
        method: 'failed',
        error: capErr,
      };
    }
  }

  // 2. STRATEGY 2: WEB SHARE API (Chrome Android, Safari iOS, PWA)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `Documento: ${filename}`,
        });
        return {
          success: true,
          message: '¡Documento compartido correctamente!',
          method: 'web-share',
        };
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        return {
          success: true,
          message: 'Acción de compartir cancelada.',
          method: 'web-share',
        };
      }
      console.warn('Web Share API failed:', shareErr);
    }
  }

  // 3. STRATEGY 3: DIRECT DOWNLOAD VIA BLOB
  const downloaded = downloadPdfBlob(blob, filename);
  if (downloaded) {
    return {
      success: true,
      message: '¡Descarga iniciada en tu dispositivo!',
      method: 'blob',
    };
  }

  // 4. STRATEGY 4: OPEN IN NEW TAB (NATIVE MOBILE PDF VIEWER)
  openPdfInNewTab(blob);
  return {
    success: true,
    message: 'PDF abierto en nueva pestaña para guardar o compartir.',
    method: 'new-tab',
  };
}
