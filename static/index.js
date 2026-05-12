let verificacao = false;
const socket = io();


function criarSala() {
    const senhaGerada = gerarCodigo();

    socket.emit('registrar_rota', { codigo: senhaGerada});
}

function entrarSala() {
    if (verificacao == false) {
        let inputAcessar = document.createElement('input');
        let botaoAcessar = document.createElement('button');
        botaoAcessar.innerHTML = '<button onclick="acessar()" id="acessarId">Acessar</button>';
        inputAcessar.innerHTML = '<input type="text" name="nome" placeholder="Seu nome">';
        document.body.appendChild(inputAcessar);
        document.body.appendChild(botaoAcessar);
        verificacao = true;
    }
}

function acessar() {
    let botaoAcessar = document.getElementById('acessarId');
    let codigo = document.querySelector('input');
    codigo.value = '';
}

function gerarCodigo() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let senha = '';
    let divCodigo = document.getElementById('divCodigo');
    let codigoGerado = document.createElement('p');
    divCodigo.appendChild(codigoGerado);
    
    for (let i = 0; i < 4; i++) {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        senha += caracteres[indiceAleatorio];
    }
    
    codigoGerado.innerText = senha;
  return senha;
}

