// utils/customImageLoader.ts
export const customImageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // You can modify the src URL here if needed
  return `${src}?w=${width}&q=${quality || 75}`
}

