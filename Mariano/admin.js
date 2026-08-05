// ===================== ESTADO =====================
let doacoes = [];
let brinquedos = [];
let apoiadores = [];
let configuracoes = {};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
               'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ===================== UTILITÁRIOS =====================
function escapar(txt) {
    return String(txt == null ? '' : txt)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mostrarErro(msg, sucesso = false) {
    const box = document.getElementById('alerta');
    const div = box.querySelector('div');
    div.textContent = msg;
    div.className = sucesso
        ? 'bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3'
        : 'bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3';
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 8000);
}

function formatarData(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
}

function rotuloMes(chave) {
    const [ano, mes] = chave.split('-');
    return `${MESES[Number(mes) - 1]} / ${ano}`;
}

// ===================== SESSÃO =====================
function protegerPagina() {
    const sessao = obterSessao();
    if (!sessao || !sessao.usuario) {
        window.location.replace('index.html');
        return false;
    }
    document.getElementById('nome-admin').textContent = sessao.usuario;
    return true;
}

function sair() {
    encerrarSessao();
    window.location.replace('index.html');
}

// ===================== ABAS =====================
function trocarAba(aba) {
    document.querySelectorAll('.aba').forEach(s => s.classList.add('hidden'));
    document.getElementById('aba-' + aba).classList.remove('hidden');

    document.querySelectorAll('.btn-aba').forEach(b => {
        const ativo = b.dataset.aba === aba;
        b.classList.toggle('tab-ativa', ativo);
        b.classList.toggle('text-gray-600', !ativo);
        b.classList.toggle('hover:bg-gray-100', !ativo);
    });
}

// ===================== CARGA DE DADOS =====================
async function carregarTudo() {
    try {
        const [d, b, a, c] = await Promise.all([
            sb.select('doacoes', 'select=*&order=data.desc'),
            sb.select('brinquedos', 'select=*&order=ordem.asc'),
            sb.select('apoiadores', 'select=*&order=ordem.asc'),
            sb.select('configuracoes', 'select=*')
        ]);
        doacoes = d || [];
        brinquedos = b || [];
        apoiadores = a || [];
        configuracoes = {};
        (c || []).forEach(i => { configuracoes[i.chave] = i.valor; });
    } catch (e) {
        mostrarErro('Não foi possível carregar os dados do Supabase. Verifique se os arquivos supabase_setup.sql e supabase_setup_2.sql já foram executados. Detalhe: ' + e.message);
        return;
    }
    renderizarTudo();
}

function renderizarTudo() {
    renderCards();
    renderVisao();
    renderMensal();
    renderDoacoes();
    renderBrinquedos();
    renderApoiadores();
    preencherConfiguracoes();
}

// ===================== VISÃO GERAL =====================
function totalArrecadado() {
    return doacoes.reduce((s, d) => s + Number(d.valor || 0), 0);
}

function renderCards() {
    document.getElementById('card-total').textContent = formatarMoeda(totalArrecadado());
    document.getElementById('card-total-sub').textContent =
        doacoes.length + (doacoes.length === 1 ? ' lançamento registrado' : ' lançamentos registrados');

    const atingidos = brinquedos.reduce((s, b) => s + Number(b.atingidos || 0), 0);
    const meta = brinquedos.reduce((s, b) => s + Number(b.meta || 0), 0);
    document.getElementById('card-brinq').textContent = atingidos;
    document.getElementById('card-brinq-meta').textContent = meta;
    document.getElementById('card-brinq-barra').style.width =
        (meta > 0 ? Math.min(100, (atingidos / meta) * 100) : 0) + '%';

}

function percentual(b) {
    const meta = Number(b.meta || 0);
    return meta > 0 ? Math.min(100, (Number(b.atingidos || 0) / meta) * 100) : 0;
}

