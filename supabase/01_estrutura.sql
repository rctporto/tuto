-- =====================================================================
-- tutô · Histórico veterinário
-- 01_estrutura.sql: tabelas, regras de acesso e operações do app
--
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo
-- inteiro → Run. Pode ser executado de novo sem perder dados.
-- Este arquivo NÃO contém senhas e pode ficar no repositório público.
--
-- Modelo de segurança: as tabelas ficam fechadas (RLS ligado e sem
-- políticas). O site só conversa com o banco pelas funções abaixo, que
-- conferem quem está logado, o vínculo com o pet e a autoria antes de
-- ler ou gravar qualquer coisa.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------

-- Perfil de cada conta (complementa o usuário de login do Supabase)
create table if not exists public.perfis (
  id             uuid primary key references auth.users(id) on delete cascade,
  tipo           text not null check (tipo in ('tutor','vet','admin')),
  nome           text not null,
  email          text not null,
  genero         text,
  crmv           text,
  uf             text,
  titulo         text,
  documento      jsonb,
  aprovacao      text not null default 'pendente' check (aprovacao in ('pendente','aprovado','recusado')),
  motivo_recusa  text,
  analisado_em   timestamptz,
  analisado_por  uuid,
  prefs          jsonb not null default '{"acessos":true,"orientacoes":true,"rotina":true}'::jsonb,
  criado_em      timestamptz not null default now()
);
-- Administrador: pode aprovar cadastros e trocar de visão (tutor, veterinário, administração).
-- "tipo" passa a ser a visão em uso.
alter table public.perfis add column if not exists admin boolean not null default false;
update public.perfis set admin = true where tipo = 'admin' and not admin;

-- Pets, sempre vinculados à conta de um tutor
create table if not exists public.pets (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid not null references public.perfis(id) on delete cascade,
  codigo      text not null unique check (codigo ~ '^[0-9]{8}$'),
  nome        text not null,
  especie     text not null default 'Cão',
  raca        text not null default '',
  sexo        text not null default 'Não informado',
  nascimento  date,
  foto        text,
  criado_em   timestamptz not null default now()
);
create index if not exists pets_tutor_idx on public.pets (tutor_id);

-- Pedidos de acesso de veterinários
create table if not exists public.solicitacoes (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references public.pets(id) on delete cascade,
  vet_id       uuid not null references public.perfis(id) on delete cascade,
  motivo       text not null default 'Acompanhamento veterinário',
  status       text not null default 'pendente' check (status in ('pendente','aprovada','recusada','cancelada')),
  criada_em    timestamptz not null default now(),
  decidida_em  timestamptz
);
create unique index if not exists solicitacoes_uma_pendente on public.solicitacoes (pet_id, vet_id) where status = 'pendente';

-- Acessos liberados pelo tutor
create table if not exists public.vinculos (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references public.pets(id) on delete cascade,
  vet_id       uuid not null references public.perfis(id) on delete cascade,
  status       text not null default 'ativo' check (status in ('ativo','revogado')),
  desde        timestamptz not null default now(),
  revogado_em  timestamptz,
  unique (pet_id, vet_id)
);

-- Registros do prontuário (orientações, receitas, planos); versões nunca são apagadas
create table if not exists public.registros (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  autor_id       uuid not null references public.perfis(id) on delete cascade,
  tipo           text not null,
  titulo         text not null,
  status         text not null default 'rascunho' check (status in ('rascunho','publicado')),
  retorno        text,
  anexo          jsonb,
  rascunho       jsonb,
  versoes        jsonb not null default '[]'::jsonb,
  bloqueado      boolean not null default false,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz,
  publicado_em   timestamptz
);
create index if not exists registros_pet_idx on public.registros (pet_id);

-- Anotações do tutor (separadas dos registros veterinários)
create table if not exists public.notas (
  id         uuid primary key default gen_random_uuid(),
  chave      text not null unique,
  pet_id     uuid not null references public.pets(id) on delete cascade,
  autor_id   uuid not null references public.perfis(id) on delete cascade,
  categoria  text not null default '',
  titulo     text not null default '',
  descricao  text not null default '',
  anexo      jsonb,
  ref        text,
  notificar  uuid[] not null default '{}',
  data       timestamptz not null default now()
);
create index if not exists notas_pet_idx on public.notas (pet_id);

