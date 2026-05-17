let verificacao = false;
const socket = io();

function criarSala() {
    const senhaGerada = gerarCodigo();
    const nome_aluno = document.getElementById('inputNome').value.trim();
    

    
    if (!nome_aluno) {
        alert('Digite seu nome antes de criar a sala.');
        return;
    }

    socket.emit('registrar_rota', { codigo: senhaGerada, nome: nome_aluno }, (res) => {
        if (res && res.status === 'ok') {
            window.location.href = `/quiz/${senhaGerada}`;
            
            return;
        }
        alert('Erro ao criar a sala. Tente novamente.');
    });
    const nomeDoAluno = document.getElementById('nomeDoAluno');
    nomeDoAluno.innerText = `Nome: ${nome_aluno}`;
}

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

    window.location.href = `/quiz/${codigo}`;
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
    const path = window.location.pathname;
    const partes = path.split('/').filter(Boolean);

    if (partes.length === 2 && partes[0] === 'quiz') {
        const codigoDaSala = partes[1];
        const div = document.getElementById('divCodigo');
        if (div) {
            const textoCodigo = document.createElement('h2');
            div.insertBefore(textoCodigo, div.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', mostrarCodigoSalaAtual);



