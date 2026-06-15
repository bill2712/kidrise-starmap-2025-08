import json

langs = {
    "zh-TW": {
        "about.tag": "咖啡沖煮科學",
        "about.belief": "我們的信念",
        "about.team": "— Barista Flow 團隊",
        "layout.footer.quote": '"咖啡本身就是一種語言。" — 成龍',
        "layout.footer.madeFor": "專為精品咖啡愛好者打造 ☕",
        "faq.breadcrumb": "常見問題 FAQ",
        "faq.title.prefix": "咖啡沖煮",
        "faq.title.highlight": "疑難排解",
        "faq.cta.title": "找不到您要的答案？",
        "faq.cta.desc": "如果您有其他關於咖啡沖煮的問題，歡迎隨時與我們聯絡！",
        "faq.cta.button": "聯絡我們"
    },
    "zh-CN": {
        "about.tag": "咖啡冲煮科学",
        "about.belief": "我们的信念",
        "about.team": "— Barista Flow 团队",
        "layout.footer.quote": '"咖啡本身就是一种语言。" — 成龙',
        "layout.footer.madeFor": "专为精品咖啡爱好者打造 ☕",
        "faq.breadcrumb": "常见问题 FAQ",
        "faq.title.prefix": "咖啡冲煮",
        "faq.title.highlight": "疑难排解",
        "faq.cta.title": "找不到您要的答案？",
        "faq.cta.desc": "如果您有其他关于咖啡冲煮的问题，欢迎随时与我们联络！",
        "faq.cta.button": "联络我们"
    },
    "en": {
        "about.tag": "Brewing Science",
        "about.belief": "OUR BELIEF",
        "about.team": "— The Barista Flow Team",
        "layout.footer.quote": '"Coffee is a language in itself." — Jackie Chan',
        "layout.footer.madeFor": "Made for Specialty Coffee Lovers ☕",
        "faq.breadcrumb": "FAQ",
        "faq.title.prefix": "Coffee Brewing",
        "faq.title.highlight": "Troubleshooting",
        "faq.cta.title": "Can't find your answer?",
        "faq.cta.desc": "If you have any other questions about coffee brewing, feel free to contact us!",
        "faq.cta.button": "Contact Us"
    },
    "ja": {
        "about.tag": "抽出の科学",
        "about.belief": "私たちの信念",
        "about.team": "— Barista Flow チーム",
        "layout.footer.quote": '"コーヒーはそれ自体が言語である。" — ジャッキー・チェン',
        "layout.footer.madeFor": "スペシャルティコーヒー愛好家のために ☕",
        "faq.breadcrumb": "よくある質問 FAQ",
        "faq.title.prefix": "コーヒー抽出の",
        "faq.title.highlight": "トラブルシューティング",
        "faq.cta.title": "答えが見つかりませんか？",
        "faq.cta.desc": "コーヒー抽出に関するその他の質問がある場合は、お気軽にお問い合わせください！",
        "faq.cta.button": "お問い合わせ"
    },
    "fr": {
        "about.tag": "Science de l'Infusion",
        "about.belief": "NOTRE CONVICTION",
        "about.team": "— L'équipe Barista Flow",
        "layout.footer.quote": '"Le café est une langue en soi." — Jackie Chan',
        "layout.footer.madeFor": "Conçu pour les amateurs de café de spécialité ☕",
        "faq.breadcrumb": "FAQ",
        "faq.title.prefix": "Préparation du Café",
        "faq.title.highlight": "Dépannage",
        "faq.cta.title": "Vous ne trouvez pas votre réponse ?",
        "faq.cta.desc": "Si vous avez d'autres questions sur la préparation du café, n'hésitez pas à nous contacter !",
        "faq.cta.button": "Contactez-nous"
    },
    "de": {
        "about.tag": "Brühwissenschaft",
        "about.belief": "UNSER GLAUBE",
        "about.team": "— Das Barista Flow Team",
        "layout.footer.quote": '"Kaffee ist eine Sprache für sich." — Jackie Chan',
        "layout.footer.madeFor": "Gemacht für Liebhaber von Spezialitätenkaffee ☕",
        "faq.breadcrumb": "FAQ",
        "faq.title.prefix": "Kaffeezubereitung",
        "faq.title.highlight": "Fehlerbehebung",
        "faq.cta.title": "Antwort nicht gefunden?",
        "faq.cta.desc": "Wenn Sie weitere Fragen zur Kaffeezubereitung haben, können Sie uns gerne kontaktieren!",
        "faq.cta.button": "Kontaktiere uns"
    },
    "es": {
        "about.tag": "Ciencia de la Extracción",
        "about.belief": "NUESTRA CREENCIA",
        "about.team": "— El Equipo de Barista Flow",
        "layout.footer.quote": '"El café es un lenguaje en sí mismo." — Jackie Chan',
        "layout.footer.madeFor": "Hecho para los Amantes del Café de Especialidad ☕",
        "faq.breadcrumb": "Preguntas Frecuentes",
        "faq.title.prefix": "Preparación del Café",
        "faq.title.highlight": "Solución de Problemas",
        "faq.cta.title": "¿No encuentras tu respuesta?",
        "faq.cta.desc": "Si tienes otras preguntas sobre la preparación del café, ¡no dudes en contactarnos!",
        "faq.cta.button": "Contáctanos"
    },
    "pt": {
        "about.tag": "Ciência da Extração",
        "about.belief": "NOSSA CRENÇA",
        "about.team": "— A Equipe Barista Flow",
        "layout.footer.quote": '"O café é uma língua em si." — Jackie Chan',
        "layout.footer.madeFor": "Feito para Amantes de Cafés Especiais ☕",
        "faq.breadcrumb": "FAQ",
        "faq.title.prefix": "Preparação de Café",
        "faq.title.highlight": "Solução de Problemas",
        "faq.cta.title": "Não encontrou sua resposta?",
        "faq.cta.desc": "Se você tiver outras perguntas sobre a preparação de café, não hesite em nos contatar!",
        "faq.cta.button": "Contate-nos"
    },
    "ru": {
        "about.tag": "Наука Заваривания",
        "about.belief": "НАШЕ УБЕЖДЕНИЕ",
        "about.team": "— Команда Barista Flow",
        "layout.footer.quote": '"Кофе — это язык сам по себе." — Джеки Чан',
        "layout.footer.madeFor": "Сделано для любителей спешелти кофе ☕",
        "faq.breadcrumb": "FAQ",
        "faq.title.prefix": "Заваривание кофе",
        "faq.title.highlight": "Устранение неполадок",
        "faq.cta.title": "Не нашли ответ?",
        "faq.cta.desc": "Если у вас есть другие вопросы о заваривании кофе, смело обращайтесь к нам!",
        "faq.cta.button": "Связаться с нами"
    },
    "hi": {
        "about.tag": "ब्रूइंग साइंस",
        "about.belief": "हमारा विश्वास",
        "about.team": "— Barista Flow टीम",
        "layout.footer.quote": '"कॉफी अपने आप में एक भाषा है।" — जैकी चैन',
        "layout.footer.madeFor": "स्पेशलिटी कॉफी प्रेमियों के लिए बनाया गया ☕",
        "faq.breadcrumb": "सामान्य प्रश्न (FAQ)",
        "faq.title.prefix": "कॉफी ब्रूइंग",
        "faq.title.highlight": "समस्या निवारण",
        "faq.cta.title": "अपना जवाब नहीं मिला?",
        "faq.cta.desc": "यदि आपके पास कॉफी ब्रूइंग के बारे में कोई अन्य प्रश्न हैं, तो बेझिझक हमसे संपर्क करें!",
        "faq.cta.button": "हमसे संपर्क करें"
    },
    "bn": {
        "about.tag": "ব্রুয়িং সায়েন্স",
        "about.belief": "আমাদের বিশ্বাস",
        "about.team": "— Barista Flow টিম",
        "layout.footer.quote": '"কফি নিজেই একটি ভাষা।" — জ্যাকি চ্যান',
        "layout.footer.madeFor": "স্পেশালিটি কফি প্রেমীদের জন্য তৈরি ☕",
        "faq.breadcrumb": "সাধারণ প্রশ্ন (FAQ)",
        "faq.title.prefix": "কফি ব্রুয়িং",
        "faq.title.highlight": "সমস্যা সমাধান",
        "faq.cta.title": "আপনার উত্তর খুঁজে পাননি?",
        "faq.cta.desc": "কফি ব্রুয়িং সম্পর্কে আপনার যদি অন্য কোনো প্রশ্ন থাকে, তাহলে নির্দ্বিধায় আমাদের সাথে যোগাযোগ করুন!",
        "faq.cta.button": "যোগাযোগ করুন"
    },
    "ar": {
        "about.tag": "علم التحضير",
        "about.belief": "إيماننا",
        "about.team": "— فريق Barista Flow",
        "layout.footer.quote": '"القهوة لغة في حد ذاتها." — جاكي شان',
        "layout.footer.madeFor": "صُنع لعشاق القهوة المختصة ☕",
        "faq.breadcrumb": "الأسئلة الشائعة",
        "faq.title.prefix": "تحضير القهوة",
        "faq.title.highlight": "استكشاف الأخطاء وإصلاحها",
        "faq.cta.title": "لم تجد إجابتك؟",
        "faq.cta.desc": "إذا كان لديك أي أسئلة أخرى حول تحضير القهوة، فلا تتردد في الاتصال بنا!",
        "faq.cta.button": "اتصل بنا"
    },
    "ur": {
        "about.tag": "بروئنگ سائنس",
        "about.belief": "ہمارا عقیدہ",
        "about.team": "— Barista Flow ٹیم",
        "layout.footer.quote": '"کافی بذات خود ایک زبان ہے۔" — جیکی چن',
        "layout.footer.madeFor": "اسپیشلٹی کافی سے محبت کرنے والوں کے لیے بنایا گیا ☕",
        "faq.breadcrumb": "عمومی سوالات (FAQ)",
        "faq.title.prefix": "کافی بروئنگ",
        "faq.title.highlight": "مسائل کا حل",
        "faq.cta.title": "اپنا جواب نہیں ملا؟",
        "faq.cta.desc": "اگر آپ کے پاس کافی بروئنگ کے بارے میں کوئی اور سوالات ہیں، تو بلا جھجھک ہم سے رابطہ کریں!",
        "faq.cta.button": "ہم سے رابطہ کریں"
    }
}

with open('src/i18n/ui.ts', 'r') as f:
    ui_text = f.read()

# Replace or inject
for lang_code, t_dict in langs.items():
    search_str1 = f'"{lang_code}": {{'
    search_str2 = f"'{lang_code}': {{"
    
    start_idx = ui_text.find(search_str1)
    if start_idx == -1:
        start_idx = ui_text.find(search_str2)
        search_str = search_str2
    else:
        search_str = search_str1
        
    if start_idx != -1:
        insert_idx = start_idx + len(search_str)
        injection = "\n"
        for k, v in t_dict.items():
            # escape single quotes
            v_safe = v.replace("'", "\\'")
            injection += f"    '{k}': '{v_safe}',\n"
            
        ui_text = ui_text[:insert_idx] + injection + ui_text[insert_idx:]

with open('src/i18n/ui.ts', 'w') as f:
    f.write(ui_text)

print("Injected all missing keys successfully!")