-- Cuidados realizados pelo tutor
create table if not exists public.cuidados (
  id             uuid primary key default gen_random_uuid(),
  chave          text not null unique,
  pet_id         uuid not null references public.pets(id) on delete cascade,
  registro_id    uuid references public.registros(id) on delete set null,
  versao         int,
  resultado      text not null,
  data_hora      timestamptz not null,
  obs            text not null default '',
  autor_id       uuid not null references public.perfis(id) on delete cascade,
  registrado_em  timestamptz not null default now()
);
create index if not exists cuidados_pet_idx on public.cuidados (pet_id);

-- Notificações dentro do app
create table if not exists public.notifs (
  id      uuid primary key default gen_random_uuid(),
  para    uuid not null references public.perfis(id) on delete cascade,
  tipo    text not null,
  ref     text,
  kind    text,
  pet_id  uuid,
  data    timestamptz not null default now(),
  lida    boolean not null default false
);
create index if not exists notifs_para_idx on public.notifs (para, data desc);

-- Tabelas fechadas: só as funções abaixo leem e gravam
alter table public.perfis       enable row level security;
alter table public.pets         enable row level security;
alter table public.solicitacoes enable row level security;
alter table public.vinculos     enable row level security;
alter table public.registros    enable row level security;
alter table public.notas        enable row level security;
alter table public.cuidados     enable row level security;
alter table public.notifs       enable row level security;
revoke all on public.perfis, public.pets, public.solicitacoes, public.vinculos,
              public.registros, public.notas, public.cuidados, public.notifs
  from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Auxiliares
-- ---------------------------------------------------------------------

create or replace function public._erro(msg text) returns void
language plpgsql as $$ begin raise exception using message = msg, errcode = 'P0001'; end $$;

-- Perfil de quem está logado (erro se não houver)
create or replace function public._eu() returns public.perfis
language plpgsql stable security definer set search_path = public as $$
declare p perfis;
begin
  select * into p from perfis where id = auth.uid();
  if p.id is null then perform _erro('Sua sessão terminou. Entre novamente.'); end if;
  return p;
end $$;

create or replace function public._notif(p_para uuid, p_tipo text, p_ref text default null, p_pet uuid default null, p_kind text default null, p_lida boolean default false)
returns void language sql security definer set search_path = public as $$
  insert into notifs (para, tipo, ref, pet_id, kind, lida) values (p_para, p_tipo, p_ref, p_pet, p_kind, p_lida);
$$;

-- Veterinário aprovado e com acesso ativo ao pet
create or replace function public._vet_pode_ler(p_vet uuid, p_pet uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vinculos v join perfis u on u.id = v.vet_id
    where v.pet_id = p_pet and v.vet_id = p_vet and v.status = 'ativo'
      and u.tipo = 'vet' and u.aprovacao = 'aprovado');
$$;

create or replace function public._pode_ler_pet(p_user uuid, p_pet uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pets where id = p_pet and tutor_id = p_user)
      or public._vet_pode_ler(p_user, p_pet);
$$;

create or replace function public._novo_codigo() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := (10000000 + floor(random() * 89999999))::bigint::text;
    exit when not exists (select 1 from pets where codigo = c);
  end loop;
  return c;
end $$;

-- ---------------------------------------------------------------------
-- 3. Conversão para o formato usado pelo site
-- ---------------------------------------------------------------------

create or replace function public._j_user(u public.perfis, completo boolean) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', u.id, 'tipo', u.tipo, 'nome', u.nome, 'genero', u.genero,
    'crmv', u.crmv, 'uf', u.uf, 'titulo', u.titulo,
    'verificacao', case when u.tipo = 'vet' then case u.aprovacao when 'aprovado' then 'liberado' else u.aprovacao end end,
    'aprovacao', case when u.tipo = 'tutor' then u.aprovacao end,
    'criadoEm', u.criado_em
  )) || case when completo then jsonb_strip_nulls(jsonb_build_object(
    'email', u.email, 'motivoRecusa', u.motivo_recusa, 'analisadoEm', u.analisado_em,
    'prefs', u.prefs, 'documento', u.documento, 'podeAdmin', case when u.admin then true end,
    'emailConfirmado', (select au.email_confirmed_at is not null from auth.users au where au.id = u.id)
  )) else '{}'::jsonb end;
