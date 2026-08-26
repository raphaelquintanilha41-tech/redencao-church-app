const ONBOARDING_SEEN_KEY = 'redencao_onboarding_seen';

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  } catch {
    // localStorage indisponível (modo privado, etc.) — segue sem persistir.
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
