import { OpenCV } from 'react-native-fast-opencv';
import type { Mat } from 'react-native-fast-opencv';

/**
 * Computes a simple 8x8 average hash of a Mat.
 */
export const computeHash = (mat: Mat): string => {
  'worklet';
  // Sample 8x8 points
  let hash = '';
  let sum = 0;
  const pixels: number[] = [];

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const px = OpenCV.invoke('at', mat, Math.floor(y * 37.5), Math.floor(x * 37.5)) as { r: number; g: number; b: number; a: number };
      const brightness = (px.r + px.g + px.b) / 3;
      pixels.push(brightness);
      sum += brightness;
    }
  }

  const avg = sum / 64;
  for (const p of pixels) {
    hash += p > avg ? '1' : '0';
  }

  return hash;
};

/**
 * Calculates Hamming distance between two hashes.
 */
export const hammingDistance = (h1: string, h2: string): number => {
  'worklet';
  let dist = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) dist++;
  }
  return dist;
};

/**
 * Checks if a new hash is unique enough compared to previous hashes.
 */
export const isUnique = (newHash: string, previousHashes: string[], threshold = 10): boolean => {
  'worklet';
  for (const h of previousHashes) {
    if (hammingDistance(newHash, h) < threshold) return false;
  }
  return true;
};