$$;

create or replace function public._j_pet(p public.pets) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'tutorId', p.tutor_id, 'codigo', p.codigo, 'status', 'aprovado',
    'nome', p.nome, 'especie', p.especie, 'raca', p.raca, 'sexo', p.sexo,
    'nascimento', coalesce(p.nascimento::text, ''), 'foto', p.foto, 'criadoEm', p.criado_em,
    'email', (select email from perfis where id = p.tutor_id));
$$;

-- Pet sem acesso liberado: só o número, nada de nome, foto ou saúde
create or replace function public._j_pet_min(p public.pets) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', p.id, 'codigo', p.codigo, 'status', 'aprovado',
    'nome', 'Pet ' || substr(p.codigo, 1, 4) || ' ' || substr(p.codigo, 5), 'foto', null, 'tutorId', null);
$$;

create or replace function public._j_sol(s public.solicitacoes) returns jsonb
language sql stable as $$
  select jsonb_strip_nulls(jsonb_build_object('id', s.id, 'petId', s.pet_id, 'vetId', s.vet_id, 'motivo', s.motivo,
    'status', s.status, 'criadaEm', s.criada_em, 'decididaEm', s.decidida_em));
$$;

create or replace function public._j_vinc(v public.vinculos) returns jsonb
language sql stable as $$
  select jsonb_strip_nulls(jsonb_build_object('id', v.id, 'petId', v.pet_id, 'vetId', v.vet_id, 'status', v.status,
    'desde', v.desde, 'revogadoEm', v.revogado_em));
$$;

create or replace function public._j_reg(r public.registros) returns jsonb
language sql stable as $$
  select jsonb_strip_nulls(jsonb_build_object('id', r.id, 'petId', r.pet_id, 'autorId', r.autor_id, 'tipo', r.tipo,
    'titulo', r.titulo, 'status', r.status, 'anexo', r.anexo, 'rascunho', r.rascunho,
    'bloqueado', case when r.bloqueado then true end, 'criadoEm', r.criado_em, 'atualizadoEm', r.atualizado_em,
    'publicadoEm', r.publicado_em)) || jsonb_build_object('versoes', r.versoes, 'retorno', coalesce(r.retorno, ''));
$$;

create or replace function public._j_nota(n public.notas) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', n.id, 'chave', n.chave, 'petId', n.pet_id, 'autorId', n.autor_id, 'categoria', n.categoria,
    'titulo', n.titulo, 'descricao', n.descricao, 'anexo', n.anexo, 'ref', n.ref,
    'notificar', to_jsonb(n.notificar), 'data', n.data);
$$;

create or replace function public._j_cuid(c public.cuidados) returns jsonb
language sql stable as $$
  select jsonb_build_object('id', c.id, 'chave', c.chave, 'petId', c.pet_id, 'registroId', c.registro_id, 'versao', c.versao,
    'resultado', c.resultado, 'dataHora', c.data_hora, 'obs', c.obs, 'autorId', c.autor_id, 'registradoEm', c.registrado_em);
$$;

create or replace function public._j_notif(n public.notifs) returns jsonb
language sql stable as $$
  select jsonb_strip_nulls(jsonb_build_object('id', n.id, 'para', n.para, 'tipo', n.tipo, 'ref', n.ref, 'kind', n.kind,
    'petId', n.pet_id, 'data', n.data)) || jsonb_build_object('lida', n.lida);
$$;

-- ---------------------------------------------------------------------
-- 4. Novas contas: cria o perfil e avisa os administradores
-- ---------------------------------------------------------------------

create or replace function public._nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  t text := case when m->>'tipo' = 'vet' then 'vet' else 'tutor' end;
  a record;
