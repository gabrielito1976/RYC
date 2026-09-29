import { jsPDF } from 'jspdf';
import { ForensicCaseData, SeizureItem } from '../types';
import { MPA_LOGO_BASE64 } from './mpaLogoBase64';
import { getStoredCustomLogo } from './storage';

function getFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'JPEG';
  }
  return 'PNG';
}

function drawImageContained(
  doc: jsPDF,
  imgDataUrl: string,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  try {
    let aspect = 4 / 3;
    try {
      const props = (doc as any).getImageProperties ? (doc as any).getImageProperties(imgDataUrl) : null;
      if (props && props.width && props.height) {
        aspect = props.width / props.height;
      }
    } catch {
      aspect = 4 / 3;
    }

    let drawW = boxW;
    let drawH = boxW / aspect;
    if (drawH > boxH) {
      drawH = boxH;
      drawW = boxH * aspect;
    }

    const imgX = boxX + (boxW - drawW) / 2;
    const imgY = boxY + (boxH - drawH) / 2;
    const fmt = getFormatFromDataUrl(imgDataUrl);
    doc.addImage(imgDataUrl, fmt, imgX, imgY, drawW, drawH, undefined, 'FAST');
  } catch (e) {
    console.warn('Error dibujando imagen:', e);
  }
}

function createNewDoc(options: any): jsPDF {
  const Constructor: any = typeof jsPDF === 'function' ? jsPDF : (jsPDF as any).jsPDF || (jsPDF as any).default;
  return new Constructor(options);
}

export interface GeneratedDocuments {
  blob: Blob;
  url: string;
  dataUrl: string;
  filename: string;
}

/**
 * Genera el documento completo:
 * - Página 1: RÓTULO DE ELEMENTOS SECUESTRADOS (con Fotografía del secuestro integrada)
 * - Página 2: FORMULARIO DE CADENA DE CUSTODIA (Página 1)
 * - Página 3: FORMULARIO DE CADENA DE CUSTODIA (Página 2)
 */
export async function generateForensicPDF(caseData: ForensicCaseData): Promise<GeneratedDocuments> {
  const doc = createNewDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Página 1: RÓTULO DE ELEMENTOS SECUESTRADOS
  renderRotulo(doc, caseData);

  // Página 2: FORMULARIO DE CADENA DE CUSTODIA (Parte 1)
  doc.addPage();
  renderCadenaCustodiaPagina1(doc, caseData);

  // Página 3: FORMULARIO DE CADENA DE CUSTODIA (Parte 2)
  doc.addPage();
  renderCadenaCustodiaPagina2(doc, caseData);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const dataUrl = doc.output('datauristring');
  const cleanCuij = (caseData.cuij || 'Sin_CUIJ').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `Rotulo_y_Cadena_Custodia_${cleanCuij}.pdf`;

  return { blob, url, dataUrl, filename };
}

// -------------------------------------------------------------
// DIBUJO DEL LOGO DEL MPA 
// Rectángulo azul (#1F4E9E) con letras blancas MPA
// -------------------------------------------------------------
export function drawMPALogo(doc: jsPDF, x: number, y: number, width: number, height: number) {
  // Fondo azul institucional (#1F4E9E)
  doc.setFillColor(31, 78, 158);
  doc.rect(x, y, width, height, 'F');

  // Letras blancas
  doc.setFillColor(255, 255, 255);

  const topY = y + height * 0.16;
  const botY = y + height * 0.84;
  const letterH = botY - topY;
  const strokeW = width * 0.058;

  // Letra M
  const mX = x + width * 0.07;
  const mW = width * 0.26;
  doc.rect(mX, topY, strokeW, letterH, 'F');
  doc.rect(mX + mW - strokeW, topY, strokeW, letterH, 'F');
  doc.lines([
    [mW / 2 - strokeW / 2, letterH * 0.85],
    [strokeW * 0.5, 0],
    [-mW / 2 + strokeW, -letterH * 0.85]
  ], mX + strokeW, topY, [1, 1], 'F', true);
  doc.lines([
    [-mW / 2 + strokeW / 2, letterH * 0.85],
    [-strokeW * 0.5, 0],
    [mW / 2 - strokeW, -letterH * 0.85]
  ], mX + mW - strokeW, topY, [1, 1], 'F', true);

  // Letra P
  const pX = x + width * 0.38;
  const pW = width * 0.22;
  const pLoopH = letterH * 0.58;
  doc.rect(pX, topY, strokeW, letterH, 'F');
  doc.roundedRect(pX + strokeW * 0.4, topY, pW - strokeW * 0.4, pLoopH, strokeW * 0.8, strokeW * 0.8, 'F');
  // Hueco interior azul de la P
  doc.setFillColor(31, 78, 158);
  doc.roundedRect(pX + strokeW * 1.3, topY + strokeW * 0.85, pW - strokeW * 2.3, pLoopH - strokeW * 1.7, strokeW * 0.4, strokeW * 0.4, 'F');

  // Letra A
  doc.setFillColor(255, 255, 255);
  const aX = x + width * 0.65;
  const aW = width * 0.27;
  const aApexX = aX + aW / 2;

  // Pierna izquierda de la A
  doc.lines([
    [aW / 2, -letterH],
    [strokeW * 0.85, 0],
    [-aW / 2, letterH]
  ], aX, botY, [1, 1], 'F', true);

  // Pierna derecha de la A
  doc.lines([
    [-aW / 2, -letterH],
    [-strokeW * 0.85, 0],
    [aW / 2, letterH]
  ], aX + aW, botY, [1, 1], 'F', true);

  // Triángulo inferior blanco distintivo del logo de MPA
  const triW = aW * 0.46;
  const triH = letterH * 0.38;
  doc.triangle(
    aApexX, botY - triH,
    aApexX - triW / 2, botY,
    aApexX + triW / 2, botY,
    'F'
  );
}

