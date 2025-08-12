// map_simple.js (最終修正版 - 指定繪圖容器)

document.addEventListener("DOMContentLoaded", function() {

    if (typeof Celestial === "undefined") {
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        document.body.innerHTML = "<h1>錯誤：星圖核心元件載入失敗</h1>";
        return;
    }

    const starmapContainer = document.getElementById("starmap-container");
    if (!starmapContainer) {
        console.error("找不到 ID 為 'starmap-container' 的容器元素。");
        return;
    }
    const width = starmapContainer.getBoundingClientRect().width;

    const celestialConfig = {
        width: width,
        // 關鍵修正：明確告訴函式庫在哪個 div 中繪圖
        container: "celestial-map", 
        projection: "stereographic",
        datapath: "/kidrise-starmap/data/",
        stars: {
            show: true,
            limit: 5
        },
        planets: {
            show: true, 
            which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
            symbolType: "disk",
            symbols: {
              "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"},
              "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"},
              "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"},
              "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"},
              "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"}
            },
            namestyle: { fill: "#f0f0f0" }
        },
        constellations: {
            show: true,
            lines: true,
            linestyle: { stroke: "#5594b8", width: 1, opacity: 0.7 }
        }
    };

    try {
        Celestial.display(celestialConfig);
        console.log("Celestial.display() 執行成功！星圖應該已顯示。");
    } catch (e) {
        console.error("執行 Celestial.display() 時發生錯誤:", e);
        document.body.innerHTML = "<h1>錯誤：繪製星圖時發生問題</h1><p>請在開發者工具 (F12) 的 Console 中查看詳細錯誤訊息。</p>";
    }

});
