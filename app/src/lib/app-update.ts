// Faz chegar as novas versões da app sem o utilizador ter de a fechar à força.
// O service worker gerado (vite-plugin-pwa, autoUpdate) já ativa logo a versão nova
// (skipWaiting + clientsClaim), mas a página aberta continuava com o código antigo,
// sobretudo no iPhone, onde a app instalada volta da memória sem recarregar.
// Aqui: (1) procuramos atualizações sempre que a app volta ao ecrã e (2) quando o
// service worker novo assume o controlo, recarregamos a página uma única vez.

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function setupAppAutoUpdate(): void {
  if (!('serviceWorker' in navigator)) return;

  // Na primeira instalação não há controlador anterior: não recarregar nesse caso.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  let lastCheck = 0;
  const checkForUpdate = () => {
    const now = Date.now();
    if (now - lastCheck < 60 * 1000) return;
    lastCheck = now;
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {
        /* sem rede ou sem registo: tenta de novo mais tarde */
      });
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  window.addEventListener('focus', checkForUpdate);
  window.setInterval(checkForUpdate, CHECK_INTERVAL_MS);
}
