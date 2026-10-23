import requests
import os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv('GEMINI_API_KEY')
models = [
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-pro-latest',
]

for model in models:
    try:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
        payload = {
            'contents': [{'role': 'user', 'parts': [{'text': 'Hi, say hello'}]}],
            'generationConfig': {'maxOutputTokens': 20}
        }
        r = requests.post(url, json=payload, timeout=15)
        data = r.json()
        if r.status_code == 200:
            txt = data['candidates'][0]['content']['parts'][0]['text']
            print(f'WORKS: {model} -> {txt[:50]}')
            break
        else:
            err = data.get('error', {}).get('message', 'unknown')[:70]
            print(f'FAIL {r.status_code}: {model} -> {err}')
    except Exception as e:
        print(f'ERROR: {model} -> {str(e)[:60]}')
