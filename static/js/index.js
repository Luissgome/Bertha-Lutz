let verificacao = false
function criarSala() {
    if (verificacao == false) {
        let codigo = document.createElement('input');
        codigo.innerHTML = '<input type="text" name="nome" placeholder="Seu nome">';
        document.body.appendChild(codigo);
        verificacao = true;
    }
}