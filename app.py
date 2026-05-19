import mysql.connector
from mysql.connector import Error
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pinbas'
socketio = SocketIO(app, cors_allowed_origins="*")

banco = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Luis050810.',
    'database': 'template'
}

def executar_query(sql, valores=None):
    conexao = None
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
        return False
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@app.route('/')
def index():
    return render_template('index.html')
@app.route('/admin')
def admin():
    return render_template('admin.html')
@app.route('/quiz')
def iniciar():
    return render_template('quiz.html')

@socketio.on('registrar_rota')                                                  # ROTA
def registrar_rota(dados):
    codigo = dados.get('codigo')
    nome = dados.get('nome')
    role = dados.get('role')
    cargo = dados.get('cargo')
    acertos = dados.get('acertos', 0)

    if not codigo or not nome or not role or not cargo:
        return {'status': 'erro', 'mensagem': 'Código, nome, role e cargo são obrigatórios'}

    if role != 'criador':
        conexao = None
        try:
            conexao = mysql.connector.connect(**banco)
            cursor = conexao.cursor(dictionary=True)
            cursor.execute("SELECT id_sessao FROM codigos_temporarios WHERE id_sessao = %s", (codigo,))
            resultado = cursor.fetchone()
            if not resultado:
                return {'status': 'erro', 'mensagem': 'Sala não encontrada'}
        except Error as e:
            print(f"Erro no MySQL: {e}")
            return {'status': 'erro', 'mensagem': 'Erro ao verificar sala'}
        finally:
            if conexao and conexao.is_connected():
                cursor.close()
                conexao.close()

    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, conteudo_js, acertos) VALUES (%s, %s, %s, %s)"
    sucesso = executar_query(sql, (codigo, nome, cargo, acertos))
    if sucesso:
        return {'status': 'ok'}
    return {'status': 'erro', 'mensagem': 'Erro ao gravar no banco'}

@app.route('/quiz/<codigo_da_sala>/questoes')
def acessar_questoes(codigo_da_sala):
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
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
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT id_sessao FROM codigos_temporarios WHERE id_sessao = %s", (codigo_da_sala,))
    resultado = cursor.fetchone()
    cursor.close()
    conexao.close()

    if resultado:
        return render_template('quiz.html', sala=codigo_da_sala)
    else:
        return "<h1>Sala não encontrada!</h1>", 404

@socketio.on('enviar_progresso')
def salvar_progresso(dados):
    id_sessao = dados.get('id')
    nome = dados.get('nome')
    cargo = dados.get('cargo', 'Aluno')
    acertos = dados.get('acertos', 0)

    conexao = None
    try:
        conexao = mysql.connector.connect(**banco)
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT id_sessao FROM codigos_temporarios WHERE id_sessao = %s AND nome_aluno = %s", (id_sessao, nome))
        resultado = cursor.fetchone()
        if resultado:
            sql = "UPDATE codigos_temporarios SET acertos = %s, conteudo_js = %s WHERE id_sessao = %s AND nome_aluno = %s"
            cursor.execute(sql, (acertos, cargo, id_sessao, nome))
        else:
            sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, conteudo_js, acertos) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (id_sessao, nome, cargo, acertos))
        conexao.commit()
    except Error as e:
        print(f"Erro no MySQL: {e}")
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


@socketio.on('começar_quiz_sala')
def comecar_quiz_sala(dados):
    """Recebe do criador para iniciar o quiz e notifica os membros."""
    sala = dados.get('sala')
    nome = dados.get('nome')

    emit('quiz_iniciar', {'sala': sala, 'nome': nome}, broadcast=True)

@socketio.on('buscar_ranking')
def enviar_ranking():
    conexao = mysql.connector.connect(**banco)
    cursor = conexao.cursor(dictionary=True)
    sql = "SELECT nome_aluno, acertos FROM codigos_temporarios ORDER BY acertos DESC LIMIT 5"
    cursor.execute(sql)
    ranking = cursor.fetchall()
    
    cursor.close()
    conexao.close()
    
    emit('atualizar_ranking', ranking, broadcast=True)


@socketio.on('limpar_banco')
def deletar_dados():
    sql = "DELETE FROM codigos_temporarios WHERE id"
    executar_query(sql)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5500)