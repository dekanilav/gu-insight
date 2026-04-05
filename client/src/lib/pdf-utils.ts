// PDF.js utilities for handling PDF viewing
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Load PDF.js from CDN
const loadPDFJS = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
};

export const loadPDF = async (url: string) => {
  const pdfjsLib = await loadPDFJS();
  const loadingTask = pdfjsLib.getDocument(url);
  return loadingTask.promise;
};

export const renderPDFPage = async (
  pdfDoc: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1
) => {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
  } catch (error) {
    console.error('Error rendering PDF page:', error);
  }
};

export const getPDFPageCount = async (pdfDoc: any): Promise<number> => {
  return pdfDoc.numPages;
};
