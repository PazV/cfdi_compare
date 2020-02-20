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
from .db_connection import getDB
db = getDB()
from flask import current_app as app
from .import general_functions
GF = general_functions.GeneralFunctions()

bp = Blueprint('company', __name__, url_prefix='/company')

@bp.route('/<int:company_id>', methods=['GET','POST'])
# @is_logged_in
def selectedCompany(company_id):
    return render_template('company.html', g=g)
