import { Link } from "wouter";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white border-b border-gray-200">
      <div className="px-4 py-2 space-y-1">
        <Link href="/" className="block px-3 py-2 text-secondary-newspaper hover:text-primary-newspaper" onClick={onClose}>
          Today's Edition
        </Link>
        <a href="#archives" className="block px-3 py-2 text-secondary-newspaper hover:text-primary-newspaper" onClick={onClose}>
          Archives
        </a>
        <a href="#about" className="block px-3 py-2 text-secondary-newspaper hover:text-primary-newspaper" onClick={onClose}>
          About
        </a>
      </div>
    </div>
  );
}
