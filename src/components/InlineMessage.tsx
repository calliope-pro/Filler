import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export type MessageType = 'success' | 'warning' | 'error' | 'info';

interface InlineMessageProps {
  type: MessageType;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  className?: string;
}

export function InlineMessage({
  type,
  message,
  onConfirm,
  onCancel,
  confirmText = '続行',
  cancelText = 'キャンセル',
  className = ''
}: InlineMessageProps): JSX.Element {
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getButtonStyle = (isPrimary: boolean) => {
    const base = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200';
    
    if (!isPrimary) {
      return `${base} text-gray-600 bg-gray-100 hover:bg-gray-200`;
    }

    switch (type) {
      case 'warning':
        return `${base} text-white bg-orange-600 hover:bg-orange-700`;
      case 'error':
        return `${base} text-white bg-red-600 hover:bg-red-700`;
      default:
        return `${base} text-white bg-blue-600 hover:bg-blue-700`;
    }
  };

  return (
    <div className={`border rounded-md p-4 ${getColorClasses()} ${className}`} role="alert">
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {message}
          </p>
          
          {/* Action buttons for warnings that need confirmation */}
          {onConfirm && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={onConfirm}
                className={getButtonStyle(true)}
                type="button"
              >
                {confirmText}
              </button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className={getButtonStyle(false)}
                  type="button"
                >
                  {cancelText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}