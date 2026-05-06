let verificacao = false;
function entrarSala() {
    if (verificacao == false) {
        let codigo = document.createElement('input');
        let acessarCodigo = document.createElement('button');
        acessarCodigo.innerHTML = '<button onclick="acessar()" id="acessarId">Acessar</button>';
        codigo.innerHTML = '<input type="text" name="nome" placeholder="Seu nome">';
        document.body.appendChild(codigo);
        document.body.appendChild(acessarCodigo);
        verificacao = true;
    }
}

function acessar() {
    let botaoAcessar = document.getElementById('acessarId');
    let codigo = document.querySelector('input');
    codigo.value = '';
}