begin
  insert into perfis (id, tipo, nome, email, crmv, uf, titulo, documento)
  values (new.id, t,
          coalesce(nullif(trim(m->>'nome'), ''), split_part(new.email, '@', 1)),
          lower(new.email),
          case when t = 'vet' then nullif(trim(m->>'crmv'), '') end,
          case when t = 'vet' then nullif(m->>'uf', '') end,
          case when t = 'vet' then 'Médico(a)-veterinário(a)' end,
          case when t = 'vet' and jsonb_typeof(m->'documento') = 'object' then m->'documento' end)
  on conflict (id) do nothing;
  for a in select id from perfis where admin loop
    perform _notif(a.id, 'pendencia', new.id::text, null, t);
  end loop;
  return new;
end $$;

drop trigger if exists tuto_nova_conta on auth.users;
create trigger tuto_nova_conta after insert on auth.users
  for each row execute function public._nova_conta();

-- ---------------------------------------------------------------------
-- 5. Leitura: tudo o que a pessoa logada pode ver, no formato do site
-- ---------------------------------------------------------------------

create or replace function public.estado() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  eu perfis := _eu();
  pets_cheios uuid[];   -- pets com dados de saúde visíveis
  pets_min uuid[];      -- pets visíveis só pelo cadastro (nome, foto, número)
  regs uuid[];
  usuarios jsonb;
begin
  if eu.tipo = 'tutor' then
    select coalesce(array_agg(id), '{}') into pets_cheios from pets where tutor_id = eu.id;
    pets_min := pets_cheios;
  elsif eu.tipo = 'vet' then
    select coalesce(array_agg(v.pet_id), '{}') into pets_cheios from vinculos v
      where v.vet_id = eu.id and _vet_pode_ler(eu.id, v.pet_id);
    select coalesce(array_agg(distinct x), '{}') into pets_min from (
      select pet_id x from solicitacoes where vet_id = eu.id
      union select pet_id from vinculos where vet_id = eu.id
      union select pet_id from registros where autor_id = eu.id) q;
  else
    pets_cheios := '{}';
    select coalesce(array_agg(id), '{}') into pets_min from pets;
  end if;

  select coalesce(array_agg(id), '{}') into regs from registros r
    where (r.status = 'publicado' and r.pet_id = any (pets_cheios)) or r.autor_id = eu.id;

  if eu.tipo = 'admin' then
    select coalesce(jsonb_agg(_j_user(u, true) order by u.criado_em), '[]') into usuarios from perfis u;
  else
    select coalesce(jsonb_agg(_j_user(u, u.id = eu.id)), '[]') into usuarios from perfis u
    where u.id = eu.id
       or u.id in (select tutor_id from pets where id = any (case when eu.tipo = 'vet' then pets_cheios else pets_min end))
       or u.id in (select vet_id from solicitacoes where pet_id = any (pets_cheios))
       or u.id in (select vet_id from vinculos where pet_id = any (pets_cheios))
       or u.id in (select autor_id from registros where id = any (regs));
  end if;

  return jsonb_build_object(
    'users', usuarios,
    'pets', (select coalesce(jsonb_agg(case when eu.tipo <> 'vet' or p.id = any (pets_cheios) then _j_pet(p) else _j_pet_min(p) end
                                       order by p.criado_em), '[]') from pets p where p.id = any (pets_min)),
    'solicitacoes', (select coalesce(jsonb_agg(_j_sol(s) order by s.criada_em), '[]') from solicitacoes s
                     where (eu.tipo = 'tutor' and s.pet_id = any (pets_cheios)) or s.vet_id = eu.id),
    'vinculos', (select coalesce(jsonb_agg(_j_vinc(v)), '[]') from vinculos v
                 where (eu.tipo = 'tutor' and v.pet_id = any (pets_cheios)) or v.vet_id = eu.id),
    'registros', (select coalesce(jsonb_agg(_j_reg(r) order by r.criado_em), '[]') from registros r where r.id = any (regs)),
    'notas', (select coalesce(jsonb_agg(_j_nota(n) order by n.data), '[]') from notas n where n.pet_id = any (pets_cheios)),
    'cuidados', (select coalesce(jsonb_agg(_j_cuid(c) order by c.data_hora), '[]') from cuidados c where c.pet_id = any (pets_cheios)),
    'notifs', (select coalesce(jsonb_agg(_j_notif(n) order by n.data), '[]') from
                (select * from notifs where para = eu.id order by data desc limit 200) n)
  );
