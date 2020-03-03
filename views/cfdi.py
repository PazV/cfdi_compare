#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.utils import secure_filename
import logging
# from .login import is_logged_in
import json
import sys
import traceback
import os
import glob
import re
import shutil
import random
import zipfile
from .db_connection import getDB
db = getDB()
from flask import current_app as app
from . import general_functions
GF = general_functions.GeneralFunctions()
import app_config as cfg
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Color, colors, PatternFill, Border, Alignment, Side, NamedStyle
from openpyxl.cell import Cell
from time import gmtime, strftime, localtime
import datetime
import csv

bp = Blueprint('cfdi', __name__, url_prefix='/cfdi' )

@bp.route('/load-company-file')
# @is_logged_in
def loadCompanyFile():
    return render_template('load_company_file.html',g=g)

@bp.route('/load-sat-file')
# @is_logged_in
def loadSatFile():
    return render_template('load_sat_file.html', g=g)

@bp.route('/compare')
# @is_logged_in
def compareRecords():
    return render_template('compare_records.html', g=g)

@bp.route('/my-progress')
# @is_logged_in
def comparingProgress():
    return render_template('comparing_progress.html', g=g)


@bp.route('/createLoadingFormat', methods=['GET','POST'])
# @is_logged_in
def createLoadingFormat():
    response={}
    try:
        if request.method=='POST':
            headers=['uuid','rfc_emisor','nombre_emisor','rfc_receptor','nombre_receptor','fecha_emision','monto','tipo_comprobante','estatus','fecha_cancelacion']
            wb = Workbook()
            ws = wb.create_sheet("Formato")
            column=1
            for x in headers:
                ws.cell(row=1,column=column,value=x).font=Font(name='Arial',size=12)
                column+=1

            for column_cells in ws.columns:
                length = max(len(GF.as_text(cell.value))+5 for cell in column_cells)
                ws.column_dimensions[column_cells[0].column].width = length


            wb.remove(wb['Sheet'])
            wb.save('%sFormato_carga.xlsx'%cfg.path_for_downloads)
            path='%sFormato_carga.xlsx'%cfg.path_for_downloads
            name='Formato_carga.xlsx'
            response['success']=True
            response['filename']=name
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'

    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/downloadFile/<filename>', methods=['GET','POST'])
# @is_logged_in
def downloadFile(filename):
    response={}
    try:
        path="%s%s"%(cfg.path_for_downloads,filename)
        name="%s"%filename
        return send_file(path,attachment_filename=name)
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
        return json.dumps(response)

@bp.route('/checkCompanyExistingRecords', methods=['GET','POST'])
# @is_logged_in
def checkCompanyExistingRecords():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                response['success']=True
                exists=db.query("""
                    select *
                    from system.company_cfdi_my_rel
                    where year=%s
                    and company_id=%s
                """%(data['year'],data['company_id'])).dictresult()
                if exists!=[]:
                    months=eval(exists[0]['months'])
                    if months[data['month']]==True:
                        response['exists']=True
                        response['msg_confirm']='Ya existen registros para el mes seleccionado, ¿desea reemplazarlos?'
                    else:
                        response['exists']=False
                else:
                    response['exists']=False
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

