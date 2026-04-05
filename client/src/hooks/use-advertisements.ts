import { useQuery } from "@tanstack/react-query";
import { type Advertisement } from "@shared/schema";

export function useAdvertisements(position?: string) {
  return useQuery<Advertisement[]>({
    queryKey: position ? ['/api/advertisements', { position }] : ['/api/advertisements'],
  });
}

export function useAdvertisementsByPosition(position: string) {
  return useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements', { position }],
  });
}
