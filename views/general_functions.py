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
