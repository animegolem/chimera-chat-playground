import React, { useState } from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface OllamaInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Detect user's operating system
function getOperatingSystem(): 'macos' | 'linux' | 'windows' | 'unknown' {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  if (userAgent.includes('win')) return 'windows';

  return 'unknown';
}

interface InstructionStep {
  title: string;
  description: string;
  command?: string;
  note?: string;
}

const instructions: Record<string, InstructionStep[]> = {
  macos: [
    {
      title: 'Set Environment Variable',
      description:
        'Open Terminal and run the following command to set the OLLAMA_ORIGINS variable:',
      command: 'launchctl setenv OLLAMA_ORIGINS "*"',
      note: 'This sets the environment variable for the current session.',
    },
    {
      title: 'Make it Permanent (Optional)',
      description:
        'To make this setting persist across reboots, add it to your shell profile:',
      command: 'echo \'export OLLAMA_ORIGINS="*"\' >> ~/.zshrc',
      note: 'Restart your terminal or run "source ~/.zshrc" to apply.',
    },
    {
      title: 'Restart Ollama',
      description:
        'Quit Ollama completely and restart it to apply the changes.',
      note: 'You can quit Ollama from the menu bar or Activity Monitor.',
    },
  ],
  linux: [
    {
      title: 'Edit Systemd Service',
      description: 'Create or edit the Ollama systemd service override:',
      command: 'sudo systemctl edit ollama',
      note: 'This opens the systemd override file in your default editor.',
    },
    {
      title: 'Add Environment Variable',
      description: 'Add the following lines to the override file:',
      command: '[Service]\nEnvironment="OLLAMA_ORIGINS=*"',
      note: 'Save and exit the editor after adding these lines.',
    },
    {
      title: 'Restart Service',
      description: 'Reload systemd and restart the Ollama service:',
      command: 'sudo systemctl daemon-reload && sudo systemctl restart ollama',
      note: 'The service should now accept connections from browser extensions.',
    },
  ],
  windows: [
    {
      title: 'Set Environment Variable',
      description: 'Open PowerShell as Administrator and run:',
      command: '$env:OLLAMA_ORIGINS="*"',
      note: 'This sets the variable for the current PowerShell session.',
    },
    {
      title: 'Make it Permanent',
      description: 'To make this setting permanent, use:',
      command:
        '[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")',
      note: 'This sets the environment variable permanently for your user account.',
    },
    {
      title: 'Restart Ollama',
      description:
        'Close Ollama completely and restart it to apply the changes.',
      note: 'Check the system tray for the Ollama icon and right-click to quit.',
    },
  ],
};

function CopyButton({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      logger.log('OllamaInstructions: Copied command to clipboard');

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('OllamaInstructions: Failed to copy to clipboard:', error);

      // Fallback: select text for manual copy
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
        copied
          ? 'bg-gruv-green-bright text-gruv-dark'
          : 'bg-gruv-medium hover:bg-gruv-bright text-gruv-light hover:text-gruv-dark'
      } ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

export function OllamaInstructionsModal({
  isOpen,
  onClose,
}: OllamaInstructionsModalProps) {
  const [selectedOS, setSelectedOS] = useState<string>(() => {
    const detectedOS = getOperatingSystem();
    return detectedOS !== 'unknown' ? detectedOS : 'linux'; // Default to Linux
  });

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentInstructions = instructions[selectedOS] || instructions.linux;
  const osLabels = {
    macos: 'macOS',
    linux: 'Linux',
    windows: 'Windows',
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div className="bg-gruv-dark-soft border border-gruv-medium rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gruv-medium">
            <div>
              <h2 className="text-lg font-semibold text-gruv-light">
                Ollama Setup Instructions
              </h2>
              <p className="text-sm text-gruv-medium">
                Configure Ollama to accept browser connections
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gruv-medium hover:text-gruv-light transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* OS Selection */}
          <div className="p-4 border-b border-gruv-medium">
            <label className="block text-sm font-medium text-gruv-light mb-2">
              Select your operating system:
            </label>
            <div className="flex gap-2">
              {Object.entries(osLabels).map(([os, label]) => (
                <button
                  key={os}
                  onClick={() => setSelectedOS(os)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedOS === os
                      ? 'bg-gruv-blue-bright text-gruv-dark'
                      : 'bg-gruv-medium text-gruv-light hover:bg-gruv-bright hover:text-gruv-dark'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 space-y-4">
            {currentInstructions.map((step, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-sm font-semibold text-gruv-light flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-gruv-blue-bright text-gruv-dark text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  {step.title}
                </h3>

                <p className="text-sm text-gruv-medium ml-8">
                  {step.description}
                </p>

                {step.command && (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-start gap-2">
                      <pre className="flex-1 p-3 bg-gruv-dark border border-gruv-medium rounded text-xs text-gruv-light font-mono whitespace-pre-wrap overflow-x-auto">
                        {step.command}
                      </pre>
                      <CopyButton text={step.command} />
                    </div>
                  </div>
                )}

                {step.note && (
                  <div className="ml-8 p-2 bg-gruv-blue-dim border border-gruv-blue rounded text-xs text-gruv-blue-bright">
                    💡 {step.note}
                  </div>
                )}
              </div>
            ))}

            {/* Additional Info */}
            <div className="mt-6 p-3 bg-gruv-green-dim border border-gruv-green rounded">
              <h4 className="text-sm font-semibold text-gruv-green-bright mb-1">
                ✅ Verification
              </h4>
              <p className="text-xs text-gruv-green-bright">
                Once configured, try using a model in this extension. The banner
                will automatically disappear when Ollama connections work
                properly.
              </p>
            </div>

            <div className="mt-4 p-3 bg-gruv-orange-dim border border-gruv-orange rounded">
              <h4 className="text-sm font-semibold text-gruv-orange-bright mb-1">
                ⚠️ Security Note
              </h4>
              <p className="text-xs text-gruv-orange-bright">
                Setting OLLAMA_ORIGINS="*" allows any website to access your
                local Ollama service. For better security, you can set it to
                "app-extension://*" instead.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 border-t border-gruv-medium">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gruv-blue-bright hover:bg-gruv-blue text-gruv-dark rounded transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
