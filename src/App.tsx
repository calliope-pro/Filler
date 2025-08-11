import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SizeInput } from './components/SizeInput.tsx';
import { FormatSelector } from './components/FormatSelector.tsx';
import { ProgressBar } from './components/ProgressBar.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { InlineMessage, MessageType } from './components/InlineMessage.tsx';
import { parseSizeInput, getMaxFileSize } from './utils/sizeParser.ts';
import { generateFile, getDefaultFilename } from './utils/fileGenerator.ts';
import { downloadBlob, validateBrowserSupport } from './utils/downloadHandler.ts';
import './i18n/index.ts';

interface InlineMessageState {
  type: MessageType;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function App(): JSX.Element {
  const { t } = useTranslation();
  const [sizeValue, setSizeValue] = useState<string>('1');
  const [sizeUnit, setSizeUnit] = useState<string>('MB');
  const [format, setFormat] = useState<string>('txt');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [inlineMessage, setInlineMessage] = useState<InlineMessageState | null>(null);

  // Safe size value setter with validation
  const handleSizeValueChange = useCallback((value: string) => {
    if (/^\d*$/.test(value)) {
      setSizeValue(value);
      setInlineMessage(null);
    }
  }, []);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const maxFileSize = getMaxFileSize();

  // Helper functions for inline messages
  const showInlineError = useCallback((message: string) => {
    setInlineMessage({
      type: 'error',
      message
    });
  }, []);

  const showInlineWarning = useCallback((message: string, onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
    setInlineMessage({
      type: 'warning',
      message,
      onConfirm,
      onCancel: () => setInlineMessage(null),
      confirmText,
      cancelText
    });
  }, []);


  const continueGeneration = useCallback(async (bytes: number) => {
    setIsGenerating(true);
    setProgress(0);
    setEstimatedTime(null);
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
      const blob = await generateFile(format, bytes);
      
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
      const error = err as Error;
      
      showInlineError(`生成エラー: ${error.message}`);
      
      setIsGenerating(false);
      setProgress(0);
      setEstimatedTime(null);
    }
  }, [format, showInlineError, t]);

  // Safe parsing for render calculations - moved before validateInput
  const getSafeParsedSize = useCallback(() => {
    if (!sizeValue || sizeValue.trim() === '' || isNaN(parseFloat(sizeValue))) {
      return 0;
    }
    
    const numValue = parseFloat(sizeValue);
    if (numValue <= 0 || !isFinite(numValue)) {
      return 0;
    }
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1000,
      'MB': 1000 * 1000,
      'GB': 1000 * 1000 * 1000,
      'TB': 1000 * 1000 * 1000 * 1000,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024,
    };
    
    const multiplier = multipliers[sizeUnit];
    if (!multiplier) {
      return 0;
    }
    
    const estimatedBytes = Math.floor(numValue * multiplier);
    
    const maxFileSize = getMaxFileSize();
    if (!isFinite(estimatedBytes) || estimatedBytes < 0 || estimatedBytes > maxFileSize) {
      return 0;
    }
    
    return estimatedBytes;
  }, [sizeValue, sizeUnit]);

  
  // Validation for generation (more strict)
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
      const error = err as Error;
      if (error.message.includes('File size exceeds maximum limit')) {
        return t('errors.sizeTooLarge');
      }
      return t('errors.invalidSize');
    }
  }, [sizeValue, sizeUnit, maxFileSize, t]);

  const handleGenerate = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      showInlineError(validationError);
      return;
    }

    try {
      validateBrowserSupport();
      
      const bytes = parseSizeInput(sizeValue, sizeUnit);
      
      continueGeneration(bytes);

    } catch (err) {
      console.error('Validation failed:', err);
      const error = err as Error;
      const errorMessage = error.message || t('errors.generationFailed');
      
      showInlineError(errorMessage);
    }
  }, [sizeValue, sizeUnit, validateForm, showInlineError, showInlineWarning, continueGeneration, t]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setProgress(0);
    setEstimatedTime(null);
  }, []);


  const totalBytes = getSafeParsedSize();
  const currentBytes = Math.max(0, totalBytes * progress);
  
  // Check for validation errors to display
  const getValidationError = useCallback(() => {
    if (!sizeValue || sizeValue.trim() === '') {
      return '';
    }
    
    if (isNaN(parseFloat(sizeValue))) {
      return '無効なサイズです';
    }
    
    const numValue = parseFloat(sizeValue);
    if (numValue <= 0) {
      return 'サイズは0より大きい値を入力してください';
    }
    
    if (totalBytes === 0 && numValue > 0) {
      return 'ファイルサイズが大きすぎます';
    }
    
    return '';
  }, [sizeValue, totalBytes]);
  
  const validationError = getValidationError();
  

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a 
              href="https://github.com/calliope-pro/Filler" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              aria-label="GitHub Repository"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
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
            onValueChange={handleSizeValueChange}
            onUnitChange={setSizeUnit}
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
              {t(`formats.${format}.algorithm`)}
            </p>
          </div>

          {/* Validation Error */}
          {validationError && !inlineMessage && (
            <InlineMessage
              type="error"
              message={validationError}
            />
          )}
          
          {/* Inline Message */}
          {inlineMessage && (
            <InlineMessage
              type={inlineMessage.type}
              message={inlineMessage.message}
              onConfirm={inlineMessage.onConfirm}
              onCancel={inlineMessage.onCancel}
              confirmText={inlineMessage.confirmText}
              cancelText={inlineMessage.cancelText}
            />
          )}

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

            {!isGenerating && sizeValue && totalBytes > 0 && !inlineMessage && !validationError && (
              <p className="text-sm text-gray-600 text-center">
                {t('form.willGenerate', { 
                  size: totalBytes.toLocaleString(), 
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
          <div className="mt-4 space-y-2">
            <p>
              <a 
                href="https://github.com/calliope-pro/Filler" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                GitHub Repository
              </a>
            </p>
            <p>© 2025-present calliope-pro. Licensed under the Apache License, Version 2.0.</p>
          </div>
        </div>
      </div>
    </div>
  );
}