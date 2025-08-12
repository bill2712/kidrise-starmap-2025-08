// map.js (v3.0 - 在地化與 UX 升級)
document.addEventListener("DOMContentLoaded", function() {

    if (typeof Celestial === "undefined") { return console.error("核心星圖函式庫 Celestial 未能成功載入。"); }

    const ui = {
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
        targetSelect: document.getElementById('target-select'),
        clearTargetButton: document.getElementById('clear-target-button'),
    };

    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        celestialData: [],
        orientationLastUpdate: 0
    };

    const constellationArtConfig = {
      images: true, imageStyle: { width: 0.8, opacity: 0.4 },
      imageList: [ {c:"ori", f:"/kidrise-starmap/images/constellations/ori.png"}, {c:"uma", f:"/kidrise-starmap/images/constellations/uma.png"}, {c:"cas", f:"/kidrise-starmap/images/constellations/cas.png"}, {c:"sco", f:"/kidrise-starmap/images/constellations/sco.png"} ]
    };

    const celestialConfig = {
        width: 0, projection: "stereographic", transform: "equatorial", background: { fill: "#000", stroke: "#000" }, datapath: "/kidrise-starmap-2025-08/data/", interactive: true, zoombuttons: false, controls: true,
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 16px 'Helvetica', Arial, sans-serif", offset: 14 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1, width: 1.5 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "14px 'Helvetica', Arial, sans-serif" } },
        planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbolType: "disk", symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} }, style: { width: 2 }, namestyle: { fill: "#f0f0f0", font: "14px 'Helvetica', Arial, sans-serif", align: "center", baseline: "middle" } },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "16px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#5594b8", width: 1.5, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } },
        callback: function (err) {
            if (err) { return console.error("Celestial Error:", err); }
            buildTargetIndex();
            setTimeout(getLocation, 500);
        }
    };

    Celestial.display(celestialConfig);

    ui.targetSelect.addEventListener('change', findTarget);
    ui.clearTargetButton.addEventListener('click', clearTarget);
    ui.locationButton.addEventListener('click', getLocation);
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);

    function showMessage(message, duration = 2000) { ui.messageElement.innerText = message; if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration); }

    function buildTargetIndex() {
        state.celestialData = [];
        if (Celestial.constellations) { Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation", id: c.id, value: `con_${c.id}` })); }
        if (Celestial.data?.stars?.features) { Celestial.data.stars.features.forEach(f => { const nm = f.properties?.name; if (nm && f.properties.mag < 2.5) state.celestialData.push({ name: nm, type: "star", id: f.id, value: `star_${nm}` }); }); }
        ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet", value: `planet_${p}` }));
        
        const planets = state.celestialData.filter(i => i.type === 'planet');
        const constellations = state.celestialData.filter(i => i.type === 'constellation');
        const stars = state.celestialData.filter(i => i.type === 'star');

        ui.targetSelect.innerHTML += `<optgroup label="行星">${planets.map(item => `<option value="${item.value}">${item.name}</option>`).join('')}</optgroup>`;
        ui.targetSelect.innerHTML += `<optgroup label="星座">${constellations.map(item => `<option value="${item.value}">${item.name}</option>`).join('')}</optgroup>`;
        ui.targetSelect.innerHTML += `<optgroup label="亮星">${stars.map(item => `<option value="${item.value}">${item.name}</option>`).join('')}</optgroup>`;
    }

    function findTarget() {
        const selectedValue = ui.targetSelect.value;
        if (!selectedValue) return;

        const [type, identifier] = selectedValue.split('_');
        const item = state.celestialData.find(x => x.value === selectedValue);
        if (!item) return;

        const res = Celestial.search({ type: item.type, name: item.name, id: item.id });
        if (!res) { showMessage(`抱歉，找不到 ${item.name} 的座標。`); return; }

        Celestial.remove("search-target");
        Celestial.add({ type: "Point", id: "search-target", geometry: { type: "Point", coordinates: [res.ra, res.dec] }, properties: { size: 20, style: { class: "target-indicator" } } });
        Celestial.redraw();
        ui.clearTargetButton.classList.remove("hidden");
        showMessage(`為您標示 ${item.name}...`, 3000);
    }

    function clearTarget() {
        Celestial.remove("search-target");
        Celestial.redraw();
        ui.targetSelect.value = "";
        ui.clearTargetButton.classList.add("hidden");
        showMessage("");
    }
    
    // ... 此處省略 getLocation, toggleSkyView 等與之前版本相同的函式 ...
});
