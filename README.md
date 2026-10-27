# tutô · Histórico veterinário

Protótipo navegável da plataforma tutô: tutor e veterinário com conta por e-mail, aprovação de contas por um administrador, pets vinculados à conta do tutor, número e QR por pet, autorização de veterinários e prontuário com autoria.

O site é estático e usa o **Supabase** para login, banco de dados e regras de acesso. Ele fica publicado no **Firebase Hosting** da Nório (site `tuto`) e também no GitHub Pages. Enquanto `config.js` estiver vazio, o site funciona como protótipo, com os dados só no navegador.

No modo protótipo (ou com `?demo` no endereço), as contas de demonstração são (senha `tuto1234`): `renato@exemplo.com` (tutor), `ana@exemplo.com` (veterinária), `admin@exemplo.com` (administrador). Com `?demo` no fim do endereço (https://rctporto.github.io/tuto/?demo) aparece o painel "Demonstração", que permite trocar de usuário e abrir qualquer uma das 34 telas de referência.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | O site publicado (gerado, não edite à mão) |
| `config.js` | Endereço e chave pública do Supabase |
| `supabase/01_estrutura.sql` | Cria tabelas, regras de acesso e as operações do app (pode rodar de novo) |
| `firebase.json` | Publicação no Firebase Hosting da Nório (site `tuto`) |
| `src/` | Código-fonte: `head.html` (estilos) e os módulos `core`, `actions` (protótipo), `servidor` (Supabase), `auth`, `tutor`, `vet`, `admin`, `app` |
| `assets/` | Logo e símbolo (embutidos no `index.html`) |
| `build.py` | Gera o `index.html` a partir de `src/`: `python3 build.py` |
| `favicon.png` | Ícone da aba |

## Como funciona a segurança

As tabelas do banco ficam fechadas. O site só fala com o banco por funções (`supabase/01_estrutura.sql`) que conferem, no servidor, quem está logado e o que essa pessoa pode fazer:

- Toda conta nova de tutor ou veterinário fica **em análise** até um administrador aprovar ou recusar (com motivo).
- O tutor aprovado vincula os próprios pets; cada pet recebe um número único de 8 dígitos.
- O veterinário encontra o pet pelo número, mas só vê nome, foto e histórico depois que o tutor autoriza. O tutor pode revogar a qualquer momento.
- Só o autor edita um registro, e cada edição cria uma nova versão sem apagar as anteriores.
- O administrador vê os cadastros, nunca os prontuários.

## Publicação — passo a passo

### 1. Supabase
1. Crie um projeto em <https://supabase.com> (região São Paulo).
2. **Authentication → Sign In / Providers → Email:** deixe *Allow new users to sign up* e *Confirm email* **ligados**.
3. **Authentication → URL Configuration:** *Site URL* = `https://tuto.web.app`. Em *Redirect URLs*, adicione também `https://rctporto.github.io/tuto/`.
4. **SQL Editor → New query:** cole `supabase/01_estrutura.sql` e clique em **Run**.
5. **Project Settings → API:** copie a **Project URL** e a chave **anon / public** para o `config.js`. **Nunca** use a chave `service_role` no site.

### 2. Primeiro administrador
Crie sua conta pelo próprio site (Cadastrar tutor), confirme o e-mail e depois rode no **SQL Editor**, trocando o e-mail:

```sql
update public.perfis set tipo = 'admin', aprovacao = 'aprovado' where email = 'seu@email.com';
```

A partir daí, as novas contas aparecem em **Pendências** para esse administrador.

### 3. Firebase Hosting (Nório)
1. No console do Firebase do projeto da Nório: **Hosting → Adicionar outro site** → `tuto`.
2. No seu computador, dentro da pasta deste repositório: `firebase deploy --only hosting --project norio-pd-os`
3. O site fica em <https://tuto.web.app>. Só a hospedagem é Firebase: o login e o banco continuam no Supabase.

### 4. GitHub Pages (opcional)

1. **Settings → Pages → Build and deployment:** *Source* = **Deploy from a branch**, *Branch* = **main**, pasta **/ (root)** → **Save**.
2. Em 1–2 minutos o site fica em `https://rctporto.github.io/tuto/`.
