// Conteúdo dinâmico da página pública (vitrine, apoiadores e PIX)

function esc(txt) {
    return String(txt == null ? '' : txt)
        .replace(/&/g, '&').replace(/</g, '<')
        .replace(/>/g, '>').replace(/"/g, '"');
}

function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).slice(0, 2)
        .map(p => p[0]).join('').toUpperCase();
}

// ---------------- VITRINE DE BRINQUEDOS ----------------
async function carregarVitrine() {
    const grid = document.getElementById('vitrine-grid');
    if (!grid) return;

    let itens;
    try {
        itens = await sb.select('brinquedos', 'select=*&order=ordem.asc');
    } catch (e) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">Não foi possível carregar os brinquedos agora.</p>';
        return;
    }

    // Só mostra na vitrine pública os brinquedos marcados como visíveis pelo admin
    itens = (itens || []).filter(b => b.visivel === true);

    if (!itens.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">Nenhum brinquedo cadastrado ainda.</p>';
        return;
    }

    grid.innerHTML = itens.map(b => {
        const meta = Number(b.meta || 0);
        const atingidos = Number(b.atingidos || 0);
        const pct = meta > 0 ? Math.min(100, (atingidos / meta) * 100) : 0;
        const completo = meta > 0 && atingidos >= meta;
        const link = b.link ? b.link.trim() : '';
        const descricao = b.descricao ? b.descricao.trim() : '';

        return `
        <article class="card-premium rounded-2xl overflow-hidden flex flex-col border-t-4 ${completo ? 'border-green-500' : 'border-terra'} mx-auto w-full max-w-sm">
            <div class="h-44 bg-white flex items-center justify-center p-4 relative">
                ${b.imagem_url
                    ? `<img src="${esc(b.imagem_url)}" alt="${esc(b.nome)}" class="max-h-full max-w-full object-contain" loading="lazy">`
                    : '<span class="text-5xl">🧸</span>'}
                ${completo ? '<span class="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">META ATINGIDA</span>' : ''}
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-bold text-gray-800 font-poppins leading-tight mb-1 text-center">${esc(b.nome)}</h3>
                ${b.categoria ? `<p class="text-xs text-terra font-semibold uppercase tracking-wide mb-2 text-center">${esc(b.categoria)}</p>` : '<div class="mb-2"></div>'}
                ${descricao ? `<p class="text-sm text-gray-600 font-light leading-relaxed mb-4 text-center">${esc(descricao)}</p>` : ''}

                ${link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="block w-full text-center text-sm font-bold text-white bg-gradient-to-r from-terra to-terra-light hover:from-terra-light hover:to-terra rounded-lg py-2.5 mb-4 transition-all">🔗 Acessar</a>` : ''}

                <div class="mt-auto">
                    <div class="flex justify-between items-baseline mb-1.5">
                        <span class="text-sm font-bold text-gray-800">${atingidos} <span class="text-gray-400 font-medium">/ ${meta}</span></span>
                        <span class="text-xs font-bold ${completo ? 'text-green-600' : 'text-terra'}">${pct.toFixed(0)}%</span>
                    </div>
                    <div class="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700 ${completo ? 'bg-green-500' : 'bg-gradient-to-r from-terra to-terra-light'}" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
        </article>`;
    }).join('');
}

// ---------------- APOIADORES ----------------
async function carregarApoiadores() {
    const grid = document.getElementById('apoiadores-grid');
    if (!grid) return;

    let itens;
    try {
        itens = await sb.select('apoiadores', 'select=*&order=ordem.asc');
    } catch (e) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">Não foi possível carregar os apoiadores agora.</p>';
        return;
    }

    if (!itens || !itens.length) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10">Em breve, nossos apoiadores aparecerão aqui.</p>';
        return;
    }

    grid.innerHTML = itens.map(a => `
        <article class="card-premium rounded-2xl p-5 flex flex-col items-center text-center mx-auto w-full max-w-xs">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-tr from-teal to-terra flex items-center justify-center mb-3 flex-shrink-0">
                ${a.foto_url
                    ? `<img src="${esc(a.foto_url)}" alt="${esc(a.nome)}" class="w-full h-full object-cover" loading="lazy">`
                    : `<span class="text-white font-bold text-xl font-poppins">${esc(iniciais(a.nome))}</span>`}
            </div>
            <h3 class="font-bold text-gray-800 text-sm leading-tight">${esc(a.nome)}</h3>
            ${a.funcao ? `<p class="text-xs text-gray-500 mt-1">${esc(a.funcao)}</p>` : ''}
        </article>`).join('');
}

// ---------------- CONFIGURAÇÕES (PIX / COLETA) ----------------
async function carregarConfiguracoes() {
    let itens;
    try {
        itens = await sb.select('configuracoes', 'select=*');
    } catch (e) {
        return; // mantém os valores padrão que já estão no HTML
    }

    const cfg = {};
    (itens || []).forEach(i => { cfg[i.chave] = i.valor; });

    const campoPix = document.getElementById('pixKey');
    if (campoPix && cfg.pix_chave) {
        campoPix.value = cfg.pix_chave;
    }

    const titular = document.getElementById('pixTitular');
    if (titular && cfg.pix_titular) {
        titular.textContent = 'Titular: ' + cfg.pix_titular;
        titular.classList.remove('hidden');
    }

    const endereco = document.getElementById('coletaEndereco');
    if (endereco && cfg.coleta_endereco) {
        endereco.innerHTML = esc(cfg.coleta_endereco).replace(/<br\s*\/?>/gi, '<br>');
    }

    const obs = document.getElementById('coletaObservacao');
    if (obs && cfg.coleta_observacao) {
        obs.textContent = cfg.coleta_observacao;
    }

    // QR Code do Site (para folder)
    const siteQr = document.getElementById('siteQrCode');
    if (siteQr) {
        const siteUrl = 'https://aumapiracicaba.org.br/sensoriacao';
        siteQr.src = cfg.site_qrcode
            ? cfg.site_qrcode
            : 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
              encodeURIComponent(siteUrl);
    }

    // Instagram da ONG - atualiza o link da seção "Conheça a AUMA"
    // O link flutuante e do rodapé já estão corretos no HTML, não mexemos neles
    const instagramAumaLink = document.querySelector('#crp .inline-flex.items-center.justify-center.gap-2.bg-gradient-to.r.from-purple-bright.to-pink-500.text-white.px-6.py-3.rounded-xl.font-semibold.text-center');
    if (instagramAumaLink) {
        instagramAumaLink.href = 'https://www.instagram.com/aumapiracicaba?igsh=NTgydGkwbHZnZnlw';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarVitrine();
    carregarApoiadores();
    carregarConfiguracoes();
});