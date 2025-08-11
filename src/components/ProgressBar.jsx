import React from 'react';
import { useTranslation } from 'react-i18next';

export function ProgressBar({ 
  isGenerating, 
  progress, 
  currentBytes, 
  totalBytes, 
  estimatedTimeRemaining,
  onCancel 
}) {
  const { t } = useTranslation();

  if (!isGenerating) return null;

  const progressPercent = Math.round(progress * 100);
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {t('progress.generating')}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {t('progress.cancel')}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('progress.completed', { percent: progressPercent })}</span>
          <span>
            {currentBytes.toLocaleString()} / {totalBytes.toLocaleString()} バイト
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('progress.completed', { percent: progressPercent })}
          />
        </div>
        
        {estimatedTimeRemaining !== null && (
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