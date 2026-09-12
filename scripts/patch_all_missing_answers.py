import os, json

OUT_DIR = '/Volumes/MacOS Sandisk/Users/thietphamvan/hoctoeic/IELTS/json_output'

PATCH_MAP = {
    # Test 6
    6: {
        1: "B", 2: "A", 3: "B", 4: "F", 5: "C", 6: "E", 7: "G", 8: "G", 9: "A",
        10: "Sea water/Salt", 11: "swimming speed", 12: "Coastal otters", 13: "Small mammals",
        14: "iv", 15: "v", 16: "ii", 17: "x", 18: "vii", 19: "i", 20: "vii",
        21: "A", 22: "C", 23: "parental guidance", 24: "compass", 25: "predators", 26: "visible",
        27: "C", 28: "C", 29: "B", 30: "A", 31: "B", 32: "C", 33: "20", 34: "foam",
        35: "waste water", 36: "harmful", 37: "bodegrade", 38: "droplets",
        39: "Lamination and packing", 40: "Grape growers"
    },
    # Test 7
    7: {
        31: "YES",
        38: "D"
    },
    # Test 8
    8: {
        31: "ix"
    },
    # Test 10
    10: {
        37: "6 stages"
    },
    # Test 12
    12: {
        31: "YES"
    },
    # Test 13
    13: {
        31: "E"
    },
    # Test 14
    14: {
        31: "J"
    },
    # Test 15
    15: {
        31: "B"
    },
    # Test 16
    16: {
        32: "YES"
    },
    # Test 17
    17: {
        31: "Not Given"
    },
    # Test 18
    18: {
        31: "YES"
    },
    # Test 19
    19: {
        31: "F"
    },
    # Test 20
    20: {
        31: "F"
    },
    # Test 21
    21: {
        31: "vii"
    }
}

print("=== STARTING PATCHING FOR REMAINING MISSING ANSWERS ===")

for t_id, answers in PATCH_MAP.items():
    for p_num in range(1, 4):
        filename = f"test_{t_id:02d}_passage_{p_num}.json"
        filepath = os.path.join(OUT_DIR, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Get translation map to build proper explanations
        passages = data.get('passages', [])
        translation_map = passages[0].get('translation_map', {}) if passages else {}
        
        updated = False
        for g in data.get('question_groups', []):
            for q in g.get('questions', []):
                q_num = q.get('questionNo')
                if q_num in answers:
                    ans = answers[q_num]
                    q['correctAnswer'] = ans
                    
                    # Update explanation with evidence translation if possible
                    ev_sids = q.get('evidence_sids', [])
                    ev_sid = ev_sids[0] if ev_sids else f"p{p_num}-s1"
                    ev_vi = translation_map.get(ev_sid, "")
                    
                    q['explanation'] = {
                        "vi": q.get('explanation', {}).get('vi', f"Dịch câu hỏi {q_num}"),
                        "why_correct": f"Dẫn chứng từ câu [{ev_sid}]: \"{ev_vi}\". Đáp án đúng theo PDF là \"{ans}\".",
                        "why_wrong": "Các phương án khác không khớp hoặc mâu thuẫn với nội dung bài đọc."
                    }
                    updated = True
                    print(f"  Test {t_id} P{p_num}: Patched Q{q_num} -> '{ans}'")
                    
        if updated:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

print("\n=== PATCHING COMPLETED SUCCESSFULLY! ===")
