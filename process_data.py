import numpy as np
from flask_cors import CORS
import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry
from datetime import datetime, timedelta

from flask import Flask, jsonify, request
app = Flask(__name__)
CORS(app, resources={r"/daily-dataframe": {"origins": "http://127.0.0.1:5500"}})
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

url = "https://api.open-meteo.com/v1/forecast"
historicalURL = "https://archive-api.open-meteo.com/v1/archive"
@app.route('/daily-dataframe', methods=['GET'])

def getData():
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    feature = request.args.get('feature', type=str)
    day = request.args.get('day', type = str)
    month = request.args.get('month', type = str)
    year = request.args.get('year', type = str)
    if day != None:
        day = int(day);
    if month != None:
        month = int(month);
    if year != None:
        year = int(year);
    
    print(f"Latitude: {latitude}, Longitude: {longitude}")
    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and Longitude must be provided."}), 400
    if day == None:
        print("WAY 1");
        today = pd.Timestamp.now()
        todayDate = today.strftime('%Y-%m-%d')
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": feature,
            "start_date": todayDate,
            "end_date": todayDate
        }
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        daily = response.Daily()
        daily_values = daily.Variables(0).ValuesAsNumpy()
        value = float(daily_values[0])
        data = {
            "latitude": latitude,
            "longitude": longitude,
            feature: value
        }
        return jsonify(data);
    else:
        print("WAY 2");
        date = f"{year:04d}-{month:02d}-{day:02d}"
        print(date);
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": feature,
            "start_date": date,
            "end_date": date
        }
        responses = openmeteo.weather_api(historicalURL, params=params)

        response = responses[0]
        daily = response.Daily()
        daily_values = daily.Variables(0).ValuesAsNumpy()
        value = float(daily_values[0])
        data = {
            "latitude": latitude,
            "longitude": longitude,
            feature: value
        }
        return jsonify(data);

if __name__ == '__main__':
    app.run(debug=True)