function renderVisao() {
    const corpo = document.getElementById('tabela-visao');
    if (!brinquedos.length) {
        corpo.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Nenhum brinquedo cadastrado.</td></tr>';
        return;
    }
    corpo.innerHTML = brinquedos.map(b => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        ${b.imagem_url ? `<img src="${escapar(b.imagem_url)}" class="w-full h-full object-cover" alt="">` : ''}
                    </div>
                    <span class="font-bold text-gray-800">${escapar(b.nome)}</span>
                </div>
            </td>
            <td class="px-6 py-4"><span class="px-2 py-1 bg-terra/10 text-terra rounded text-xs font-bold">${escapar(b.categoria) || '—'}</span></td>
            <td class="px-6 py-4 w-48">
                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-terra" style="width:${percentual(b)}%"></div>
                </div>
            </td>
            <td class="px-6 py-4 text-center font-semibold text-gray-800">${Number(b.atingidos || 0)}</td>
            <td class="px-6 py-4 text-center text-gray-500">${Number(b.meta || 0)}</td>
        </tr>`).join('');
}

// ===================== ARRECADAÇÃO =====================
function agruparPorMes() {
    const mapa = {};
    doacoes.forEach(d => {
        const chave = (d.data || '').slice(0, 7);
        if (!chave) return;
        if (!mapa[chave]) mapa[chave] = { chave, qtd: 0, total: 0 };
        mapa[chave].qtd += 1;
        mapa[chave].total += Number(d.valor || 0);
    });
    return Object.values(mapa).sort((a, b) => b.chave.localeCompare(a.chave));
}

function renderMensal() {
    const meses = agruparPorMes();
    const corpo = document.getElementById('tabela-mensal');
    corpo.innerHTML = meses.length
        ? meses.map(m => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-semibold text-gray-800">${rotuloMes(m.chave)}</td>
                <td class="px-4 py-3 text-center">${m.qtd}</td>
                <td class="px-4 py-3 text-right font-semibold">${formatarMoeda(m.total)}</td>
            </tr>`).join('')
        : '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">Nenhum valor lançado ainda.</td></tr>';

    document.getElementById('mensal-qtd').textContent = doacoes.length;
    document.getElementById('mensal-total').textContent = formatarMoeda(totalArrecadado());
}

function renderDoacoes() {
    const corpo = document.getElementById('tabela-doacoes');
    if (!doacoes.length) {
        corpo.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Nenhum lançamento registrado.</td></tr>';
        return;
    }
    corpo.innerHTML = doacoes.map(d => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">${formatarData(d.data)}</td>
            <td class="px-6 py-4 font-semibold text-gray-800">${escapar(d.doador) || '—'}</td>
            <td class="px-6 py-4">${escapar(d.descricao) || '—'}</td>
            <td class="px-6 py-4">${escapar(d.metodo)}</td>
            <td class="px-6 py-4 text-right font-bold text-gray-800">${formatarMoeda(d.valor)}</td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <button onclick="editarDoacao('${d.id}')" class="text-teal hover:text-teal/70 font-semibold text-sm mr-3">Editar</button>
                <button onclick="excluirDoacao('${d.id}')" class="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
            </td>
        </tr>`).join('');
}

function limparFormDoacao() {
    document.getElementById('doacao-id').value = '';
    document.getElementById('doacao-valor').value = '';
    document.getElementById('doacao-doador').value = '';
    document.getElementById('doacao-descricao').value = '';
    document.getElementById('doacao-metodo').value = 'Pix';
    document.getElementById('doacao-data').value = new Date().toISOString().slice(0, 10);
}

async function salvarDoacao(evento) {
    evento.preventDefault();
    const id = document.getElementById('doacao-id').value;
    const dados = {
        valor: Number(document.getElementById('doacao-valor').value || 0),
        doador: document.getElementById('doacao-doador').value.trim(),
        descricao: document.getElementById('doacao-descricao').value.trim(),
        metodo: document.getElementById('doacao-metodo').value,
        data: document.getElementById('doacao-data').value
    };
    try {
        if (id) {
            await sb.update('doacoes', id, dados);
        } else {
            await sb.insert('doacoes', dados);
        }
        limparFormDoacao();
        await carregarTudo();
    } catch (e) {
        mostrarErro('Erro ao salvar o valor: ' + e.message);
    }
}

function editarDoacao(id) {
    const d = doacoes.find(x => x.id === id);
    if (!d) return;
    document.getElementById('doacao-id').value = d.id;
    document.getElementById('doacao-valor').value = d.valor;
    document.getElementById('doacao-doador').value = d.doador || '';
    document.getElementById('doacao-descricao').value = d.descricao || '';
    document.getElementById('doacao-metodo').value = d.metodo || 'Pix';
    document.getElementById('doacao-data').value = d.data;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirDoacao(id) {
    if (!confirm('Excluir este lançamento?')) return;
    try {
        await sb.remove('doacoes', id);
        await carregarTudo();
    } catch (e) {
        mostrarErro('Erro ao excluir: ' + e.message);
    }
}

// ===================== BRINQUEDOS =====================
function renderBrinquedos() {
    const corpo = document.getElementById('tabela-brinquedos');
    if (!brinquedos.length) {
        corpo.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Nenhum brinquedo cadastrado.</td></tr>';
        return;
    }
    corpo.innerHTML = brinquedos.map(b => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                        ${b.imagem_url ? `<img src="${escapar(b.imagem_url)}" class="w-full h-full object-cover" alt="">` : ''}
                    </div>
                    <div>
                        <p class="font-bold text-gray-800">${escapar(b.nome)}</p>
                        <p class="text-xs text-gray-400">${escapar(b.categoria) || '—'}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 w-48">
                <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-terra" style="width:${percentual(b)}%"></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">${percentual(b).toFixed(0)}%</p>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="inline-flex items-center gap-2">
                    <button onclick="ajustarAtingidos('${b.id}', -1)" class="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold">−</button>
                    <span class="font-bold text-gray-800 min-w-[54px] inline-block">${Number(b.atingidos || 0)} / ${Number(b.meta || 0)}</span>
                    <button onclick="ajustarAtingidos('${b.id}', 1)" class="w-7 h-7 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${b.visivel ? 'checked' : ''} onchange="alternarVisivel('${b.id}', this.checked)" class="w-4 h-4 text-teal rounded border-gray-300 focus:ring-teal">
                </label>
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <button onclick="editarBrinquedo('${b.id}')" class="text-teal hover:text-teal/70 font-semibold text-sm mr-3">Editar</button>
                <button onclick="excluirBrinquedo('${b.id}')" class="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
            </td>
        </tr>`).join('');
}

