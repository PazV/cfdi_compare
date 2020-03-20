#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.utils import secure_filename
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
import copy
from . import general_functions
GF = general_functions.GeneralFunctions()
import app_config as cfg

bp = Blueprint('settings', __name__, url_prefix='/settings')

@bp.route('/users')
@is_logged_in
def users():
    return render_template('users.html', g=g)

@bp.route('/companies')
@is_logged_in
def companies():
    return render_template('companies.html', g=g)

@bp.route('/saveCompany', methods=['GET','POST'])
@is_logged_in
def saveCompany():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                #nueva empresa
                if data['company_id']==-1:
                    company={
                        'name':data['name'].encode('utf-8'),
                        'rfc':data['rfc'].upper(),
                        'created_by':1, #temporal
                        'created':'now'
                    }
                    db.insert('system.company',company)
                    response['success']=True
                    response['msg_response']='La empresa ha sido registrada.'

                #editar empresa
                else:
                    edita
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información capturada.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error al intentar obtener la información capturada, favor de intentarlo de nuevo.'
    except:
        response['success'] = False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/getCompanies', methods=['GET','POST'])
@is_logged_in
def getCompanies():
    response={}
    try:
        user_id=int(request.form['user_id'])
        start=int(request.form['start'])
        limit=int(request.form['length'])
        companies=db.query("""
            select
                *, to_char(created,'DD-MM-YYYY HH:MI:SS') as created
                from system.company
                where created_by=%s
                order by name asc
                offset %s limit %s
        """%(user_id,start,limit)).dictresult()

        companies_total=db.query("""
            select count(*)
            from system.company
            where created_by=%s
        """%user_id).dictresult()

        response['success']=True
        response['data']=companies
        response['recordsTotal']=companies_total[0]['count']
        response['recordsFiltered']=companies_total[0]['count']

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo nuevamente más tarde.'
        app.logger.info(traceback.format_exc())
    return json.dumps(response)

@bp.route('/getAllCompanies', methods=['GET','POST'])
@is_logged_in
def getAllCompanies():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                companies=db.query("""
                    select company_id,name from system.company where enabled=True
                    order by name asc
                """).dictresult()
                response['success']=True
                response['data']=companies
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/getUsers', methods=['GET','POST'])
@is_logged_in
def getUsers():
    response={}
    try:
        if request.method=='POST':
            start=int(request.form['start'])
            limit=int(request.form['length']);
            users=db.query("""
                select user_id,
                name, email
                from system.user
                where enabled=True
                order by name asc
                offset %s limit %s
            """%(start,limit)).dictresult()

            total=db.query("""
                select count(*) from system.user
                where enabled=True
            """).dictresult()

            response['data']=users
            response['recordsTotal']=total[0]['count']
            response['recordsFiltered']=total[0]['count']
            response['success']=True
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/saveUser', methods=['GET','POST'])
@is_logged_in
def saveUser():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                data['email']=data['email'].lower()
                data['email']=data['email'].strip()
                user_data=copy.deepcopy(data)
                if data['user_id']==-1: #nuevo usuario
                    mail_exists=db.query("""
                        select count(*) from system.user where
                        email='%s'
                    """%data['email']).dictresult()[0]['count']
                    mail_exists=0
                    if mail_exists==0:
                        del user_data['user_id']
                        passwd_success,passwd=GF.generateRandomPassword(7)
                        if passwd_success:
                            user_data['password']=generate_password_hash(passwd)
                            user_data['created']='now()'
                            user_data['enabled']=True
                            new_user=db.insert('system.user',user_data)
                            mail_body='Se ha registrado al usuario %s. <br><br> <b>Correo:</b> %s, <br> <b>Contraseña:</b> %s<br><br><a href="%s">Acceder</a>'%(new_user['name'],new_user['email'],passwd,cfg.host)
                            GF.sendMail('Nuevo usuario',mail_body,user_data['email'])
                            if user_data['companies']!='':
                                companies=user_data['companies'].split(",")
                                for x in companies:
                                    db.insert('system.user_company',{'user_id':new_user['user_id'],'company_id':x.split("_")[1],'added':'now()'})
                            response['success']=True
                            response['msg_response']='El usuario ha sido creado.'
                        else:
                            response['success']=False
                            response['msg_response']='Ocurrió un error al momento de generar la contraseña, favor de intentarlo de nuevo.'
                    else:
                        response['success']=False
                        response['msg_response']='El correo ingresado ya se encuentra registrado.'
                # else: #editar usuario
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar la información.'
        else:
            response['suceess']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)
