import cdsapi

dataset = "reanalysis-era5-land"
request = {
    "variable": [
        "2m_temperature",
        "total_precipitation"
    ],
    "year": "2024",
    "month": "05",
    "day": ["22"],
    "time": ["00:00"],
    "format": "netcdf"
}

client = cdsapi.Client()
client.retrieve(dataset, request, 'download.nc')