function limparFormBrinquedo() {
    document.getElementById('brinquedo-id').value = '';
    document.getElementById('brinquedo-nome').value = '';
    document.getElementById('brinquedo-categoria').value = '';
    document.getElementById('brinquedo-imagem').value = '';
    document.getElementById('brinquedo-link').value = '';
    document.getElementById('brinquedo-meta').value = 0;
    document.getElementById('brinquedo-meta-valor').textContent = '0';
    document.getElementById('brinquedo-visivel').checked = false;
    document.getElementById('titulo-form-brinquedo').textContent = 'Adicionar Brinquedo';
}

async function salvarBrinquedo(evento) {
    evento.preventDefault();
    const id = document.getElementById('brinquedo-id').value;
    const link = document.getElementById('brinquedo-link').value.trim();
    const dados = {
        nome: document.getElementById('brinquedo-nome').value.trim(),
        categoria: document.getElementById('brinquedo-categoria').value.trim(),
        imagem_url: document.getElementById('brinquedo-imagem').value.trim(),
        meta: Number(document.getElementById('brinquedo-meta').value || 0),
        visivel: document.getElementById('brinquedo-visivel').checked
    };
    if (link) dados.link = link;

    try {
        if (id) {
            await sb.update('brinquedos', id, dados);
        } else {
            dados.ordem = brinquedos.length + 1;
            await sb.insert('brinquedos', dados);
        }
        limparFormBrinquedo();
        await carregarTudo();
    } catch (e) {
        // Se a coluna "link" ainda não existir no banco (PGRST204),
        // tenta salvar sem ela até o supabase_setup_2.sql ser executado.
        if (dados.link && (String(e.message).includes('PGRST204') || String(e.message).includes('link'))) {
            delete dados.link;
            try {
                if (id) {
                    await sb.update('brinquedos', id, dados);
                } else {
                    dados.ordem = brinquedos.length + 1;
                    await sb.insert('brinquedos', dados);
                }
                limparFormBrinquedo();
                await carregarTudo();
                mostrarErro('Brinquedo salvo! Dica: execute o supabase_setup_2.sql para ativar o campo Link.', true);
                return;
            } catch (e2) {
                mostrarErro('Erro ao salvar o brinquedo: ' + e2.message);
                return;
            }
        }
        mostrarErro('Erro ao salvar o brinquedo: ' + e.message);
    }
}

