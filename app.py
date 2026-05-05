from flask import Flask, render_template
from flask_socketio import SocketIO, emit

# 1.Flask e Socket.io
app = Flask(__name__)
app.config['SECRET_KEY'] = 'pinbas'
socketio = SocketIO(app, cors_allowed_origins="*")

# 2. Rota para a página do Aluno (a principal)
@app.route('/')
def index():
    return render_template('index.html')

# 3. Rota para a página da Professora
@app.route('/professor')
def admin():
    return render_template('admin.html')

# 4. Iniciar o servidor
if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5500)