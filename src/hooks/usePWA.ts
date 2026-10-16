import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
export function usePWA() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setError('Não foi possível preparar o modo offline. Volta a abrir a aplicação com internet.'),
  });
  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
    let active = true;
    void navigator.serviceWorker.ready.then((registration) => {
      if (active && registration.active) setReady(true);
    });
    const check = () => {
      void navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .catch(() => {});
    };
    window.addEventListener('online', check);
    const timer = window.setInterval(check, 60 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('online', check);
    };
  }, []);
  return {
    offlineReady: ready || offlineReady,
    needRefresh,
    error,
    update: () => updateServiceWorker(true),
  };
}
