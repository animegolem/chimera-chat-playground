import React, { useState } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

interface OllamaSetupBannerProps {
  onDismiss: () => void;
  onShowInstructions: () => void;
  onDontShowAgain: () => void;
}

export function OllamaSetupBanner({
  onDismiss,
  onShowInstructions,
  onDontShowAgain,
}: OllamaSetupBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    logger.log('OllamaSetupBanner: User dismissed banner');
    setIsVisible(false);
    onDismiss();
  };

  const handleShowInstructions = () => {
    logger.log('OllamaSetupBanner: User requested instructions');
    onShowInstructions();
  };

  const handleDontShowAgain = () => {
    logger.log('OllamaSetupBanner: User selected "Don\'t show again"');
    setIsVisible(false);
    onDontShowAgain();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gruv-yellow-dim border border-gruv-yellow rounded-lg p-3 mb-4 mx-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-gruv-yellow-bright flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gruv-yellow-bright mb-1">
            Ollama Setup Required
          </h3>
          <p className="text-xs text-gruv-yellow-bright mb-3 leading-relaxed">
            To use local models, configure Ollama to accept browser connections:
          </p>

          <div className="text-xs text-gruv-yellow-bright mb-3 font-mono bg-gruv-dark-soft rounded px-2 py-1">
            1. Edit your Ollama service file
            <br />
            2. Add: OLLAMA_ORIGINS="*"
            <br />
            3. Restart Ollama
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShowInstructions}
              className="flex items-center gap-1 px-2 py-1 bg-gruv-yellow-bright text-gruv-dark text-xs rounded hover:bg-gruv-yellow transition-colors"
            >
              <Info className="h-3 w-3" />
              Show Instructions
            </button>

            <button
              onClick={handleDismiss}
              className="px-2 py-1 border border-gruv-yellow-bright text-gruv-yellow-bright text-xs rounded hover:bg-gruv-yellow-bright hover:text-gruv-dark transition-colors"
            >
              Dismiss
            </button>

            <button
              onClick={handleDontShowAgain}
              className="px-2 py-1 text-gruv-yellow text-xs hover:text-gruv-yellow-bright transition-colors"
            >
              Don't Show Again
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gruv-yellow hover:text-gruv-yellow-bright transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
