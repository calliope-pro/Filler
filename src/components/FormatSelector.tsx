import { useTranslation } from 'react-i18next';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { SUPPORTED_FORMATS, FileFormat } from '../types/fileFormats';

interface FormatSelectorProps {
  value: FileFormat;
  onChange: (format: FileFormat) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps): JSX.Element {
  const { t } = useTranslation();

  const selectedFormat = SUPPORTED_FORMATS.find(f => f === value) || SUPPORTED_FORMATS[0];

  return (
    <div className="space-y-2">
      <Listbox value={selectedFormat} onChange={onChange}>
        <Listbox.Label className="block text-sm font-medium text-gray-700">
          {t('form.fileFormat')}
        </Listbox.Label>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
            <span className="block truncate">
              {t(`formats.${selectedFormat}.label`)}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {SUPPORTED_FORMATS.map((format) => (
                <Listbox.Option
                  key={format}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    }`
                  }
                  value={format}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {t(`formats.${format}.label`)}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      <p className="text-sm text-gray-600">
        {t(`formats.${value}.description`)}
      </p>
    </div>
  );
}
