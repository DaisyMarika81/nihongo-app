import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportNoteAsPDF(sessionNum: number) {
  const element = document.querySelector('.ProseMirror') as HTMLElement;
  if (!element) return;

  // Temporarily hide no-print elements so they don't affect layout
  const noPrintElements = document.querySelectorAll<HTMLElement>('.no-print');
  noPrintElements.forEach((el) => { el.dataset.display = el.style.display; el.style.display = 'none'; });

  // Force white background for capture
  const originalBg = element.style.background;
  element.style.background = '#ffffff';

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Restore
  element.style.background = originalBg;
  noPrintElements.forEach((el) => { el.style.display = el.dataset.display || ''; delete el.dataset.display; });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  const pdfImgWidth = pageWidth - margin * 2;
  const pdfImgHeight = (canvas.height * pdfImgWidth) / canvas.width;
  const pageContentHeight = pageHeight - margin * 2;

  if (pdfImgHeight <= pageContentHeight) {
    // Single page
    const yOffset = (pageContentHeight - pdfImgHeight) / 2 + margin;
    pdf.addImage(imgData, 'PNG', margin, yOffset, pdfImgWidth, pdfImgHeight);
  } else {
    // Multi-page: slice canvas into page-sized chunks
    const totalPages = Math.ceil(pdfImgHeight / pageContentHeight);
    const pxPerMm = canvas.width / pdfImgWidth;

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();

      const srcY = Math.round((p * pageContentHeight) * pxPerMm);
      const sliceHeight = Math.round(Math.min(pageContentHeight, pdfImgHeight - p * pageContentHeight) * pxPerMm);

      // Crop canvas to the visible slice for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, pdfImgWidth, sliceHeight / pxPerMm);
    }
  }

  pdf.save(`buoi-${sessionNum}-note.pdf`);
}
