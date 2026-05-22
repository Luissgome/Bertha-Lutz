let verificacao = false;
let perguntasEmbaralhadas = [];
const socket = io();
const senhaGerada = gerarCodigo();

let acertosContador = 0;
let questaoAtual = null;

function getCodigoSalaDaUrl() {
    const segmentos = window.location.pathname.split('/').filter(Boolean);
    if (segmentos.length >= 2 && (segmentos[0] === 'quiz' || segmentos[0] === 'professor-admin')) return segmentos[1];
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
    const criador = 'CRIADOR';

    if (!nome_aluno) {
        alert('Digite seu nome antes de criar a sala.');
        return;
    }

    socket.emit('registrar_rota', { codigo: senhaGerada, nome: nome_aluno, cargo: 'CRIADOR' }, (res) => {
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

    const sala = getCodigoSalaDaUrl();
    if (sala) {
        socket.emit('enviando_informacoes', { codigo: sala });
        if (window.location.pathname.startsWith('/professor-admin')) {
            socket.emit('buscar_ranking', { sala });
            setInterval(() => socket.emit('buscar_ranking', { sala }), 5000);
        }
    }

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
            selecionarResposta(i);
        });
    }
}

function selecionarResposta(index) {
    if (!questaoAtual) {
        return;
    }

    const opcaoEscolhida = questaoAtual.opcoes[index];
    if (opcaoEscolhida === questaoAtual.resposta) {
        acertosContador += 1;
    }

    proximaPergunta();
}

function iniciarJogo() {
    const sala = getCodigoSalaDaUrl();
    const nome_aluno = getNomeDaQueryOuInput();
    const cargo = 'CRIADOR';
    const MEMBRO = 'MEMBRO';
    if (!sala) {
        alert('Código da sala inválido.');
        return;
    }
    if (!nome_aluno) {
        alert('Digite seu nome antes de iniciar o quiz.');
        return;
    }

    socket.emit('começar_quiz_sala', { sala: sala, nome: nome_aluno, MEMBRO: MEMBRO, cargo: cargo });

    const params = new URLSearchParams({
        nome: nome_aluno,
        role: 'criador'
    });

    socket.emit('criador_sala', { role: 'criador' });
    window.location.href = `/professor-admin/${sala}?${params.toString()}`;
}

socket.on('quiz_iniciar', () => {
    const sala = getCodigoSalaDaUrl();
    const search = window.location.search || '';
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');

    if (!sala || role === 'criador') return;
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
    const cargo = 'membro';

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
    socket.emit('registrando_membros', { codigo: codigo, nome: nome_aluno, cargo : 'MEMBRO', conteudo_js : "ACESSOU_SALA" }, (res) => {
        if (res && res.status === 'ok') {
            window.location.href = `/quiz/${codigo}?${params.toString()}`;
            return;
        }
        alert('Erro ao acessar a sala: ' + (res && res.mensagem ? res.mensagem : 'Erro no banco de dados'));
    });
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

    let infoSessao = document.getElementById('infoSessao');
    if (!infoSessao) {
        infoSessao = document.createElement('div');
        infoSessao.id = 'infoSessao';
        div.appendChild(infoSessao);
    }

    infoSessao.innerHTML = `
        <p><strong>Nome:</strong> ${nome}</p>
        <p>${roleTexto}</p>
    `;
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
    acertosContador = 0;
    questaoAtual = null;
    proximaPergunta();
}

function proximaPergunta() {
    if (perguntasEmbaralhadas.length === 0) {
        console.log("Fim do Quiz! Todas as perguntas foram respondidas.");

        const params = new URLSearchParams(window.location.search);
        const role = params.get('role');
        const nome_aluno = getNomeDaQueryOuInput();
        const sala = getCodigoSalaDaUrl();

        if (role === 'membro') {
            if (sala && nome_aluno) {
                socket.emit('enviar_progresso', {
                    id: sala,
                    nome: nome_aluno,
                    codigo: sala,
                    acertos: acertosContador
                });
            }
            const redirectParams = new URLSearchParams({ nome: nome_aluno, acertos: acertosContador });
            window.location.href = `/agradecimento?${redirectParams.toString()}`;
            return null;
        }

        alert("Quiz concluído!");
        return null;
    }

    questaoAtual = perguntasEmbaralhadas.pop();
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

socket.on('atualizar_informacoes', (informacoes) => {
    const membrosList = document.getElementById('membrosLista');
    if (!membrosList) return;
    membrosList.innerHTML = '';

    informacoes.forEach((info) => {
        const li = document.createElement('li');
        li.textContent = `${info.nome_aluno}`;
        li.style.margin = '0px';
        li.style.fontSize = '18px';
        membrosList.appendChild(li);
    });
});

socket.on('atualizar_ranking', (ranking) => {
    const rankingLista = document.getElementById('rankingLista');
    if (!rankingLista) return;

    rankingLista.innerHTML = '';
    if (!ranking || ranking.length === 0) {
        rankingLista.innerHTML = '<p>Nenhum participante com acertos registrados ainda.</p>';
        return;
    }

    ranking.forEach((item, index) => {
        const linha = document.createElement('div');
        linha.className = 'ranking-item';
        linha.innerHTML = `<span>${index + 1}. ${item.nome_aluno}</span><strong>${item.acertos || 0} acertos</strong>`;
        rankingLista.appendChild(linha);
    });
});

function telaCriador() {
    const nome_aluno = document.getElementById('inputNome').value.trim();
    let main = document.getElementById('mainContent');
    const params = new URLSearchParams({ nome: nome_aluno });
    if (window.location.href === `/quiz/${senhaGerada}?${params.toString()}&role=criador`) {
        if (main && main.parentNode) {
            main.parentNode.removeChild(main);
        }
    }
}

const imagens = [
    "static/imgs/bertha lutz1.jpg",
    "static/imgs/bertha lutz2.jpg",
    "static/imgs/bertha lutz3.jpg",
    "static/imgs/bertha lutz4.jpg",
    "static/imgs/bertha lutz5.jpg",
    "static/imgs/bertha lutz6.jpg",
    "static/imgs/bertha lutz7.jpg",
    "static/imgs/bertha lutz8.jpg",
    "static/imgs/bertha lutz9.jpg",
    "static/imgs/bertha lutz10.jpg",
    "static/imgs/bertha lutz11.jpg",
    
];

let indiceAtual = 0;

function atualizarTelaSlides() {
    const imagemEl = document.getElementById("imagem-atual");
    const btnVoltar = document.getElementById("btn-voltar");
    const btnProximo = document.getElementById("btn-proximo");
    const btnFechar = document.getElementById("btn-fechar");

    if (!imagemEl) return;

    imagemEl.src = imagens[indiceAtual];

    if (indiceAtual === 0) {
        btnVoltar.classList.add("oculto");
    } else {
        btnVoltar.classList.remove("oculto");
    }

    if (indiceAtual === imagens.length - 1) {
        btnProximo.classList.add("oculto");
        btnFechar.classList.remove("oculto");
    } else {
        btnProximo.classList.remove("oculto");
        btnFechar.classList.add("oculto");
    }
}

function abrirSlides() {
    indiceAtual = 0; 
    document.getElementById("container-slides").classList.remove("oculto");
    atualizarTelaSlides();
}

function fecharSlides() {
    document.getElementById("container-slides").classList.add("oculto");
}

function mudarSlide(direcao) {
    indiceAtual += direcao;
    atualizarTelaSlides();
}