@bp.route('/loadCompanyInfo', methods=['GET','POST'])
# @is_logged_in
def loadCompanyInfo():
    response={}
    try:
        if request.method=='POST':
            # valid,data=GF.getDict(request.form,'post')
            data=request.form.to_dict()
            files=request.files
            file_path=cfg.path_for_downloads
            file=files[data['file_name']]
            filename = secure_filename(file.filename)
            file.save(os.path.join(file_path,filename))
            read_file=load_workbook(os.path.join(file_path,filename))
            ws=read_file.worksheets[0]

            cfdi_list=[]
            row=2

            for r in range(1,ws.max_row):
                record={}
                for x in range(1,int(ws.max_column)+1):
                    if ws.cell(row=row,column=x).value!=None:
                        record[ws.cell(row=1,column=x).value]=ws.cell(row=row,column=x).value
                cfdi_list.append(record)
                row+=1

            #busca si ya existe registro de esa empresa en ese año
            register_exists=db.query("""
                select * from system.company_cfdi_my_rel
                where company_id=%s and year=%s
            """%(data['company_id'],data['year'])).dictresult()
            if data['exists']=='create':
                #crear tabla
                db.query("""
                    CREATE TABLE company_cfdi.c_%s_%s_%s(
                        c_id serial not null primary key,
                        uuid text not null default '',
                        rfc_emisor text not null default '',
                        nombre_emisor text not null default '',
                        rfc_receptor text not null default '',
                        nombre_receptor text not null default '',
                        fecha_emision timestamp without time zone default '1900-01-01 00:00:00',
                        monto float not null default 0,
                        tipo_comprobante text not null default '',
                        estatus text not null default '',
                        fecha_cancelacion timestamp without time zone not null default '1900-01-01 00:00:00'
                    );
                """%(data['company_id'],data['month'],data['year']))

                #inserta los registros a la tabla correspondiente
                for c in cfdi_list:
                    db.insert('company_cfdi.c_%s_%s_%s'%(data['company_id'],data['month'],data['year']),c)

                if register_exists==[]: #si no existe registro, se crea uno
                    months={
                        'ene':False, 'feb':False, 'mar':False,
                        'abr':False, 'may':False, 'jun':False,
                        'jul':False, 'ago':False, 'sep':False,
                        'oct':False, 'nov':False, 'dic':False
                    }
                    updated={
                        'ene':'1900-01-01 00:00:00', 'feb':'1900-01-01 00:00:00', 'mar':'1900-01-01 00:00:00',
                        'abr':'1900-01-01 00:00:00', 'may':'1900-01-01 00:00:00', 'jun':'1900-01-01 00:00:00',
                        'jul':'1900-01-01 00:00:00', 'ago':'1900-01-01 00:00:00', 'sep':'1900-01-01 00:00:00',
                        'oct':'1900-01-01 00:00:00', 'nov':'1900-01-01 00:00:00', 'dic':'1900-01-01 00:00:00'
                    }
                    months[data['month']]=True
                    updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    rel_reg={
                        'company_id':data['company_id'],
                        'year':data['year'],
                        'months':str(months),
                        'updated':str(updated)
                    }
                    #agrega registro de la tabla creada
                    db.insert('system.company_cfdi_my_rel',rel_reg)
                else: #si ya existe registro, se edita para agregar el mes que se está procesando
                    months=eval(register_exists[0]['months'])
                    months[data['month']]=True
                    updated=eval(register_exists[0]['updated'])
                    updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    db.query("""
                        update system.company_cfdi_my_rel
                        set months='%s',
                        updated='%s'
                        where company_id=%s and year=%s
                    """%(str(months).replace("'","''"),str(updated).replace("'","''"),data['company_id'],data['year']))

                response['msg_response']='Los registros han sido guardados.'

            elif data['exists']=='replace':
                #obtener el id del último registro de la tabla
                last_id=db.query("""
                    select max(c_id) from company_cfdi.c_%s_%s_%s
                """%(data['company_id'],data['month'],data['year'])).dictresult()[0]['max']

                #inserta los registros a la tabla correspondiente
                for c in cfdi_list:
                    db.insert('company_cfdi.c_%s_%s_%s'%(data['company_id'],data['month'],data['year']),c)

                #elimina datos de la tabla
                db.query("""
                    delete from company_cfdi.c_%s_%s_%s where c_id < %s
                """%(data['company_id'],data['month'],data['year'],int(last_id)+1))

                updated=eval(register_exists[0]['updated'])
                updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                db.query("""
                    update system.company_cfdi_my_rel
                    set updated='%s'
                    where company_id=%s and year=%s
                """%(str(updated).replace("'","''"),data['company_id'],data['year']))

                response['msg_response']='Los registros han sido reemplazados.'
            response['success']=True

        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/checkSatExistingRecords', methods=['GET','POST'])
