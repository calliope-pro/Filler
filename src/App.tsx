import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SizeInput } from './components/SizeInput.tsx';
import { FormatSelector } from './components/FormatSelector.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { InlineMessage, MessageType } from './components/InlineMessage.tsx';
import SizeWarningModal from './components/SizeWarningModal.tsx';
import { parseSizeInput, getMaxFileSize, getMinFileSize } from './utils/sizeParser.ts';
import { StreamingDownloadManager, validateBrowserSupport } from './utils/streamingDownloadHandler.ts';
import { FileFormat, DEFAULT_FILE_FORMAT, SUPPORTED_FORMATS } from './types/fileFormats';
import { SizeUnit, DEFAULT_SIZE_UNIT, SIZE_MULTIPLIERS } from './types/sizeUnits';
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
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>(DEFAULT_SIZE_UNIT);
  const [format, setFormat] = useState<FileFormat>(DEFAULT_FILE_FORMAT);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [inlineMessage, setInlineMessage] = useState<InlineMessageState | null>(null);
  const [showSizeWarning, setShowSizeWarning] = useState<boolean>(false);

  // Safe size value setter with validation
  const handleSizeValueChange = useCallback((value: string) => {
    if (/^\d*$/.test(value)) {
      setSizeValue(value);
      setInlineMessage(null);
    }
  }, []);
  
  const maxFileSize = getMaxFileSize();

  // Helper functions for inline messages
  const showInlineError = useCallback((message: string) => {
    setInlineMessage({
      type: 'error',
      message
    });
  }, []);



  const continueGeneration = async (bytes: number) => {
    setIsGenerating(true);
    
    try {
      const streamingManager = new StreamingDownloadManager();
      await streamingManager.startDownload({
        format,
        size: bytes,
        onError: (error: string) => {
          showInlineError(`生成エラー: ${error}`);
          setIsGenerating(false);
        }
      });
      
      // Reset after successful download
      setIsGenerating(false);
      
    } catch (err) {
      const error = err as Error;
      showInlineError(`生成エラー: ${error.message}`);
      setIsGenerating(false);
    }
  };

  // Safe parsing for render calculations - moved before validateInput
  const getSafeParsedSize = useCallback(() => {
    if (!sizeValue || sizeValue.trim() === '' || isNaN(parseFloat(sizeValue))) {
      return 0;
    }
    
    const numValue = parseFloat(sizeValue);
    if (numValue <= 0 || !isFinite(numValue)) {
      return 0;
    }
    
    const multiplier = SIZE_MULTIPLIERS[sizeUnit];
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

  
  // Check if file size is below minimum recommended for format
  const isUnderMinimumSize = useCallback(() => {
    try {
      const bytes = parseSizeInput(sizeValue, sizeUnit);
      const minSize = getMinFileSize(format);
      return bytes > 0 && bytes < minSize;
    } catch {
      return false;
    }
  }, [sizeValue, sizeUnit, format]);

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

  const handleGenerate = async () => {
    const validationError = validateForm();
    if (validationError) {
      showInlineError(validationError);
      return;
    }

    // Check if file size is 1GB or larger
    try {
      const bytes = parseSizeInput(sizeValue, sizeUnit);
      const oneGB = 1 * SIZE_MULTIPLIERS.GB;
      
      if (bytes >= oneGB) {
        setShowSizeWarning(true);
        return;
      }
    } catch (err) {
      showInlineError(t('errors.invalidSize'));
      return;
    }

    proceedWithGeneration();
  };

  const handleSizeWarningConfirm = () => {
    setShowSizeWarning(false);
    proceedWithGeneration();
  };

  const handleSizeWarningCancel = () => {
    setShowSizeWarning(false);
  };

  const proceedWithGeneration = async () => {
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
  };



  const totalBytes = getSafeParsedSize();
  
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
  
  // Check if current input is below minimum recommended size
  const getMinimumSizeWarning = useCallback(() => {
    if (!sizeValue || sizeValue.trim() === '' || validationError || isGenerating) {
      return null;
    }
    
    if (isUnderMinimumSize()) {
      const minSize = getMinFileSize(format);
      return {
        type: 'warning' as MessageType,
        message: t('warnings.fileSizeBelowMinimum', { 
          format: format.toUpperCase(), 
          minSize 
        })
      };
    }
    
    return null;
  }, [sizeValue, format, validationError, isGenerating, isUnderMinimumSize, t]);
  
  const minimumSizeWarning = getMinimumSizeWarning();
  

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a 
              href="https://github.com/calliope-pro/Simulacra" 
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
          
          {/* Minimum Size Warning */}
          {!validationError && minimumSizeWarning && !inlineMessage && (
            <InlineMessage
              type={minimumSizeWarning.type}
              message={minimumSizeWarning.message}
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
              {isGenerating ? t('form.downloading') : t('form.generateButton')}
            </button>

            {!isGenerating && sizeValue && totalBytes > 0 && !inlineMessage && !validationError && (
              <div className="text-sm text-gray-600 text-center space-y-1">
                <p>
                  {t('form.willGenerate', { 
                    size: totalBytes.toLocaleString(), 
                    format: format.toUpperCase() 
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  📁 fillr-{format.toUpperCase()}-{totalBytes}bytes.{format}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Size Warning Modal */}
        <SizeWarningModal
          isOpen={showSizeWarning}
          onClose={handleSizeWarningCancel}
          onConfirm={handleSizeWarningConfirm}
          fileSize={`${sizeValue} ${sizeUnit}`}
        />

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
              {t('features.formats.description', { 
                formats: SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ')
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>{t('footer.purpose')}</p>
          <div className="mt-4 space-y-2">
            <p>
              <a 
                href="https://github.com/calliope-pro/Simulacra" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                GitHub Repository
              </a>
              •
              <a 
                href="/terms-of-service.html" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('footer.terms', '利用規約')}
              </a>
              •
              <a 
                href="/privacy-policy.html" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {t('footer.privacy', 'プライバシーポリシー')}
              </a>
            </p>
            <p>© 2025-present calliope-pro. Licensed under the Apache License, Version 2.0.</p>
          </div>
        </div>
      </div>
    </div>
  );
}