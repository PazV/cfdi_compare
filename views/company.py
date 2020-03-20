#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.utils import secure_filename
import logging
from .login import is_logged_in
import json
import sys
import traceback
import os
from .db_connection import getDB
db = getDB()
from flask import current_app as app
from .import general_functions
GF = general_functions.GeneralFunctions()
import app_config as cfg

bp = Blueprint('company', __name__, url_prefix='/company')

@bp.route('/<int:company_id>', methods=['GET','POST'])
@is_logged_in
def selectedCompany(company_id):

    c_id=company_id/cfg.company_factor
    company_name=db.query("""
        select name from system.company where company_id=%s
    """%c_id).dictresult()[0]['name']
    g=GF.userInfo([{'company_factor':company_id},{'company':company_name}])
    g.company=company_name
    g.company_factor=company_id
    return render_template('company.html', g=g)
