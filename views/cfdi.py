#--*-- coding: utf-8 --*--
from flask import Flask, render_template, flash, redirect, url_for, session, request, logging, Blueprint, g, send_file
from passlib.hash import sha236_crypt
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
# from .db_connection import getDB
# db = getDB()
from flask import current_app as app
# from . import general_functions
GF = general_functions.GeneralFunctions()
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Color, colors, PatternFill, Border, Alignment, Side, NamedStyle
from openpyxl.cell import Cell
from time import gmtime, strftime, localtime

bp = Blueprint('cfdi', __name__, url_prefix='/cfdi' )
