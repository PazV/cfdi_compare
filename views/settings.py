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
# from .db_connection import getDB
# db = getDB()
from flask import current_app as app

bp = Blueprint('settings', __name__, url_prefix='/settings')

@bp.route('/users')
# @is_logged_in
def users():
    return render_template('users.html', g=g)

@bp.route('/companies')
# @is_logged_in
def companies():
    return render_template('companies.html', g=g)
