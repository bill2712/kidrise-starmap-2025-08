// compass.js (v2.5 - 最終穩定完整版)

document.addEventListener("DOMContentLoaded", function() {
    // 守衛 Celestial 是否存在
    if (typeof Celestial === "undefined") { 
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        const section = document.querySelector(".section");
        if(section) section.innerHTML = "<h1>抱歉，核心元件載入失敗</h1>";
        return;
    }

    // --- UI 元素定義 ---
    const ui = {
        compassRose: document.getElementById('compass-rose'),
        compassNeedle: document.getElementById('compass-needle-img'),
        compassReading: document.getElementById('compass-reading'),
        currentTime: document.getElementById('current-time'),
        currentLocation: document.getElementById('current-location'),
        currentAltitude: document.getElementById('current-altitude'),
        visibleStarsList: document.getElementById('visible-stars-list'),
        permissionButton: document.getElementById('permission-button'),
        permissionRequestDiv: document.getElementById('permission-request')
    };

    // --- 狀態變數 ---
    let state = { location: null, lastUpdate: 0, celestialData: [], azimuth: 0 };

    // --- 初始化函式 ---
    function init() {
        updateTime();
        setInterval(updateTime, 1000);
        getLocation();
        
        // 使用一個最小化但完整的設定檔來安全地初始化 Celestial
        const celestialConfig = {
            projection: "stereographic",
            width: 1, // 只需一個非零值即可繞開 Bug
            datapath: "/kidrise-starmap-2025-08/data/",
            planets: { 
                show: true, 
                which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
                symbols: { "sol": {}, "lun": {}, "mer": {}, "ven": {}, "mar": {}, "jup": {}, "sat": {}, "ura": {}, "nep": {}, "ter": {} },
                namestyle: { fill: "#f0f0f0" }
            },
            callback: function(err) {
                if (err) return console.error("Celestial Error:", err);
                buildCelestialIndex();
                updateVisibleStars();
            }
        };
        Celestial.display(celestialConfig);

        // 為權限按鈕綁定事件
        ui.permissionButton.addEventListener('click', requestSensorPermission);
    }
    
    // --- 功能函式 ---

    function updateTime() { 
        if (ui.currentTime) ui.currentTime.textContent = new Date().toLocaleTimeString('zh-HK'); 
    }

    function getLocation() {
        if (!navigator.geolocation) {
            if (ui.currentLocation) ui.currentLocation.textContent = "瀏覽器不支援定位";
            return;
        }
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude, altitude } = pos.coords;
            state.location = [latitude, longitude];
            fetchLocationName(latitude, longitude);
            if (ui.currentAltitude) {
                if (altitude) {
                    ui.currentAltitude.textContent = `海拔: ${Math.round(altitude)} 公尺`;
                } else {
                    ui.currentAltitude.textContent = "海拔: N/A";
                }
            }
            updateVisibleStars();
        }, err => { 
            if (ui.currentLocation) ui.currentLocation.textContent = "無法獲取位置"; 
        });
    }

    function fetchLocationName(lat, lon) {
        const PROXY_URL = 'https://api.allorigins.win/raw?url=';
        const ORIGINAL_API_URL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const REVERSE_GEOCODING_API = PROXY_URL + encodeURIComponent(ORIGINAL_API_URL);
        
        fetch(REVERSE_GEOCODING_API, { headers: { 'Accept-Language': 'zh-HK, zh' } })
            .then(response => response.json())
            .then(data => {
                let locationName = "未知地點";
                if (data && data.address) {
                    const address = data.address;
                    if (address.country === '香港' || address.country === 'Hong Kong') {
                        const district = address.suburb || address.city_district || address.city || '';
                        locationName = `香港・${district}`;
                    } else if (address.country === '澳門' || address.country === 'Macau') {
                        const district = address.city_district || address.city || '';
                        locationName = `澳門・${district}`;
                    } else {
                        const city = address.city || address.town || address.village || '';
                        locationName = `${address.country}・${city}`;
                    }
                }
                const latDMS = decimalToDMS(lat, true);
                const lonDMS = decimalToDMS(lon, false);
                if (ui.currentLocation) ui.currentLocation.textContent = `${locationName} (${latDMS} ${lonDMS})`;
            })
            .catch(error => {
                console.error("逆地理編碼錯誤:", error);
                if (ui.currentLocation) ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
            });
    }

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
                    if (ui.permissionRequestDiv) ui.permissionRequestDiv.style.display = 'none';
                } else { 
                    alert('您拒絕了感測器權限，指南針功能無法使用。'); 
                }
            }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', orientationHandler, true);
            if (ui.permissionRequestDiv) ui.permissionRequestDiv.style.display = 'none';
        }
    }

    function orientationHandler(event) {
        const now = performance.now();
        if (now - state.lastUpdate < 100) return;
        state.lastUpdate = now;
        let alpha = event.webkitCompassHeading || event.alpha;
        if (alpha === null) return;
        state.azimuth = alpha;
        if (ui.compassNeedle) ui.compassNeedle.style.transform = `rotate(${alpha}deg)`;
        if (ui.compassReading) ui.compassReading.textContent = `${Math.round(alpha)}° ${getDirectionFromAzimuth(alpha)}`;
        updateVisibleStars();
    }
    
    function getDirectionFromAzimuth(azimuth) {
        const directions = ['北', '東北偏北', '東北', '東北偏東', '東', '東南偏東', '東南', '東南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北'];
        const index = Math.round(azimuth / 22.5) % 16;
        return directions[index];
    }
    
    function buildCelestialIndex() {
        state.celestialData = [];
        if (Celestial.constellations) { Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation" })); }
        if (Celestial.data?.stars?.features) { Celestial.data.stars.features.forEach(f => { const nm = f.properties?.name; if (nm && f.properties.mag < 2.5) state.celestialData.push({ name: nm, type: "star" }); }); }
        ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet" }));
    }

    function updateVisibleStars() {
        if (!state.location || state.celestialData.length === 0) return;
        Celestial.date(new Date());
        
        const visibleObjects = [];
        const viewAzimuth = state.azimuth;
        const viewAltitude = 30;
        const viewRadius = 45;
        const centerCoords = Celestial.azimuthalToEquatorial({az: viewAzimuth, alt: viewAltitude}, state.location);

        state.celestialData.forEach(item => {
            const itemCoords = Celestial.search({ type: item.type, name: item.name });
            if (itemCoords) {
                const distance = Celestial.distance(centerCoords, itemCoords);
                const currentPos = Celestial.equatorialToAzimuthal(itemCoords, state.location);
                if (currentPos.alt > 0 && distance <= viewRadius) {
                    visibleObjects.push(item);
                }
            }
        });

        if (ui.visibleStarsList) {
            if (visibleObjects.length > 0) {
                ui.visibleStarsList.innerHTML = visibleObjects
                    .slice(0, 5)
                    .map(item => `<li><span class="star-type star-type-${item.type.toLowerCase()}">${getTypeName(item.type)}</span> ${item.name}</li>`)
                    .join('');
            } else {
                ui.visibleStarsList.innerHTML = `<li>當前方向無顯著目標</li>`;
            }
        }
    }
    
    function getTypeName(type) {
        const names = { "constellation": "星座", "star": "恆星", "planet": "行星" };
        return names[type] || type;
    }

    // --- 啟動 App ---
    init();
});