end $$;

-- ---------------------------------------------------------------------
-- 6. Operações (mesmas regras do protótipo, agora no servidor)
-- ---------------------------------------------------------------------

create or replace function public.cadastrar_pet(f jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); p pets;
begin
  if eu.tipo <> 'tutor' then perform _erro('Somente tutores cadastram pets.'); end if;
  if eu.aprovacao <> 'aprovado' then perform _erro('Sua conta ainda está em análise. Você poderá vincular pets depois da aprovação.'); end if;
  if coalesce(trim(f->>'nome'), '') = '' then perform _erro('Informe o nome do pet.'); end if;
  if nullif(f->>'id', '') is not null then
    update pets set nome = trim(f->>'nome'), especie = coalesce(f->>'especie', especie), raca = coalesce(trim(f->>'raca'), ''),
           sexo = coalesce(f->>'sexo', sexo), nascimento = nullif(f->>'nascimento', '')::date, foto = f->>'foto'
     where id = (f->>'id')::uuid and tutor_id = eu.id returning * into p;
    if p.id is null then perform _erro('Você não pode alterar este pet.'); end if;
    return _j_pet(p);
  end if;
  insert into pets (tutor_id, codigo, nome, especie, raca, sexo, nascimento, foto)
  values (eu.id, _novo_codigo(), trim(f->>'nome'), coalesce(f->>'especie', 'Cão'), coalesce(trim(f->>'raca'), ''),
          coalesce(f->>'sexo', 'Não informado'), nullif(f->>'nascimento', '')::date, f->>'foto')
  returning * into p;
  perform _notif(eu.id, 'cadastro', null, p.id, null, true);
  return _j_pet(p);
end $$;

create or replace function public.atualizar_foto(p_pet uuid, p_foto text) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu();
begin
  update pets set foto = p_foto where id = p_pet and tutor_id = eu.id;
  if not found then perform _erro('Você não pode alterar este pet.'); end if;
end $$;

