"""Gera o index.html a partir de src/ (rode: python3 build.py)."""
import base64, pathlib
R = pathlib.Path(__file__).parent
uri = lambda p: "data:image/png;base64," + base64.b64encode((R / p).read_bytes()).decode()
ordem = ["core", "actions", "servidor", "auth", "tutor", "vet", "admin", "app"]
js = "\n".join((R / "src" / f"{n}.js").read_text() for n in ordem)
js = js.replace("__LOGO__", uri("assets/logo.png")).replace("__SYM__", uri("assets/sym.png"))
head = (R / "src" / "head.html").read_text()
html = f'''<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<link rel="icon" type="image/png" href="favicon.png">
{head}
</head><body>
<div id="root"><div style="padding:40px;text-align:center;font-family:system-ui,sans-serif;color:#6B6576">Carregando o tutô…</div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="config.js"></script>
<script>
{js}
</script>
</body></html>
'''
(R / "index.html").write_text(html)
print("index.html gerado")