# @is_logged_in
def checkSatExistingRecords():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                response['success']=True
                exists=db.query("""
                    select *
                    from system.sat_cfdi_my_rel
                    where year=%s
                    and company_id=%s
                """%(data['year'],data['company_id'])).dictresult()
                if exists!=[]:
                    months=eval(exists[0]['months'])
                    if months[data['month']]==True:
                        response['exists']=True
                        response['msg_confirm']='Ya existen registros para el mes seleccionado, ¿desea reemplazarlos?'
                    else:
                        response['exists']=False
                else:
                    response['exists']=False
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


@bp.route('/loadSatInfo', methods=['GET','POST'])
# @is_logged_in
def loadSatInfo():
    response={}
    try:
        if request.method=='POST':
            #obtiene data
            data=request.form.to_dict()
            #lee archivo
            files=request.files
            file_path=cfg.path_for_downloads
            file=files[data['file_name']]
            filename = secure_filename(file.filename)
            file.save(os.path.join(file_path,filename))

            #convierte el archivo .txt en .csv
            with open (os.path.join(file_path,filename), 'r') as f:
                stripped=(line.strip() for line in f)
                lines=(line.split("~") for line in stripped if line)
                csv_file_name='sat_load.csv'
                with open(os.path.join(file_path,csv_file_name), 'w') as of:
                    writer=csv.writer(of)
                    writer.writerows(lines)

            #revisar si ya hay registro
            existing_record=db.query("""
                select * from system.sat_cfdi_my_rel
                where year=%s and company_id=%s
            """%(data['year'],data['company_id'])).dictresult()
            if data['exists']=='create':
                #crear tabla
                db.query("""
                    CREATE TABLE sat_cfdi.sc_%s_%s_%s(
                        sc_id serial not null primary key,
                        uuid text not null default '',
                        rfc_emisor text not null default '',
                        nombre_emisor text not null default '',
                        rfc_receptor text not null default '',
                        nombre_receptor text not null default '',
                        fecha_emision timestamp without time zone default '1900-01-01 00:00:00',
                        monto float not null default 0,
                        tipo_comprobante text not null default '',
                        estatus text not null default '',
                        fecha_cancelacion timestamp without time zone default '1900-01-01 00:00:00'
                    );
                """%(data['company_id'],data['month'],data['year']))

                ##inserta los registros a la tabla correspondiente
                #lee archivo csv para insertar registros en tabla correspondiente
                with open(os.path.join(file_path,csv_file_name),'rb') as csvfile:
                    fieldnames=['uuid','rfc_emisor','nombre_emisor','rfc_receptor','nombre_receptor','rfc_pac','fecha_emision','fecha_certificacion_sat','monto','tipo_comprobante','estatus','fecha_cancelacion']
                    sreader=csv.DictReader(csvfile,fieldnames=fieldnames, delimiter=',', quotechar='"')
                    count_row=0
                    for row in sreader:

                        if count_row!=0:
                            # app.logger.info(row)
                            db.insert('sat_cfdi.sc_%s_%s_%s'%(data['company_id'],data['month'],data['year']),row)
                        count_row+=1


                if existing_record==[]: #si no existe registro, se crea uno
                    months={
                        'ene':False, 'feb':False, 'mar':False,
                        'abr':False, 'may':False, 'jun':False,
                        'jul':False, 'ago':False, 'sep':False,
                        'oct':False, 'nov':False, 'dic':False
                    }
                    updated={
                        'ene':'1900-01-01 00:00:00', 'feb':'1900-01-01 00:00:00', 'mar':'1900-01-01 00:00:00',
                        'abr':'1900-01-01 00:00:00', 'may':'1900-01-01 00:00:00', 'jun':'1900-01-01 00:00:00',
                        'jul':'1900-01-01 00:00:00', 'ago':'1900-01-01 00:00:00', 'sep':'1900-01-01 00:00:00',
                        'oct':'1900-01-01 00:00:00', 'nov':'1900-01-01 00:00:00', 'dic':'1900-01-01 00:00:00'
                    }
                    months[data['month']]=True
                    updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    rel_reg={
                        'company_id':data['company_id'],
                        'year':data['year'],
                        'months':str(months),
                        'updated':str(updated)
                    }
                    #agrega registro de la tabla creada
                    db.insert('system.sat_cfdi_my_rel',rel_reg)
                else: #si ya existe registro, se edita para agregar el mes que se está procesando
                    months=eval(existing_record[0]['months'])
                    months[data['month']]=True
                    updated=eval(existing_record[0]['updated'])
                    updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    db.query("""
                        update system.sat_cfdi_my_rel
                        set months='%s',
                        updated='%s'
                        where company_id=%s and year=%s
                    """%(str(months).replace("'","''"),str(updated).replace("'","''"),data['company_id'],data['year']))
                response['msg_response']='Los registros han sido guardados.'

            elif data['exists']=='replace':
                #obtener el id del último registro de la tabla
                last_id=db.query("""
                    select max(sc_id) from sat_cfdi.sc_%s_%s_%s
                """%(data['company_id'],data['month'],data['year'])).dictresult()[0]['max']

                ##inserta los registros a la tabla correspondiente
                #lee archivo csv para insertar registros en tabla correspondiente
                with open(os.path.join(file_path,csv_file_name),'rb') as csvfile:
                    fieldnames=['uuid','rfc_emisor','nombre_emisor','rfc_receptor','nombre_receptor','rfc_pac','fecha_emision','fecha_certificacion_sat','monto','tipo_comprobante','estatus','fecha_cancelacion']
                    sreader=csv.DictReader(csvfile,fieldnames=fieldnames, delimiter=',', quotechar='"')
                    count_row=0
                    for row in sreader:
                        if count_row!=0:
                            db.insert('sat_cfdi.sc_%s_%s_%s'%(data['company_id'],data['month'],data['year']),row)
                        count_row+=1

                #elimina datos anteriores de la tabla
                db.query("""
                    delete from sat_cfdi.sc_%s_%s_%s
                    where sc_id < %s
                """%(data['company_id'],data['month'],data['year'],int(last_id)+1))

                updated=eval(existing_record[0]['updated'])
                updated[data['month']]=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                db.query("""
                    update system.sat_cfdi_my_rel
                    set updated='%s'
                    where company_id=%s and year=%s
                """%(str(updated).replace("'","''"),data['company_id'],data['year']))

                response['msg_response']='Los registros han sido actualizados.'

            response['success']=True

        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/checkDataToCompare', methods=['GET','POST'])
