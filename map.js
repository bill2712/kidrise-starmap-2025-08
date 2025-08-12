// map.js (v3.1 - 移除目標搜尋功能)
document.addEventListener("DOMContentLoaded", function() {

    if (typeof Celestial === "undefined") { return console.error("核心星圖函式庫 Celestial 未能成功載入。"); }

    const ui = {
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
    };

    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        orientationLastUpdate: 0
    };

    const constellationArtConfig = {
      images: true, imageStyle: { width: 0.8, opacity: 0.4 },
      imageList: [ {c:"ori", f:"/kidrise-starmap/images/constellations/ori.png"}, {c:"uma", f:"/kidrise-starmap/images/constellations/uma.png"}, {c:"cas", f:"/kidrise-starmap/images/constellations/cas.png"}, {c:"sco", f:"/kidrise-starmap/images/constellations/sco.png"} ]
    };

    const celestialConfig = {
        width: 0, projection: "stereographic", transform: "equatorial", background: { fill: "#000", stroke: "#000" }, datapath: "/kidrise-starmap/data/", interactive: true, zoombuttons: false, controls: true,
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 16px 'Helvetica', Arial, sans-serif", offset: 14 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1, width: 1.5 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "14px 'Helvetica', Arial, sans-serif" } },
        planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbolType: "disk", symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} }, style: { width: 2 }, namestyle: { fill: "#f0f0f0", font: "14px 'Helvetica', Arial, sans-serif", align: "center", baseline: "middle" } },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "16px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#5594b8", width: 1.5, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } },
        callback: function (err) {
            if (err) { return console.error("Celestial Error:", err); }
            // 簡化 callback，不再需要建立搜尋索引
            setTimeout(getLocation, 500);
        }
    };

    Celestial.display(celestialConfig);

    ui.locationButton.addEventListener('click', getLocation);
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);

    function showMessage(message, duration = 2000) { 
        ui.messageElement.innerText = message; 
        if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration); 
    }

    function toggleConstellationArt() {
        state.isArtActive = !state.isArtActive;
        ui.toggleArtButton.classList.toggle('active', state.isArtActive);
        Celestial.apply({ constellations: state.isArtActive ? constellationArtConfig : { images: false } });
    }
    
    function toggleSkyView() {
        state.isSkyviewActive = !state.isSkyviewActive;
        const button = ui.skyviewToggleButton;
        button.textContent = state.isSkyviewActive ? '🛑 關閉陀螺儀' : '🔭 開啟陀螺儀';
        button.classList.toggle('active', state.isSkyviewActive);
        if (state.isSkyviewActive) {
            showMessage("正在開啟陀螺儀...", 0);
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', orientationHandler, { passive: true });
                        Celestial.skyview({ "follow": "center" });
                        showMessage("陀螺儀已開啟！");
                    } else { 
                        showMessage('方向感測器權限遭拒。');
                        state.isSkyviewActive = false;
                        button.textContent = '🔭 開啟陀螺儀';
                        button.classList.remove('active');
                    }
                }).catch(console.error);
            } else {
                if (!('ondeviceorientation' in window)) { console.warn("此瀏覽器不支援 DeviceOrientationEvent。"); showMessage("此瀏覽器不支援陀螺儀。"); state.isSkyviewActive = false; button.textContent = '🔭 開啟陀螺儀'; button.classList.remove('active'); return; }
                window.addEventListener('deviceorientation', orientationHandler, { passive: true });
                Celestial.skyview({ "follow": "center" });
                showMessage("陀螺儀已開啟！");
            }
        } else {
            showMessage("陀螺儀已關閉。");
            window.removeEventListener('deviceorientation', orientationHandler);
            Celestial.skyview({ "follow": "none" });
        }
    }

    function orientationHandler(evt) {
      const now = performance.now();
      if (now - state.orientationLastUpdate < 50) return; // ~20fps
      state.orientationLastUpdate = now;
      Celestial.skyview(evt);
    }

    function getLocation() {
        if (navigator.geolocation) {
            showMessage("正在獲取您的位置...", 0);
            navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000, enableHighAccuracy: true });
        } else { 
            showMessage("您的瀏覽器不支援定位。");
        }
    }

    function showPosition(position) {
        const { latitude, longitude } = position.coords;
        Celestial.apply({ location: [latitude, longitude], local: true });
        showMessage(`已更新為您的位置！`);
    }

    function showError(error) {
        const errors = { 1: '您已拒絕位置請求。', 2: '無法獲取當前位置。', 3: '獲取位置超時。' };
        showMessage(errors[error.code] || '獲取位置時發生未知錯誤。');
    }
});
