// compass.js (v2.9 - 新增穩健的數據載入與按鈕狀態管理)
document.addEventListener("DOMContentLoaded", function() {
    if (typeof Celestial === "undefined") { return; }

    const ui = {
        compassNeedle: document.getElementById('compass-needle-img'),
        compassReading: document.getElementById('compass-reading'),
        currentTime: document.getElementById('current-time'),
        currentLocation: document.getElementById('current-location'),
        currentAltitude: document.getElementById('current-altitude'),
        visibleStarsList: document.getElementById('visible-stars-list'),
        permissionButton: document.getElementById('permission-button'),
        permissionRequestDiv: document.getElementById('permission-request'),
        mainContentDiv: document.getElementById('compass-main-content'),
        analyzeButton: document.getElementById('analyze-direction-button')
    };

    let state = { 
        location: null, 
        lastUpdate: 0, 
        celestialData: [], 
        azimuth: 0,
        rotationCount: 0,
        lastRawAzimuth: 0,
        locationReady: false,
        celestialDataReady: false
    };
    
    const celestialDetails = { "Sun": "太陽是太陽系的中心恆星，觀測時必須使用專業的太陽濾鏡以保護眼睛。", "Moon": "月球是地球唯一的天然衛星，充滿了環形山和廣闊的月海，是初學者的最佳目標。", "Mars": "火星因其表面的氧化鐵而呈現紅色，在特定時間可以看到其白色的極冠。", "Jupiter": "木星是太陽系最大的行星，用小型望遠鏡就能看到它和它的四顆伽利略衛星。", "Saturn": "土星以其壯麗的光環而聞名，這是在望遠鏡中最令人驚嘆的景象之一。", "Orion": "獵戶座是冬季夜空中最顯眼的星座，以其腰帶上並排的三顆亮星而聞名，其內部擁有著名的獵戶座大星雲(M42)。", "Ursa Major": "大熊座包含了著名的北斗七星，是北天最重要的指極星座之一，可以幫助你找到北極星。", "Cassiopeia": "仙后座是一個呈 W 或 M 形的星座，位於北極星的另一側，與大熊座相對。", "Sirius": "天狼星是夜空中最亮的恆星，位於大犬座，可以順著獵戶座腰帶三星向左下方找到它。", "Polaris": "北極星位於小熊座的尾巴末端，非常接近天球北極，因此看起來幾乎不動，是尋找北方的重要指標。" };

    function init() {
        updateTime();
        setInterval(updateTime, 1000);
        
        ui.analyzeButton.disabled = true;
        ui.analyzeButton.style.backgroundColor = '#666'; // 灰色表示禁用
        ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">正在載入位置及星體數據...</p>`;
        
        const celestialConfig = {
            projection: "stereographic", width: 1, datapath: "/kidrise-starmap-2025-08/data/",
            planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbols: { "sol": {}, "lun": {}, "mer": {}, "ven": {}, "mar": {}, "jup": {}, "sat": {}, "ura": {}, "nep": {}, "ter": {} }, namestyle: { fill: "#f0f0f0" } },
            callback: function(err) { if (err) return; buildCelestialIndex(); }
        };
        Celestial.display(celestialConfig);

        ui.permissionButton.addEventListener('click', requestSensorPermission);
        ui.analyzeButton.addEventListener('click', analyzeDirection);
    }
    
    function checkReadyState() {
        if (state.locationReady && state.celestialDataReady) {
            ui.analyzeButton.disabled = false;
            ui.analyzeButton.style.backgroundColor = '#2ecc71';
            ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">數據已就緒。請確定方向後點擊「分析」按鈕。</p>`;
        }
    }

    function getLocation() {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude, altitude } = pos.coords;
            state.location = [latitude, longitude];
            state.locationReady = true;
            checkReadyState();
            fetchLocationName(latitude, longitude);
            if (altitude) { ui.currentAltitude.textContent = `海拔: ${Math.round(altitude)} 公尺`; } 
            else { ui.currentAltitude.textContent = "海拔: N/A"; }
        }, err => { 
            ui.currentLocation.textContent = "無法獲取位置"; 
            ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">錯誤：無法獲取您的位置，請檢查瀏覽器權限。</p>`;
        });
    }

    function buildCelestialIndex() {
        state.celestialData = [];
        if (Celestial.constellations) { Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation", id: c.id })); }
        if (Celestial.data?.stars?.features) { Celestial.data.stars.features.forEach(f => { const nm = f.properties?.name; if (nm && f.properties.mag < 2.5) state.celestialData.push({ name: nm, type: "star" }); }); }
        ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet" }));
        state.celestialDataReady = true;
        checkReadyState();
    }
    
    function analyzeDirection() {
        if (!state.locationReady || !state.celestialDataReady) {
            alert("數據仍在載入中，請稍候。");
            return;
        }
        const capturedAzimuth = state.azimuth;
        ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">正在分析 ${Math.round(capturedAzimuth)}° 方向的星空...</p>`;
        setTimeout(() => {
            updateVisibleStars(capturedAzimuth);
        }, 100);
    }

    function updateTime() { ui.currentTime.textContent = new Date().toLocaleTimeString('zh-HK'); }
    function fetchLocationName(lat, lon) { const PROXY_URL = 'https://api.allorigins.win/raw?url='; const ORIGINAL_API_URL = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`; const REVERSE_GEOCODING_API = PROXY_URL + encodeURIComponent(ORIGINAL_API_URL); fetch(REVERSE_GEOCODING_API, { headers: { 'Accept-Language': 'zh-HK, zh' } }).then(response => response.json()).then(data => { let locationName = "未知地點"; if (data && data.address) { const address = data.address; if (address.country === '香港' || address.country === 'Hong Kong') { const district = address.suburb || address.city_district || address.city || ''; locationName = `香港・${district}`; } else if (address.country === '澳門' || address.country === 'Macau') { const district = address.city_district || address.city || ''; locationName = `澳門・${district}`; } else { const city = address.city || address.town || address.village || ''; locationName = `${address.country}・${city}`; } } const latDMS = decimalToDMS(lat, true); const lonDMS = decimalToDMS(lon, false); ui.currentLocation.textContent = `${locationName} (${latDMS} ${lonDMS})`; }).catch(error => { console.error("逆地理編碼錯誤:", error); ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`; }); }
    function decimalToDMS(decimal, isLatitude) { const dir = decimal > 0 ? (isLatitude ? '北緯' : '東經') : (isLatitude ? '南緯' : '西經'); const absDecimal = Math.abs(decimal); const deg = Math.floor(absDecimal); const minFloat = (absDecimal - deg) * 60; const min = Math.floor(minFloat); const sec = Math.round((minFloat - min) * 60); return `${dir}${deg}°${min}'${sec}"`; }
    function requestSensorPermission() { if (typeof DeviceOrientationEvent.requestPermission === 'function') { DeviceOrientationEvent.requestPermission().then(permissionState => { if (permissionState === 'granted') { window.addEventListener('deviceorientation', orientationHandler, true); ui.permissionRequestDiv.classList.add('hidden'); ui.mainContentDiv.classList.remove('hidden'); } else { alert('您拒絕了感測器權限，指南針功能無法使用。'); } }).catch(console.error); } else { window.addEventListener('deviceorientation', orientationHandler, true); ui.permissionRequestDiv.classList.add('hidden'); ui.mainContentDiv.classList.remove('hidden'); } }
    function orientationHandler(event) { let alpha = event.webkitCompassHeading || event.alpha; if (alpha === null) return; let diff = alpha - state.lastRawAzimuth; if (Math.abs(diff) > 180) { if (diff > 0) { state.rotationCount--; } else { state.rotationCount++; } } const cumulativeRotation = alpha + state.rotationCount * 360; state.lastRawAzimuth = alpha; state.azimuth = alpha; if (ui.compassNeedle) ui.compassNeedle.style.transform = `rotate(${cumulativeRotation}deg)`; if (ui.compassReading) ui.compassReading.textContent = `${Math.round(alpha)}° ${getDirectionFromAzimuth(alpha)}`; }
    function getDirectionFromAzimuth(azimuth) { const directions = ['北', '東北偏北', '東北', '東北偏東', '東', '東南偏東', '東南', '東南偏南', '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北']; const index = Math.round(azimuth / 22.5) % 16; return directions[index]; }
    function updateVisibleStars(capturedAzimuth) { Celestial.date(new Date()); const visibleObjects = []; const centerCoords = Celestial.azimuthalToEquatorial({az: capturedAzimuth, alt: 30}, state.location); state.celestialData.forEach(item => { const searchParams = { type: item.type, name: item.name }; if (item.type === 'constellation' && item.id) { searchParams.id = item.id; } const itemCoords = Celestial.search(searchParams); if (itemCoords) { const distance = Celestial.distance(centerCoords, itemCoords); const currentPos = Celestial.equatorialToAzimuthal(itemCoords, state.location); if (currentPos.alt > 0 && distance <= 45) { visibleObjects.push(item); } } }); if (ui.visibleStarsList) { if (visibleObjects.length > 0) { ui.visibleStarsList.innerHTML = visibleObjects.slice(0, 5).map(item => { const detail = celestialDetails[item.name] || `這是${item.name}，一個美麗的宇宙天體。`; const typeClass = `star-type-${item.type.toLowerCase()}`; const borderColor = { constellation: '#3498db', star: '#f1c40f', planet: '#c2b280' }[item.type] || '#ccc'; return `<div class="star-details-card" style="border-left-color: ${borderColor};"><div class="star-details-header"><span class="star-type ${typeClass}">${getTypeName(item.type)}</span><h4>${item.name}</h4></div><p>${detail}</p></div>`; }).join(''); } else { ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">在 ${Math.round(capturedAzimuth)}° 方向的地平線以上，目前沒有找到顯著目標。</p>`; } } }
    function getTypeName(type) { const names = { "constellation": "星座", "star": "恆星", "planet": "行星" }; return names[type] || type; }
    
    init();
});
