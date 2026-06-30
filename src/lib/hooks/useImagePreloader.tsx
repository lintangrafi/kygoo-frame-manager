// Image Preloading System for better performance

type ImageCache = Map<string, HTMLImageElement>;

class ImagePreloader {
  private cache: ImageCache = new Map();
  private loading: Map<string, Promise<HTMLImageElement>> = new Map();
  private maxCacheSize = 100;

  async preload(url: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Return existing promise if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url)!;
    }

    // Start loading
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Cache the image
        if (this.cache.size >= this.maxCacheSize) {
          // Remove oldest entry
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(url, img);
        this.loading.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.loading.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.loading.set(url, loadPromise);
    return loadPromise;
  }

  async preloadMultiple(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map(url => this.preload(url).catch(() => null))).then(
      results => results.filter((img): img is HTMLImageElement => img !== null)
    );
  }

  // Preload images with priority (visible first)
  async preloadWithPriority(
    urls: string[],
    visibleCount: number = 3
  ): Promise<void> {
    // First, preload visible images
    const visibleUrls = urls.slice(0, visibleCount);
    await this.preloadMultiple(visibleUrls);

    // Then preload remaining in background
    const remainingUrls = urls.slice(visibleCount);
    remainingUrls.forEach(url => {
      this.preload(url).catch(() => {}); // Fire and forget
    });
  }

  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url);
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  remove(url: string): void {
    this.cache.delete(url);
  }
}

// Singleton instance
export const imagePreloader = new ImagePreloader();

// Hook for React
"use client";
import { useEffect, useRef, useCallback } from "react";

interface UseImagePreloadOptions {
  threshold?: number; // How many images to preload upfront
  rootMargin?: string; // Intersection observer root margin
}

export function useImagePreload(urls: string[], options: UseImagePreloadOptions = {}) {
  const { threshold = 3, rootMargin = "100px" } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const preloadedRef = useRef<Set<string>>(new Set());

  // Preload initial images
  useEffect(() => {
    const initialUrls = urls.slice(0, threshold);
    imagePreloader.preloadMultiple(initialUrls).then(() => {
      initialUrls.forEach(url => preloadedRef.current.add(url));
    });
  }, [urls, threshold]);

  // Set up intersection observer for lazy loading
  const observeElement = useCallback(
    (element: HTMLElement, url: string) => {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const imgUrl = (entry.target as HTMLElement).dataset.imageUrl;
                if (imgUrl && !preloadedRef.current.has(imgUrl)) {
                  imagePreloader.preload(imgUrl).then(() => {
                    preloadedRef.current.add(imgUrl);
                  });
                }
              }
            });
          },
          { rootMargin }
        );
      }

      element.dataset.imageUrl = url;
      observerRef.current.observe(element);

      return () => {
        observerRef.current?.unobserve(element);
      };
    },
    [rootMargin]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { observeElement, preload: imagePreloader.preload.bind(imagePreloader) };
}

// Progressive image loading (blur up effect)
export function useProgressiveImage(src: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      setLoaded(true);
    };

    img.onerror = () => {
      setError(true);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { loaded, error, img: imgRef.current };
}

// Import useState for the hook
import { useState } from "react";
