#!/usr/bin/env python
# coding: utf-8

import serial
import re
#import daemon.runner
from pymongo import MongoClient
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import logging
import time
import json

float_re = re.compile('^[+-]?(\d*\.\d+|\d+\.?\d*)([eE][+-]?\d+|)\Z')

def read_current():
  current = None
  try:
    current = ser.readline().rstrip()
    if is_number(current):
      current = float(current)
  except serial.SerialException:
    print('error')
  return current

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

if __name__ == '__main__':

  # Daizawa Meter
  ser = serial.Serial('/dev/tty.usbserial-A8008Jr9', 9600)
  #ser = serial.Serial('/dev/ttyUSB0', 9600)
  
  # mongodb
  client = MongoClient("mongodb://localhost:27017")
  db = client.dhmongo

  # Read in command-line parameters
  host = "apolc0dvtdymz.iot.ap-northeast-1.amazonaws.com"
  rootCAPath = "./certs/root-CA.crt"
  certificatePath = "./certs/DaizawaWattMeter.cert.pem"
  privateKeyPath = "./certs/DaizawaWattMeter.private.key"
  clientId = "basicPubSub"
  topic = "daizawattmeter"

  # Configure logging
  logger = logging.getLogger("AWSIoTPythonSDK.core")
  logger.setLevel(logging.INFO)
  streamHandler = logging.StreamHandler()
  formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
  streamHandler.setFormatter(formatter)
  logger.addHandler(streamHandler)

  # Init AWSIoTMQTTClient
  myAWSIoTMQTTClient = None
  myAWSIoTMQTTClient = AWSIoTMQTTClient(clientId)
  myAWSIoTMQTTClient.configureEndpoint(host, 8883)
  myAWSIoTMQTTClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

  # AWSIoTMQTTClient connection configuration
  myAWSIoTMQTTClient.configureAutoReconnectBackoffTime(1, 32, 20)
  myAWSIoTMQTTClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
  myAWSIoTMQTTClient.configureDrainingFrequency(2)  # Draining: 2 Hz
  myAWSIoTMQTTClient.configureConnectDisconnectTimeout(10)  # 10 sec
  myAWSIoTMQTTClient.configureMQTTOperationTimeout(5)  # 5 sec

  # Connect and subscribe to AWS IoT
  myAWSIoTMQTTClient.connect()

  N = 60
  i = 0
  current_total = 0
  while True:
    current = read_current()
    if is_number(current):
      # mongodb
      currentX10 = int(float(current) * 10)
      db.currentAmpere.insert({'ampere':currentX10})
      current_total = current_total + current
      # aws IoT
      if i % N == 0:
        message = {}
        message['ampere'] = current_total / N
        messageJson = json.dumps(message)
        myAWSIoTMQTTClient.publish(topic, messageJson, 1)
        current_total = 0
    i = i + 1