function editarBrinquedo(id) {
    const b = brinquedos.find(x => x.id === id);
    if (!b) return;
    document.getElementById('brinquedo-id').value = b.id;
    document.getElementById('brinquedo-nome').value = b.nome;
    document.getElementById('brinquedo-categoria').value = b.categoria || '';
    document.getElementById('brinquedo-imagem').value = b.imagem_url || '';
    document.getElementById('brinquedo-link').value = b.link || '';
    document.getElementById('brinquedo-meta').value = b.meta || 0;
    document.getElementById('brinquedo-meta-valor').textContent = b.meta || 0;
    document.getElementById('brinquedo-visivel').checked = !!b.visivel;
    document.getElementById('titulo-form-brinquedo').textContent = 'Editar Brinquedo';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function adicionarNovoBrinquedo() {
    limparFormBrinquedo();
    const form = document.getElementById('brinquedo-form') || document.querySelector('#aba-brinquedos form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function alternarVisivel(id, visivel) {
    try {
        await sb.update('brinquedos', id, { visivel });
        const b = brinquedos.find(x => x.id === id);
        if (b) b.visivel = visivel;
    } catch (e) {
        mostrarErro('Erro ao atualizar visibilidade: ' + e.message);
        renderBrinquedos();
    }
}

async function ajustarAtingidos(id, delta) {
    const b = brinquedos.find(x => x.id === id);
    if (!b) return;
    const novo = Math.max(0, Number(b.atingidos || 0) + delta);
    try {
        await sb.update('brinquedos', id, { atingidos: novo });
        b.atingidos = novo;
        renderCards();
        renderVisao();
        renderBrinquedos();
    } catch (e) {
        mostrarErro('Erro ao atualizar: ' + e.message);
    }
}

async function excluirBrinquedo(id) {
    if (!confirm('Excluir este brinquedo?')) return;
    try {
        await sb.remove('brinquedos', id);
        await carregarTudo();
    } catch (e) {
        mostrarErro('Erro ao excluir: ' + e.message);
    }
}

// ===================== APOIADORES =====================
function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).slice(0, 2)
        .map(p => p[0]).join('').toUpperCase();
}

