"""Rigenera il blocco "Potrebbe interessarti anche" in fondo a ogni articolo del blog.
Uso: python3 tools/correlati.py  (dalla cartella del sito). Legge le card di blog/index.html."""
import re, html
s = open('blog/index.html').read()
cards = []
for b in re.findall(r'(<a class="note-card".*?</a>)', s, re.S):
    slug = re.search(r'href="([^"/]+)/"', b).group(1)
    cat = re.search(r'data-cat="([^"]+)"', b).group(1)
    old = re.search(r'data-outdated="(\d)"', b).group(1) == '1'
    img = re.search(r'<img src="\.\./(assets/blog/thumbs/[^"?]+)', b)
    tools = re.sub(r'\s+', ' ', re.search(r'<span class="tools">(.*?)</span>', b, re.S).group(1)).strip()
    title = re.search(r'<strong>(.*?)</strong>', b, re.S).group(1).strip()
    cards.append(dict(slug=slug, cat=cat, old=old, img=img.group(1) if img else None, tools=tools, title=title))
fresh = [c for c in cards if not c['old']]
START, END = '<!-- correlati -->', '<!-- /correlati -->'
for c in cards:
    p = f"blog/{c['slug']}/index.html"
    try: page = open(p).read()
    except FileNotFoundError: continue
    pick = [x for x in fresh if x['cat'] == c['cat'] and x['slug'] != c['slug']][:3]
    pick += [x for x in fresh if x not in pick and x['slug'] != c['slug']][:3 - len(pick)]
    items = ''.join(
        f'\n      <a class="rel-card" href="../{x["slug"]}/">'
        + (f'<span class="rel-img"><img src="../../{x["img"]}" alt="" width="800" height="420" loading="lazy" decoding="async"></span>' if x['img'] else '')
        + f'<span class="rel-txt"><small>{x["tools"]}</small><strong>{x["title"]}</strong></span></a>' for x in pick)
    block = f'{START}\n  <aside class="related" aria-label="Altri appunti">\n    <p class="label">Potrebbe interessarti anche</p>\n    <div class="rel-grid">{items}\n    </div>\n    <a class="rel-all" href="../">Tutti gli appunti &rarr;</a>\n  </aside>\n  {END}\n'
    page = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n', '', page, flags=re.S)
    page = page.replace('  </article>\n</main>', '  </article>\n  ' + block + '</main>', 1)
    open(p, 'w').write(page)
print('ok', len(cards))
