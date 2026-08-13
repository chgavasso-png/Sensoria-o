// Configuração e helpers de acesso ao Supabase (REST)
const SUPABASE_URL = 'https://qodoomggkesrukquhnbz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kiVuH4RtOcfqkT7l7Ndl_w_59xjYLrQ';

const SB_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
};

async function sbRequest(path, options = {}) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
        ...options,
        headers: { ...SB_HEADERS, ...(options.headers || {}) }
    });
    const texto = await res.text();
    if (!res.ok) {
        throw new Error(texto || ('Erro ' + res.status));
    }
    return texto ? JSON.parse(texto) : null;
}

const sb = {
    select: (tabela, query = '') => sbRequest(tabela + '?' + (query || 'select=*')),
    insert: (tabela, dados) => sbRequest(tabela, {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(dados)
    }),
    update: (tabela, id, dados) => sbRequest(tabela + '?id=eq.' + id, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(dados)
    }),
    remove: (tabela, id) => sbRequest(tabela + '?id=eq.' + id, { method: 'DELETE' }),
    rpc: (funcao, params) => sbRequest('rpc/' + funcao, {
        method: 'POST',
        body: JSON.stringify(params)
    }),
    // Upload de arquivo para o Storage do Supabase
    upload: async (bucket, caminho, arquivo) => {
        const res = await fetch(SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + caminho, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': arquivo.type || 'application/octet-stream',
                'x-upsert': 'true'
            },
            body: arquivo
        });
        if (!res.ok) {
            const texto = await res.text();
            throw new Error(texto || ('Erro upload ' + res.status));
        }
        return SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + caminho;
    }
};

// Sessão simples do painel administrativo
const SESSAO_KEY = 'sensoriacao_admin';

function salvarSessao(usuario) {
    sessionStorage.setItem(SESSAO_KEY, JSON.stringify({ usuario, em: Date.now() }));
}

function obterSessao() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSAO_KEY));
    } catch (e) {
        return null;
    }
}

function encerrarSessao() {
    sessionStorage.removeItem(SESSAO_KEY);
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
