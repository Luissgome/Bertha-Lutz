import eventlet
eventlet.monkey_patch()
import mysql.connector
import os
from mysql.connector import Error
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pinbas'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

db_host = os.environ.get("MYSQLHOST", "localhost")
db_user = os.environ.get("MYSQLUSER", "root")
db_password = os.environ.get("MYSQLPASSWORD", "Luis050810.")
db_database = os.environ.get("MYSQLDATABASE", "Local instance MySQL80")
db_port = int(os.environ.get("MYSQLPORT", 3306))

banco = {
    "host": db_host,
    "user": db_user,
    "password": db_password,
    "database": db_database,
    "port": db_port
}

def executar_query(sql, valores=None):
    conexao = None
    cursor = None
    try:
        conexao = mysql.connector.connect(**banco)
        cursor = conexao.cursor()
        if valores:
            cursor.execute(sql, valores)
        else:
            cursor.execute(sql)
        conexao.commit()
        return True
    except Error as e:
        print(f"Erro no MySQL: {e}")
        return str(e)
    finally:
        if cursor is not None:
            cursor.close()
        if conexao is not None and conexao.is_connected():
            conexao.close()


def emitir_informacoes_sala(codigo):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
    query = "SELECT nome_aluno, cargo, acertos FROM codigos_temporarios WHERE id_sessao = %s"
    cursor.execute(query, (codigo,))
    informacoes = cursor.fetchall()
    cursor.close()
    conexao.close()
    emit('atualizar_informacoes', informacoes, broadcast=True)
    return informacoes


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/professor-admin/<codigo_da_sala>')
def admin(codigo_da_sala):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
    cursor.execute(
        "SELECT id_sessao, nome_aluno, cargo FROM codigos_temporarios WHERE id_sessao = %s AND cargo = 'CRIADOR'",
        (codigo_da_sala,)
    )
    informacoes = cursor.fetchall()
    cursor.close()
    conexao.close()
    return render_template('admin.html', informacoes=informacoes, sala=codigo_da_sala)

@app.route('/quiz')
def iniciar():
    return render_template('quiz.html')

@socketio.on('registrar_rota')                                                  # ROTA
def registrar_rota(dados):
    codigo = dados.get('codigo')
    nome = dados.get('nome')
    cargo = dados.get('cargo', 'criador')
    if not codigo or not nome:
        return {'status': 'erro', 'mensagem': 'Código e nome são obrigatórios'}

    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, cargo, conteudo_js) VALUES (%s, %s, %s, %s)"
    sucesso = executar_query(sql, (codigo, nome, cargo, "SALA_CRIADA"))
    if sucesso is True:
        return {'status': 'ok'}
    return {'status': 'erro', 'mensagem': f'Erro ao gravar no banco: {sucesso}'}

@app.route('/quiz/<codigo_da_sala>/questoes')
def acessar_questoes(codigo_da_sala):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True, buffered=True)
    cursor.execute("SELECT id_sessao FROM codigos_temporarios WHERE id_sessao = %s", (codigo_da_sala,))
    resultado = cursor.fetchone()
    cursor.close()
    conexao.close()

    if resultado:
        return render_template('perguntas.html', sala=codigo_da_sala)
    else:
        return "<h1>Sala não encontrada!</h1>", 404

@app.route('/quiz/<codigo_da_sala>')
def acessar_quiz(codigo_da_sala):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True, buffered=True)
    cursor.execute("SELECT id_sessao FROM codigos_temporarios WHERE id_sessao = %s", (codigo_da_sala,))
    resultado = cursor.fetchone()
    cursor.close()
    conexao.close()

    if resultado:
        return render_template('quiz.html', sala=codigo_da_sala)
    else:
        return "<h1>Sala não encontrada!</h1>", 404

@app.route('/gabarito')
def gabarito():
    return render_template('gabarito.html')

@app.route('/agradecimento')
def agradecimento():
    nome = request.args.get('nome', '')
    acertos = request.args.get('acertos', '0')
    return render_template('agradecimento.html', nome=nome, acertos=acertos)

@socketio.on('enviar_progresso')
def salvar_progresso(dados):
    id_sessao = dados.get('id')
    nome = dados.get('nome')
    codigo = dados.get('codigo')
    acertos = dados.get('acertos', 0)

    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, conteudo_js, acertos) VALUES (%s, %s, %s, %s)"
    executar_query(sql, (id_sessao, nome, codigo, acertos))


@socketio.on('começar_quiz_sala')
def comecar_quiz_sala(dados):
    sala = dados.get('sala')
    nome = dados.get('nome')

    emit('quiz_iniciar', {'sala': sala, 'nome': nome}, broadcast=True)

@socketio.on('buscar_ranking')
def enviar_ranking(dados=None):
    dados = dados or {}
    sala = dados.get('sala')
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
    if sala:
        sql = "SELECT nome_aluno, acertos FROM codigos_temporarios WHERE id_sessao = %s AND acertos IS NOT NULL ORDER BY acertos DESC LIMIT 10"
        cursor.execute(sql, (sala,))
    else:
        sql = "SELECT nome_aluno, acertos FROM codigos_temporarios WHERE acertos IS NOT NULL ORDER BY acertos DESC LIMIT 10"
        cursor.execute(sql)
    ranking = cursor.fetchall()
    
    cursor.close()
    conexao.close()
    
    emit('atualizar_ranking', ranking)

@socketio.on('registrando_membros')
def registrar_membros(dados):
    codigo = dados.get('codigo')
    nome = dados.get('nome')
    cargo = dados.get('cargo')
    conteudo_js = dados.get('conteudo_js', 'MEMBRO_ENTROU')

    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, cargo, conteudo_js) VALUES (%s, %s, %s, %s)"
    sucesso = executar_query(sql, (codigo, nome, cargo, conteudo_js))
    if sucesso is True:
        emitir_informacoes_sala(codigo)
        return {'status': 'ok'}
    return {'status': 'erro', 'mensagem': f'Erro ao gravar membro no banco: {sucesso}'}

@socketio.on('enviando_informacoes')
def enviando_informacoes(dados):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
    
    query = "SELECT nome_aluno, cargo, acertos FROM codigos_temporarios WHERE id_sessao = %s"
    cursor.execute(query, (dados.get('codigo'),))
    informacoes = cursor.fetchall()

    cursor.close()
    conexao.close()
    emit('atualizar_informacoes', informacoes, broadcast=True)

@socketio.on('limpar_banco')
def deletar_dados():
    sql = "DELETE FROM codigos_temporarios"
    executar_query(sql)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)
