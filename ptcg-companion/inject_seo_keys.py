import json
import re
import os

dict_map = {
    'en': {
        'seo.title': 'Barista Flow | Coffee Timer & Pour Over Calculator',
        'seo.description': 'Master the perfect pour over coffee with our V60 timer and golden ratio calculator. Track blooming, pouring times, and save your daily coffee log.',
        'seo.keywords': 'pour over coffee, coffee ratio calculator, brew timer, v60 recipe, specialty coffee, barista flow'
    },
    'zh-TW': {
        'seo.title': 'Barista Flow | 手沖咖啡計時器與粉水比計算',
        'seo.description': '用我們的V60計時器和黃金粉水比計算器掌握完美的手沖咖啡。追蹤悶蒸、注水時間，並記錄你每天的咖啡日記。',
        'seo.keywords': '手沖咖啡, 咖啡粉水比, 咖啡計時器, V60濾杯, 精品咖啡指南, barista flow'
    },
    'zh-CN': {
        'seo.title': 'Barista Flow | 手冲咖啡计时器与粉水比计算',
        'seo.description': '用我们的V60计时器和黄金粉水比计算器掌握完美的手冲咖啡。追踪闷蒸、注水时间，并记录你每天的咖啡日记。',
        'seo.keywords': '手冲咖啡, 咖啡粉水比, 咖啡计时器, V60滤杯, 精品咖啡指南, barista flow'
    },
    'ja': {
        'seo.title': 'Barista Flow | コーヒータイマー＆ハンドドリップ計算ツール',
        'seo.description': 'V60タイマーと黄金比計算ツールで、完璧なハンドドリップコーヒーをマスターしよう。蒸らし、注湯時間を追跡し、毎日のコーヒーログを保存できます。',
        'seo.keywords': 'ハンドドリップ 珈琲, コーヒー 比率 計算, 抽出タイマー, V60 レシピ, スペシャルティコーヒー'
    },
    'es': {
        'seo.title': 'Barista Flow | Temporizador de Café y Calculadora de V60',
        'seo.description': 'Domina el café de filtro perfecto con nuestro temporizador V60 y calculadora de ratio dorado. Haz seguimiento del blooming, tiempos de vertido y guarda tu registro de café.',
        'seo.keywords': 'café de filtro, calculadora de ratio café, temporizador de goteo, barista v60, café de especialidad'
    },
    'fr': {
        'seo.title': 'Barista Flow | Minuteur de Café et Calculateur de Ratio',
        'seo.description': 'Maîtrisez le café filtre parfait avec notre minuteur V60 et calculateur de ratio. Suivez le blooming, les temps de versement et enregistrez votre journal de café.',
        'seo.keywords': 'café filtre, calculateur ratio café, minuteur café, recette v60, café de spécialité'
    },
    'de': {
        'seo.title': 'Barista Flow | Kaffee-Timer & Pour Over Rechner',
        'seo.description': 'Meistern Sie den perfekten Pour Over Kaffee mit unserem V60-Timer und dem Rechner für das goldene Verhältnis. Verfolgen Sie Blooming, Gießzeiten und speichern Sie Ihr Kaffeelog.',
        'seo.keywords': 'filterkaffee, kaffee verhältnis rechner, brüh-timer, v60 rezept, spezialitätenkaffee'
    },
    'pt': {
        'seo.title': 'Barista Flow | Temporizador de Café e Calculadora de Proporção',
        'seo.description': 'Domine o café filtrado perfeito com nosso temporizador V60 e calculadora de proporção. Acompanhe a pré-infusão, os tempos de despejo e salve seu registro diário.',
        'seo.keywords': 'café coado, calculadora proporção café, temporizador café, receita v60, café especial'
    },
    'ru': {
        'seo.title': 'Barista Flow | Таймер для Кофе и Калькулятор Пропорций',
        'seo.description': 'Освойте идеальный пуровер с нашим таймером V60 и калькулятором пропорций. Отслеживайте время блуминга, вливаний и сохраняйте дневник кофе.',
        'seo.keywords': 'пуровер кофе, калькулятор пропорций кофе, таймер заваривания, рецепт v60, спешелти кофе'
    },
    'hi': {
        'seo.title': 'Barista Flow | कॉफी टाइमर और पोर-ओवर कैलकुलेटर',
        'seo.description': 'हमारे V60 टाइमर और गोल्डन रेश्यो कैलकुलेटर के साथ परफेक्ट पोर ओवर कॉफी में महारत हासिल करें। ब्लूमिंग, डालने का समय ट्रैक करें।',
        'seo.keywords': 'पोर ओवर कॉफी, कॉफी अनुपात कैलकुलेटर, ब्रू टाइमर, v60 रेसिपी, स्पेशलटी कॉफी'
    },
    'bn': {
        'seo.title': 'Barista Flow | কফি টাইমার এবং পোর-ওভার ক্যালকুলেটর',
        'seo.description': 'আমাদের V60 টাইমার এবং গোল্ডেন রেশিও ক্যালকুলেটর দিয়ে পারফেক্ট পোর ওভার কফি আয়ত্ত করুন। ব্লুমিং, ঢালার সময় ট্র্যাক করুন।',
        'seo.keywords': 'পোর ওভার কফি, কফি রেশিও ক্যালকুলেটর, ব্রু টাইমার, v60 রেসিপি, স্পেশালটি কফি'
    },
    'ar': {
        'seo.title': 'Barista Flow | مؤقت القهوة وحاسبة النسبة',
        'seo.description': 'أتقن تحضير القهوة المقطرة مع مؤقت V60 وحاسبة النسبة الذهبية. تتبع وقت الترطيب، ومراحل الصب، واحفظ سجل القهوة اليومي الخاص بك.',
        'seo.keywords': 'قهوة مقطرة, حاسبة نسبة القهوة, مؤقت القهوة, وصفة V60, قهوة مختصة'
    },
    'ur': {
        'seo.title': 'Barista Flow | کافی ٹائمر اور پور اوور کیلکولیٹر',
        'seo.description': 'ہمارے V60 ٹائمر اور گولڈن ریشو کیلکولیٹر کے ساتھ پرفیکٹ پور اوور کافی میں مہارت حاصل کریں۔ بلومنگ اور ڈالنے کے وقت کو ٹریک کریں۔',
        'seo.keywords': 'پور اوور کافی, کافی ریشو کیلکولیٹر, برُو ٹائمر, v60 ترکیب, اسپیشلٹی کافی'
    }
}

file_path = 'src/i18n/ui.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

locales_regex = re.compile(r"('|\"|`)([a-zA-Z-]+)\1\s*:\s*{")
locales = []

for match in locales_regex.finditer(content):
    locales.append({
        'name': match.group(2),
        'index': match.start(),
        'matchLength': len(match.group(0))
    })

locales.reverse()

for loc in locales:
    insert_pos = loc['index'] + loc['matchLength']
    insert_str = '\n'
    
    dict_vals = dict_map.get(loc['name'], dict_map['en'])
    for key, val in dict_vals.items():
        escaped_val = val.replace("'", "\\'")
        insert_str += f"    '{key}': '{escaped_val}',\n"
        
    content = content[:insert_pos] + insert_str + content[insert_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully injected SEO keys into ui.ts')
