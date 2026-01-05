import { useState, useEffect, useRef } from 'react';
import type { ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * LazyImage Component
 * Lazy loads images when they enter viewport for better performance
 * Implements Intersection Observer API for optimal loading
 * 
 * @example
 * <LazyImage 
 *   src="/hero-image.jpg" 
 *   alt="BookAgreed scheduling platform dashboard"
 *   className="w-full rounded-lg"
 * />
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  className = '',
  threshold = 0.01,
  rootMargin = '50px',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately if browser doesn't support IntersectionObserver
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, threshold, rootMargin]);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    console.error(`Failed to load image: ${src}`);
    // Optionally set a fallback error image
    setImageLoaded(true); // Still mark as loaded to remove blur
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        imageLoaded && isInView ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

/**
 * LazyBackgroundImage Component
 * Lazy loads background images
 * 
 * @example
 * <LazyBackgroundImage 
 *   src="/hero-bg.jpg" 
 *   className="h-96 w-full"
 * >
 *   <div>Content here</div>
 * </LazyBackgroundImage>
 */
interface LazyBackgroundImageProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function LazyBackgroundImage({
  src,
  className = '',
  children,
  style = {},
}: LazyBackgroundImageProps) {
  const [bgLoaded, setBgLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload the image
            const img = new Image();
            img.src = src;
            img.onload = () => setBgLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
      }
    );

    observer.observe(divRef.current);

    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={divRef}
      className={`transition-all duration-300 ${className}`}
      style={{
        ...style,
        backgroundImage: bgLoaded ? `url(${src})` : 'none',
        backgroundColor: bgLoaded ? 'transparent' : '#f0f0f0',
      }}
    >
      {children}
    </div>
  );
}
