import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedNewspaperId, setSelectedNewspaperId] = useState<number | null>(null);
  
  const { data: newspapers = [], isLoading: newspapersLoading } = useNewspaper();
  const { data: advertisements = [] } = useAdvertisements();
  
  const currentNewspaper = selectedNewspaperId 
    ? newspapers.find(n => n.id === selectedNewspaperId)
    : newspapers[0]; // Latest edition

  const recentEditions = newspapers.slice(0, 5);

  const handleDownloadPDF = () => {
    if (currentNewspaper) {
      const link = document.createElement('a');
      link.href = `/${currentNewspaper.filePath}`;
      link.download = currentNewspaper.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-serif font-bold text-primary-newspaper">GU Insight</h1>
              <span className="ml-3 text-sm text-secondary-newspaper">Online Edition Newspaper of Gauhati University</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-secondary-newspaper hover:text-primary-newspaper transition-colors">
                Today's Edition
              </Link>
              <a href="#archives" className="text-secondary-newspaper hover:text-primary-newspaper transition-colors">
                Archives
              </a>
              <a href="#about" className="text-secondary-newspaper hover:text-primary-newspaper transition-colors">
                About
              </a>
            </nav>
            
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
      </header>

      {/* Mobile Menu */}
      <MobileNavigation 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-primary-newspaper mb-2">
                    Today's Edition
                  </h2>
                  {currentNewspaper && (
                    <p className="text-secondary-newspaper">
                      {new Date(currentNewspaper.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {currentNewspaper.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <EditionSelector
                    newspapers={newspapers}
                    selectedId={selectedNewspaperId}
                    onSelect={setSelectedNewspaperId}
                  />
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={!currentNewspaper}
                    className="bg-accent-newspaper text-white hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Newspaper Viewer */}
            {currentNewspaper ? (
              <NewspaperViewer newspaper={currentNewspaper} />
            ) : (
              <Card className="newspaper-viewer rounded-lg border border-gray-200">
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Advertisement */}
            <AdvertisementSpace 
              position="top-banner"
              advertisements={advertisements}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            />

            {/* Recent Editions */}
            <Card className="bg-white border border-gray-200 rounded-lg">
              <CardContent className="p-4">
                <h3 className="font-serif font-semibold text-lg mb-4">Recent Editions</h3>
                <div className="space-y-3">
                  {recentEditions.map((edition) => (
                    <button
                      key={edition.id}
                      onClick={() => setSelectedNewspaperId(edition.id)}
                      className={`block w-full text-left p-3 rounded-md transition-colors ${
                        selectedNewspaperId === edition.id || (!selectedNewspaperId && edition === recentEditions[0])
                          ? 'bg-accent-newspaper text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {new Date(edition.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs opacity-75">
                        {edition.title}
                      </div>
                    </button>
                  ))}
                </div>
                {newspapers.length > 5 && (
                  <a href="#archives" className="block text-center text-accent-newspaper text-sm mt-4 hover:text-blue-700">
                    View All Archives
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Advertisement */}
            <AdvertisementSpace 
              position="sidebar"
              advertisements={advertisements}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            />

            {/* Newsletter Signup */}
            <Card className="bg-accent-newspaper text-white rounded-lg">
              <CardContent className="p-4">
                <h3 className="font-serif font-semibold mb-2">Stay Updated</h3>
                <p className="text-sm text-blue-100 mb-4">Get notified when new editions are published.</p>
                <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full bg-white text-gray-900"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-accent-newspaper hover:bg-gray-50"
                  >
                    Subscribe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-serif font-semibold mb-4">GU Insight</h3>
              <p className="text-gray-300 text-sm">
                The online edition newspaper of Gauhati University. Read the latest editions online with our fast, mobile-friendly newspaper reader.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/" className="hover:text-white transition-colors">Today's Edition</Link></li>
                <li><a href="#archives" className="hover:text-white transition-colors">Archives</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#advertise" className="hover:text-white transition-colors">Advertise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 GU Insight. All rights reserved. | Gauhati University</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
