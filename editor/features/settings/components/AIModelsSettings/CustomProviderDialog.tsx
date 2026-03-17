// CustomProviderDialog - 自定义 Provider 对话框组件
import { motion, AnimatePresence } from "motion/react";

export interface CustomProviderDialogProps {
  isOpen: boolean;
  displayName: string;
  modelNames: string;
  baseUrl: string;
  apiKey: string;
  isSaving: boolean;
  onChangeDisplayName: (value: string) => void;
  onChangeModelNames: (value: string) => void;
  onChangeBaseUrl: (value: string) => void;
  onChangeApiKey: (value: string) => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

export function CustomProviderDialog({
  isOpen,
  displayName,
  modelNames,
  baseUrl,
  apiKey,
  isSaving,
  onChangeDisplayName,
  onChangeModelNames,
  onChangeBaseUrl,
  onChangeApiKey,
  onCancel,
  onSave,
}: CustomProviderDialogProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mt-2 mb-4 flex flex-col gap-4 rounded-lg border border-white/5 bg-white/[0.01] px-3 py-4">
            <div>
              <h4 className="text-[13px] font-medium text-zinc-300">Custom Provider</h4>
              <p className="mt-0.5 text-[11px] text-zinc-500">OpenAI-compatible API endpoint</p>
            </div>

            <div className="space-y-4">
              <ProviderFormField
                label="Provider Name"
                value={displayName}
                onChange={onChangeDisplayName}
                placeholder="e.g. DeepSeek"
              />

              <ProviderFormField
                label="Model Name"
                value={modelNames}
                onChange={onChangeModelNames}
                placeholder="e.g. deepseek-chat"
              />

              <ProviderFormField
                label="Base URL"
                value={baseUrl}
                onChange={onChangeBaseUrl}
                placeholder="https://api.openai.com/v1"
              />

              <ProviderFormField
                label="API Key"
                type="password"
                value={apiKey}
                onChange={onChangeApiKey}
                placeholder="sk-..."
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCancel}
                className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => void onSave()}
                disabled={isSaving}
                className="text-[12px] font-medium text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ProviderFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  autoFocus?: boolean;
}

function ProviderFormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus = false,
}: ProviderFormFieldProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-24 flex-shrink-0 text-[12px] text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 border-b border-white/10 bg-transparent pb-1.5 font-mono text-[12px] text-zinc-300 transition-colors placeholder:text-zinc-700 focus:border-zinc-500 focus:outline-none"
      />
    </div>
  );
}
