import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Menu, X } from "lucide-react";
import { useNewspaper } from "@/hooks/use-newspaper";
import { useAdvertisements } from "@/hooks/use-advertisements";
import NewspaperViewer from "@/components/newspaper-viewer";
import AdvertisementSpace from "@/components/advertisement-space";
import EditionSelector from "@/components/edition-selector";
import MobileNavigation from "@/components/mobile-navigation";
import { Link } from "wouter";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const sidebarItem = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedNewspaperId, setSelectedNewspaperId] = useState<number | null>(null);

  const { data: newspapers = [], isLoading: newspapersLoading } = useNewspaper();
  const { data: advertisements = [] } = useAdvertisements();

  const currentNewspaper = selectedNewspaperId
    ? newspapers.find((n) => n.id === selectedNewspaperId)
    : newspapers[0];

  const recentEditions = newspapers.slice(0, 5);

  // Reading progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  const handleDownloadPDF = () => {
    if (currentNewspaper) {
      const link = document.createElement("a");
      link.href = `/${currentNewspaper.filePath}`;
      link.download = currentNewspaper.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 min-h-screen font-sans">
      {/* ── Reading Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 origin-left"
        style={{ scaleX }}
      />

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/75 backdrop-blur-md border-b border-white/30 shadow-sm sticky top-[3px] z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <motion.h1
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-2xl font-serif font-bold tracking-tight text-primary-newspaper cursor-default select-none"
                style={{ textShadow: "0 0 0px transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.textShadow =
                    "0 0 18px rgba(59,130,246,0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.textShadow =
                    "0 0 0px transparent";
                }}
              >
                GU Insight
              </motion.h1>
              <span className="ml-3 text-sm text-secondary-newspaper hidden sm:block">
                Online Edition Newspaper of Gauhati University
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              {["Today's Edition", "Archives", "About"].map((label, i) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {i === 0 ? (
                    <Link
                      href="/"
                      className="text-secondary-newspaper hover:text-primary-newspaper transition-colors duration-200 font-medium text-sm"
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      href={`#${label.toLowerCase()}`}
                      className="text-secondary-newspaper hover:text-primary-newspaper transition-colors duration-200 font-medium text-sm"
                    >
                      {label}
                    </a>
                  )}
                </motion.div>
              ))}
            </nav>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <MobileNavigation isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ── Main Content ── */}
          <motion.div className="lg:col-span-3" variants={fadeUp}>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-serif font-bold tracking-tight text-primary-newspaper mb-2">
                    Today's Edition
                  </h2>
                  {currentNewspaper && (
                    <p className="text-secondary-newspaper">
                      {new Date(currentNewspaper.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {currentNewspaper.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <EditionSelector
                    newspapers={newspapers}
                    selectedId={selectedNewspaperId}
                    onSelect={setSelectedNewspaperId}
                  />
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={handleDownloadPDF}
                      disabled={!currentNewspaper}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-blue-200 transition-all duration-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Newspaper Viewer */}
            {currentNewspaper ? (
              <NewspaperViewer newspaper={currentNewspaper} />
            ) : (
              <Card className="newspaper-viewer rounded-xl border border-white/30 bg-white/60 backdrop-blur-sm shadow-sm">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <p className="text-secondary-newspaper mb-2">No newspapers available</p>
                    <p className="text-sm text-muted-foreground">
                      Check back later or contact the administrator
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Advertisement */}
            <motion.div variants={sidebarItem}>
              <AdvertisementSpace
                position="top-banner"
                advertisements={advertisements}
                className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm"
              />
            </motion.div>

            {/* Recent Editions */}
            <motion.div variants={sidebarItem}>
              <Card className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold text-lg tracking-tight mb-4">
                    Recent Editions
                  </h3>
                  <div className="space-y-2">
                    {recentEditions.map((edition) => (
                      <motion.button
                        key={edition.id}
                        onClick={() => setSelectedNewspaperId(edition.id)}
                        whileHover={{ y: -2, backgroundColor: "rgba(239,246,255,1)" }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`block w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                          selectedNewspaperId === edition.id ||
                          (!selectedNewspaperId && edition === recentEditions[0])
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "hover:bg-blue-50/80 text-gray-700"
                        }`}
                      >
                        <div className="font-medium text-sm">
                          {new Date(edition.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs opacity-75">{edition.title}</div>
                      </motion.button>
                    ))}
                  </div>
                  {newspapers.length > 5 && (
                    <a
                      href="#archives"
                      className="block text-center text-accent-newspaper text-sm mt-4 hover:text-blue-700 transition-colors"
                    >
                      View All Archives
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar Advertisement */}
            <motion.div variants={sidebarItem}>
              <AdvertisementSpace
                position="sidebar"
                advertisements={advertisements}
                className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4 shadow-sm"
              />
            </motion.div>

            {/* Newsletter Signup */}
            <motion.div variants={sidebarItem}>
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg border-0">
                <CardContent className="p-5">
                  <h3 className="font-serif font-semibold text-lg tracking-tight mb-1">
                    Stay Updated
                  </h3>
                  <p className="text-sm text-blue-100 mb-4">
                    Get notified when new editions are published.
                  </p>
                  <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full rounded-md px-3 py-2 bg-white text-gray-900 text-sm placeholder:text-gray-400
                        outline-none ring-0 border border-transparent
                        focus:ring-2 focus:ring-white/70 focus:border-white/80
                        transition-all duration-200 shadow-sm"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03, boxShadow: "0 6px 24px rgba(255,255,255,0.25)" }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-full rounded-md py-2 text-sm font-semibold
                        bg-white text-blue-700
                        hover:bg-blue-50
                        shadow-md transition-colors duration-200"
                    >
                      Subscribe
                    </motion.button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-serif font-semibold tracking-tight mb-4">GU Insight</h3>
              <p className="text-gray-300 text-sm">
                The online edition newspaper of Gauhati University. Read the latest editions online
                with our fast, mobile-friendly newspaper reader.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Today's Edition
                  </Link>
                </li>
                <li>
                  <a href="#archives" className="hover:text-white transition-colors">
                    Archives
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#advertise" className="hover:text-white transition-colors">
                    Advertise
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 GU Insight. All rights reserved. | Gauhati University</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
