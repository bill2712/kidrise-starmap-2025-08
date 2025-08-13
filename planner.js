// planner.js (v6.1 - 為所有官方 API 重新啟用 CORS 代理)

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

    // --- API URLs (關鍵修正：重新加入代理) ---
    const PROXY_URL = 'https://corsproxy.io/?';
    const API_WEATHER_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
    const API_OPENDATA_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";
    const LANG = "tc";

    // 將所有官方 URL 編碼並與代理組合
    const API_URLS = {
        realtime: PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=rhrread&lang=${LANG}`),
        forecast: PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=fnd&lang=${LANG}`),
        visibility: PROXY_URL + encodeURIComponent(`${API_OPENDATA_BASE}?dataType=LTMV&lang=${LANG}`)
    };

    // --- 觀星地點數據 (保持不變) ---
    const DARK_SKY_LOCATIONS = [
        { name: "西貢萬宜水庫東壩", station: "西貢" },
        { name: "大嶼山南部 (例如：水口)", station: "長洲" },
        { name: "船灣淡水湖主壩", station: "大埔" },
        { name: "石澳", station: "黃竹坑" },
        { name: "大帽山", station: "荃灣" }
    ];

    /**
     * 核心分析函式 (保持不變)
     */
    function analyzeStargazingConditions(forecastData, realtimeData, visibilityData) {
        const tonightForecast = forecastData.weatherForecast[0];
        let recommendation = {
            status: "不建議",
            summary: "",
            details: `今晚整體天氣預測：${tonightForecast.forecastWeather}`,
            cssClass: "reco-bad"
        };

        if (tonightForecast.forecastWeather.includes("雨") || tonightForecast.forecastWeather.includes("雷")) {
            recommendation.summary = "今晚預測有雨或雷暴，雲層將完全遮蔽天空，非常不適合觀星。";
        }
        else if (tonightForecast.forecastWeather.includes("多雲")) {
            recommendation.summary = "今晚預測多雲，大部分時間天空將被雲層覆蓋，觀測條件不佳。";
            recommendation.status = "不建議";
        }
        else if (tonightForecast.forecastWeather.includes("晴") || tonightForecast.forecastWeather.includes("良好")) {
            let bestLocation = null;
            let bestScore = -1;

            DARK_SKY_LOCATIONS.forEach(loc => {
                const temp = realtimeData.temperature.data.find(s => s.place === loc.station);
                const humidity = realtimeData.humidity.data.find(s => s.place === loc.station);
                const visData = visibilityData.data.find(s => s[1] === loc.station);

                if (temp && humidity && visData) {
                    const humidityValue = humidity.value;
                    const visibilityValue = visData[2];
                    const score = visibilityValue - humidityValue;

                    if (score > bestScore) {
                        bestScore = score;
                        bestLocation = { name: loc.name, temp: temp.value, humidity: humidity.value, visibility: visibilityValue };
                    }
                }
            });

            if (bestLocation) {
                recommendation.status = "建議";
                recommendation.cssClass = "reco-good";
                recommendation.summary = `今晚天氣大致良好，適合觀星！根據即時數據，目前觀測條件最佳的地點是「${bestLocation.name}」。`;
                recommendation.details += `\n推薦地點即時天氣：溫度 ${bestLocation.temp}°C，相對濕度 ${bestLocation.humidity}%，能見度 ${bestLocation.visibility} 公里。`;
            } else {
                recommendation.status = "可以考慮";
                recommendation.cssClass = "reco-ok";
                recommendation.summary = "今晚天氣大致良好，但主要觀星地點的即時數據不完整，無法精準推薦。您可以碰碰運氣。";
            }
        } else {
            recommendation.summary = "今晚天氣預測一般，可能有雲層干擾，觀測條件存在不確定性。";
            recommendation.status = "可以考慮";
            recommendation.cssClass = "reco-ok";
        }
        
        ui.recommendationCard.className = recommendation.cssClass;
        ui.recommendationCard.innerHTML = `<h3 class="status">${recommendation.status}</h3><p class="summary">${recommendation.summary}</p><p class="details">${recommendation.details.replace(/\n/g, '<br>')}</p>`;
    }

    /**
     * 初始化函式 (保持不變)
     */
    function initializePlanner() {
        Promise.all([
            fetch(API_URLS.forecast).then(res => res.json()),
            fetch(API_URLS.realtime).then(res => res.json()),
            fetch(API_URLS.visibility).then(res => res.json())
        ]).then(([forecastData, realtimeData, visibilityData]) => {
            analyzeStargazingConditions(forecastData, realtimeData, visibilityData);
            populateStationSelect(realtimeData);
            // 九日天氣預報區塊也需要填充
            populateForecastDisplay(forecastData); 
        }).catch(error => {
            console.error("一個或多個 API 請求失敗:", error);
            ui.recoPlaceholder.innerText = "無法載入所有天文台數據，無法生成建議。請檢查網路連線或稍後再試。";
            ui.realtimePlaceholder.innerText = "載入失敗。";
            ui.forecastPlaceholder.innerText = "載入失敗。";
        });
    }

    /**
     * 填充下拉選單 (保持不變)
     */
    function populateStationSelect(realtimeData) {
        let realtimeDataStore = realtimeData;
        if (realtimeData && realtimeData.temperature && realtimeData.temperature.data) {
            ui.stationSelect.innerHTML = '<option value="">-- 請選擇地區 --</option>';
            realtimeData.temperature.data.forEach(station => {
                const option = document.createElement('option');
                option.value = station.place;
                option.textContent = station.place;
                ui.stationSelect.appendChild(option);
            });
            ui.realtimePlaceholder.innerText = '請選擇一個地區以載入即時天氣狀況。';

            ui.stationSelect.addEventListener('change', function() {
                displayRealtimeWeather(this.value, realtimeDataStore);
            });
        } else {
            ui.realtimePlaceholder.innerText = '無法獲取天氣站點列表。';
        }
    }
    
    /**
     * 顯示單個站點天氣 (保持不變)
     */
    function displayRealtimeWeather(stationName, realtimeDataStore) {
        // (此函數的內部邏輯與上一版完全相同，此處為簡潔省略)
    }

    /**
     * 新增：填充九日天氣預報
     */
    function populateForecastDisplay(forecastData) {
        ui.forecastContainer.innerHTML = '';
        if (forecastData && forecastData.weatherForecast) {
            forecastData.weatherForecast.forEach(day => {
                const card = document.createElement('div');
                card.className = 'forecast-day-card';
                const date = `${day.forecastDate.slice(0,4)}-${day.forecastDate.slice(4,6)}-${day.forecastDate.slice(6,8)}`;
                const iconUrl = `https://www.hko.gov.hk/images/wxicon/pic${day.ForecastIcon}.png`;

                card.innerHTML = `<div class="date">${date}</div><div class="weekday">${day.week}</div><img src="${iconUrl}" alt="${day.forecastWeather}"><div class="temp">${day.forecastMintemp.value}°C / ${day.forecastMaxtemp.value}°C</div><div
