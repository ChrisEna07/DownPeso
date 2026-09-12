import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Comprobar si el usuario no cerró el banner recientemente
      const dismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <Download className="w-4 h-4" />
        </div>
        <span className="font-medium">
          Instala <strong className="font-extrabold">DownPeso</strong> en tu pantalla de inicio para usarla offline y sin conexión.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1 rounded-lg font-bold text-xs shadow-sm transition-colors"
        >
          Instalar App
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
