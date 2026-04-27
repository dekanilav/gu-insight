import { type Advertisement } from "@shared/schema";
import { motion } from "framer-motion";

interface AdvertisementSpaceProps {
  position: string;
  advertisements: Advertisement[];
  className?: string;
}

export default function AdvertisementSpace({
  position,
  advertisements,
  className,
}: AdvertisementSpaceProps) {
  const ad = advertisements.find((a) => a.position === position && a.isActive);

  const getPlaceholderSize = (position: string) => {
    switch (position) {
      case "top-banner":
        return { width: "300px", height: "250px" };
      case "sidebar":
        return { width: "300px", height: "600px" };
      case "between-pages":
        return { width: "728px", height: "90px" };
      default:
        return { width: "300px", height: "250px" };
    }
  };

  const placeholderSize = getPlaceholderSize(position);

  return (
    <div className={className}>
      <p className="text-[10px] text-gray-400 mb-2 text-center tracking-widest uppercase">
        Advertisement
      </p>

      {ad ? (
        <div className="text-center">
          <img
            src={`/${ad.filePath}`}
            alt="Advertisement"
            className="w-full h-auto rounded-lg max-w-full"
            style={{ maxHeight: placeholderSize.height }}
          />
        </div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-lg flex flex-col items-center justify-center
            bg-gradient-to-br from-slate-100/80 to-blue-50/60
            border border-dashed border-blue-200/60 text-gray-400"
          style={{
            minWidth: placeholderSize.width,
            minHeight: placeholderSize.height,
            maxWidth: "100%",
          }}
        >
          <div className="text-center px-4">
            <h4 className="font-semibold text-sm mb-1 text-gray-500">Advertisement Space</h4>
            <p className="text-xs text-gray-400">
              {position === "top-banner" && "300×250 pixels"}
              {position === "sidebar" && "300×600 pixels"}
              {position === "between-pages" && "728×90 pixels"}
            </p>
            <p className="text-xs mt-2 opacity-60">No ad currently displayed</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
