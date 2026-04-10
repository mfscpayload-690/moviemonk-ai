import { useEffect, useState } from 'react';

type ScrimTone = 'soft' | 'balanced' | 'strong';

const brightnessCache = new Map<string, ScrimTone>();

function classifyBrightness(brightness: number): ScrimTone {
  if (brightness >= 0.7) return 'strong';
  if (brightness >= 0.48) return 'balanced';
  return 'soft';
}

async function sampleImageBrightness(url: string): Promise<ScrimTone> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = 24;
        const height = 24;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve('balanced');
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);

        let totalLuminance = 0;
        const pixelCount = data.length / 4;
        for (let index = 0; index < data.length; index += 4) {
          const r = data[index] / 255;
          const g = data[index + 1] / 255;
          const b = data[index + 2] / 255;
          totalLuminance += (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
        }

        resolve(classifyBrightness(totalLuminance / pixelCount));
      } catch {
        resolve('balanced');
      }
    };

    image.onerror = () => resolve('balanced');
    image.src = url;
  });
}

export function useAdaptiveImageTone(imageUrl?: string | null) {
  const [tone, setTone] = useState<ScrimTone>('balanced');

  useEffect(() => {
    if (!imageUrl) {
      setTone('balanced');
      return;
    }

    const cachedTone = brightnessCache.get(imageUrl);
    if (cachedTone) {
      setTone(cachedTone);
      return;
    }

    let isCancelled = false;

    const loadTone = async () => {
      const nextTone = await sampleImageBrightness(imageUrl);
      brightnessCache.set(imageUrl, nextTone);
      if (!isCancelled) {
        setTone(nextTone);
      }
    };

    void loadTone();

    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);

  return tone;
}

