#-*- coding: utf-8 -*-

import logging
import sys
import traceback
import json
from flask import Flask, session, request, logging, g
from flask_mail import Mail, Message
import random
import app_config as cfg
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText
import re
import os
from .db_connection import getDB
db = getDB()
app = Flask(__name__)

class GeneralFunctions:
    def getDict(self,form,method):
        """
            Parameters:request.form
            Description:Obtains ImmutableMultiDict object and returns [flag success (True/False) ,data dictionary]
        """
        try:
            if method=='post':
                d=form.to_dict(flat=False)
                e=d.keys()[0]
                f=json.loads(e)
                return True,f
            else:
                d=form.to_dict(flat=False)
                return True,d
        except:
            exc_info = sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
            return False,''

    def as_text(self,value):
        if value is None:
            return ""
        else:
            try:
                return str(value)
            except:
                return value

    def generateRandomPassword(self,pass_len):
        """
        Parameters:pass_len(indicates the password length)
        Description:Generates a random password with the length stablished in pass_len
        """
        try:
            sample='abcdefghijklmnopqstuvwxyzABCDEFGHIJKLMNOPQRSTUVWZYX0123456789_-.$#'
            password=''.join(str(i) for i in random.sample(sample,pass_len))
            return True,password
        except:
            exc_info = sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
            return False, ''

    def sendMail(self,subject,body,to_address):
        response={}
        try:
            server=smtplib.SMTP(cfg.mail_server,cfg.mail_port)
            server.login(cfg.mail_username,cfg.mail_password)
            from_address=cfg.mail_username
            msg=MIMEMultipart()
            msg['From']=from_address
            if type(to_address)==list:
                msg['To']=','.join(to_address)
                to_address.append(cfg.app_admin_mail)
                list_to=to_address
            else:
                msg['To']=to_address
                list_to=[to_address,cfg.app_admin_mail]
            # msg['To']="%s, %s"%(to_address,cfg.app_admin_mail)
            msg['Subject']=subject.decode('utf-8')
            body=self.replaceStringHtml(body)
            msg.attach(MIMEText(body,'html'))
            text=msg.as_string()

            resp=server.sendmail(from_address,list_to,text)
            app.logger.info(resp)
            app.logger.info("sends mail")
            response['success']=True
        except:
            exc_info=sys.exc_info()
            app.logger.info(traceback.format_exc(exc_info))
            response['success']=False
        return response

    def replaceStringHtml(self,text):
        rep = {
            "á":"&aacute;",
            "é":"&eacute;",
            "í":"&iacute;",
            "ó":"&oacute;",
            "ú":"&uacute;",
            "Á":"&Aacute;",
            "É":"&Eacute;",
            "Í":"&Iacute;",
            "Ó":"&Oacute;",
            "Ú":"&Uacute;",
            "ñ":"&ntilde;",
            "Ñ":"&Ntilde;"
        }
        rep = dict((re.escape(k), v) for k, v in rep.iteritems())
        pattern = re.compile("|".join(rep.keys()))
        new_text = pattern.sub(lambda m: rep[re.escape(m.group(0))], text)
        return new_text

    def userInfo(self,extras=None):
        # user_info=db.query("""
        #     select user_id,profile_picture_class,workspace_id
        #     from system.user where user_id=%s
        # """%session['user_id']).dictresult()[0]
        user_info=db.query("""
            select user_id, name, role from system.user where user_id=%s
        """%session['user_id']).dictresult()[0]
        if extras!=None:
            for x in extras:
                user_info.update(x)
        g.user_info=json.dumps(user_info)
        # g.profile_picture_class=user_info['profile_picture_class']
        return g

    def userInfoWCompany(self,extras=None):
        user_info=db.query("""
            select user_id,name,role
            from system.user where user_id=%s
        """%session['user_id']).dictresult()[0]
        company_id=int(extras[0]['company_factor'])/int(cfg.company_factor)
        company_name=db.query("""
            select name from system.company where company_id=%s
        """%company_id).dictresult()
        if extras!=None:
            for x in extras:
                user_info.update(x)
        user_info.update({'company':company_name[0]['name']})
        g.user_info=json.dumps(user_info)

        return g
