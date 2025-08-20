// compass.js (v2.0 - 功能升級版)

document.addEventListener("DOMContentLoaded", function() {
    if (typeof Celestial === "undefined") { return console.error("核心星圖函式庫 Celestial 未能成功載入。"); }

    const ui = {
        compassNeedle: document.getElementById('compass-needle-img'),
        compassReading: document.getElementById('compass-reading'),
        currentTime: document.getElementById('current-time'),
        currentLocation: document.getElementById('current-location'),
        currentAltitude: document.getElementById('current-altitude'),
        visibleStarsList: document.getElementById('visible-stars-list'),
        permissionButton: document.getElementById('permission-button'),
        permissionRequestDiv: document.getElementById('permission-request')
    };

    let state = { location: null, lastUpdate: 0, celestialData: [], azimuth: 0 };

    function init() {
        updateTime();
        setInterval(updateTime, 1000);
        getLocation();
        const celestialConfig = {
            width: 1, datapath: "/kidrise-starmap-2025-08/data/",
            planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbols: { "sol": {}, "lun": {}, "mer": {}, "ven": {}, "mar": {}, "jup": {}, "sat": {}, "ura": {}, "nep": {}, "ter": {} }, namestyle: {} },
            callback: function(err) { if (err) return; buildCelestialIndex(); }
        };
        Celestial.display(celestialConfig);
        ui.permissionButton.addEventListener('click', requestSensorPermission);
    }
    
    function updateTime() { ui.currentTime.textContent = new Date().toLocaleTimeString('zh-HK'); }

    function getLocation() {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude, altitude } = pos.coords;
            state.location = [latitude, longitude];
            fetchLocationName(latitude, longitude);
            // 升級 5: 顯示海拔高度
            if (altitude) {
                ui.currentAltitude.textContent = `海拔: ${Math.round(altitude)} 公尺`;
            } else {
                ui.currentAltitude.textContent = "海拔: N/A";
            }
            updateVisibleStars();
        }, err => { ui.currentLocation.textContent = "無法獲取位置"; });
    }

    // 升級 4: 請求中文地點
    function fetchLocationName(lat, lon) {
        const PROXY_URL = 'https://corsproxy.io/?';
        const ORIGINAL_API_URL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const REVERSE_GEOCODING_API = PROXY_URL + encodeURIComponent(ORIGINAL_API_URL);
        fetch(REVERSE_GEOCODING_API, { headers: { 'Accept-Language': 'zh-HK, zh' } })
            .then(response => response.json())
            .then(data => {
                const address = data.address;
                let locationName = "未知地點";
                if (address) {
                    locationName = address.city || address.town || address.county || address.state || address.country;
                }
                // 升級 3: 顯示度分秒格式
                const latDMS = decimalToDMS(lat, true);
                const lonDMS = decimalToDMS(lon, false);
                ui.currentLocation.textContent = `${locationName} (${latDMS} ${lonDMS})`;
            })
            .catch(error => {
                console.error("逆地理編碼錯誤:", error);
                ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
            });
    }

    // 升級 3: 將十進位經緯度轉為度分秒格式
    function decimalToDMS(decimal, isLatitude) {
        const dir = decimal > 0 ? (isLatitude ? '北緯' : '東經') : (isLatitude ? '南緯' : '西經');
        const absDecimal = Math.abs(decimal);
        const deg = Math.floor(absDecimal);
        const minFloat = (absDecimal - deg) * 60;
        const min = Math.floor(minFloat);
        const sec = Math.round((minFloat - min) * 60);
        return `${dir}${deg}°${min}'${sec}"`;
    }

    function requestSensorPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', orientationHandler, true);
                    ui.permissionRequestDiv.style.display = 'none';
                } else { alert('您拒絕了感測器權限，指南針功能無法使用。'); }
            }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', orientationHandler, true);
            ui.permissionRequestDiv.style.display = 'none';
        }
    }

    function orientationHandler(event) {
        const now = performance.now();
        if (now - state.lastUpdate < 100) return;
        state.lastUpdate = now;
        let alpha = event.webkitCompassHeading || event.alpha;
        if (alpha === null) return;
        state.azimuth = alpha;
        // 升級 1: 旋轉指針
        ui.compassNeedle.style.transform = `rotate(${alpha}deg)`;
        // 升級 2: 顯示中文方位
        ui.compassReading.textContent = `${Math.round(alpha)}° ${getDirectionFromAzimuth(alpha)}`;
        updateVisibleStars();
    }
    
    // 升級 2: 根據角度獲取中文方位
    function getDirectionFromAzimuth(azimuth) {
        const directions = ['北', '東北偏北', '東北', '東北偏東', '東', '東南偏東', '東南', '東南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北'];
        const index = Math.round(azimuth / 22.5) % 16;
        return directions[index];
    }
    
    // (buildCelestialIndex, updateVisibleStars, getTypeName 保持不變)
    function buildCelestialIndex() { /* ... */ }
    function updateVisibleStars() { /* ... */ }
    function getTypeName(type) { /* ... */ }

    init();
});
