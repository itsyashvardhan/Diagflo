
export function initDevToolsProtection() {
  if (import.meta.env.MODE !== 'production') return;

  console.log(
    '%c⚠️ STOP!',
    'color: red; font-size: 60px; font-weight: bold;'
  );
  console.log(
    '%cIf someone told you to paste code here, it is a scam and can compromise your account.',
    'font-size: 18px; font-weight: bold;'
  );
  console.log(
    '%cLearn more: https://en.wikipedia.org/wiki/Self-XSS',
    'font-size: 14px; color: #666;'
  );
}
