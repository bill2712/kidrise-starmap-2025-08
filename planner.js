// planner.js (v5.2 + 觀星建議 + CORS 代理 + 最終修正)

document.addEventListener("DOMContentLoaded", function() {
    // --- UI 元素定義 ---
    const ui = {
        stationSelect: document.getElementById('station-select'),
        realtimeContainer: document.getElementById('realtime-weather-container'),
        realtimePlaceholder: document.getElementById('realtime-placeholder'),
        forecastContainer: document.getElementById('forecast-container'),
        forecastPlaceholder: document.getElementById('forecast-placeholder'),
        recommendationCard: document.getElementById('recommendation-card'),
        recoPlaceholder: document.getElementById('reco-placeholder')
    };

    // --- API URLs ---
    const PROXY_URL = 'https://corsproxy.io/?';
    const API_WEATHER_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
    const API_OPENDATA_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";
    const LANG = "tc";

    let realtimeDataStore = null;

    // =======================================================
    //  v5.2 的原有功能 (完全保留，僅為 API 加入代理)
    // =======================================================

    function initRealtimeWeather() {
        const realtimeApiUrl = PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=rhrread&lang=${LANG}`);
        ui.realtimePlaceholder.innerText = '正在從香港天文台獲取站點列表...';
        fetch(realtimeApiUrl)
            .then(response => response.json())
            .then(data => {
                realtimeDataStore = data;
                if (data && data.temperature && data.temperature.data) {
                    ui.stationSelect.innerHTML = '<option value="">-- 請選擇地區 --</option>';
                    data.temperature.data.forEach(station => {
                        const option = document.createElement('option');
                        option.value = station.place;
                        option.textContent = station.place;
                        ui.stationSelect.appendChild(option);
                    });
                    ui.realtimePlaceholder.innerText = '請選擇一個地區以載入即時天氣狀況。';
                } else { ui.realtimePlaceholder.innerText = '無法獲取天氣站點列表。'; }
            })
            .catch(error => {
                console.error('即時天氣 API 錯誤:', error);
                ui.realtimePlaceholder.innerText = '載入即時天氣數據失敗。';
            });
        ui.stationSelect.addEventListener('change', function() {
            displayRealtimeWeather(this.value);
        });
    }

    function initForecastWeather() {
        const forecastApiUrl = PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=fnd&lang=${LANG}`);
        fetch(forecastApiUrl)
            .then(response => response.json())
            .then(data => {
                ui.forecastContainer.innerHTML = '';
                if (data && data.weatherForecast) {
                    data.weatherForecast.forEach(day => {
                        const card = document.createElement('div');
                        card.className = 'forecast-day-card';
                        const date = `${day.forecastDate.slice(0,4)}-${day.forecastDate.slice(4,6)}-${day.forecastDate.slice(6,8)}`;
                        const iconUrl = `https://www.hko.gov.hk/images/wxicon/pic${day.ForecastIcon}.png`;
                        card.innerHTML = `<div class="date">${date}</div><div class="weekday">${day.week}</div><img src="${iconUrl}" alt="${day.forecastWeather}"><div class="temp">${day.forecastMintemp.value}°C / ${day.forecastMaxtemp.value}°C</div><div class="humidity">${day.forecastMinrh.value}% - ${day.forecastMaxrh.value}%</div><div class="weather-desc">${day.forecastWeather}</div>`;
                        ui.forecastContainer.appendChild(card);
                    });
                } else { ui.forecastPlaceholder.innerText = '無法獲取九日天氣預報。'; }
            })
            .catch(error => {
                console.error('九日預報 API 錯誤:', error);
                ui.forecastPlaceholder.innerText = '載入九日天氣預報失敗。';
            });
    }
    
    function displayRealtimeWeather(stationName) {
        if (!realtimeDataStore || !stationName) { return; }
        const tempData = realtimeDataStore.temperature.data.find(s => s.place === stationName);
        const humidityData = realtimeDataStore.humidity.data.find(s => s.place === stationName);
        const updateTime = new Date(realtimeDataStore.updateTime).toLocaleString('zh-HK');
        const iconId = realtimeDataStore.icon[0];
        ui.realtimeContainer.innerHTML = `<div class="weather-card visible"><div class="weather-header"><div class="location"><h3>${stationName}</h3><p>更新時間: ${updateTime}</p></div><div class="icon"><img src="https://www.hko.gov.hk/images/wxicon/pic${iconId}.png" alt="Weather Icon"></div></div><div class="weather-body"><div class="weather-metric"><div class="label">溫度</div><div class="value">${tempData ? tempData.value : 'N/A'} °C</div></div><div class="weather-metric"><div class="label">相對濕度</div><div class="value">${humidityData ? humidityData.value : 'N/A'} %</div></div></div></div>`;
    }

    // =======================================================
    //  新增功能：觀星建議摘要
    // =======================================================
    
    const DARK_SKY_LOCATIONS = [
        { name: "西貢萬宜水庫東壩", station: "西貢" },
        { name: "大嶼山南部 (例如：水口)", station: "長洲" },
        { name: "船灣淡水湖主壩", station: "大埔" },
        { name: "石澳", station: "黃竹坑" },
        { name: "大帽山", station: "荃灣" }
    ];

    function analyzeStargazingConditions(forecastData, realtimeData, visibilityData) {
        const tonightForecast = forecastData.weatherForecast[0];
        let recommendation = { status: "不建議", summary: "", details: `今晚整體天氣預測：${tonightForecast.forecastWeather}`, cssClass: "reco-bad" };

        if (tonightForecast.forecastWeather.includes("雨") || tonightForecast.forecastWeather.includes("雷")) {
            recommendation.summary = "今晚預測有雨或雷暴，雲層將完全遮蔽天空，非常不適合觀星。";
        } else if (tonightForecast.forecastWeather.includes("多雲")) {
            recommendation.summary = "今晚預測多雲，大部分時間天空將被雲層覆蓋，觀測條件不佳。";
        } else if (tonightForecast.forecastWeather.includes("晴") || tonightForecast.forecastWeather.includes("良好")) {
            let bestLocation = null, bestScore = -1000;
            if (realtimeData && visibilityData && visibilityData.data) {
                DARK_SKY_LOCATIONS.forEach(loc => {
                    const temp = realtimeData.temperature.data.find(s => s.place === loc.station);
                    const humidity = realtimeData.humidity.data.find(s => s.place === loc.station);
                    const vis = visibilityData.data.find(s => s[1] === loc.station);
                    if (temp && humidity && vis) {
                        const score = vis[2] - humidity.value;
                        if (score > bestScore) {
                            bestScore = score;
                            bestLocation = { name: loc.name, temp: temp.value, humidity: humidity.value, visibility: vis[2] };
                        }
                    }
                });
            }
            if (bestLocation) {
                recommendation.status = "建議";
                recommendation.cssClass = "reco-good";
                recommendation.summary = `今晚天氣大致良好，適合觀星！根據即時數據，目前觀測條件最佳的地點是「${bestLocation.name}」。`;
                recommendation.details += `\n推薦地點即時天氣：溫度 ${bestLocation.temp}°C，相對濕度 ${bestLocation.humidity}%，能見度 ${bestLocation.visibility} 公里。`;
            } else {
                recommendation.status = "建議";
                recommendation.cssClass = "reco-good";
                recommendation.summary = "今晚天氣大致良好，適合觀星。請選擇光害較少的地點。";
                recommendation.details += "\n(無法獲取所有地區的詳細數據以作精準推薦)";
            }
        } else {
            recommendation.summary = "今晚天氣預測一般，可能有雲層干擾，觀測條件存在不確定性。";
            recommendation.status = "可以考慮";
            recommendation.cssClass = "reco-ok";
        }
        
        ui.recommendationCard.className = recommendation.cssClass;
        ui.recommendationCard.innerHTML = `<h3 class="status">${recommendation.status}</h3><p class="summary">${recommendation.summary}</p><p class="details">${recommendation.details.replace(/\n/g, '<br>')}</p>`;
    }

    function initStargazingAnalysis() {
        const forecastUrl = PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=fnd&lang=${LANG}`);
        const realtimeUrl = PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=rhrread&lang=${LANG}`);
        // 關鍵修正：為能見度 API 加上 rformat=json 參數
        const visibilityUrl = PROXY_URL + encodeURIComponent(`${API_OPENDATA_BASE}?dataType=LTMV&lang=${LANG}&rformat=json`);

        Promise.all([
            fetch(forecastUrl).then(res => res.json()),
            fetch(realtimeUrl).then(res => res.json()),
            fetch(visibilityUrl).then(res => res.json())
        ]).then(([forecastData, realtimeData, visibilityData]) => {
            analyzeStargazingConditions(forecastData, realtimeData, visibilityData);
        }).catch(error => {
            console.error("生成建議時，一個或多個 API 請求失敗:", error);
            ui.recoPlaceholder.innerText = "無法載入所有天文台數據，無法生成建議。";
        });
    }

    // --- 頁面初始化 ---
    initRealtimeWeather();
    initForecastWeather();
    initStargazingAnalysis();
});
