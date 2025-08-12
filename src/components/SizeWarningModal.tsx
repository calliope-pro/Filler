import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SizeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileSize: string;
}

const SizeWarningModal: React.FC<SizeWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fileSize,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel className="max-w-lg space-y-4 border bg-white p-6 rounded-lg shadow-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {t('sizeWarning.title')}
            </DialogTitle>
          </div>
          <div className="space-y-3">
            <p className="text-gray-700">
              {t('sizeWarning.message', { size: fileSize })}
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>{t('sizeWarning.risks.memory')}</li>
              <li>{t('sizeWarning.risks.performance')}</li>
              <li>{t('sizeWarning.risks.crash')}</li>
            </ul>
            <p className="text-sm text-gray-600">
              {t('sizeWarning.confirmation')}
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              {t('sizeWarning.proceed')}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
            >
              {t('sizeWarning.cancel')}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default SizeWarningModal;