// -------------------------------------------------------------
// RECUADRO SUPERIOR DERECHO
// "Para uso interno de la Fiscalía / Nº de CUIJ: ..."
// -------------------------------------------------------------
function drawHeaderCuijBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  cuij: string,
  customLogo?: string
) {
  // Marco con borde negro fino
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, height);

  // Logo MPA a la izquierda (rectángulo institucional 15mm x 7.2mm idéntico al oficial)
  const logoW = 15;
  const logoH = 7.2;
  const logoX = x + 1.6;
  const logoY = y + (height - logoH) / 2;

  const logoToUse = customLogo || getStoredCustomLogo() || MPA_LOGO_BASE64;

  try {
    const fmt = getFormatFromDataUrl(logoToUse);
    doc.addImage(logoToUse, fmt, logoX, logoY, logoW, logoH, undefined, 'FAST');
  } catch (imgErr) {
    drawMPALogo(doc, logoX, logoY, logoW, logoH);
  }

  // Divisoria vertical sutil
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(x + 18, y, x + 18, y + height);

  // Textos reglamentarios
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Para uso interno de la Fiscalía', x + 20.5, y + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Nº de CUIJ:  ${cuij || ''}`, x + 20.5, y + 9.8);
}

// -------------------------------------------------------------
// PÁGINA 1: RÓTULO DE ELEMENTOS SECUESTRADOS
// -------------------------------------------------------------
function renderRotulo(doc: jsPDF, caseData: ForensicCaseData) {
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let curY = 12;

  // 1. Recuadro superior derecho
  const headerBoxW = 78;
  const headerBoxH = 12;
  const headerBoxX = margin + contentWidth - headerBoxW;
  drawHeaderCuijBox(doc, headerBoxX, curY, headerBoxW, headerBoxH, caseData.cuij, caseData.customLogo);
  curY += headerBoxH + 3.5;

  // 2. Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(0, 0, 0);
  const titleText = 'RÓTULO DE ELEMENTOS SECUESTRADOS';
  doc.text(titleText, pageWidth / 2, curY + 4, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - titleW / 2, curY + 5.2, pageWidth / 2 + titleW / 2, curY + 5.2);
  curY += 8;

  // 3. Subtítulo en negrita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.text(
    'Importante: NO efectuar tachaduras ni enmiendas. Si debe corregir algo, hágalo entre paréntesis explicando el motivo',
    pageWidth / 2,
    curY,
    { align: 'center' }
  );
  curY += 2.5;

  // 4. Recuadro de Fecha, Hora y Lugar + Datos que permitan identificar el caso
  const box1H = 15;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, box1H);

  // Fila 1: Fecha, Hora y Lugar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text('Fecha, Hora y Lugar del secuestro:', margin + 2, curY + 4.5);
  doc.setFont('helvetica', 'normal');
  const dtText = caseData.seizureDateTime ? caseData.seizureDateTime.replace('T', ' ') + ' hs' : '';
  const locText = caseData.seizureLocation || '';
  const fullSeizureLoc = dtText && locText ? `${dtText} en ${locText}` : dtText || locText;
  doc.text(fullSeizureLoc, margin + 50, curY + 4.5);

  // Divisoria
  doc.line(margin, curY + 7.5, margin + contentWidth, curY + 7.5);

  // Fila 2: Datos que permitan identificar el caso
  doc.setFont('helvetica', 'bold');
  doc.text('Datos que permitan identificar el caso:', margin + 2, curY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(caseData.caseInfo || '', margin + 52, curY + 12);
  curY += box1H;

  // 5. Tabla de Elementos Secuestrados
  // Encabezados con fondo gris
  const colW1 = 68; // Descripción (1)
  const colW2 = 50; // Lugar del hallazgo (2)
  const colW3 = 20; // Cantidad
  const colW4 = 44; // Observaciones (3)

  const headH = 8.5;
  doc.setFillColor(225, 225, 225);
  doc.rect(margin, curY, contentWidth, headH, 'FD');

  doc.line(margin + colW1, curY, margin + colW1, curY + headH);
  doc.line(margin + colW1 + colW2, curY, margin + colW1 + colW2, curY + headH);
  doc.line(margin + colW1 + colW2 + colW3, curY, margin + colW1 + colW2 + colW3, curY + headH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DESCRIPCIÓN', margin + colW1 / 2, curY + 3.2, { align: 'center' });
  doc.text('(1)', margin + colW1 / 2, curY + 6.8, { align: 'center' });

  doc.text('LUGAR DEL HALLAZGO', margin + colW1 + colW2 / 2, curY + 3.2, { align: 'center' });
  doc.text('(2)', margin + colW1 + colW2 / 2, curY + 6.8, { align: 'center' });

  doc.text('Cantidad', margin + colW1 + colW2 + colW3 / 2, curY + 5.2, { align: 'center' });

  doc.text('OBSERVACIONES', margin + colW1 + colW2 + colW3 + colW4 / 2, curY + 3.2, { align: 'center' });
  doc.text('(3)', margin + colW1 + colW2 + colW3 + colW4 / 2, curY + 6.8, { align: 'center' });
  curY += headH;

  // Filas de items (2 filas según la plantilla)
  const items = caseData.items || [];
  const rows: SeizureItem[] = [
    items[0] || { id: '1', description: '', findingPlace: '', quantity: '', observations: '' },
    items[1] || { id: '2', description: '', findingPlace: '', quantity: '', observations: '' },
  ];

  const rowH = 15;
  rows.forEach((it) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, curY, contentWidth, rowH);

    doc.line(margin + colW1, curY, margin + colW1, curY + rowH);
    doc.line(margin + colW1 + colW2, curY, margin + colW1 + colW2, curY + rowH);
    doc.line(margin + colW1 + colW2 + colW3, curY, margin + colW1 + colW2 + colW3, curY + rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    // Texto Descripción
    if (it.description) {
      const splitDesc = doc.splitTextToSize(it.description, colW1 - 3);
      doc.text(splitDesc.slice(0, 4), margin + 1.5, curY + 4);
    }
    // Texto Lugar del hallazgo
    if (it.findingPlace) {
      const splitPlace = doc.splitTextToSize(it.findingPlace, colW2 - 3);
      doc.text(splitPlace.slice(0, 4), margin + colW1 + 1.5, curY + 4);
    }
    // Cantidad
    if (it.quantity) {
      doc.text(String(it.quantity), margin + colW1 + colW2 + colW3 / 2, curY + 7, { align: 'center' });
    }
    // Observaciones
    if (it.observations) {
      const splitObs = doc.splitTextToSize(it.observations, colW4 - 3);
      doc.text(splitObs.slice(0, 4), margin + colW1 + colW2 + colW3 + 1.5, curY + 4);
    }

    curY += rowH;
  });

  // 6. Recuadro "Fotografía del secuestro"
  const photoBoxH = 68;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, photoBoxH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const photo1 = caseData.photoDataUrl;
  const photo2 = caseData.photoDataUrl2;

  if (photo1 && photo2) {
    // Dos fotografías una al lado de la otra
    doc.text('Fotografía del secuestro: Elemento 1', margin + 2, curY + 5);
    doc.text('Elemento 2', margin + contentWidth / 2 + 3, curY + 5);

    // Divisoria vertical sutil entre ambas fotos
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.line(margin + contentWidth / 2, curY + 6.5, margin + contentWidth / 2, curY + photoBoxH - 2);

    const slotPadding = 2.5;
    const slotW = contentWidth / 2 - slotPadding * 2;
    const slotH = photoBoxH - 8.5;
    const slotY = curY + 6.5;

    // Foto 1 (izquierda)
    drawImageContained(doc, photo1, margin + slotPadding, slotY, slotW, slotH);

    // Foto 2 (derecha)
    drawImageContained(doc, photo2, margin + contentWidth / 2 + slotPadding, slotY, slotW, slotH);
  } else if (photo1 || photo2) {
    // Una sola fotografía
    const singlePhoto = (photo1 || photo2)!;
    doc.text('Fotografía del secuestro', margin + 2, curY + 5);
    const maxW = contentWidth - 8;
    const maxH = photoBoxH - 8.5;
    drawImageContained(doc, singlePhoto, margin + 4, curY + 6.5, maxW, maxH);
  } else {
    // Sin fotografía: espacio en blanco para fijar foto física
    doc.text('Fotografía del secuestro', margin + 2, curY + 5);
  }
  curY += photoBoxH;

  // 7. Recuadro Testigos
  const witBoxH = 13;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, witBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Testigos: 1)', margin + 2, curY + 5);

  const w1 = caseData.witnesses?.[0];
  const w2 = caseData.witnesses?.[1];
  const w1Str = w1?.name ? `${w1.name}${w1.dni ? ' - DNI: ' + w1.dni : ''}` : '';
  const w2Str = w2?.name ? `${w2.name}${w2.dni ? ' - DNI: ' + w2.dni : ''}` : '';

  doc.setFont('helvetica', 'normal');
  doc.text(w1Str, margin + 22, curY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('2)', margin + 22, curY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(w2Str, margin + 27, curY + 10);
  curY += witBoxH;

  // 8. Tabla de Embalaje
  // Columnas: Embalaje (38) | Bolsa Plástica (32) | Bolsa/Sobre de Papel (40) | Frasco (36) | Otro (36) = 182
  const embW1 = 40;
  const embW2 = 34;
  const embW3 = 40;
  const embW4 = 34;
  const embW5 = 34;

  const embHeadH = 8.5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, embHeadH);

  doc.line(margin + embW1, curY, margin + embW1, curY + embHeadH);
  doc.line(margin + embW1 + embW2, curY, margin + embW1 + embW2, curY + embHeadH);
  doc.line(margin + embW1 + embW2 + embW3, curY, margin + embW1 + embW2 + embW3, curY + embHeadH);
  doc.line(margin + embW1 + embW2 + embW3 + embW4, curY, margin + embW1 + embW2 + embW3 + embW4, curY + embHeadH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.text('Embalaje (Marque con', margin + embW1 / 2, curY + 3.2, { align: 'center' });
  doc.text('una cruz)', margin + embW1 / 2, curY + 6.8, { align: 'center' });

  doc.text('Bolsa', margin + embW1 + embW2 / 2, curY + 3.2, { align: 'center' });
  doc.text('Plástica', margin + embW1 + embW2 / 2, curY + 6.8, { align: 'center' });

  doc.text('Bolsa/Sobre', margin + embW1 + embW2 + embW3 / 2, curY + 3.2, { align: 'center' });
  doc.text('de Papel', margin + embW1 + embW2 + embW3 / 2, curY + 6.8, { align: 'center' });

  doc.text('Frasco', margin + embW1 + embW2 + embW3 + embW4 / 2, curY + 5.2, { align: 'center' });
  doc.text('Otro', margin + embW1 + embW2 + embW3 + embW4 + embW5 / 2, curY + 5.2, { align: 'center' });
  curY += embHeadH;

  // Fila ¿Está cerrado?
  const isClosedH = 7;
  doc.rect(margin, curY, contentWidth, isClosedH);
  doc.line(margin + embW1, curY, margin + embW1, curY + isClosedH);
  doc.line(margin + embW1 + embW2, curY, margin + embW1 + embW2, curY + isClosedH);
  doc.line(margin + embW1 + embW2 + embW3, curY, margin + embW1 + embW2 + embW3, curY + isClosedH);
  doc.line(margin + embW1 + embW2 + embW3 + embW4, curY, margin + embW1 + embW2 + embW3 + embW4, curY + isClosedH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('¿Está cerrado?', margin + 2, curY + 4.8);

  // Marcas de embalaje
  const pkg = caseData.packaging || { type: 'bolsa_plastica', otherText: '', isClosed: true };
  const mark = pkg.isClosed ? 'X' : '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  if (pkg.type === 'bolsa_plastica') {
    doc.text(mark, margin + embW1 + embW2 / 2, curY + 5, { align: 'center' });
  } else if (pkg.type === 'bolsa_papel') {
    doc.text(mark, margin + embW1 + embW2 + embW3 / 2, curY + 5, { align: 'center' });
  } else if (pkg.type === 'frasco') {
    doc.text(mark, margin + embW1 + embW2 + embW3 + embW4 / 2, curY + 5, { align: 'center' });
  }

  // Celda 5 (Otro): Sombrear en gris oscuro
  doc.setFillColor(150, 150, 150);
  doc.rect(margin + embW1 + embW2 + embW3 + embW4, curY, embW5, isClosedH, 'F');
  doc.rect(margin + embW1 + embW2 + embW3 + embW4, curY, embW5, isClosedH, 'D');
  curY += isClosedH;

  // 9. Funcionario que efectuó la recolección y Firma
  const officerBoxH = 15;
  const offW1 = embW1 + embW2 + embW3; // 114 mm
  const offW2 = contentWidth - offW1; // 68 mm
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, officerBoxH);
  doc.line(margin + offW1, curY, margin + offW1, curY + officerBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Funcionario que', margin + 2, curY + 4.5);
  doc.text('efectuó la recolección', margin + 2, curY + 8);

  const officer = caseData.officer;
  const officerLine = officer?.name
    ? `${officer.name}${officer.role ? ' (' + officer.role + ')' : ''}${officer.department ? ' - ' + officer.department : ''}`
    : '';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(officerLine, margin + 2, curY + 12.5);

  // Espacio para la firma manual física
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Firma:', margin + offW1 + 2, curY + 4.5);
  curY += officerBoxH;

  // 10. Referencias para completar el presente rótulo (Fondo sombreado)
  const refH = 16.5;
  doc.setFillColor(235, 235, 235);
  doc.rect(margin, curY, contentWidth, refH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('REFERENCIAS PARA COMPLETAR EL PRESENTE RÓTULO:', margin + 1.5, curY + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.text('(1) Detallar: caracteres, peso, medida, tamaño, color, especie, estado.', margin + 1.5, curY + 6.8);
  doc.text('(2) Tenga en cuenta que debe ser minucioso y detallado.', margin + 1.5, curY + 9.8);
  doc.text(
    '(3) De ser posible, referenciar si se tomaron fotos, si se posee restos biológicos (sangre, semen, saliva, orina, etc.) y la cadena de custodia respectiva.',
    margin + 1.5,
    curY + 12.8
  );
}

// -------------------------------------------------------------
// PÁGINA 2: FORMULARIO DE CADENA DE CUSTODIA (PÁGINA 1)
// -------------------------------------------------------------
function renderCadenaCustodiaPagina1(doc: jsPDF, caseData: ForensicCaseData) {
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let curY = 12;

  // 1. Recuadro superior derecho
  const headerBoxW = 78;
  const headerBoxH = 12;
  const headerBoxX = margin + contentWidth - headerBoxW;
  drawHeaderCuijBox(doc, headerBoxX, curY, headerBoxW, headerBoxH, caseData.cuij, caseData.customLogo);
  curY += headerBoxH + 3.5;

  // 2. Título principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(0, 0, 0);
  const titleText = 'FORMULARIO DE CADENA DE CUSTODIA';
  doc.text(titleText, pageWidth / 2, curY + 4, { align: 'center' });
  const titleW = doc.getTextWidth(titleText);
  doc.setLineWidth(0.4);
  doc.line(pageWidth / 2 - titleW / 2, curY + 5.2, pageWidth / 2 + titleW / 2, curY + 5.2);
  curY += 8;

  // 3. Subtítulo en cursiva
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text('(el presente formulario debe acompañar la evidencia en todo momento)', pageWidth / 2, curY, {
    align: 'center',
  });
  curY += 3;

  // 4. Recuadro de Datos iniciales (Datos que permitan identificar el caso / Fecha y Hora / Lugar)
  const infoBoxH = 21;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(margin, curY, contentWidth, infoBoxH);

  // Fila 1: Datos que permitan identificar el caso
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Datos que permitan identificar el caso:', margin + 2, curY + 4.8);
  doc.setFont('helvetica', 'normal');
  doc.text(caseData.caseInfo || '', margin + 52, curY + 4.8);

  doc.line(margin, curY + 7, margin + contentWidth, curY + 7);

  // Fila 2: Fecha y Hora del secuestro
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha y Hora del secuestro:', margin + 2, curY + 11.8);
  doc.setFont('helvetica', 'normal');
  const dtText = caseData.seizureDateTime ? caseData.seizureDateTime.replace('T', ' ') + ' hs' : '';
  doc.text(dtText, margin + 42, curY + 11.8);

  doc.line(margin, curY + 14, margin + contentWidth, curY + 14);

  // Fila 3: Lugar del secuestro
  doc.setFont('helvetica', 'bold');
  doc.text('Lugar del secuestro:', margin + 2, curY + 18.8);
  doc.setFont('helvetica', 'normal');
  doc.text(caseData.seizureLocation || '', margin + 32, curY + 18.8);
  curY += infoBoxH;

  // 5. EMBALAJE
  const embBoxH = 18;
  doc.rect(margin, curY, contentWidth, embBoxH);

  // Fila encabezado de embalaje
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EMBALAJE (Marque con una cruz lo que corresponda)', margin + 2, curY + 4.2);
  doc.line(margin, curY + 6, margin + contentWidth, curY + 6);

  // Fila de tipos de embalaje: Bolsa Plástica | Bolsa/Sobre de Papel | Frasco | Otro:
  const eCol1 = 45;
  const eCol2 = 45;
  const eCol3 = 35;
  const eCol4 = contentWidth - eCol1 - eCol2 - eCol3; // 57 mm

  doc.line(margin + eCol1, curY + 6, margin + eCol1, curY + embBoxH);
  doc.line(margin + eCol1 + eCol2, curY + 6, margin + eCol1 + eCol2, curY + embBoxH);
  doc.line(margin + eCol1 + eCol2 + eCol3, curY + 6, margin + eCol1 + eCol2 + eCol3, curY + embBoxH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Bolsa Plástica', margin + 2, curY + 9.8);
  doc.text('Bolsa/Sobre de Papel', margin + eCol1 + 2, curY + 9.8);
  doc.text('Frasco', margin + eCol1 + eCol2 + 2, curY + 9.8);

  const pkg = caseData.packaging || { type: 'bolsa_plastica', otherText: '', isClosed: true };
  const otroTexto = pkg.type === 'otro' && pkg.otherText ? ` ${pkg.otherText}` : '';
  doc.text(`Otro:${otroTexto}`, margin + eCol1 + eCol2 + eCol3 + 2, curY + 9.8);

  // Línea divisoria de ¿Está cerrado?
  doc.line(margin, curY + 12, margin + contentWidth, curY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('¿Está cerrado?', margin + 2, curY + 16);

  const isClosedMark = pkg.isClosed ? 'X' : '';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  if (pkg.type === 'bolsa_plastica') {
    doc.text(isClosedMark, margin + eCol1 - 10, curY + 16, { align: 'center' });
  } else if (pkg.type === 'bolsa_papel') {
    doc.text(isClosedMark, margin + eCol1 + eCol2 - 10, curY + 16, { align: 'center' });
  } else if (pkg.type === 'frasco') {
    doc.text(isClosedMark, margin + eCol1 + eCol2 + eCol3 - 10, curY + 16, { align: 'center' });
  }

  // Celda sombreada en gris oscuro debajo de "Otro:"
  doc.setFillColor(150, 150, 150);
  doc.rect(margin + eCol1 + eCol2 + eCol3, curY + 12, eCol4, 6, 'F');
  doc.rect(margin + eCol1 + eCol2 + eCol3, curY + 12, eCol4, 6, 'D');
  curY += embBoxH;

  // 6. Descripción del elemento secuestrado
  const items = caseData.items || [];
  const item1Desc = items[0]?.description?.trim();
  const item2Desc = items[1]?.description?.trim();

  const hasDesc1 = !!item1Desc;
  const hasDesc2 = !!item2Desc;

  const descBoxH = hasDesc1 && hasDesc2 ? 16 : 14;
  doc.rect(margin, curY, contentWidth, descBoxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Descripción del elemento secuestrado:', margin + 2, curY + 4.5);

  doc.setFontSize(7);
  if (hasDesc1 && hasDesc2) {
    // Elemento 1 arriba
    const text1 = item1Desc.endsWith(';') || item1Desc.endsWith('.') ? item1Desc : `${item1Desc};`;
    doc.setFont('helvetica', 'bold');
    doc.text('Elemento 1: ', margin + 2, curY + 8.5);
    const p1W = doc.getTextWidth('Elemento 1: ');
    doc.setFont('helvetica', 'normal');
    const s1 = doc.splitTextToSize(text1, contentWidth - 4 - p1W);
    doc.text(s1[0], margin + 2 + p1W, curY + 8.5);

    // Elemento 2 debajo
    doc.setFont('helvetica', 'bold');
    doc.text('Elemento 2: ', margin + 2, curY + 12.5);
    const p2W = doc.getTextWidth('Elemento 2: ');
    doc.setFont('helvetica', 'normal');
    const s2 = doc.splitTextToSize(item2Desc, contentWidth - 4 - p2W);
    doc.text(s2[0], margin + 2 + p2W, curY + 12.5);
  } else if (hasDesc1 || hasDesc2) {
    const singleDesc = (item1Desc || item2Desc)!;
    const label = hasDesc1 ? 'Elemento 1: ' : 'Elemento 2: ';
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 2, curY + 8.5);
    const pW = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    const s = doc.splitTextToSize(singleDesc, contentWidth - 4 - pW);
    doc.text(s.slice(0, 2), margin + 2 + pW, curY + 8.5);
  }
  curY += descBoxH;

  // 7. Observaciones
  const item1Obs = items[0]?.observations?.trim();
  const item2Obs = items[1]?.observations?.trim();

  const hasObs1 = !!item1Obs;
  const hasObs2 = !!item2Obs;

  const obsBoxH = hasObs1 && hasObs2 ? 16 : 14;
  doc.rect(margin, curY, contentWidth, obsBoxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Observaciones:', margin + 2, curY + 4.5);

  doc.setFontSize(7);
  if (hasObs1 && hasObs2) {
    // Observaciones Elemento 1 arriba
    const textObs1 = item1Obs.endsWith(';') || item1Obs.endsWith('.') ? item1Obs : `${item1Obs};`;
    doc.setFont('helvetica', 'bold');
    doc.text('Elemento 1: ', margin + 2, curY + 8.5);
    const p1W = doc.getTextWidth('Elemento 1: ');
    doc.setFont('helvetica', 'normal');
    const s1 = doc.splitTextToSize(textObs1, contentWidth - 4 - p1W);
    doc.text(s1[0], margin + 2 + p1W, curY + 8.5);

    // Observaciones Elemento 2 debajo
    doc.setFont('helvetica', 'bold');
    doc.text('Elemento 2: ', margin + 2, curY + 12.5);
    const p2W = doc.getTextWidth('Elemento 2: ');
    doc.setFont('helvetica', 'normal');
    const s2 = doc.splitTextToSize(item2Obs, contentWidth - 4 - p2W);
    doc.text(s2[0], margin + 2 + p2W, curY + 12.5);
  } else if (hasObs1 || hasObs2) {
    const singleObs = (item1Obs || item2Obs)!;
    const label = hasObs1 ? 'Elemento 1: ' : 'Elemento 2: ';
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 2, curY + 8.5);
    const pW = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    const s = doc.splitTextToSize(singleObs, contentWidth - 4 - pW);
    doc.text(s.slice(0, 2), margin + 2 + pW, curY + 8.5);
  }
  curY += obsBoxH;

  // 8. Testigos
  const witBoxH = 14;
  doc.rect(margin, curY, contentWidth, witBoxH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Testigos: 1)', margin + 2, curY + 5);

  const w1 = caseData.witnesses?.[0];
  const w2 = caseData.witnesses?.[1];
  const w1Str = w1?.name ? `${w1.name}${w1.dni ? ' - DNI: ' + w1.dni : ''}` : '';
  const w2Str = w2?.name ? `${w2.name}${w2.dni ? ' - DNI: ' + w2.dni : ''}` : '';

  doc.setFont('helvetica', 'normal');
  doc.text(w1Str, margin + 20, curY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('2)', margin + 20, curY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(w2Str, margin + 25, curY + 10.5);
  curY += witBoxH;

  // 9. CADENA DE CUSTODIA - TRAMO 1 COMPLETO
  const t1 = caseData.transfers?.[0];
  const recolectorOfficer = caseData.officer;
  const t1Entrega = t1?.entrega?.name ? t1.entrega : recolectorOfficer;
  const t1Recibe = t1?.recibe || { name: '', role: '', department: '' };

  renderCustodyBlock(
    doc,
    margin,
    curY,
    contentWidth,
    'FUNCIONARIO QUE EFECTUÓ LA RECOLECCIÓN - ENTREGA',
    t1Entrega,
    t1Recibe,
    t1?.evidenceState || 'Envasado y rotulado en condiciones',
    t1?.dateTime || caseData.seizureDateTime
  );
  curY += 46;

  // 10. CADENA DE CUSTODIA - TRAMO 2 (Inicia en página 1: Cabecera, Entrega y Recibe)
  const t2 = caseData.transfers?.[1];
  renderCustodyBlockHeaderAndPeople(
    doc,
    margin,
    curY,
    contentWidth,
    'ENTREGA',
    t2?.entrega || { name: '', role: '', department: '' },
    t2?.recibe || { name: '', role: '', department: '' }
  );
}

// -------------------------------------------------------------
// PÁGINA 3: FORMULARIO DE CADENA DE CUSTODIA (PÁGINA 2)
// -------------------------------------------------------------
function renderCadenaCustodiaPagina2(doc: jsPDF, caseData: ForensicCaseData) {
  const margin = 14;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let curY = 16;

  // 1. Cierre del Tramo 2 que comenzó en la página anterior
  const t2 = caseData.transfers?.[1];
  renderCustodyFooter(
    doc,
    margin,
    curY,
    contentWidth,
    t2?.evidenceState || '',
    t2?.dateTime || ''
  );
  curY += 20;

  // 2. TRAMO 3
  const t3 = caseData.transfers?.[2];
  renderCustodyBlock(
    doc,
    margin,
    curY,
    contentWidth,
    'ENTREGA',
    t3?.entrega || { name: '', role: '', department: '' },
    t3?.recibe || { name: '', role: '', department: '' },
    t3?.evidenceState || '',
    t3?.dateTime || ''
  );
  curY += 54;

  // 3. TRAMO 4
  const t4 = caseData.transfers?.[3];
  renderCustodyBlock(
    doc,
    margin,
    curY,
    contentWidth,
    'ENTREGA',
    t4?.entrega || { name: '', role: '', department: '' },
    t4?.recibe || { name: '', role: '', department: '' },
    t4?.evidenceState || '',
    t4?.dateTime || ''
  );
}

// -------------------------------------------------------------
// HELPERS PARA LOS BLOQUES DE CADENA DE CUSTODIA
// -------------------------------------------------------------
function renderCustodyBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  entregaTitle: string,
  entrega: any,
  recibe: any,
  evidenceState: string,
  dateTime: string
) {
  let curY = y;
  // Barra 1: CADENA DE CUSTODIA (fondo gris medio)
  doc.setFillColor(180, 180, 180);
  doc.rect(x, curY, width, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('CADENA DE CUSTODIA', x + width / 2, curY + 3.8, { align: 'center' });
  curY += 5.5;

  // Sub-barra: ENTREGA
  doc.setFillColor(240, 240, 240);
  doc.rect(x, curY, width, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text(entregaTitle, x + width / 2, curY + 3.5, { align: 'center' });
  curY += 5;

  // Tabla ENTREGA: Nombre y Apellido (55) | Función (38) | Repartición (45) | Firma (44) = 182
  const c1 = 55;
  const c2 = 38;
  const c3 = 45;
  const c4 = width - c1 - c2 - c3;

  doc.rect(x, curY, width, 4.8);
  doc.line(x + c1, curY, x + c1, curY + 4.8);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 4.8);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Nombre y Apellido', x + c1 / 2, curY + 3.3, { align: 'center' });
  doc.text('Función', x + c1 + c2 / 2, curY + 3.3, { align: 'center' });
  doc.text('Repartición', x + c1 + c2 + c3 / 2, curY + 3.3, { align: 'center' });
  doc.text('Firma', x + c1 + c2 + c3 + c4 / 2, curY + 3.3, { align: 'center' });
  curY += 4.8;

  // Datos ENTREGA
  doc.rect(x, curY, width, 7);
  doc.line(x + c1, curY, x + c1, curY + 7);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 7);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(entrega?.name || '', x + 2, curY + 4.5);
  doc.text(entrega?.role || '', x + c1 + 2, curY + 4.5);
  doc.text(entrega?.department || '', x + c1 + c2 + 2, curY + 4.5);
  curY += 7;

  // Sub-barra: RECIBE
  doc.setFillColor(240, 240, 240);
  doc.rect(x, curY, width, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('RECIBE', x + width / 2, curY + 3.5, { align: 'center' });
  curY += 5;

  // Tabla RECIBE: Encabezados
  doc.rect(x, curY, width, 4.8);
  doc.line(x + c1, curY, x + c1, curY + 4.8);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 4.8);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Nombre y Apellido', x + c1 / 2, curY + 3.3, { align: 'center' });
  doc.text('Función', x + c1 + c2 / 2, curY + 3.3, { align: 'center' });
  doc.text('Repartición', x + c1 + c2 + c3 / 2, curY + 3.3, { align: 'center' });
  doc.text('Firma', x + c1 + c2 + c3 + c4 / 2, curY + 3.3, { align: 'center' });
  curY += 4.8;

  // Datos RECIBE
  doc.rect(x, curY, width, 7);
  doc.line(x + c1, curY, x + c1, curY + 7);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 7);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(recibe?.name || '', x + 2, curY + 4.5);
  doc.text(recibe?.role || '', x + c1 + 2, curY + 4.5);
  doc.text(recibe?.department || '', x + c1 + c2 + 2, curY + 4.5);
  curY += 7;

  // Fila inferior: Estado general y Fecha y Hora
  renderCustodyFooter(doc, x, curY, width, evidenceState, dateTime);
}

function renderCustodyBlockHeaderAndPeople(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  entregaTitle: string,
  entrega: any,
  recibe: any
) {
  let curY = y;
  // Barra 1: CADENA DE CUSTODIA (fondo gris medio)
  doc.setFillColor(180, 180, 180);
  doc.rect(x, curY, width, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('CADENA DE CUSTODIA', x + width / 2, curY + 3.8, { align: 'center' });
  curY += 5.5;

  // Sub-barra: ENTREGA
  doc.setFillColor(240, 240, 240);
  doc.rect(x, curY, width, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text(entregaTitle, x + width / 2, curY + 3.5, { align: 'center' });
  curY += 5;

  const c1 = 55;
  const c2 = 38;
  const c3 = 45;
  const c4 = width - c1 - c2 - c3;

  doc.rect(x, curY, width, 4.8);
  doc.line(x + c1, curY, x + c1, curY + 4.8);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 4.8);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Nombre y Apellido', x + c1 / 2, curY + 3.3, { align: 'center' });
  doc.text('Función', x + c1 + c2 / 2, curY + 3.3, { align: 'center' });
  doc.text('Repartición', x + c1 + c2 + c3 / 2, curY + 3.3, { align: 'center' });
  doc.text('Firma', x + c1 + c2 + c3 + c4 / 2, curY + 3.3, { align: 'center' });
  curY += 4.8;

  doc.rect(x, curY, width, 7);
  doc.line(x + c1, curY, x + c1, curY + 7);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 7);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(entrega?.name || '', x + 2, curY + 4.5);
  doc.text(entrega?.role || '', x + c1 + 2, curY + 4.5);
  doc.text(entrega?.department || '', x + c1 + c2 + 2, curY + 4.5);
  curY += 7;

  // Sub-barra: RECIBE
  doc.setFillColor(240, 240, 240);
  doc.rect(x, curY, width, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('RECIBE', x + width / 2, curY + 3.5, { align: 'center' });
  curY += 5;

  doc.rect(x, curY, width, 4.8);
  doc.line(x + c1, curY, x + c1, curY + 4.8);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 4.8);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Nombre y Apellido', x + c1 / 2, curY + 3.3, { align: 'center' });
  doc.text('Función', x + c1 + c2 / 2, curY + 3.3, { align: 'center' });
  doc.text('Repartición', x + c1 + c2 + c3 / 2, curY + 3.3, { align: 'center' });
  doc.text('Firma', x + c1 + c2 + c3 + c4 / 2, curY + 3.3, { align: 'center' });
  curY += 4.8;

  doc.rect(x, curY, width, 7);
  doc.line(x + c1, curY, x + c1, curY + 7);
  doc.line(x + c1 + c2, curY, x + c1 + c2, curY + 7);
  doc.line(x + c1 + c2 + c3, curY, x + c1 + c2 + c3, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text(recibe?.name || '', x + 2, curY + 4.5);
  doc.text(recibe?.role || '', x + c1 + 2, curY + 4.5);
  doc.text(recibe?.department || '', x + c1 + c2 + 2, curY + 4.5);
}

function renderCustodyFooter(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  evidenceState: string,
  dateTime: string
) {
  const footH = 14;
  const leftW = width * 0.68; // ~124 mm
  const rightW = width - leftW; // ~58 mm

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, footH);
  doc.line(x + leftW, y, x + leftW, y + footH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('Estado general de la especie / evidencia (observaciones):', x + 2, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  if (evidenceState) {
    const splitState = doc.splitTextToSize(evidenceState, leftW - 4);
    doc.text(splitState.slice(0, 2), x + 2, y + 8.5);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('Fecha y Hora', x + leftW + 2, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const dtText = dateTime ? dateTime.replace('T', ' ') + ' hs' : '';
  doc.text(dtText, x + leftW + 2, y + 8.5);
}