# @is_logged_in
def checkDataToCompare():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                response['available']=False
                response['success']=True
                company=db.query("""
                    select * from system.company_cfdi_my_rel
                    where company_id=%s and year=%s
                """%(data['company_id'],data['year'])).dictresult()
                if company!=[]:
                    company_months=eval(company[0]['months'])
                    if company_months[data['month']]==True:
                        sat=db.query("""
                            select * from system.sat_cfdi_my_rel
                            where company_id=%s and year=%s
                        """%(data['company_id'],data['year'])).dictresult()
                        if sat!=[]:
                            sat_months=eval(sat[0]['months'])
                            if sat_months[data['month']]==True:
                                response['available']=True
                                response['msg_response']='Se puede realizar el comparativo.'
                            else:
                                response['msg_response']='No existen datos del SAT correspondientes al mes seleccionado en el a&ntilde;o %s.'%data['year']
                        else:
                            response['msg_response']='No existe ning&uacute;n registro del SAT correspondiente al a&ntilde;o %s.'%data['year']
                    else:
                        response['msg_response']='No existen datos cargados por la empresa correspondientes al mes seleccionado en el a&ntilde;o %s.'%data['year']
                else:
                    response['msg_response']='No existe ning&uacute;n registro del SAT correspondiente al a&ntilde;o %s.'%data['year']
            else:
                response['success']=False
                response['msg_response']='Ocurrió un error al intentar validar los datos capturados.'
        else:
            response['success']=False
            response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo.'
    except:
        response['success']=False
        response['msg_response']='Ocurrió un error, favor de intentarlo de nuevo más tarde.'
        app.logger.info(traceback.format_exc(sys.exc_info()))
    return json.dumps(response)

@bp.route('/doComparison', methods=['GET','POST'])
# @is_logged_in
def doComparison():
    response={}
    try:
        if request.method=='POST':
            valid,data=GF.getDict(request.form,'post')
            if valid:
                doComparison
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
