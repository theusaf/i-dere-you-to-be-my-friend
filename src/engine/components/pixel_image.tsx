export interface PixelImageProps {
  src: string;
  className?: string;
}

export function PixelImage({ src, className }: PixelImageProps): JSX.Element {
  return (
    <img
      src={src}
      className={className}
      style={{
        imageRendering: "pixelated",
      }}
    />
  );
}
