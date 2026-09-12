import os, json

out_dir = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

for p_num in range(1, 4):
    fname = f"test_01_passage_{p_num}.json"
    fpath = os.path.join(out_dir, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
        t_title = data.get('passage_title')
        p = data['passages'][0]
        s_count = len(p['translation_map'])
        q_groups = data.get('question_groups', [])
        total_qs = sum(len(g['questions']) for g in q_groups)
        q_nums = [q['questionNo'] for g in q_groups for q in g['questions']]
        print(f"File {fname}: Title={repr(t_title[:30])} | Sents={s_count} | Total Qs={total_qs} | Q Range={q_nums[:2]}...{q_nums[-2:] if len(q_nums)>2 else ''}")
