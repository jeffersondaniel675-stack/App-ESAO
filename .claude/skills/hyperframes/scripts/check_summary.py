"""Resume o JSON de `hyperframes check --json`: uma linha por achado.
Uso: python3 -I check_summary.py check.json [--all]   (--all inclui rotation_pivot_drift)"""
import json, sys

def main():
    path = sys.argv[1]
    show_all = "--all" in sys.argv
    d = json.load(open(path))
    for sec in ("lint", "runtime", "layout", "motion", "contrast", "craft", "audio"):
        s = d.get(sec) or {}
        for f in s.get("findings", []) or []:
            rule = f.get("rule") or f.get("code")
            if rule == "rotation_pivot_drift" and not show_all:
                continue
            print(f"{sec:8} {f.get('severity',''):7} {rule} @ {f.get('time','')} {f.get('selector','')}\n         {str(f.get('message',''))[:240]}")
    print("ok:", d.get("ok"))

if __name__ == "__main__":
    main()
