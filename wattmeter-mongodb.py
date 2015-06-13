#!/usr/bin/env python
# coding: utf-8

import serial
import re
import daemon.runner
from pymongo import MongoClient

float_re = re.compile('^[+-]?(\d*\.\d+|\d+\.?\d*)([eE][+-]?\d+|)\Z')

def read_current():
  current = None
  try:
    current = ser.readline().rstrip()
    if is_number(current) and float_re.match(current):
      current = float(current)
  except serial.SerialException:
    print 'error'
  return current

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

if __name__ == '__main__':

  ser = serial.Serial('/dev/ttyUSB0', 9600)
  client = MongoClient("mongodb://localhost:27017")
  db = client.dhmongo

  while True:
    current = read_current()
    if is_number(current):
      currentX10 = int(float(current) * 10)
      db.currentAmpere.insert({'ampere':currentX10})

