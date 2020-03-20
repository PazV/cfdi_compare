#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
import logging
from .login import is_logged_in
import json
import sys
import traceback
import os
from .db_connection import getDB
db = getDB()
from flask import current_app as app
from . import general_functions
GF = general_functions.GeneralFunctions()
import app_config as cfg

bp = Blueprint('home', __name__, url_prefix='/home')

@bp.route('/')
@is_logged_in
def home():
    user_info=db.query("""
        select user_id, name, role from system.user where user_id=%s
    """%session['user_id']).dictresult()[0]
    g.user_info=json.dumps(user_info)
    g.name=user_info['name']
    return render_template('home.html',g=g)




@bp.route('/getHomeCompanies', methods=['GET','POST'])
# @is_logged_in
def getHomeCompanies():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                companies = db.query("""
                    select a.name, a.company_id
                    from system.company a,
                    system.user_company b
                    where a.company_id=b.company_id
                    and b.user_id=%s
                """%data['user_id']).dictresult()
                for c in companies:
                    c['company_id']=c['company_id']*cfg.company_factor
                response['success']=True
                response['data']=companies
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información capturada.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar obtener la información.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
