import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@headlessui/react';

interface ProgressBarProps {
  isGenerating: boolean;
  progress: number;
  currentBytes: number;
  totalBytes: number;
  estimatedTimeRemaining: number | null;
  onCancel?: () => void;
}

export function ProgressBar({ 
  isGenerating, 
  progress, 
  currentBytes, 
  totalBytes, 
  estimatedTimeRemaining,
  onCancel 
}: ProgressBarProps): JSX.Element | null {
  const { t } = useTranslation();
  const [stableProgress, setStableProgress] = useState(0);

  // Debounce progress updates for stability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStableProgress(progress);
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [progress]);

  // Memoize calculated values to prevent unnecessary re-renders
  const { progressPercent, formattedBytes } = useMemo(() => {
    const percent = Math.max(0, Math.min(100, Math.round(stableProgress * 100)));
    const current = Math.max(0, currentBytes);
    const total = Math.max(current, totalBytes);
    
    return {
      progressPercent: percent,
      formattedBytes: {
        current: current.toLocaleString(),
        total: total.toLocaleString()
      }
    };
  }, [stableProgress, currentBytes, totalBytes]);

  if (!isGenerating) return null;
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t('progress.generating')}
        </h3>
        {onCancel && (
          <Button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded-md"
          >
            {t('progress.cancel')}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('progress.completed', { percent: progressPercent })}</span>
          <span>
            {formattedBytes.current} / {formattedBytes.total} バイト
          </span>
        </div>
        
        {/* Enhanced Progress Bar with Headless UI patterns */}
        <div 
          className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('progress.completed', { percent: progressPercent })}
        >
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ 
              width: `${progressPercent}%`,
              transform: `translateX(${progressPercent < 100 ? '0' : '0'})`,
              willChange: progressPercent < 100 ? 'width' : 'auto'
            }}
          >
            {progressPercent > 10 && (
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
          </div>
        </div>
        
        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
          <div className="text-sm text-gray-600 text-center">
            {t('progress.estimatedTime', { 
              time: estimatedTimeRemaining < 1 ? 
                t('time.lessThanSecond') : 
                t('time.seconds', { count: Math.ceil(estimatedTimeRemaining) })
            })}
          </div>
        )}
      </div>
    </div>
  );
}