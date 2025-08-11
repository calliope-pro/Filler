import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SizeInput } from './components/SizeInput.jsx';
import { FormatSelector } from './components/FormatSelector.jsx';
import { ProgressBar } from './components/ProgressBar.jsx';
import { LanguageSelector } from './components/LanguageSelector.jsx';
import { parseSizeInput, getMaxFileSize } from './utils/sizeParser.js';
import { generateFile, getDefaultFilename } from './utils/fileGenerator.js';
import { downloadBlob, validateBrowserSupport } from './utils/downloadHandler.js';
import './i18n/index.js';

export default function App() {
  const { t } = useTranslation();
  const [sizeValue, setSizeValue] = useState('1');
  const [sizeUnit, setSizeUnit] = useState('MB');
  const [format, setFormat] = useState('txt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);
  
  const abortControllerRef = useRef(null);
  const maxFileSize = getMaxFileSize();

  const validateForm = useCallback(() => {
    try {
      const bytes = parseSizeInput(sizeValue, sizeUnit);
      if (bytes === 0) {
        return t('errors.sizeZero');
      }
      if (bytes > maxFileSize) {
        return t('errors.sizeTooLarge');
      }
      return '';
    } catch (err) {
      if (err.message.includes('Invalid size value')) {
        return t('errors.invalidSize');
      }
      if (err.message.includes('Unsupported unit')) {
        return t('errors.unsupportedFormat', { format: sizeUnit });
      }
      if (err.message.includes('File size exceeds maximum limit')) {
        return t('errors.sizeTooLarge');
      }
      return t('errors.generationFailed');
    }
  }, [sizeValue, sizeUnit, maxFileSize, t]);

  const handleGenerate = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      validateBrowserSupport();
      setError('');
      setIsGenerating(true);
      setProgress(0);
      setEstimatedTime(null);

      const bytes = parseSizeInput(sizeValue, sizeUnit);
      const startTime = Date.now();
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 0.1, 0.9);
          
          // Estimate remaining time
          const elapsed = (Date.now() - startTime) / 1000;
          const estimatedTotal = elapsed / newProgress;
          const remaining = estimatedTotal - elapsed;
          setEstimatedTime(remaining);
          
          return newProgress;
        });
      }, 100);

      try {
        const blob = await generateFile(format, bytes, { fillMode: 'zero' });
        
        clearInterval(progressInterval);
        setProgress(1);
        setEstimatedTime(0);

        // Verify file size
        if (blob.size !== bytes) {
          console.warn(`Generated file size (${blob.size}) doesn't match target (${bytes})`);
        }

        const finalFilename = getDefaultFilename(format, bytes);
        downloadBlob(blob, finalFilename);
        
        // Reset after successful generation
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(0);
          setEstimatedTime(null);
        }, 1000);
        
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }

    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || t('errors.generationFailed'));
      setIsGenerating(false);
      setProgress(0);
      setEstimatedTime(null);
    }
  }, [sizeValue, sizeUnit, format, validateForm]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setProgress(0);
    setEstimatedTime(null);
  }, []);

  const currentBytes = parseSizeInput(sizeValue, sizeUnit) * progress;
  const totalBytes = parseSizeInput(sizeValue, sizeUnit);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <LanguageSelector />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📁 {t('app.title')}
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            {t('app.tagline')}
          </p>
          <p className="text-sm text-gray-500">
            {t('app.description')}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t('form.maxSize', { bytes: maxFileSize.toLocaleString() })}
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <SizeInput
            value={sizeValue}
            unit={sizeUnit}
            onValueChange={setSizeValue}
            onUnitChange={setSizeUnit}
            error={error}
          />

          <FormatSelector
            value={format}
            onChange={setFormat}
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t('algorithm.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('algorithm.description')}
            </p>
          </div>

          {/* Generation Button */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !!validateForm()}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                isGenerating || validateForm()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isGenerating ? t('form.generating') : t('form.generateButton')}
            </button>

            {!error && !isGenerating && sizeValue && (
              <p className="text-sm text-gray-600 text-center">
                {t('form.willGenerate', { 
                  size: parseSizeInput(sizeValue, sizeUnit).toLocaleString(), 
                  format: format.toUpperCase() 
                })}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <ProgressBar
            isGenerating={isGenerating}
            progress={progress}
            currentBytes={currentBytes}
            totalBytes={totalBytes}
            estimatedTimeRemaining={estimatedTime}
            onCancel={handleCancel}
          />
        </div>

        {/* Features */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">✅ {t('features.exactSize.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('features.exactSize.description')}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">🔒 {t('features.private.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('features.private.description')}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">⚡ {t('features.fast.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('features.fast.description')}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">📱 {t('features.formats.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('features.formats.description')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>{t('footer.purpose')}</p>
        </div>
      </div>
    </div>
  );
}