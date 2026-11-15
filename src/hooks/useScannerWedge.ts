import { useEffect, useRef } from 'react';

interface ScannerWedgeOptions {
  onScan: (scannedText: string) => void;
  maxIntervalMs?: number;
  minChars?: number;
  enabled?: boolean;
}

/**
 * Keyboard wedge barcode scanner hook.
 * Detects rapid sequential keystrokes (< 50ms per key) ending with Enter.
 * Ignores keystrokes when an input, textarea, or contentEditable element is focused.
 */
export function useScannerWedge({
  onScan,
  maxIntervalMs = 50,
  minChars = 3,
  enabled = true,
}: ScannerWedgeOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          const barcode = bufferRef.current;
          bufferRef.current = '';
          onScan(barcode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If key is printable character (length 1)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (timeSinceLastKey > maxIntervalMs) {
          // Reset buffer if delay exceeds threshold
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, maxIntervalMs, minChars, enabled]);
}
