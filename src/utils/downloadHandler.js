export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'file';
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function createProgressiveBlob(chunks, mimeType = 'application/octet-stream') {
  return new Blob(chunks, { type: mimeType });
}

export function validateBrowserSupport() {
  const features = {
    blob: typeof Blob !== 'undefined',
    cryptoGetRandomValues: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function',
    urlCreateObjectURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function',
    arrayBuffer: typeof ArrayBuffer !== 'undefined',
    uint8Array: typeof Uint8Array !== 'undefined'
  };

  const unsupportedFeatures = Object.entries(features)
    .filter(([key, supported]) => !supported)
    .map(([key]) => key);

  if (unsupportedFeatures.length > 0) {
    throw new Error(`Unsupported browser features: ${unsupportedFeatures.join(', ')}`);
  }

  return true;
}