#-*- coding: utf-8 -*-

import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, render_template
from flask_mail import Mail, Message

def page_not_found(e):
    return render_template('error.html'),404

def create_app(test_config=None):
    #create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.debug = True
    formatter = logging.Formatter("[%(asctime)s] {%(pathname)s:%(lineno)d} %(levelname)s - %(message)s")
    handler = RotatingFileHandler('/var/log/cfdi_compare/cfdi_compare.log', maxBytes=10000000, backupCount=5)
    handler.setFormatter(formatter)
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)

    app.register_error_handler(404, page_not_found)

    from views import app_config as cfg

    app.config.from_mapping(
        SECRET_KEY=cfg.app_secret_key,
        DEBUG_TB_INTERCEPT_REDIRECTS=False,
    )

    if test_config is None:
        app.config.from_pyfile('config.py',
        silent=True)
    else:
        app.config.from_mapping(test_config)

    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    from views import home
    app.register_blueprint(home.bp)
    from views import cfdi
    app.register_blueprint(cfdi.bp)
    from views import settings
    app.register_blueprint(settings.bp)

    app.add_url_rule('/', endpoint='home.home')
    app.add_url_rule('/home', endpoint='home.home')

    return app

app = create_app()
