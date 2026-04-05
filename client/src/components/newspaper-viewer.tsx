import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { type Newspaper } from "@shared/schema";
import { loadPDF, renderPDFPage } from "@/lib/pdf-utils";

interface NewspaperViewerProps {
  newspaper: Newspaper;
}

export default function NewspaperViewer({ newspaper }: NewspaperViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newspaper.fileType === 'pdf') {
      loadPDF(`/${newspaper.filePath.replace(/\\/g, "/")}`)
        .then((pdf) => {
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        })
        .catch(console.error);
    } else {
      setTotalPages(1);
      setCurrentPage(1);
    }
  }, [newspaper]);

  useEffect(() => {
    if (pdfDoc && canvasRef.current && newspaper.fileType === 'pdf') {
      renderPDFPage(pdfDoc, currentPage, canvasRef.current, zoom / 100);
    }
  }, [pdfDoc, currentPage, zoom, newspaper.fileType]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentPage < totalPages) {
        handleNextPage();
      } else if (diff < 0 && currentPage > 1) {
        handlePrevPage();
      }
    }
    
    setTouchStart(null);
  };

  return (
    <Card className="newspaper-viewer rounded-lg border border-gray-200 relative" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 zoom-control rounded-lg px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-secondary-newspaper min-w-[3rem] text-center">
          {zoom}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-gray-300 mx-2"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullscreen}
          title="Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Newspaper Content */}
      <CardContent className="px-4 pt-4 pb-2 overflow-auto" style={{ height: '90vh' }}>

        <div
          className="mx-auto page-transition"
          style={{ width: 'fit-content' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {newspaper.fileType === 'pdf' ? (
            <canvas
              ref={canvasRef}
              className="pdf-page shadow-lg rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          ) : (
            <img
              src={`/${newspaper.filePath.replace(/\\/g, "/")}`}
              alt={`${newspaper.title} - Page ${currentPage}`}
              className="w-full h-auto rounded shadow-lg"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                maxWidth: 'none'
              }}
            />
          )}
        </div>
      </CardContent>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 zoom-control rounded-lg px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              title="Previous Page"
              className="touch-control"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-secondary-newspaper px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              title="Next Page"
              className="touch-control"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
