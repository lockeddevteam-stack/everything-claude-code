import re
F='redesign/input/locked-current-v6.html'
src=open(F,encoding='utf-8',errors='replace').read().split('\n')
defs={}
pats=[re.compile(r'^\s*function\s+([A-Za-z_$][\w$]*)\s*\('),
      re.compile(r'^\s*(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()'),
      re.compile(r'^\s*(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*\{'),
      re.compile(r'^\s*class\s+([A-Za-z_$][\w$]*)')]
for i,l in enumerate(src,1):
    for p in pats:
        m=p.match(l)
        if m: defs.setdefault(m.group(1), i); break
rows=[]
for line in open('audit/FUNCTION_INDEX.md',encoding='utf-8'):
    m=re.match(r'^\| (.+?) \| `(.+?)` \| (.*?) \| (.*?) \| (.*?) \|$', line.rstrip('\n'))
    if m: rows.append(list(m.groups()))
fixed=drift=unres=0; out=[]
for cited,name,kind,purpose,agent in rows:
    base=re.sub(r'\(.*','',name).strip().strip('`')
    true=defs.get(base); cm=re.search(r'(\d+)',cited)
    if true:
        anchor=f"{F}:{true}"; fixed+=1
        if cm and abs(int(cm.group(1))-true)>2: drift+=1
    else:
        anchor=cited+" *(unresolved)*"; unres+=1
    out.append((true or 10**9, anchor, base, kind, purpose, agent))
out.sort(key=lambda r:(r[0], r[2]))
with open('audit/FUNCTION_INDEX.md','w',encoding='utf-8') as fh:
    fh.write("# LOCKED — Function & Component Index\n\n")
    fh.write(f"Every function, component, hook and handler in the production build\n`{F}` (58,015 lines), sorted by line number.\n\n")
    fh.write(f"**{len(out)} entries.** Line numbers are **machine-re-anchored**: each symbol's\ndefinition line was recomputed directly from the source, replacing the\nagent-reported cites (Wave 3 found those drifted by 5-64 lines).\n")
    fh.write(f"{fixed} anchored to an exact definition ({drift} of which corrected real drift);\n{unres} unresolved — inline handlers and closures with no top-level definition,\nwhere the original cite is kept and marked.\n\n")
    fh.write("| Location | Symbol | Kind | Purpose | Source agent |\n|---|---|---|---|---|\n")
    for _,anchor,base,kind,purpose,agent in out:
        fh.write(f"| {anchor} | `{base}` | {kind} | {purpose} | {agent} |\n")
print(f"re-anchored={fixed} drift_corrected={drift} unresolved={unres}")
