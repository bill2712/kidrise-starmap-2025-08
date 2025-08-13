// planner.js (v6.2 - 使用 Promise.allSettled 提升容錯能力)

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

    // --- API URLs (使用 CORS 代理確保穩定) ---
    const PROXY_URL = 'https://corsproxy.io/?';
    const API_WEATHER_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
    const API_OPENDATA_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";
    const LANG = "tc";

    const API_URLS = {
        realtime: PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=rhrread&lang=${LANG}`),
        forecast: PROXY_URL + encodeURIComponent(`${API_WEATHER_BASE}?dataType=fnd&lang=${LANG}`),
        visibility: PROXY_URL + encodeURIComponent(`${API_OPENDATA_BASE}?dataType=LTMV&lang=${LANG}`)
    };

    // --- 觀星地點數據 ---
    const DARK_SKY_LOCATIONS = [
        { name: "西貢萬宜水庫東壩", station: "西貢" },
        { name: "大嶼山南部 (例如：水口)", station: "長洲" },
        { name: "船灣淡水湖主壩", station: "大埔" },
        { name: "石澳", station: "黃竹坑" },
        { name: "大帽山", station: "荃灣" }
    ];

    /**
     * 核心分析函式：現在能處理不完整的數據
     */
    function analyzeStargazingConditions(results) {
        const forecastResult = results[0];
        const realtimeResult = results[1];
        const visibilityResult = results[2];

        // 1. 檢查最關鍵的「天氣預報」數據是否成功
        if (forecastResult.status !== 'fulfilled' || !forecastResult.value.weatherForecast) {
            ui.recoPlaceholder.innerText = "無法獲取核心天氣預報，無法生成建議。";
            return;
        }
        
        const forecastData = forecastResult.value;
        const realtimeData = realtimeResult.status === 'fulfilled' ? realtimeResult.value : null;
        const visibilityData = visibilityResult.status === 'fulfilled' ? visibilityResult.value : null;

        const tonightForecast = forecastData.weatherForecast[0];
        let recommendation = { status: "不建議", summary: "", details: `今晚整體天氣預測：${tonightForecast.forecastWeather}`, cssClass: "reco-bad" };

        if (tonightForecast.forecastWeather.includes("雨") || tonightForecast.forecastWeather.includes("雷")) {
            recommendation.summary = "今晚預測有雨或雷暴，雲層將完全遮蔽天空，非常不適合觀星。";
        }
        else if (tonightForecast.forecastWeather.includes("多雲")) {
            recommendation.summary = "今晚預測多雲，大部分時間天空將被雲層覆蓋，觀測條件不佳。";
        }
        else if (tonightForecast.forecastWeather.includes("晴") || tonightForecast.forecastWeather.includes("良好")) {
            // 只有在天氣良好時，才嘗試推薦地點
            let bestLocation = null;
            let bestScore = -1000;

            // 檢查是否有即時數據可用
            if (realtimeData && realtimeData.temperature) {
                DARK_SKY_LOCATIONS.forEach(loc => {
                    const temp = realtimeData.temperature.data.find(s => s.place === loc.station);
                    const humidity = realtimeData.humidity.data.find(s => s.place === loc.station);
                    
                    // 能見度數據是可選的
                    const vis = visibilityData ? visibilityData.data.find(s => s[1] === loc.station) : null;
                    
                    if (temp && humidity) {
                        const humidityValue = humidity.value;
                        const visibilityValue = vis ? vis[2] : 0; // 如果沒有能見度數據，則設為0
                        const score = visibilityValue - humidityValue;

                        if (score > bestScore) {
                            bestScore = score;
                            bestLocation = { name: loc.name, temp: temp.value, humidity: humidity.value, visibility: vis ? visibilityValue : null };
                        }
                    }
                });
            }

            if (bestLocation) {
                recommendation.status = "建議";
                recommendation.cssClass = "reco-good";
                recommendation.summary = `今晚天氣大致良好，適合觀星！根據即時數據，目前觀測條件最佳的地點是「${bestLocation.name}」。`;
                let detailsText = `\n推薦地點即時天氣：溫度 ${bestLocation.temp}°C，相對濕度 ${bestLocation.humidity}%`;
                if(bestLocation.visibility !== null) {
                    detailsText += `，能見度 ${bestLocation.visibility} 公里。`;
                } else {
                    detailsText += `。(能見度數據暫缺)`;
                }
                recommendation.details += detailsText;
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

    /**
     * 初始化函式：頁面載入時執行
     */
    function initializePlanner() {
        // 使用 Promise.allSettled 來處理所有請求
        Promise.allSettled([
            fetch(API_URLS.forecast),
            fetch(API_URLS.realtime),
            fetch(API_URLS.visibility)
        ]).then(results => {
            // 將請求結果（無論成敗）傳遞給分析函式
            const jsonDataPromises = results.map(result => {
                if (result.status === 'fulfilled' && result.value.ok) {
                    return result.value.json();
                }
                // 如果失敗，返回一個包含錯誤的物件
                return Promise.resolve({ error: true, status: result.reason || result.value.status });
            });
            
            // 解析所有 JSON
            Promise.all(jsonDataPromises).then(dataResults => {
                // 將成功或失敗的結果包裝回 allSettled 的格式
                const finalResults = dataResults.map((data, index) => {
                    if (data.error) {
                        return { status: 'rejected', reason: `API request failed with status: ${data.status}` };
                    }
                    return { status: 'fulfilled', value: data };
 eighty-four
                });
                
                // 執行分析
                analyzeStargazingConditions(finalResults);
                
                // 獨立處理下方區塊的 UI
                const realtimeResult = finalResults[1];
                if(realtimeResult.status === 'fulfilled') {
                    populateStationSelect(realtimeResult.value);
                } else {
                    ui.realtimePlaceholder.innerText = "載入即時天氣失敗。";
                }

                const forecastResult = finalResults[0];
                if(forecastResult.status === 'fulfilled') {
                    populateForecastDisplay(forecastResult.value);
                } else {
                    ui.forecastPlaceholder.innerText = "載入九日預報失敗。";
                }
            });
        });
    }

    // 填充下拉選單 (保持不變)
    function populateStationSelect(realtimeData) {
        // ... (省略內部實作)
    }
    
    // 顯示單個站點天氣 (保持不變)
    function displayRealtimeWeather(stationName, realtimeDataStore) {
        // ... (省略內部實作)
    }

    // 填充九日天氣預報 (保持不變)
    function populateForecastDisplay(forecastData) {
        // ... (省略內部實作)
    }

    // --- 頁面啟動 ---
    initializePlanner();
});
