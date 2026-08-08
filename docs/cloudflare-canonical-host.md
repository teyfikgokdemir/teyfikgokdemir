# Cloudflare canonical host redirects

Production must expose one canonical host: `https://teyfikgokdemir.com`.

Cloudflare Pages `_redirects` handles the root language decision and generated
path-level trailing-slash redirects. The `www` hostname rule belongs in the
Cloudflare zone because Pages `_redirects` cannot reliably enforce a host-level
redirect for every custom-domain request.

Create these Cloudflare **Single Redirects** before publishing this branch,
in this order:

- Menu: **Cloudflare dashboard → teyfikgokdemir.com → Rules → Redirect Rules
  → Single Redirects**
- **SİLİNMESİ / KAPATILMASI GEREKEN ESKİ KURAL**:
  Eski mimaride Cloudflare panelinde tanımlanmış olan `/` (kök adres) ➔ `/tr/` yönlendirme kuralını **Silin** veya **Devre Dışı (Disabled)** bırakın.
- Host/scheme rule expression (www ve HTTP'den HTTPS non-www'ye yönlendirme):
  `((http.host eq "www.teyfikgokdemir.com" or starts_with(http.request.full_uri, "http://")) and http.request.uri.path ne "/")`
- Status: `301` (permanent)
- Dynamic target expression:
  `concat("https://teyfikgokdemir.com", http.request.uri.path)`
- Query string: preserve the original query string

Bu işlem Cloudflare panelinde yapıldığında, `/` adresi doğrudan 200 OK ile Türkçe ana sayfayı sunacak, `/tr/` adresi ise repository `_redirects` kuralı ile sorunsuz 301 olarak `/` adresine yönlenecektir.

This repository does not deploy or change the Cloudflare zone rule itself.
