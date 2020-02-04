#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from werkzeug.security import check_password_hash, generate_password_hash
# from .db_connection import getDB
# db = getDB()
import logging
# from .login import is_logged_in
import json
from flask import current_app as app

bp = Blueprint('home', __name__, url_prefix='/home')

@bp.route('/')
# @is_logged_in
def home():
    return render_template('home.html',g=g)

@bp.route('/2')
def home2():
    return render_template('home2.html',g=g)
