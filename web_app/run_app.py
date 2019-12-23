import sys
import os
from flask import Flask
from flask import render_template

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    app = Flask(__name__, template_folder=template_folder)
else:
    app = Flask(__name__)


@app.route("/")
def hello():
    return render_template('welcome.html', port=port)


@app.route('/dashboard')
def dashboard():
    """
    Render the dashboard template on the /dashboard route
    """
    return render_template('dashboard.html')


if __name__ == "__main__":
    port = sys.argv[1]
    app.run(host='127.0.0.1', port=int(port))