function renderApoiadores() {
    const corpo = document.getElementById('tabela-apoiadores');
    if (!apoiadores.length) {
        corpo.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Nenhum apoiador cadastrado.</td></tr>';
        return;
    }
    corpo.innerHTML = apoiadores.map(a => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-teal to-terra flex items-center justify-center flex-shrink-0">
                        ${a.foto_url
                            ? `<img src="${escapar(a.foto_url)}" class="w-full h-full object-cover" alt="">`
                            : `<span class="text-white font-bold text-xs">${escapar(iniciais(a.nome))}</span>`}
                    </div>
                    <span class="font-bold text-gray-800">${escapar(a.nome)}</span>
                </div>
            </td>
            <td class="px-6 py-4">${escapar(a.funcao) || '—'}</td>
            <td class="px-6 py-4 text-center text-gray-500">${Number(a.ordem || 0)}</td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <button onclick="editarApoiador('${a.id}')" class="text-teal hover:text-teal/70 font-semibold text-sm mr-3">Editar</button>
                <button onclick="excluirApoiador('${a.id}')" class="text-red-500 hover:text-red-400 font-semibold text-sm">Excluir</button>
            </td>
        </tr>`).join('');
}

function limparFormApoiador() {
    document.getElementById('apoiador-id').value = '';
    document.getElementById('apoiador-nome').value = '';
    document.getElementById('apoiador-funcao').value = '';
    document.getElementById('apoiador-foto').value = '';
    document.getElementById('apoiador-ordem').value = apoiadores.length + 1;
    document.getElementById('titulo-form-apoiador').textContent = 'Adicionar Apoiador';
}

async function salvarApoiador(evento) {
    evento.preventDefault();
    const id = document.getElementById('apoiador-id').value;
    const dados = {
        nome: document.getElementById('apoiador-nome').value.trim(),
        funcao: document.getElementById('apoiador-funcao').value.trim(),
        foto_url: document.getElementById('apoiador-foto').value.trim(),
        ordem: Number(document.getElementById('apoiador-ordem').value || 0)
    };
    try {
        if (id) {
            await sb.update('apoiadores', id, dados);
        } else {
            await sb.insert('apoiadores', dados);
        }
        limparFormApoiador();
        await carregarTudo();
    } catch (e) {
        mostrarErro('Erro ao salvar o apoiador: ' + e.message);
    }
}

function editarApoiador(id) {
    const a = apoiadores.find(x => x.id === id);
    if (!a) return;
    document.getElementById('apoiador-id').value = a.id;
    document.getElementById('apoiador-nome').value = a.nome;
    document.getElementById('apoiador-funcao').value = a.funcao || '';
    document.getElementById('apoiador-foto').value = a.foto_url || '';
    document.getElementById('apoiador-ordem').value = a.ordem || 0;
    document.getElementById('titulo-form-apoiador').textContent = 'Editar Apoiador';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirApoiador(id) {
    if (!confirm('Excluir este apoiador?')) return;
    try {
        await sb.remove('apoiadores', id);
        await carregarTudo();
    } catch (e) {
        mostrarErro('Erro ao excluir: ' + e.message);
    }
}

// ===================== PIX & SITE =====================
function preencherConfiguracoes() {
    document.getElementById('cfg-pix-chave').value = configuracoes.pix_chave || '';
    document.getElementById('cfg-pix-titular').value = configuracoes.pix_titular || '';
    document.getElementById('cfg-pix-qrcode').value = configuracoes.pix_qrcode || '';
    document.getElementById('cfg-coleta-endereco').value = configuracoes.coleta_endereco || '';
    document.getElementById('cfg-coleta-observacao').value = configuracoes.coleta_observacao || '';
    atualizarPreviaQr();
}

function atualizarPreviaQr() {
    const url = document.getElementById('cfg-pix-qrcode').value.trim();
    const chave = document.getElementById('cfg-pix-chave').value.trim();
    document.getElementById('cfg-qr-previa').src = url
        ? url
        : 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(chave);
}

async function salvarConfiguracoes(evento) {
    evento.preventDefault();
    const valores = {
        pix_chave: document.getElementById('cfg-pix-chave').value.trim(),
        pix_titular: document.getElementById('cfg-pix-titular').value.trim(),
        pix_qrcode: document.getElementById('cfg-pix-qrcode').value.trim(),
        coleta_endereco: document.getElementById('cfg-coleta-endereco').value.trim(),
        coleta_observacao: document.getElementById('cfg-coleta-observacao').value.trim()
    };

    const linhas = Object.keys(valores).map(chave => ({
        chave, valor: valores[chave], atualizado_em: new Date().toISOString()
    }));

    try {
        await sbRequest('configuracoes?on_conflict=chave', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(linhas)
        });
        configuracoes = valores;
        const aviso = document.getElementById('cfg-salvo');
        aviso.classList.remove('hidden');
        setTimeout(() => aviso.classList.add('hidden'), 4000);
    } catch (e) {
        mostrarErro('Erro ao salvar as configurações: ' + e.message);
    }
}

// ===================== EXPORTAÇÃO EXCEL =====================
function exportarExcel(tipo) {
    const wb = XLSX.utils.book_new();
    const hoje = new Date().toISOString().slice(0, 10);

    const linhasMensal = agruparPorMes().map(m => ({
        'Mês': rotuloMes(m.chave),
        'Lançamentos': m.qtd,
        'Total (R$)': Number(m.total.toFixed(2))
    }));

    const linhasDoacoes = doacoes.map(d => ({
        'Data': formatarData(d.data),
        'Doador': d.doador || '',
        'Descrição': d.descricao || '',
        'Método': d.metodo || '',
        'Valor (R$)': Number(Number(d.valor || 0).toFixed(2))
    }));

    const linhasBrinquedos = brinquedos.map(b => ({
        'Brinquedo': b.nome,
        'Categoria': b.categoria || '',
        'Atingidos': Number(b.atingidos || 0),
        'Meta': Number(b.meta || 0),
        'Progresso (%)': Number(percentual(b).toFixed(1))
    }));

    if (tipo === 'mensal') {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasMensal), 'Arrecadação Mensal');
        XLSX.writeFile(wb, `arrecadacao-mensal-${hoje}.xlsx`);
        return;
    }

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasMensal), 'Arrecadação Mensal');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasDoacoes), 'Lançamentos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhasBrinquedos), 'Brinquedos');
    XLSX.writeFile(wb, `sensoriacao-relatorio-${hoje}.xlsx`);
}

// ===================== UPLOAD DE IMAGEM =====================
async function uploadImagem(input, campoId) {
    const arquivo = input.files && input.files[0];
    if (!arquivo) return;

    // Valida se é imagem
    if (!arquivo.type.startsWith('image/')) {
        mostrarErro('Selecione um arquivo de imagem válido.');
        input.value = '';
        return;
    }

    // Limita a 5MB
    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarErro('A imagem deve ter no máximo 5MB.');
        input.value = '';
        return;
    }

    const campo = document.getElementById(campoId);
    if (!campo) return;

    // Gera nome único para o arquivo
    const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
    const nome = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;

    try {
        const url = await sb.upload('imagens', nome, arquivo);
        campo.value = url;
        if (campoId === 'cfg-pix-qrcode') {
            atualizarPreviaQr();
        }
        mostrarErro('✓ Imagem enviada com sucesso!', true);
    } catch (e) {
        mostrarErro('Erro ao enviar imagem: ' + e.message);
    } finally {
        input.value = '';
    }
}

// ===================== INICIALIZAÇÃO =====================
document.addEventListener('DOMContentLoaded', () => {
    if (!protegerPagina()) return;
    limparFormDoacao();
    carregarTudo();
});
