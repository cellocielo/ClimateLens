from flask import Flask, jsonify, request
import os
import pandas as pd
from flask_cors import CORS
import requests_cache
import openmeteo_requests
from retry_requests import retry

app = Flask(__name__)

# Enable Cross-Origin Resource Sharing
CORS(app, resources={r"/daily-dataframe": {"origins": "http://127.0.0.1:5500"}})

# Set up caching and retry mechanisms
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

url = "https://api.open-meteo.com/v1/forecast"
historicalURL = "https://archive-api.open-meteo.com/v1/archive"


@app.route('/daily-dataframe', methods=['GET'])
def getData():
    latitude = request.args.get('latitude', type=float)
    longitude = request.args.get('longitude', type=float)
    feature = request.args.get('feature', type=str)
    day = request.args.get('day', type=str)
    month = request.args.get('month', type=str)
    year = request.args.get('year', type=str)

    # Validate inputs
    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and Longitude must be provided."}), 400

    if day and month and year:
        date = f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": feature,
            "start_date": date,
            "end_date": date
        }
        responses = openmeteo.weather_api(historicalURL, params=params)
    else:
        today = pd.Timestamp.now().strftime('%Y-%m-%d')
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "daily": feature,
            "start_date": today,
            "end_date": today
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
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

def run_script_on_startup():
    try:
        os.system("python3 process_data.py")  # Adjust path if necessary
        print("Script executed successfully on app startup.")
    except Exception as e:
        print(f"Error executing the script: {e}")

@app.route('/run-script', methods=['GET'])
def run_script():
    try:
        os.system("python3 process_data.py")
        return jsonify({"status": "success", "message": "Script executed successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})