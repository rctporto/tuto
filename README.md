# tutô · Histórico veterinário

Protótipo navegável da plataforma tutô: tutor e veterinário com conta por e-mail, aprovação de contas por um administrador, pets vinculados à conta do tutor, número e QR por pet, autorização de veterinários e prontuário com autoria.

Nesta etapa o site é estático (GitHub Pages). Login, e-mail e banco de dados são **simulados** e os dados ficam só no navegador de cada pessoa. A próxima etapa liga o site ao **Supabase** para login, banco de dados e regras de acesso reais, como no BugLab.

Contas de demonstração (senha `tuto1234`): `renato@exemplo.com` (tutor), `ana@exemplo.com` (veterinária), `admin@exemplo.com` (administrador). O painel "Demonstração" ao lado permite trocar de usuário e abrir qualquer uma das 34 telas de referência.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | O site publicado (gerado, não edite à mão) |
| `src/` | Código-fonte: `head.html` (estilos) e os módulos `core`, `actions`, `auth`, `tutor`, `vet`, `admin`, `app` |
| `assets/` | Logo e símbolo (embutidos no `index.html`) |
| `build.py` | Gera o `index.html` a partir de `src/`: `python3 build.py` |
| `favicon.png` | Ícone da aba |

## Publicação no GitHub Pages

1. **Settings → Pages → Build and deployment:** *Source* = **Deploy from a branch**, *Branch* = **main**, pasta **/ (root)** → **Save**.
2. Em 1–2 minutos o site fica em `https://rctporto.github.io/tuto/`.
