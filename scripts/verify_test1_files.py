import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'
files = sorted(os.listdir(out_dir))

print(f"=== Files in {out_dir} ===")
for f in files:
    path = os.path.join(out_dir, f)
    with open(path, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
    p = data['passages'][0]
    print(f"  {f:<25} | Title: {repr(data.get('passage_title'))} | Sents: {len(p['translation_map'])} | Groups: {len(data['question_groups'])}")