create or replace function public.decidir_cadastro(p_id uuid, p_aprovar boolean, p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare adm perfis := _eu(); u perfis; m text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if not adm.admin then perform _erro('Somente administradores aprovam cadastros.'); end if;
  if not p_aprovar and m is null then perform _erro('Explique o motivo da recusa. Ele será mostrado a quem fez o cadastro.'); end if;
  select * into u from perfis where id = p_id for update;
  if u.id is null or u.admin then perform _erro('Conta não encontrada.'); end if;
  if u.aprovacao <> 'pendente' then perform _erro('Este cadastro já foi analisado.'); end if;
  update perfis set aprovacao = case when p_aprovar then 'aprovado' else 'recusado' end,
         motivo_recusa = case when p_aprovar then null else m end, analisado_em = now(), analisado_por = adm.id
   where id = u.id;
  perform _notif(u.id, case when u.tipo = 'vet' then (case when p_aprovar then 'liberado' else 'vetRecusado' end)
                            else (case when p_aprovar then 'contaAprovada' else 'contaRecusada' end) end);
  update notifs set lida = true where tipo = 'pendencia' and ref = u.id::text;
end $$;

create or replace function public.buscar_codigo(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); p pets; c text := regexp_replace(coalesce(p_codigo, ''), '\D', '', 'g');
begin
  if eu.tipo <> 'vet' then perform _erro('Busca disponível para veterinários.'); end if;
  if eu.aprovacao <> 'aprovado' then perform _erro('Seu perfil profissional ainda está em análise.'); end if;
  select * into p from pets where codigo = c;
  if p.id is null then return null; end if;
  -- só o necessário para pedir acesso: nada de saúde
  return jsonb_build_object('petId', p.id, 'codigo', p.codigo, 'pet', _j_pet_min(p));
end $$;

create or replace function public.solicitar(p_pet uuid, p_motivo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); s solicitacoes; p pets;
begin
  if eu.tipo <> 'vet' or eu.aprovacao <> 'aprovado' then perform _erro('Seu perfil profissional precisa estar liberado.'); end if;
  select * into s from solicitacoes where pet_id = p_pet and vet_id = eu.id and status = 'pendente';
  if s.id is not null then return _j_sol(s); end if;
  if _vet_pode_ler(eu.id, p_pet) then perform _erro('Você já tem acesso ativo a este pet.'); end if;
  select * into p from pets where id = p_pet;
  if p.id is null then perform _erro('Este pet não está disponível para solicitações.'); end if;
  insert into solicitacoes (pet_id, vet_id, motivo)
  values (p_pet, eu.id, coalesce(nullif(trim(p_motivo), ''), 'Acompanhamento veterinário')) returning * into s;
  perform _notif(p.tutor_id, 'solicitacao', s.id::text, p_pet);
  return _j_sol(s);
end $$;

create or replace function public.cancelar_solicitacao(p_sid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); s solicitacoes;
begin
  select * into s from solicitacoes where id = p_sid and vet_id = eu.id for update;
  if s.id is null then perform _erro('Solicitação não encontrada.'); end if;
  if s.status <> 'pendente' then perform _erro('Esta solicitação já foi decidida pelo tutor.'); end if;
  update solicitacoes set status = 'cancelada', decidida_em = now() where id = s.id;
end $$;

create or replace function public.decidir(p_sid uuid, p_aprovar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); s solicitacoes;
begin
  select s0.* into s from solicitacoes s0 join pets p on p.id = s0.pet_id
   where s0.id = p_sid and p.tutor_id = eu.id for update of s0;
  if s.id is null then perform _erro('Só o tutor responsável pode decidir sobre este acesso.'); end if;
  if s.status <> 'pendente' then
    perform _erro(case when s.status = 'cancelada' then 'O profissional cancelou esta solicitação.' else 'Esta solicitação já foi decidida.' end);
  end if;
  update solicitacoes set status = case when p_aprovar then 'aprovada' else 'recusada' end, decidida_em = now() where id = s.id;
  if p_aprovar then
    insert into vinculos (pet_id, vet_id) values (s.pet_id, s.vet_id)
      on conflict (pet_id, vet_id) do update set status = 'ativo', desde = now(), revogado_em = null;
    update registros set bloqueado = false where pet_id = s.pet_id and autor_id = s.vet_id and status = 'rascunho';
    perform _notif(s.vet_id, 'autorizado', null, s.pet_id);
  else
    perform _notif(s.vet_id, 'recusado', s.id::text, s.pet_id);
  end if;
  update notifs set lida = true where para = eu.id and ref = s.id::text;
end $$;

create or replace function public.revogar(p_pet uuid, p_vet uuid) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu();
begin
  if not exists (select 1 from pets where id = p_pet and tutor_id = eu.id) then
    perform _erro('Só o tutor responsável pode revogar acessos.');
  end if;
  update vinculos set status = 'revogado', revogado_em = now() where pet_id = p_pet and vet_id = p_vet and status = 'ativo';
  if not found then perform _erro('Este acesso já não está ativo.'); end if;
  update registros set bloqueado = true where pet_id = p_pet and autor_id = p_vet and status = 'rascunho';
  perform _notif(p_vet, 'revogado', null, p_pet);
end $$;

create or replace function public.salvar_rascunho(f jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); r registros; pet uuid := (f->>'petId')::uuid;
begin
  if not _vet_pode_ler(eu.id, pet) then perform _erro('Seu acesso a este pet não está ativo.'); end if;
  if nullif(f->>'id', '') is not null then
    select * into r from registros where id = (f->>'id')::uuid for update;
    if r.id is null or r.autor_id <> eu.id or r.status <> 'rascunho' then perform _erro('Você só pode alterar seus próprios rascunhos.'); end if;
  end if;
  if r.id is null then
    insert into registros (pet_id, autor_id, tipo, titulo) values (pet, eu.id, f->>'tipo', coalesce(f->>'titulo', '')) returning * into r;
  end if;
  update registros set tipo = f->>'tipo',
         titulo = coalesce(nullif(trim(f->>'titulo'), ''), f->>'tituloPadrao', 'Orientação'),
         retorno = f->>'retorno', anexo = case when jsonb_typeof(f->'anexo') = 'object' then f->'anexo' end,
         rascunho = coalesce(f->'conteudo', '{}'::jsonb), atualizado_em = now()
   where id = r.id returning * into r;
  return _j_reg(r);
end $$;

create or replace function public.publicar(p_rid uuid, p_notificar boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); r registros; tutor uuid;
begin
  select * into r from registros where id = p_rid for update;
  if r.id is null or r.autor_id <> eu.id then perform _erro('Você só pode publicar seus próprios registros.'); end if;
  if not _vet_pode_ler(eu.id, r.pet_id) then perform _erro('Seu acesso a este pet foi encerrado. O rascunho não foi publicado.'); end if;
  if r.status = 'publicado' then return _j_reg(r); end if;  -- repetir o envio não duplica
  update registros set status = 'publicado', publicado_em = now(), rascunho = null,
         versoes = jsonb_build_array(jsonb_build_object('n', 1, 'conteudo', coalesce(r.rascunho, '{}'::jsonb),
                   'data', now(), 'motivo', 'Publicação inicial', 'autorId', eu.id))
   where id = r.id returning * into r;
  perform _notif(eu.id, 'publicada', r.id::text, r.pet_id, null, true);
  if p_notificar then
    select tutor_id into tutor from pets where id = r.pet_id;
    perform _notif(tutor, 'orientacao', r.id::text, r.pet_id);
  end if;
  return _j_reg(r);
end $$;

create or replace function public.descartar_rascunho(p_rid uuid) returns void
language sql security definer set search_path = public as $$
  delete from registros where id = p_rid and autor_id = auth.uid() and status = 'rascunho';
$$;

create or replace function public.nova_versao(p_rid uuid, p_base int, p_conteudo jsonb, p_motivo text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); r registros; n_atual int;
begin
  select * into r from registros where id = p_rid for update;
  if r.id is null or r.status <> 'publicado' then perform _erro('Registro não encontrado.'); end if;
  if r.autor_id <> eu.id then perform _erro('Somente o autor pode editar este registro. Nada foi alterado.'); end if;
  if not _vet_pode_ler(eu.id, r.pet_id) then perform _erro('Seu acesso a este pet foi encerrado. Nada foi alterado.'); end if;
  n_atual := (r.versoes -> -1 ->> 'n')::int;
  if n_atual <> p_base then perform _erro('Este registro mudou desde que você abriu a edição. Reabra para ver a versão mais recente.'); end if;
  if coalesce(trim(p_motivo), '') = '' then perform _erro('Informe o motivo da alteração.'); end if;
  update registros set versoes = versoes || jsonb_build_array(jsonb_build_object('n', p_base + 1, 'conteudo', p_conteudo,
         'data', now(), 'motivo', trim(p_motivo), 'autorId', eu.id)), atualizado_em = now()
   where id = r.id returning * into r;
  return _j_reg(r);
end $$;

create or replace function public.registrar_cuidado(f jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); pet uuid := (f->>'petId')::uuid; reg uuid := nullif(f->>'registroId', '')::uuid; v int;
begin
  if not exists (select 1 from pets where id = pet and tutor_id = eu.id) then
    perform _erro('Somente o tutor registra os cuidados realizados.');
  end if;
  if exists (select 1 from cuidados where chave = f->>'chave') then return; end if;  -- reenvio não duplica
  select (versoes -> -1 ->> 'n')::int into v from registros where id = reg and pet_id = pet and status = 'publicado';
  insert into cuidados (chave, pet_id, registro_id, versao, resultado, data_hora, obs, autor_id)
  values (f->>'chave', pet, case when v is null then null else reg end, v, f->>'resultado',
          coalesce(nullif(f->>'dataHora', '')::timestamptz, now()), coalesce(trim(f->>'obs'), ''), eu.id);
end $$;

create or replace function public.nova_nota(f jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu(); pet uuid := (f->>'petId')::uuid; n notas; destinos uuid[] := '{}'; d uuid;
begin
  if not exists (select 1 from pets where id = pet and tutor_id = eu.id) then
    perform _erro('Anotações do tutor são criadas apenas pelo tutor do pet.');
  end if;
  select * into n from notas where chave = f->>'chave';
  if n.id is not null then return _j_nota(n); end if;
  if coalesce((f->>'notificar')::boolean, false) then
    select coalesce(array_agg(vet_id), '{}') into destinos from vinculos where pet_id = pet and _vet_pode_ler(vet_id, pet);
  end if;
  insert into notas (chave, pet_id, autor_id, categoria, titulo, descricao, anexo, ref, notificar)
  values (f->>'chave', pet, eu.id, coalesce(f->>'categoria', ''), coalesce(trim(f->>'titulo'), ''), coalesce(trim(f->>'descricao'), ''),
          case when jsonb_typeof(f->'anexo') = 'object' then f->'anexo' end, nullif(f->>'ref', ''), destinos)
  returning * into n;
  foreach d in array destinos loop perform _notif(d, 'nota', n.id::text, pet); end loop;
  return _j_nota(n);
end $$;

-- Administrador troca a visão da própria conta
create or replace function public.trocar_papel(p_tipo text) returns void
language plpgsql security definer set search_path = public as $$
declare eu perfis := _eu();
begin
  if not eu.admin then perform _erro('Somente administradores trocam de visão.'); end if;
  if p_tipo not in ('tutor', 'vet', 'admin') then perform _erro('Visão desconhecida.'); end if;
  update perfis set tipo = p_tipo, aprovacao = 'aprovado',
         titulo = case when p_tipo = 'vet' then coalesce(titulo, 'Médico(a)-veterinário(a)') else titulo end
   where id = eu.id;
end $$;

create or replace function public.ler_notifs() returns void
language sql security definer set search_path = public as $$
  update notifs set lida = true where para = auth.uid() and not lida;
$$;

create or replace function public.salvar_pref(p_chave text, p_valor boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_chave not in ('acessos', 'orientacoes', 'rotina') then perform _erro('Preferência desconhecida.'); end if;
  update perfis set prefs = prefs || jsonb_build_object(p_chave, p_valor) where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------
-- 7. Permissões das funções: só quem está logado; auxiliares fechadas
-- ---------------------------------------------------------------------

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in (
             '_erro','_eu','_notif','_vet_pode_ler','_pode_ler_pet','_novo_codigo','_j_user','_j_pet','_j_sol','_j_vinc',
             '_j_reg','_j_pet_min','_j_nota','_j_cuid','_j_notif','_nova_conta','estado','cadastrar_pet','atualizar_foto','decidir_cadastro',
             'buscar_codigo','solicitar','cancelar_solicitacao','decidir','revogar','salvar_rascunho','publicar',
             'descartar_rascunho','nova_versao','registrar_cuidado','nova_nota','trocar_papel','ler_notifs','salvar_pref') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    if left(f.proname, 1) <> '_' then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. Contas criadas antes deste script: cria o perfil que faltou
-- ---------------------------------------------------------------------

insert into public.perfis (id, tipo, nome, email, crmv, uf, titulo)
select u.id,
       case when u.raw_user_meta_data->>'tipo' = 'vet' then 'vet' else 'tutor' end,
       coalesce(nullif(trim(u.raw_user_meta_data->>'nome'), ''), split_part(u.email, '@', 1)),
       lower(u.email),
       case when u.raw_user_meta_data->>'tipo' = 'vet' then nullif(trim(u.raw_user_meta_data->>'crmv'), '') end,
       case when u.raw_user_meta_data->>'tipo' = 'vet' then nullif(u.raw_user_meta_data->>'uf', '') end,
       case when u.raw_user_meta_data->>'tipo' = 'vet' then 'Médico(a)-veterinário(a)' end
from auth.users u
where not exists (select 1 from public.perfis p where p.id = u.id);

-- Pede ao Supabase para reconhecer as funções novas na hora
notify pgrst, 'reload schema';

-- Conferência: deve mostrar 1 linha com "estado" e o total de perfis
select (select count(*) from pg_proc where proname = 'estado' and pronamespace = 'public'::regnamespace) as funcao_estado,
       (select count(*) from public.perfis) as perfis;
