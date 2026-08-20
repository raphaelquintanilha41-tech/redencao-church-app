/**
* Supabase auth errors come back in English with internal wording. Map the
* common ones to the app's ptPT voice; anything unmapped falls back to the
* raw message rather than being silently hidden.
*/
export function translateAuthError(message: string): string {
const m = message.toLowerCase();

if (m.includes('invalid login credentials')) {
return 'E-mail ou palavra-passe incorretos.';
}
if (m.includes('user already registered') || m.includes('already registered')) {
return 'Já existe uma conta com este e-mail. Tente entrar.';
}
if (m.includes('password should be at least')) {
return 'A palavra-passe deve ter pelo menos 6 caracteres.';
}
if (m.includes('unable to validate email address') || m.includes('invalid email')) {
return 'Introduza um e-mail válido.';
}
if (m.includes('email not confirmed')) {
return 'Confirme o seu e-mail antes de entrar — verifique a sua caixa de entrada.';
}
if (m.includes('rate limit')) {
return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
}
if (m.includes('same password') || m.includes('should be different')) {
return 'A nova palavra-passe deve ser diferente da atual.';
}
if (m.includes('failed to fetch') || m.includes('networkerror')) {
return 'Sem ligação ao servidor. Verifique a sua internet e tente novamente.';
}

return message;
}
