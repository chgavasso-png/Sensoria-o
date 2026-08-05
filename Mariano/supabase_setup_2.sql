-- ============================================================
-- Campanha SensoriAÇÃO - Atualização 2
-- Adiciona: apoiadores e configurações do site (PIX / QR Code).
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- (Pode rodar mais de uma vez sem problema.)
-- ============================================================

-- ------------------------------------------------------------
-- BRINQUEDOS: adiciona colunas "visivel" e "link"
-- (só aparece na vitrine pública o que o admin marcar como visível)
-- ------------------------------------------------------------
alter table public.brinquedos add column if not exists visivel boolean not null default false;
alter table public.brinquedos add column if not exists link text default '';

-- ------------------------------------------------------------
-- REMOVE A TABELA "doadores" (funcionalidade descontinuada)
-- ------------------------------------------------------------
drop table if exists public.doadores;

-- ------------------------------------------------------------
-- APOIADORES (aparecem na vitrine pública do site)
-- ------------------------------------------------------------
create table if not exists public.apoiadores (
    id          uuid primary key default gen_random_uuid(),
    nome        text not null,
    funcao      text default '',
    foto_url    text default '',
    ordem       integer not null default 0,
    criado_em   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CONFIGURAÇÕES DO SITE (chave/valor) - PIX, QR Code etc.
-- ------------------------------------------------------------
create table if not exists public.configuracoes (
    chave        text primary key,
    valor        text not null default '',
    atualizado_em timestamptz not null default now()
);

insert into public.configuracoes (chave, valor) values
    ('pix_chave', 'sensoriacao@gmail.com'),
    ('pix_qrcode', ''),
    ('pix_titular', ''),
    ('coleta_endereco', 'Avenida Piracicamirim, nº 3039<br>Bloco 3, apartamento 104'),
    ('coleta_observacao', 'OBS: Pedir para entregar com o nome de Gabriel Mariano')
on conflict (chave) do nothing;

-- ------------------------------------------------------------
-- STORAGE: bucket para upload de imagens (brinquedos, QR Code, etc.)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do nothing;

-- Policies do storage: permite upload/leitura com a chave publishable
drop policy if exists "publico_upload" on storage.objects;
create policy "publico_upload" on storage.objects
    for all to anon, authenticated
    using (bucket_id = 'imagens')
    with check (bucket_id = 'imagens');

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.apoiadores    enable row level security;
alter table public.configuracoes enable row level security;

do $$
declare t text;
begin
    foreach t in array array['apoiadores','configuracoes'] loop
        execute format('drop policy if exists "acesso_publico" on public.%I', t);
        execute format(
            'create policy "acesso_publico" on public.%I for all to anon, authenticated using (true) with check (true)',
            t
        );
    end loop;
end $$;

notify pgrst, 'reload schema';
