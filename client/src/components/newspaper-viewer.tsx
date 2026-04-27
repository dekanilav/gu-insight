import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight } from "lucide-react";
import { type Newspaper } from "@shared/schema";
import { loadPDF, renderPDFPage } from "@/lib/pdf-utils";
import { motion, AnimatePresence } from "framer-motion";

interface NewspaperViewerProps {
  newspaper: Newspaper;
}

// Direction-aware page flip variants
const pageVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  }),
};

export default function NewspaperViewer({ newspaper }: NewspaperViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [direction, setDirection] = useState(1); // +1 forward, -1 backward
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newspaper.fileType === "pdf") {
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
    if (pdfDoc && canvasRef.current && newspaper.fileType === "pdf") {
      renderPDFPage(pdfDoc, currentPage, canvasRef.current, zoom / 100);
    }
  }, [pdfDoc, currentPage, zoom, newspaper.fileType]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setDirection(-1);
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setDirection(1);
      setCurrentPage((prev) => prev + 1);
    }
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
    <Card
      className="newspaper-viewer rounded-xl border border-white/30 bg-white/70 backdrop-blur-sm shadow-md relative overflow-hidden"
      ref={containerRef}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg px-2 py-1 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          title="Zoom Out"
          className="hover:bg-gray-100/80 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-secondary-newspaper min-w-[3rem] text-center font-medium">
          {zoom}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          title="Zoom In"
          className="hover:bg-gray-100/80 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullscreen}
          title="Fullscreen"
          className="hover:bg-gray-100/80 transition-colors"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Newspaper Content with AnimatePresence for page flip */}
      <CardContent className="px-4 pt-4 pb-2 overflow-auto" style={{ height: "90vh" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="mx-auto"
            style={{ width: "fit-content" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {newspaper.fileType === "pdf" ? (
              <canvas
                ref={canvasRef}
                className="pdf-page shadow-xl rounded-lg"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            ) : (
              <img
                src={`/${newspaper.filePath.replace(/\\/g, "/")}`}
                alt={`${newspaper.title} - Page ${currentPage}`}
                className="w-full h-auto rounded-lg shadow-xl"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  maxWidth: "none",
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-2 shadow-md">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                title="Previous Page"
                className="touch-control rounded-lg hover:bg-blue-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </motion.div>
            <span className="text-sm font-medium text-secondary-newspaper px-1 tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                title="Next Page"
                className="touch-control rounded-lg hover:bg-blue-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </Card>
  );
}
