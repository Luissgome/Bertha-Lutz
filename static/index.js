let verificacao = false;
const socket = io();
const senhaGerada = gerarCodigo();

function getCodigoSalaDaUrl() {
    const segmentos = window.location.pathname.split('/').filter(Boolean);
    if (segmentos.length >= 2 && segmentos[0] === 'quiz') return segmentos[1];
    return null;
}

function getNomeDaQueryOuInput() {
    const params = new URLSearchParams(window.location.search);
    const nomeQuery = params.get('nome');
    if (nomeQuery) return nomeQuery.trim();
    const input = document.getElementById('inputNome');
    return input ? input.value.trim() : '';
}

function criarSala() {
    const nome_aluno = document.getElementById('inputNome').value.trim();

    if (!nome_aluno) {
        alert('Digite seu nome antes de criar a sala.');
        return;
    }

    socket.emit('registrar_rota', { codigo: senhaGerada, nome: nome_aluno }, (res) => {
        if (res && res.status === 'ok') {
            const params = new URLSearchParams({
                nome: nome_aluno,
                role: 'criador'
            });
            socket.emit('criador_sala', { role: 'criador' });
            window.location.href = `/quiz/${senhaGerada}?${params.toString()}`;
            return;
        }
        alert('Erro ao criar a sala. Tente novamente.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');

    if (role === 'criador') {
        const botaoIniciar = document.getElementById('btnIniciarQuiz');
        if (botaoIniciar) botaoIniciar.style.display = 'block';
    }

    mostrarCodigoSalaAtual();
});

function iniciarJogo() {
    const sala = getCodigoSalaDaUrl();
    const nome_aluno = getNomeDaQueryOuInput();

    if (!sala) {
        alert('Código da sala inválido.');
        return;
    }
    if (!nome_aluno) {
        alert('Digite seu nome antes de iniciar o quiz.');
        return;
    }

    socket.emit('começar_quiz_sala', { sala: sala, nome: nome_aluno });

    const params = new URLSearchParams({
        nome: nome_aluno,
        role: 'criador'
    });

    window.location.href = `/quiz/${sala}/questoes?${params.toString()}`;
}

socket.on('quiz_iniciar', () => {
    const sala = getCodigoSalaDaUrl();
    const search = window.location.search || '';
    if (!sala) return;
    window.location.href = `/quiz/${sala}/questoes${search}`;
});

function entrarSala() {
    if (verificacao) {
        return;
    }

    const container = document.getElementById('divDeSalas') || document.body;
    const wrapper = document.createElement('div');
    wrapper.id = 'acessoSalaWrapper';

    const inputAcessar = document.createElement('input');
    inputAcessar.type = 'text';
    inputAcessar.name = 'senha';
    inputAcessar.placeholder = 'Código da sala';
    inputAcessar.id = 'codigoSalaInput';

    const botaoAcessar = document.createElement('button');
    botaoAcessar.type = 'button';
    botaoAcessar.textContent = 'Acessar';
    botaoAcessar.addEventListener('click', acessar);

    wrapper.appendChild(inputAcessar);
    wrapper.appendChild(botaoAcessar);
    container.appendChild(wrapper);
    verificacao = true;
}

function acessar() {
    const input = document.getElementById('codigoSalaInput');
    const codigo = input ? input.value.trim() : '';
    const nome_aluno = document.getElementById('inputNome').value.trim();

    if (!codigo) {
        alert('Digite o código da sala para acessar.');
        return;
    }
    if (!nome_aluno) {
        alert('Digite seu nome antes de acessar a sala.');
        return;
    }

    const params = new URLSearchParams({
        nome: nome_aluno,
        role: 'membro'
    });
    window.location.href = `/quiz/${codigo}?${params.toString()}`;
}

function gerarCodigo() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let senha = '';

    for (let i = 0; i < 4; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        senha += caracteres[indiceAleatorio];
    }

    return senha;
}

function mostrarCodigoSalaAtual() {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get('nome');
    const role = params.get('role');
    const roleTexto = role === 'criador' ? 'Criador da sala' : role === 'membro' ? 'Membro' : 'Visitante';
    const div = document.getElementById('divCodigo');

    if (!div || !nome) {
        return;
    }

    const infoSessao = document.createElement('div');
    infoSessao.id = 'infoSessao';
    infoSessao.innerHTML = `
        <p><strong>Nome:</strong> ${nome}</p>
        <p>${roleTexto}</p>
    `;
    div.appendChild(infoSessao);
}