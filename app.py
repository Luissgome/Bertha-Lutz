import mysql.connector
from mysql.connector import Error
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

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
        print("SQL executado!")
        
    except Error as e:
        print(f"Erro no MySQL: {e}")
    finally:
        if conexao and conexao.is_connected():
            cursor.close()
            conexao.close()


app = Flask(__name__)
app.config['SECRET_KEY'] = 'pinbas'
socketio = SocketIO(app, cors_allowed_origins="*")


@app.route('/')
def index():
    return render_template('index.html')
@app.route('/admin')
def admin():
    return render_template('admin.html')
@app.route('/iniciar')
def iniciar():
    return render_template('iniciar.html')

@socketio.on('registrar_rota')
def registrar_rota(dados):
    codigo = dados.get('codigo')
    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, conteudo_js) VALUES (%s, %s, %s)"
    executar_query(sql, (codigo, "SALA_CRIADA", "AGUARDANDO_ALUNO"))

@app.route('/quiz/<codigo_da_sala>')
def acessar_quiz_dinamico(codigo_da_sala):
    

@socketio.on('enviar_progresso')
def salvar_progresso(dados):
    id_sessao = dados.get('id')
    nome = dados.get('nome')
    codigo = dados.get('codigo')
    acertos = dados.get('acertos', 0)

    sql = "INSERT INTO codigos_temporarios (id_sessao, nome_aluno, conteudo_js, acertos) VALUES (%s, %s, %s, %s)"
    executar_query(sql, (id_sessao, nome, codigo, acertos))

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

# Função para limpar o banco (ao terminar o evento)
@socketio.on('limpar_banco')
def deletar_dados():
    sql = "DELETE FROM codigos_temporarios"
    executar_query(sql)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5500)