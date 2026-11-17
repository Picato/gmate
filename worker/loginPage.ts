const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<title>gmate · log in</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
<style>
:root{color-scheme:light dark;--bg:#eceee8;--surface:#fbfbf8;--ink:#231a1c;--muted:#5e5658;--line:#d3d5cc;--brass:#c08a2e;--on-brass:#231a1c;--focus:#1f5fa8;--err:#a12a2a}
@media (prefers-color-scheme:dark){:root{--bg:#1c1416;--surface:#271c1f;--ink:#f2eae2;--muted:#b9aaa6;--line:#4a3a3e;--brass:#d9a649;--on-brass:#1c1416;--focus:#8fc1ff;--err:#ff9b9b}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
main{width:100%;max-width:380px;background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:28px 24px}
img{display:block;margin:0 auto 20px}
h1{font-size:1.15rem;margin:0 0 4px}
p{margin:0 0 16px;color:var(--muted)}
label{display:block;font-weight:600;margin-bottom:6px}
input,button{width:100%;font:inherit;border-radius:14px;padding:12px 14px}
input{border:1px solid var(--line);background:transparent;color:inherit}
button{margin-top:12px;border:0;background:var(--brass);color:var(--on-brass);font-weight:700;cursor:pointer}
button.secondary{background:transparent;color:var(--ink);border:2px solid var(--brass)}
button:disabled{opacity:.6;cursor:default}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
#msg{margin:14px 0 0;min-height:1.5em}
#msg.err{color:var(--err)}
</style>
</head>
<body>
<main>
<picture><source media="(prefers-color-scheme:dark)" srcset="/gmate-logo-dark.svg"><img src="/gmate-logo.svg" alt="gmate" width="116" height="36"></picture>
<h1>Log in</h1>
<p>Enter your email and we will send you a login link.</p>
<form id="form">
<label for="email">Email</label>
<input id="email" type="email" name="email" autocomplete="email" required autofocus>
<button type="submit">Email me a link</button>
</form>
<p id="msg" role="status"></p>
</main>
<script>
const msg = document.getElementById('msg');
if (new URLSearchParams(location.search).has('login')) {
  msg.textContent = 'That link is invalid or expired. Request a new one.';
  msg.className = 'err';
}
const COOLDOWN_MS = 120000;
let sentAt = 0;
document.getElementById('form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  const waitMs = sentAt + COOLDOWN_MS - Date.now();
  if (waitMs > 0) {
    msg.className = '';
    msg.textContent = 'A link was just sent. You can send another in ' + Math.ceil(waitMs / 1000) + ' seconds.';
    return;
  }
  button.disabled = true;
  msg.className = '';
  msg.textContent = 'Sending…';
  try {
    const response = await fetch('/auth/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value }),
    });
    if (!response.ok) throw new Error();
    sentAt = Date.now();
    button.textContent = 'Send again';
    button.className = 'secondary';
    msg.textContent = 'If that email is allowed, a link is on its way. Check your inbox.';
  } catch {
    msg.className = 'err';
    msg.textContent = 'Something went wrong. Try again.';
  } finally {
    button.disabled = false;
  }
});
</script>
</body>
</html>`;

export const loginPage = (): Response =>
  new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
