// map.js (v3.0)
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

    let state = { isSkyviewActive: false, isArtActive: false, celestialData: [] };

    const constellationArtConfig = { /* ... 省略 ... */ };
    const celestialConfig = {
        // ... 省略 ... (與上一版相同)
    };

    function buildTargetIndex() {
        // ... (省略，將填入)
    }

    function findTarget() {
        // ... (省略，將填入)
    }

    function clearTarget() {
        // ... (省略，將填入)
    }
    
    // ... (省略其他 getLocation, toggleSkyView 等函式)

    // --- 初始化 ---
    Celestial.display(celestialConfig);
    ui.targetSelect.addEventListener('change', findTarget);
    ui.clearTargetButton.addEventListener('click', clearTarget);
    // (省略其他事件監聽)
});
