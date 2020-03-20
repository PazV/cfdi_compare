#-*- coding: utf-8 -*-

from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
from .db_connection import getDB
import logging
import sys
import traceback
import json
from flask import current_app as app
from . import general_functions
GF = general_functions.GeneralFunctions()
db = getDB()
import app_config as cfg

bp = Blueprint('login', __name__, url_prefix='/login')

@bp.route('/')
def login():
    flash(u'','')
    session.clear()
    return render_template('login.html',error=None)

@bp.route('/signin', methods=['GET','POST'])
def signin():
    error=''
    try:
        app.logger.info("login")
        if request.method=='POST':
            session.pop('_flashes', None)
            email=request.form['email']
            email.strip()
            email.lower()
            password=request.form['password']
            registered_user=db.query("""
                select * from system.user where
                email='%s' order by user_id
            """%email).dictresult()
            if registered_user==[]:
                error='Usuario no registrado'
                flash(u'Usuario no registrado','user')
            elif registered_user[0]['enabled']=='f':
                error='Usuario deshabilitado'
                flash(u'Usuario deshabilitado','user')
            else:
                if not check_password_hash(registered_user[0]['password'],password):
                    error='Contraseña incorrecta.'
                    flash(u'Contraseña incorrecta.','pass')
                else:
                    db.query("""
                        update system.user_session
                        set logged=False where user_id=%s
                        and logged=True
                    """%registered_user[0]['user_id'])
                    new_session={
                        'user_id':registered_user[0]['user_id'],
                        'start_session':'now()',
                        'logged':True
                    }
                    inserted_session=db.insert('system.user_session',new_session)
                    g.session_id=inserted_session['session_id']
                    session['user_id']=registered_user[0]['user_id']
                    session['session_id']=inserted_session['session_id']
                    session['name']=inserted_session['name']
                    session['logged_in']=True
                    return redirect(url_for('home.home'))
        return render_template('login.html',error=error)
    except:
        exc_info=sys.exc_info()
        app.logger.info(traceback.format_exc(exc_info))
        return render_template('login.html',error='Ocurrió un error al intentar iniciar sesión, favor de intentarlo de nuevo.'.decode('utf-8'))

def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            logged=db.query("""
                select logged from system.user_session
                where session_id=%s
            """%session['session_id']).dictresult()

            if logged!=[]:
                if logged[0]['logged']==True:
                    db.query("""
                        update system.user_session
                        set last_action_at=now()
                        where session_id=%s
                    """%session['session_id'])
                    return f(*args, **kwargs)
                else:
                    flash('Unauthorized, Please login', 'danger')
                    return redirect(url_for('login.login'))
            else:
                flash('Unauthorized, Please login', 'danger')
                return redirect(url_for('login.login'))
        else:
            flash('Unauthorized, Please login', 'danger')
            return redirect(url_for('login.login'))
    return wrap

@bp.route('/signout', methods=['GET','POST'])
@is_logged_in
def signout():
    db.query("""
        update system.user_session
        set logged=False,
        finish_session='now'
        where session_id=%s
        and user_id=%s
    """%(session['session_id'],session['user_id']))
    session.clear()
    return redirect(url_for('login.login'))
