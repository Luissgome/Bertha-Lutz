import sqlite3
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

# Flask e Socket.io
app = Flask(__name__)
app.config['SECRET_KEY'] = 'pinbas'
socketio = SocketIO(app, cors_allowed_origins="*")

# Página inicial
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/admin')
def admin():
    return render_template('admin.html')
@app.route('/iniciar')
def iniciar():
    return render_template('iniciar.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5500)
