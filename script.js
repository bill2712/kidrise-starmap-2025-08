document.addEventListener("DOMContentLoaded", function() {

    // 守衛 Celestial 是否存在
    if (typeof Celestial === "undefined") {
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        document.getElementById("starmap-container").innerHTML = "<h1>抱歉，星圖核心元件載入失敗</h1>";
        return;
    }

    // --- UI 元素定義 ---
    const ui = {
        tabLinks: document.querySelectorAll('.tab-link'),
        tabContents: document.querySelectorAll('.tab-content'),
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
        zoomInButton: document.getElementById('zoom-in'),
        zoomOutButton: document.getElementById('zoom-out'),
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        clearButton: document.getElementById('clear-button'),
        datalist: document.getElementById('celestial-objects'),
        observatorySelect: document.getElementById('observatory-select'),
        storyModal: document.getElementById('storyModal'),
        knowledgeSection: document.getElementById('knowledge-section')
    };

    // --- 狀態變數 ---
    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        orientationLastUpdate: 0
    };

    // --- 星圖設定 ---
    const celestialConfig = {
        width: 0, 
        projection: "stereographic",
        transform: "equatorial",
        background: { fill: "#000", stroke: "#000" },
        datapath: "/kidrise-starmap/data/", // 修正路徑
        interactive: true,
        zoombuttons: false,
        controls: true,
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 18px 'Helvetica', Arial, sans-serif", offset: 12 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "13px 'Helvetica', Arial, sans-serif" } },
        // 修正行星設定
        planets: {
            show: true, 
            which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
            symbolType: "disk",
            symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} },
            namestyle: { fill: "#f0f0f0" }
        },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "14px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#3a8fb7", width: 1, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } },
        callback: function(error) {
            if (error) return console.warn(error);
            buildSearchIndex();
            setupStorybook();
            setTimeout(getLocation, 500);
        }
    };

    // 星座圖案設定
    const constellationArtConfig = {
      images: true, imageStyle: { width: 0.8, opacity: 0.4 },
      imageList: [ {c:"ori", f:"/kidrise-starmap/images/constellations/orion.png"}, {c:"uma", f:"/kidrise-starmap/images/constellations/uma.png"}, {c:"cas", f:"/kidrise-starmap/images/constellations/cas.png"} ]
    };

    // --- 初始化 ---
    Celestial.display(celestialConfig);
    
    // --- 事件監聽器 ---
    ui.tabLinks.forEach(link => link.addEventListener('click', () => switchTab(link.dataset.tab)));
    ui.locationButton.addEventListener('click', getLocation);
    ui.zoomInButton.addEventListener('click', () => zoomBy(0.8));
    ui.zoomOutButton.addEventListener('click', () => zoomBy(1.25));
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);
    ui.searchButton.addEventListener('click', searchNow);
    ui.searchInput.addEventListener('keyup', (evt) => { if (evt.key === 'Enter') searchNow(); });
    ui.clearButton.addEventListener('click', clearSearch);
    initObservatories();
    initModals();
    
    // --- 功能函式 ---
    function showMessage(message, duration = 2000) { ui.messageElement.innerText = message; if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration); }
    function switchTab(tabId) { ui.tabLinks.forEach(l => l.classList.remove('active')); ui.tabContents.forEach(c => c.classList.remove('active')); document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active'); document.getElementById(tabId).classList.add('active'); }

    function buildSearchIndex() {
      state.celestialData = [];
      if (Celestial.constellations) { Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation", id: c.id })); }
      if (Celestial.data?.stars?.features) { Celestial.data.stars.features.forEach(f => { const nm = f.properties?.name; if (nm) state.celestialData.push({ name: nm, type: "star", id: f.id }); }); }
      ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet" }));
      ui.datalist.innerHTML = state.celestialData.map(item => `<option value="${item.name}"></option>`).join("");
    }
    
    function setupStorybook() {
        const storybookContainer = document.createElement('div');
        storybookContainer.className = 'storybook-grid';
        const templates = document.getElementById('storybook-templates');
        if (templates && ui.knowledgeSection) {
            storybookContainer.innerHTML = templates.innerHTML;
            const title = document.createElement('h3');
            title.textContent = '星座故事書';
            title.style.textAlign = 'center';
            ui.knowledgeSection.appendChild(title);
            ui.knowledgeSection.appendChild(storybookContainer);
            // 為動態加入的卡片加上事件監聽
            storybookContainer.querySelectorAll('.constellation-card').forEach(card => {
                card.addEventListener('click', () => {
                    showStoryModal(card.dataset.name, card.dataset.img, card.dataset.story);
                });
            });
        }
    }

    function searchNow() {
      if (!state.celestialData || state.celestialData.length === 0) { showMessage("資料尚未載入，請稍候再試。"); return; }
      const query = ui.searchInput.value.trim();
      if (!query) return;
      const item = state.celestialData.find(x => x.name.toLowerCase() === query.toLowerCase());
      if (!item) { showMessage(`抱歉，資料庫中沒有 "${query}"。`); return; }
      const res = Celestial.search({ type: item.type, name: item.name, id: item.id });
      if (!res) { showMessage(`抱歉，找不到 ${item.name} 的座標。`); return; }
      Celestial.remove("search-target");
      Celestial.add({ type: "Point", id: "search-target", geometry: { type: "Point", coordinates: [res.ra, res.dec] }, properties: { size: 20, style: { class: "target-indicator" } } });
      Celestial.redraw();
      ui.clearButton.classList.remove("hidden");
      showMessage(`為您標示 ${item.name}...`, 3000);
    }
    
    function clearSearch() {
      Celestial.remove("search-target");
      Celestial.redraw();
      ui.searchInput.value = "";
      ui.clearButton.classList.add("hidden");
      showMessage("");
    }

    function zoomBy(factor) {
      const currentScale = Celestial.zoom.scale();
      const center = [window.innerWidth / 2, window.innerHeight / 2];
      Celestial.zoom.to(currentScale * factor, center);
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
      if (now - state.orientationLastUpdate < 50) return;
      state.orientationLastUpdate = now;
      Celestial.skyview(evt);
    }

    function getLocation() {
        if (navigator.geolocation) {
            showMessage("正在獲取您的位置...", 0);
            navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000, enableHighAccuracy: true });
        } else { showMessage("您的瀏覽器不支援定位。"); }
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
    
    function initObservatories() {
        const observatories = { "T11,US": { name: "New Mexico, USA", location: [32.90, -105.53] }, "T32,AU": { name: "Siding Spring, Australia", location: [-31.27, 149.06] }, "T7,ES": { name: "Siding Spring, Spain", location: [38.43, -2.54] } };
        ui.observatorySelect.addEventListener('change', () => {
            const selectedValue = ui.observatorySelect.value;
            if (!selectedValue) return;
            const obs = observatories[selectedValue];
            showMessage(`正在切換到 ${obs.name}...`, 0);
            Celestial.apply({ location: obs.location, local: true });
            setTimeout(() => {
                alert(`已將觀測地點設為 ${obs.name}，現在將跳轉回「星空圖」分頁。`);
                switchTab('starmap');
                showMessage('');
            }, 300);
        });
    }

    function initModals() {
        const modalClose = ui.storyModal.querySelector('.modal-close');
        window.showStoryModal = function (title, imgSrc, text) {
            if (!ui.storyModal) return;
            ui.storyModal.querySelector("#modalTitle").innerText = title;
            ui.storyModal.querySelector("#modalImage").src = imgSrc;
            ui.storyModal.querySelector("#modalStory").innerText = text;
            ui.storyModal.style.display = "flex";
        };
        window.closeStoryModal = function () {
            if (ui.storyModal) ui.storyModal.style.display = "none";
        };
        modalClose.addEventListener('click', window.closeStoryModal);
        window.addEventListener("click", (evt) => {
            if (evt.target === ui.storyModal) window.closeStoryModal();
        });
    }
});
