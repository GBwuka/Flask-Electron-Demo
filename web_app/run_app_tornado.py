import tornado.httpserver
import tornado.ioloop
import tornado.web
import sys

if getattr(sys, 'frozen', False):
    template_folder = os.path.join(sys._MEIPASS, 'templates')
else:
    template_folder = 'templates'

class Dashboard(tornado.web.RequestHandler):
    def get(self):
        self.render("dashboard.html")

class Hello(tornado.web.RequestHandler):
    def get(self):
        self.render("welcome.html", port=port)

def make_app():
    return tornado.web.Application([
        (r"/", Hello),
        (r"/dashboard", Dashboard),],
        template_path=template_folder,
    )


if __name__ == "__main__":
    port = sys.argv[1]
    app = make_app()
    app.listen(int(port))
    tornado.ioloop.IOLoop.current().start()
