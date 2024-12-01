const toggleButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
let selectedFeature;
    toggleButton.addEventListener("click", () => {
        let isAnyChecked = false;
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            if (radio.checked) {
                isAnyChecked = true;
            }
        });
        if (isAnyChecked) {
            sidebar.classList.toggle("hidden");
            if (sidebar.classList.contains("hidden")) {
                const selectedRadio = document.querySelector('input[name="feature"]:checked');
                selectedFeature = selectedRadio.value;
                loadGraphs(selectedFeature);
            
            }
        }
    });

    async function getData(feature) {
        const dataset = JSON.parse(localStorage.getItem("datasets"));
        const day = dataset[0].day;
        const month = dataset[0].month;
        const year = dataset[0].year;
        const coordinate1 = JSON.parse(localStorage.getItem("pointCoordinate"));
        const dates = getDates(month, day, year);
        for (let i = 0; i<dates.length; i++) {
            const data = await (loadInfo(dates[i].day, dates[i].month, dates[i].year, feature, coordinate1[1], coordinate1[0]));
            trendData.push({
                featureValue: data,
                date: dates[i]
            });
        }
        const coordinate2 = JSON.parse(localStorage.getItem("pointCoordinate2"));
        for (let i = 0; i<dates.length; i++) {
            const data = await (loadInfo(dates[i].day, dates[i].month, dates[i].year, feature, coordinate2[1], coordinate2[0]));
            trendData2.push({
                featureValue: data,
                date: dates[i]
            });
        }
        const dataPoints = trendData.map(entry => ({
            x: new Date(entry.date.year, entry.date.month - 1, entry.date.day),
            y: entry.featureValue[selectedFeature]
        }));
        plotGraph(dataPoints);
        const dataPoints2 = trendData2.map(entry => ({
            x: new Date(entry.date.year, entry.date.month - 1, entry.date.day),
            y: entry.featureValue[selectedFeature]
        }));
        console.log("trendData2", trendData2);
        console.log("data poitns 2", dataPoints2);
        plotGraph2(dataPoints2);
    }

trendData = [];
trendData2 = [];
async function loadInfo(day, month, year, feature, lat, lon) {
    url = `http://127.0.0.1:5000/daily-dataframe?latitude=${lat}&longitude=${lon}&feature=${feature}&day=${day}&month=${month}&year=${year}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to fetch data: ${errorMessage}`);
        }
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }
        return {
            [feature]: data[feature]
        }
    } catch (error) {
        console.error("Error in fetchWeatherData:", error);
        throw error;
    }
}

    function getDates(month, day, year) {
        const dates = [];
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date();
    
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 20)) {
            const formattedMonth = d.getMonth() + 1;
            const formattedDay = d.getDate();
            const formattedYear = d.getFullYear();
            dates.push({
                month: formattedMonth,
                day: formattedDay,
                year: formattedYear
            });
        }
    
        return dates;
    }

    function plotGraph(data) {
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Feature Value Over Time',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1,
                    fill: false,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'white'
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            tooltipFormat: 'MMM DD, YYYY',
                            displayFormats: {
                                month: 'MMM YYYY',
                                year: 'YYYY'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Feature Value',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    }
                }
            }
        });
    }

    function plotGraph2(data) {
        const ctx = document.getElementById('myChart2').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Feature Value Over Time',
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1,
                    fill: false,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'white'
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            tooltipFormat: 'MMM DD, YYYY',
                            displayFormats: {
                                month: 'MMM YYYY',
                                year: 'YYYY'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Feature Value',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        }
                    }
                }
            }
        });
    }

    async function loadGraphs(feature) {
        const loadingScreen = document.querySelector(".loading-screen");
        try {
            loadingScreen.style.display = "flex";
            await getData(feature);
        }
        catch (error) {
            console.error("Error loading heatmaps:", error);
        } finally {
            loadingScreen.style.display = "none";
        }
    }