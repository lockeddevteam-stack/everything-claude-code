import re, glob, json, os

FIELDS = ["Location","User action","Behavior","Components","Functions","State",
          "Storage","Network","AI","Edge cases","Gating","Status",
          "Evidence for status","Notes"]

feats=[]
for path in sorted(glob.glob('audit/agents/*.md')):
    agent=os.path.basename(path)[:-3]
    text=open(path,encoding='utf-8').read()
    parts=re.split(r'^###\s+(?=F-)', text, flags=re.M)[1:]
    for blk in parts:
        head=blk.split('\n',1)[0].strip()
        m=re.match(r'(F-[A-Z]+-[0-9]+[a-z]?)\s*[:—-]?\s*(.*)', head)
        if not m: continue
        fid,name=m.group(1),m.group(2).strip()
        rec={"id":fid,"name":name,"agent":agent}
        for f in FIELDS:
            mm=re.search(r'^\s*[-*]\s*\*{0,2}'+re.escape(f)+r'\*{0,2}\s*:\s*(.*?)(?=\n\s*[-*]\s*\*{0,2}(?:'
                         + '|'.join(re.escape(x) for x in FIELDS) + r')\*{0,2}\s*:|\n#{2,3}\s|\Z)',
                         blk, re.M|re.S)
            v=mm.group(1).strip() if mm else ""
            v=re.sub(r'\s*\n\s*',' ',v).strip()
            rec[f.lower().replace(' ','_')]=v
        st=rec.get("status","").upper()
        for k in ["WORKING","PARTIAL","BROKEN","STUB","DEAD","UNVERIFIED"]:
            if k in st: rec["status_norm"]=k; break
        else: rec["status_norm"]="UNSPECIFIED"
        feats.append(rec)

json.dump(feats, open('audit/features.json','w',encoding='utf-8'), indent=1, ensure_ascii=False)

# ---- function index ----
rows=[]
rowre=re.compile(r'^\|(.+)\|\s*$')
for path in sorted(glob.glob('audit/agents/*.md')):
    agent=os.path.basename(path)[:-3]
    for line in open(path,encoding='utf-8'):
        m=rowre.match(line.rstrip('\n'))
        if not m: continue
        cells=[c.strip() for c in m.group(1).split('|')]
        if len(cells)<4: continue
        if re.match(r'^-{2,}$', cells[0].replace(':','')) or cells[0].lower()=='name': continue
        loc=next((c for c in cells if re.search(r':\s*\d', c)), '')
        lm=re.search(r'(\d+)', loc)
        rows.append({"name":cells[0].strip('`'),"kind":cells[1] if len(cells)>1 else "",
                     "loc":loc,"line":int(lm.group(1)) if lm else 10**9,
                     "purpose":cells[3] if len(cells)>3 else "","agent":agent,
                     "cells":cells})
rows.sort(key=lambda r:(r["line"], r["name"]))

with open('audit/FUNCTION_INDEX.md','w',encoding='utf-8') as fh:
    fh.write("# LOCKED — Function & Component Index\n\n")
    fh.write("Every function, component, hook and handler found in the production build\n")
    fh.write("`redesign/input/locked-current-v6.html` (58,015 lines), sorted by line number.\n\n")
    fh.write(f"**{len(rows)} indexed entries.**\n\n")
    fh.write("| Line | Name | Kind | Purpose | Source agent |\n|---|---|---|---|---|\n")
    for r in rows:
        ln = r["loc"] if r["loc"] else "—"
        fh.write(f"| {ln} | `{r['name']}` | {r['kind']} | {r['purpose']} | {r['agent']} |\n")

from collections import Counter
print("features:",len(feats))
print(Counter(f["status_norm"] for f in feats).most_common())
print("index rows:",len(rows))
print("prefixes:",Counter(f["id"].split('-')[1] for f in feats).most_common())
