// knowledge.js (v2.0 - 互動百科全書)

document.addEventListener("DOMContentLoaded", function() {

    // --- UI 元素定義 ---
    const tabLinks = document.querySelectorAll('.knowledge-tab-link');
    const tabContents = document.querySelectorAll('.knowledge-tab-content');
    const basicsContainer = document.getElementById('basics');
    const solarSystemContainer = document.getElementById('solar-system');
    const deepSkyContainer = document.getElementById('deep-sky');
    const zodiacSelector = document.getElementById('zodiac-selector');
    const zodiacInfoContainer = document.getElementById('zodiac-info-container');
    const zodiacPlaceholder = document.getElementById('zodiac-placeholder');

    // =======================================================
    //  內容數據庫 (Content Database)
    // =======================================================
    
    // 基礎知識
    const basicsContent = `
        <div class="knowledge-card">
            <h3>觀測技巧入門</h3>
            <p>成功的觀星始於充分的準備。首先，盡量尋找遠離城市光害的黑暗地點。到達後，給您的眼睛至少 20-30 分鐘來完全適應黑暗，在此期間避免觀看手機等強光。使用紅色光源的手電筒可以在照明的同時保護您的夜視能力。同時，望遠鏡也需要時間「冷卻」，提前 30 分鐘將它放置在戶外，使其溫度與環境一致，可以避免鏡筒內的熱氣流影響成像清晰度。</p>
        </div>
        <div class="knowledge-card">
            <h3>天文詞彙</h3>
            <ul>
                <li><strong>光年 (Light-year):</strong> 光在真空中一年所行進的距離，約 9.46 萬億公里。它是一個距離單位，而非時間單位。</li>
                <li><strong>星等 (Magnitude):</strong> 用來衡量天體亮度的等級。數字越小，代表天體越亮。例如，太陽的星等是 -26.7，而人眼可見最暗的星星約為 6.5 等。</li>
                <li><strong>天球 (Celestial Sphere):</strong> 一個以地球為中心、半徑無限大的假想球面。我們用它來標示天體在天空中的位置，就像在地球上使用經緯度一樣。</li>
                <li><strong>赤經 (Right Ascension) & 赤緯 (Declination):</strong> 天球上的經緯度系統，用來精確標定天體的位置。</li>
            </ul>
        </div>
    `;

    // 太陽系
    const solarSystemContent = `
        <div class="knowledge-card">
            <h3>太陽 (The Sun)</h3>
            <p>太陽是太陽系的中心，一顆巨大的氣體星球，佔據了整個太陽系 99.86% 的質量。<strong>警告：絕對不可以在沒有專業太陽濾鏡的情況下，用任何望遠鏡直接觀測太陽，這會瞬間造成永久性失明！</strong></p>
        </div>
        <div class="knowledge-card">
            <h3>月球 (The Moon)</h3>
            <p>月球是地球唯一的天然衛星，也是初學者最棒的觀測目標。透過望遠鏡，您可以看到它表面的環形山、廣闊的月海和雄偉的山脈。觀測的最佳時機並非滿月，而是在月相為弦月期間，觀察白天與黑夜的分界線「晨昏線」，此時的光影效果最為立體。</p>
        </div>
        <div class="knowledge-card">
            <h3>行星 (Planets)</h3>
            <p>行星是圍繞太陽運行的天體。透過望遠鏡，您可以輕易分辨出它們與恆星的區別：行星是一個小圓盤，而恆星只是一個光點。木星的伽利略衛星和土星的光環是小型望遠鏡就能看見的奇景。</p>
        </div>
        <div class="knowledge-card">
            <h3>流星 (Meteors)</h3>
            <p>流星是彗星或小行星在軌道上留下的微小塵埃顆粒衝入地球大氣層時，摩擦燃燒產生的光跡。觀測流星雨的最佳工具是您的肉眼，因為它們的出現位置隨機且速度極快，望遠鏡的視野過於狹窄，反而會錯過精彩瞬間。</p>
        </div>
    `;

    // 十二星座數據
    const zodiacData = {
        aries: { name: "白羊座", story: "在希臘神話中，這隻金色的公羊曾從繼母的虐待中拯救了王子佛里克索斯與公主赫勒。在飛越海洋時，赫勒不慎墜海，那片海也因此被命名為赫勒斯滂海峽。公羊成功將王子送到科爾基斯後，被宙斯放到天上，成為白羊座。", location: "春季星座，位於雙魚座和金牛座之間。它的亮星不多，看起來像一個不太起眼的鈍角三角形。您可以先找到更亮的金牛座或仙女座，再向它們的下方尋找。" },
        taurus: { name: "金牛座", story: "這是風流的天神宙斯為了追求美麗的歐羅巴公主，而化身的一頭華麗白色公牛。公主看見這頭溫馴的公牛，便騎上了牠的背，公牛隨即載著她高速越過海洋，來到了克里特島。", location: "冬季夜空中非常顯眼的星座。您可以輕易找到它V字形的臉部（畢宿星團），以及一顆明亮的紅色眼睛「畢宿五」。在牠的背上，還有更著名的疏散星團「昴宿星團」(M45)。" },
        // ... (其他星座的詳細描述) ...
        leo: { name: "獅子座", story: "這是希臘神話中，刀槍不入的尼米亞猛獅。牠被大英雄赫拉克勒斯在其十二項任務的第一項中擊敗。為了紀念這次英勇的戰鬥，獅子被放上天空。", location: "春季夜空中的王者。尋找一個由亮星組成的、像「反寫問號」一樣的鐮刀形狀，這就是獅子的頭部和鬃毛。亮星「軒轅十四」就位於這個問號的底部。" },
        sagittarius: { name: "人馬座", story: "普遍認為這位半人馬是智慧的導師喀戎，他精通各種技藝，曾教導過許多希臘英雄。他正拉開弓箭，瞄準隔壁天蠍座的心臟「心宿二」。", location: "夏季銀河中最壯麗的部分。與其說像人馬，它的星群看起來更像一個「茶壺」，有壺身、壺嘴、壺蓋和握把，非常容易辨認。銀河系的中心就位於壺嘴指向的方向。" }
        // 為了簡潔，此處只列出幾個範例，您需要將所有12個星座的詳細內容補充進來
    };

    // =======================================================
    //  初始化函式 (Initialization Functions)
    // =======================================================

    // 1. 初始化索引標籤切換
    function initTabs() {
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;
                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    // 2. 載入所有知識內容
    function loadContent() {
        basicsContainer.innerHTML = basicsContent;
        solarSystemContainer.innerHTML = solarSystemContent;
        // 為了簡潔，深空天體暫時留空
        deepSkyContainer.innerHTML = `<div class="knowledge-card"><h3>深空天體 (Deep-Sky Objects)</h3><p>深空天體泛指太陽系以外的天體，例如星雲、星團和星系。它們通常非常暗淡，需要在遠離光害的黑暗環境下，使用望遠鏡才能觀測到。著名的例子有獵戶座大星雲 (M42) 和仙女座星系 (M31)。</p></div>`;
    }
    
    // 3. 初始化十二星座互動盤
    function initZodiac() {
        // 假設您在 images/zodiac/ 資料夾中有對應的 svg 圖示 (aries.svg, taurus.svg ...)
        const zodiacKeys = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpius', 'sagittarius', 'capricornus', 'aquarius', 'pisces'];
        zodiacKeys.forEach(key => {
            const data = zodiacData[key];
            if (!data) return; // 如果數據不完整，則跳過

            const icon = document.createElement('div');
            icon.className = 'zodiac-icon';
            icon.dataset.key = key;
            icon.innerHTML = `
                <img src="/kidrise-starmap-2025-08/images/zodiac/${key}.svg" alt="${data.name}">
                <span>${data.name.split(' ')[0]}</span>
            `;
            icon.addEventListener('click', () => {
                // 移除其他圖示的 active 狀態
                document.querySelectorAll('.zodiac-icon').forEach(i => i.classList.remove('active'));
                // 為當前圖示加上 active 狀態
                icon.classList.add('active');
                displayZodiacInfo(key);
            });
            zodiacSelector.appendChild(icon);
        });
    }

    // 4. 顯示選中星座的詳細資訊
    function displayZodiacInfo(key) {
        const data = zodiacData[key];
        if (!data) return;
        
        zodiacInfoContainer.innerHTML = `
            <h3>${data.name}</h3>
            <h4>神話故事</h4>
            <p>${data.story}</p>
            <h4>如何尋找</h4>
            <p>${data.location}</p>
        `;
    }

    // --- 啟動頁面 ---
    initTabs();
    loadContent();
    initZodiac();

});
