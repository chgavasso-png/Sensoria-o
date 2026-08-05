-- ============================================================
-- Campanha SensoriAÇÃO - Estrutura do banco (Supabase / Postgres)
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- ============================================================

-- pgcrypto (crypt/gen_salt). No Supabase a extensão fica no schema "extensions",
-- por isso o search_path abaixo cobre os dois casos possíveis.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
set search_path = public, extensions;

-- ------------------------------------------------------------
-- USUÁRIOS ADMIN
-- ------------------------------------------------------------
create table if not exists public.admin_users (
    id          uuid primary key default gen_random_uuid(),
    usuario     text not null unique,
    senha_hash  text not null,
    criado_em   timestamptz not null default now()
);

alter table public.admin_users enable row level security;
-- Nenhuma policy: a tabela fica inacessível pela chave pública.
-- O login acontece somente pela função verificar_login (security definer).

insert into public.admin_users (usuario, senha_hash)
values ('Mariano', crypt('nanobanana', gen_salt('bf')))
on conflict (usuario) do update set senha_hash = excluded.senha_hash;

create or replace function public.verificar_login(p_usuario text, p_senha text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    v_hash text;
begin
    select senha_hash into v_hash
      from public.admin_users
     where lower(usuario) = lower(p_usuario);

    if v_hash is null then
        return false;
    end if;

    return v_hash = crypt(p_senha, v_hash);
end;
$$;

grant execute on function public.verificar_login(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- BRINQUEDOS (metas e quantidades atingidas)
-- ------------------------------------------------------------
create table if not exists public.brinquedos (
    id           uuid primary key default gen_random_uuid(),
    nome         text not null,
    categoria    text default '',
    imagem_url   text default '',
    link         text default '',
    meta         integer not null default 0,
    atingidos    integer not null default 0,
    ordem        integer not null default 0,
    visivel      boolean not null default false,
    criado_em    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DOAÇÕES (cada valor lançado pelo admin)
-- ------------------------------------------------------------
create table if not exists public.doacoes (
    id           uuid primary key default gen_random_uuid(),
    descricao    text default '',
    doador       text default '',
    valor        numeric(12,2) not null default 0,
    data         date not null default current_date,
    metodo       text not null default 'Pix',
    criado_em    timestamptz not null default now()
);

create index if not exists doacoes_data_idx on public.doacoes (data);

-- ------------------------------------------------------------
-- RLS: o painel usa a chave publicável, então liberamos as
-- tabelas de conteúdo (não guardam dados sensíveis).
-- ------------------------------------------------------------
alter table public.brinquedos enable row level security;
alter table public.doacoes    enable row level security;

do $$
declare t text;
begin
    foreach t in array array['brinquedos','doacoes'] loop
        execute format('drop policy if exists "acesso_publico" on public.%I', t);
        execute format(
            'create policy "acesso_publico" on public.%I for all to anon, authenticated using (true) with check (true)',
            t
        );
    end loop;
end $$;

notify pgrst, 'reload schema';
