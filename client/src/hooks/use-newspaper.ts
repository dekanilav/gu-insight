import { useQuery } from "@tanstack/react-query";
import { type Newspaper } from "@shared/schema";

export function useNewspaper() {
  return useQuery<Newspaper[]>({
    queryKey: ['/api/newspapers'],
  });
}

export function useLatestNewspaper() {
  return useQuery<Newspaper>({
    queryKey: ['/api/newspapers/latest'],
  });
}

export function useNewspaperById(id: number) {
  return useQuery<Newspaper>({
    queryKey: ['/api/newspapers', id],
    enabled: !!id,
  });
}
