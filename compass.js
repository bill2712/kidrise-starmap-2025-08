// compass.js (v2.3 - 更換為更穩定的 CORS 代理)

document.addEventListener("DOMContentLoaded", function() {
    if (typeof Celestial === "undefined") { return console.error("核心星圖函式庫 Celestial 未能成功載入。"); }

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

    let state = { location: null, lastUpdate: 0, celestialData: [], azimuth: 0 };

    function init() {
        updateTime();
        setInterval(updateTime, 1000);
        getLocation();
        
        const celestialConfig = {
            projection: "stereographic",
            width: 1, 
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

        ui.permissionButton.addEventListener('click', requestSensorPermission);
    }
    
    function updateTime() { ui.currentTime.textContent = new Date().toLocaleTimeString('zh-HK'); }

    function getLocation() {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude, altitude } = pos.coords;
            state.location = [latitude, longitude];
            fetchLocationName(latitude, longitude);
            if (altitude) {
                ui.currentAltitude.textContent = `海拔: ${Math.round(altitude)} 公尺`;
            } else {
                ui.currentAltitude.textContent = "海拔: N/A";
            }
            updateVisibleStars();
        }, err => { ui.currentLocation.textContent = "無法獲取位置"; });
    }

    function fetchLocationName(lat, lon) {
        // =======================================================
        // ============== 關鍵修正：更換代理伺服器 ===============
        // =======================================================
        const ORIGINAL_API_URL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        // 使用 AllOrigins 代理，它的格式是將原始 URL 作為查詢參數傳遞
        const REVERSE_GEOCODING_API = `https://api.allorigins.win/raw?url=${encodeURIComponent(ORIGINAL_API_URL)}`;
        // =======================================================
        
        fetch(REVERSE_GEOCODING_API, { headers: { 'Accept-Language': 'zh-HK, zh' } })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.address) {
                    const address = data.address;
                    const locationName = address.city || address.town || address.county || address.state || address.country || "未知地點";
                    const latDMS = decimalToDMS(lat, true);
                    const lonDMS = decimalToDMS(lon, false);
                    ui.currentLocation.textContent = `${locationName} (${latDMS} ${lonDMS})`;
                } else {
                     ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
                }
            })
            .catch(error => {
                console.error("逆地理編碼錯誤:", error);
                ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
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
        ui.compassNeedle.style.transform = `rotate(${alpha}deg)`;
        ui.compassReading.textContent = `${Math.round(alpha)}° ${getDirectionFromAzimuth(alpha)}`;
        updateVisibleStars();
    }
    
    function getDirectionFromAzimuth(azimuth) {
        const directions = ['北', '東北偏北', '東北', '東北偏東', '東', '東南偏東', '東南', '東南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北'];
        const index = Math.round(azimuth / 22.5) % 16;
        return directions[index];
    }
    
    function buildCelestialIndex() {
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

        if (visibleObjects.length > 0) {
            ui.visibleStarsList.innerHTML = visibleObjects
                .slice(0, 5)
                .map(item => `<li><span class="star-type star-type-${item.type.toLowerCase()}">${getTypeName(item.type)}</span> ${item.name}</li>`)
                .join('');
        } else {
            ui.visibleStarsList.innerHTML = `<li>當前方向無顯著目標</li>`;
        }
    }
    
    function getTypeName(type) {
        const names = { "constellation": "星座", "star": "恆星", "planet": "行星" };
        return names[type] || type;
    }

    init();
});
