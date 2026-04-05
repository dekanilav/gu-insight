import { type Advertisement } from "@shared/schema";

interface AdvertisementSpaceProps {
  position: string;
  advertisements: Advertisement[];
  className?: string;
}

export default function AdvertisementSpace({ position, advertisements, className }: AdvertisementSpaceProps) {
  const ad = advertisements.find(a => a.position === position && a.isActive);

  const getPlaceholderSize = (position: string) => {
    switch (position) {
      case 'top-banner':
        return { width: '300px', height: '250px' };
      case 'sidebar':
        return { width: '300px', height: '600px' };
      case 'between-pages':
        return { width: '728px', height: '90px' };
      default:
        return { width: '300px', height: '250px' };
    }
  };

  const placeholderSize = getPlaceholderSize(position);

  return (
    <div className={className}>
      <div className="text-xs text-gray-400 mb-2 text-center">ADVERTISEMENT</div>
      
      {ad ? (
        <div className="text-center">
          <img
            src={`/${ad.filePath}`}
            alt="Advertisement"
            className="w-full h-auto rounded max-w-full"
            style={{ maxHeight: placeholderSize.height }}
          />
        </div>
      ) : (
        <div
          className="ad-space bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 p-6 rounded flex flex-col items-center justify-center"
          style={{ 
            minWidth: placeholderSize.width,
            minHeight: placeholderSize.height,
            maxWidth: '100%'
          }}
        >
          <div className="text-center">
            <h4 className="font-semibold text-sm mb-1">Advertisement Space</h4>
            <p className="text-xs">
              {position === 'top-banner' && '300x250 pixels'}
              {position === 'sidebar' && '300x600 pixels'}
              {position === 'between-pages' && '728x90 pixels'}
            </p>
            <p className="text-xs mt-2 opacity-75">
              No ad currently displayed
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
