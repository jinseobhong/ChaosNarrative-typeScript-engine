import json
import re

file_path = r"C:\Users\ihyeo\.gemini\antigravity\brain\cdf26eb8-f856-4cc7-abc4-0bd63ef3cd7c\.system_generated\steps\1109\content.md"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

print("Total length:", len(text))

# Let's search for AF_initDataCallback or WIZ_global_data or similar payloads in html
blocks = re.findall(r'AF_initDataCallback\s*\(\s*\{.*?data:\s*(\[.*?\])\s*\}\s*\);', text, re.DOTALL)
print(f"Found {len(blocks)} AF_initDataCallback blocks")

for i, block in enumerate(blocks):
    try:
        data = json.loads(block)
        # Search recursively for strings
        def extract_strings(obj):
            results = []
            if isinstance(obj, str):
                if len(obj) > 30:
                    results.append(obj)
            elif isinstance(obj, list):
                for item in obj:
                    results.extend(extract_strings(item))
            elif isinstance(obj, dict):
                for v in obj.values():
                    results.extend(extract_strings(v))
            return results
        
        strs = extract_strings(data)
        for s in strs:
            if any('\uac00' <= c <= '\ud7a3' for c in s) or 'DOM' in s or 'EROS' in s or 'formula' in s.lower() or '카오스' in s:
                print(f"=== BLOCK {i} CONTENT ===")
                print(s[:2000])
                print("\n" + "="*40 + "\n")
    except Exception as e:
        # If json load fails, search strings inside raw block
        pass

# Also search for any large korean paragraphs in raw text
print("--- Searching raw text for long Korean texts ---")
for match in re.finditer(r'([가-힣\w\s\.,\-\+\=\(\)\{\}\[\]\*\/\^\%\$\#\@\!:\\n]{50,})', text):
    snippet = match.group(0)
    if any('\uac00' <= c <= '\ud7a3' for c in snippet):
        print("RAW KOREAN MATCH:")
        print(snippet[:500])
        print("-" * 30)
