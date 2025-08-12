// knowledge.js (v3.0)
document.addEventListener("DOMContentLoaded", function() {
    const zodiacSelect = document.getElementById('zodiac-select');
    const infoContainer = document.getElementById('zodiac-info-container');
    const placeholder = document.getElementById('zodiac-placeholder');

    const zodiacData = {
        "aries": { name: "白羊座 (Aries)", story: "故事關於一隻金色的公羊，牠拯救了王子與公主...", location: "春季星座，位於雙魚座和金牛座之間，尋找一個由三顆亮星組成的鈍角三角形。" },
        "taurus": { name: "金牛座 (Taurus)", story: "這是天神宙斯為追求歐羅巴公主而變成的白色公牛...", location: "冬季星座，非常容易辨認，其紅色的亮星「畢宿五」和著名的「昴宿星團」(M45) 都是標誌。" },
        "gemini": { name: "雙子座 (Gemini)", story: "代表宙斯的兩個兒子，兄弟情深的卡斯托爾和波魯克斯...", location: "冬季星座，位於金牛座和巨蟹座之間，由兩顆非常接近的亮星「北河二」和「北河三」組成。" },
        "cancer": { name: "巨蟹座 (Cancer)", story: "在神話中，這隻巨蟹被派去協助九頭蛇對付赫拉克勒斯...", location: "春季星座，非常暗淡，不易觀測。其中心有一個模糊的疏散星團「鬼宿星團」(M44)。" },
        "leo": { name: "獅子座 (Leo)", story: "這是被大英雄赫拉克勒斯擊敗的尼米亞猛獅...", location: "春季的代表星座，由一個像反寫問號的「獅子座的鐮刀」和一個三角形的身體組成，亮星是「軒轅十四」。" },
        "virgo": { name: "室女座 (Virgo)", story: "代表農業女神狄蜜特，手中握著一束麥穗...", location: "春季星座，是黃道上最大的星座。亮星「角宿一」是尋找它的最佳線索。" },
        "libra": { name: "天秤座 (Libra)", story: "代表正義女神阿斯特莉亞用來衡量善惡的天秤...", location: "夏季星座，位於室女座和天蠍座之間，由一個不太顯眼的四邊形組成。" },
        "scorpius": { name: "天蠍座 (Scorpius)", story: "這隻毒蠍刺殺了獵人奧利安，因此兩者永不見於同一片天空...", location: "夏季夜空最壯麗的星座之一，擁有一個巨大的 J 形鉤子和一顆明亮的紅色心臟「心宿二」。" },
        "sagittarius": { name: "人馬座 (Sagittarius)", story: "代表著半人馬的智者喀戎，正拉弓瞄準天蠍的心臟...", location: "夏季星座，其星群看起來更像一個茶壺。銀河系的中心就位於此方向。" },
        "capricornus": { name: "摩羯座 (Capricornus)", story: "代表牧神潘恩，在躲避怪物時跳入水中，上半身是羊，下半身是魚...", location: "秋季星座，比較暗淡，看起來像一個模糊的三角形。" },
        "aquarius": { name: "寶瓶座 (Aquarius)", story: "代表為諸神倒酒的美少年伽倪墨得斯...", location: "秋季星座，非常暗淡且廣闊，缺乏亮星，不易辨認。" },
        "pisces": { name: "雙魚座 (Pisces)", story: "愛神阿佛洛狄忒和兒子厄洛斯為躲避怪物，變成兩條魚跳入河中...", location: "秋季星座，由兩條魚和一條連接牠們的絲帶組成，同樣非常暗淡。" }
    };

    // 填充下拉選單
    for (const key in zodiacData) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = zodiacData[key].name;
        zodiacSelect.appendChild(option);
    }

    zodiacSelect.addEventListener('change', function() {
        const selectedKey = this.value;
        if (selectedKey && zodiacData[selectedKey]) {
            const data = zodiacData[selectedKey];
            infoContainer.innerHTML = `
                <h3>${data.name}</h3>
                <h4>神話故事</h4>
                <p>${data.story}</p>
                <h4>如何尋找</h4>
                <p>${data.location}</p>
            `;
        } else {
            infoContainer.innerHTML = '';
            infoContainer.appendChild(placeholder);
        }
    });
});
