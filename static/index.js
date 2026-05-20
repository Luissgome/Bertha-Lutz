let verificacao = false;
let perguntasEmbaralhadas = [];
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

    const textoPergunta = document.getElementById('textoPergunta');
    if (textoPergunta) {
        configurarAlternativas();
        inicializarQuiz();
    }
});

function configurarAlternativas() {
    for (let i = 0; i < 4; i += 1) {
        const botao = document.getElementById(`btn${i}`);
        if (!botao) continue;
        botao.addEventListener('click', () => {
            proximaPergunta();
        });
    }
}

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

    const botaoVoltar = document.createElement('button');
    botaoVoltar.type = 'button';
    botaoVoltar.textContent = 'Voltar';
    botaoVoltar.style.position = 'relative';
    botaoVoltar.style.right = '1055px';
    botaoVoltar.style.top = '450px';
    verificacao = true;
    
    wrapper.appendChild(inputAcessar);
    wrapper.appendChild(botaoAcessar);
    wrapper.appendChild(botaoVoltar);
    container.appendChild(wrapper);
    botaoVoltar.addEventListener('click', () => {
        wrapper.remove();
        verificacao = false;
    });
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

function embaralharQuestoes(listaOriginal) {
    let listaCopia = [...listaOriginal];
    for (let i = listaCopia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [listaCopia[i], listaCopia[j]] = [listaCopia[j], listaCopia[i]];
    }
    return listaCopia;
}

function inicializarQuiz() {
    perguntasEmbaralhadas = embaralharQuestoes(questoes);
    proximaPergunta();
}

function proximaPergunta() {
    if (perguntasEmbaralhadas.length === 0) {
        console.log("Fim do Quiz! Todas as perguntas foram respondidas.");
        alert("Você concluiu o quiz!");
        return null;
    }

    const questaoAtual = perguntasEmbaralhadas.pop();
    console.log("Questão Atual Sorteada:", questaoAtual);

    renderizarQuestaoNaTela(questaoAtual);

    return questaoAtual;
}

function renderizarQuestaoNaTela(questao) {
    const containerPergunta = document.getElementById('textoPergunta');
    if (containerPergunta) {
        containerPergunta.innerText = questao.pergunta;
    }
    
    questao.opcoes.forEach((opcao, index) => {
        const botaoOpcao = document.getElementById(`btn${index}`);
        if (botaoOpcao) {
            botaoOpcao.innerText = opcao;
        }
    });
}

function mostrarConteudo() {
    const divConteudo = document.getElementById('conteudo');
    
     if (divConteudo === 'none') {
        divConteudo.style.display = 'block';
    } else {
        divConteudo.style.display = 'none';
    }


};
