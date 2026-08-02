# Regenerates the shared header + mobile drawer across every page.
# Header markup is duplicated by design (no build step), so it is generated
# from one source here rather than hand-edited six times.

import io, re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

I = {
 "failure": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="M7.5 10.5h6M10.5 7.5v6" stroke-opacity=".5"/></svg>',
 "formulation": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="17.5" r="2.4"/><path d="M8.2 8.3 10.5 15.4M15.8 8.3 13.5 15.4M8.4 7h7.2"/></svg>',
 "scaleup": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19h4v-7H4zM10 19h4V8h-4zM16 19h4V4h-4z"/><path d="M2 21.5h20" stroke-opacity=".5"/></svg>',
 "reliability": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5 20.5 6v6.5c0 4.9-3.4 8.3-8.5 9.6-5.1-1.3-8.5-4.7-8.5-9.6V6z"/><path d="m8.6 12 2.4 2.4 4.4-4.6"/></svg>',
 "models": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3.5" width="18" height="5" rx="1.4"/><rect x="3" y="11" width="18" height="5" rx="1.4"/><path d="M6.5 19.5h11"/></svg>',
 "faq": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/></svg>',
 "terms": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5" stroke-opacity=".6"/><path d="M9 12h6M9 16h6" stroke-opacity=".6"/></svg>',
 "semi": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="13" height="13" rx="1.6"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M9 2.5v3M15 2.5v3M9 18.5v3M15 18.5v3M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" stroke-opacity=".65"/></svg>',
 "solar": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 14.5h17l-2-8.5h-13z"/><path d="M12 6v8.5M8.4 6 7.2 14.5M15.6 6l1.2 8.5M4.6 10.2h14.8" stroke-opacity=".6"/><path d="M12 14.5v6M9 20.5h6"/></svg>',
 "batt": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="16.5" height="10" rx="2"/><path d="M21.8 10.2v3.6"/><path d="M11.4 9.4 8.8 12.6h3.4l-2.4 3.2"/></svg>',
 "chem": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.2 2.8h5.6"/><path d="M10.2 2.8v6.4L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5.2-8.8V2.8"/><path d="M7.6 15.2h8.8" stroke-opacity=".6"/></svg>',
 "adh": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3.5" width="18" height="3.6" rx="1"/><rect x="3" y="16.9" width="18" height="3.6" rx="1"/><path d="M12 7.1c-1.9 2-2.9 3.2-2.9 4.6a2.9 2.9 0 0 0 5.8 0c0-1.4-1-2.6-2.9-4.6z"/></svg>',
 "comp": '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 2.5 7.4 12 12l9.5-4.6z"/><path d="M2.5 12 12 16.6 21.5 12" stroke-opacity=".7"/><path d="M2.5 16.6 12 21.2l9.5-4.6" stroke-opacity=".45"/></svg>',
}

CAPS = [
    ("capabilities.html#failure-analysis", "failure", "Failure &amp; root-cause analysis", "Find the mechanism, then prove it"),
    ("capabilities.html#formulation",      "formulation", "Formulation &amp; materials selection", "Fewer experiments, better ones"),
    ("capabilities.html#scale-up",         "scaleup", "Process &amp; scale-up engineering", "Close the bench-to-plant gap"),
    ("capabilities.html#reliability",      "reliability", "Reliability &amp; qualification", "Tests that predict something real"),
]

ENGAGE = [
    ("capabilities.html#engagement-models", "models", "Engagement models", "Three ways to work with us"),
    ("capabilities.html#practicalities",    "faq", "Practicalities", "Laboratories, IP, confidentiality"),
    ("about.html#terms",                    "terms", "Engagement terms", "What you can hold us to"),
]

IND = [
    ("Electronics &amp; energy", [
        ("industries.html#semiconductors", "semi",  "--sig-semi",  "Semiconductors", "Yield, thin films, packaging stress"),
        ("industries.html#photovoltaics",  "solar", "--sig-solar", "Solar &amp; photovoltaics", "Degradation, encapsulants, PID"),
    ]),
    ("Storage &amp; chemistry", [
        ("industries.html#batteries", "batt", "--sig-batt", "Batteries &amp; energy storage", "Capacity fade, coating, safety"),
        ("industries.html#chemicals", "chem", "--sig-chem", "Specialty chemicals", "Impurities, scale-up, crystallisation"),
    ]),
    ("Interfaces &amp; structures", [
        ("industries.html#adhesives",  "adh",  "--sig-adhesive",  "Adhesives &amp; coatings", "Surface prep, cure, durability"),
        ("industries.html#composites", "comp", "--sig-composite", "Composites", "Porosity, cure cycle, joints"),
    ]),
]

def item(href, icon, title, desc, sector=None):
    style = ' style="--sector: var(%s)"' % sector if sector else ""
    return (
        '            <li>\n'
        '              <a class="mm-item" href="%s"%s>\n'
        '                <span class="mm-item__icon">%s</span>\n'
        '                <span>\n'
        '                  <span class="mm-item__title">%s</span>\n'
        '                  <span class="mm-item__desc">%s</span>\n'
        '                </span>\n'
        '              </a>\n'
        '            </li>\n' % (href, style, I[icon], title, desc)
    )

def column(label, lid, rows):
    s  = '        <div class="megamenu__col">\n'
    s += '          <p class="megamenu__label" id="%s">%s</p>\n' % (lid, label)
    s += '          <ul class="megamenu__list" aria-labelledby="%s">\n' % lid
    for r in rows:
        s += r
    s += '          </ul>\n        </div>\n'
    return s

# ---------------------------------------------------------------- panels
cap_panel  = '  <div class="megamenu" id="menu-capabilities" data-menu-panel="capabilities" hidden>\n'
cap_panel += '    <div class="container megamenu__inner">\n'
cap_panel += column("Capabilities", "mm-cap", [item(*c) for c in CAPS])
cap_panel += column("How we engage", "mm-eng", [item(*c) for c in ENGAGE])
cap_panel += (
'        <div class="megamenu__promo">\n'
'          <h3>Not sure which you need?</h3>\n'
'          <p>Describe the symptom. Working out which capability applies is our job, and we will tell you honestly if the answer is none of them.</p>\n'
'          <p><a class="link" href="contact.html">Describe your problem\n'
'            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>\n'
'          </a></p>\n'
'        </div>\n')
cap_panel += '    </div>\n  </div>\n'

ind_panel  = '  <div class="megamenu" id="menu-industries" data-menu-panel="industries" hidden>\n'
ind_panel += '    <div class="container megamenu__inner">\n'
for n, (label, rows) in enumerate(IND):
    ind_panel += column(label, "mm-ind-%d" % n,
                        [item(h, ic, t, d, sec) for (h, ic, sec, t, d) in rows])
ind_panel += '    </div>\n  </div>\n'

BRAND_FULL = (
'        <svg class="brand__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">\n'
'          <path d="M16 3 28 10v14L16 31 4 24V10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>\n'
'          <path d="M16 3v10M28 10l-12 7M4 10l12 7M16 17v14" stroke="currentColor" stroke-width="1.1" stroke-opacity=".45"/>\n'
'          <circle cx="16" cy="17" r="3.4" fill="currentColor"/>\n'
'        </svg>\n'
'        <span class="brand__name">GreenChem<em>X</em></span>\n')

BRAND_SM = (
'        <svg class="brand__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">\n'
'          <path d="M16 3 28 10v14L16 31 4 24V10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>\n'
'          <circle cx="16" cy="17" r="3.4" fill="currentColor"/>\n'
'        </svg>\n'
'        <span class="brand__name">GreenChem<em>X</em></span>\n')

CHEV = '<svg class="nav__chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
CHEV_M = '<svg class="mobile-nav__chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

def build(page):
    home = ' aria-current="page"' if page == "index.html" else ""
    about = ' aria-current="page"' if page == "about.html" else ""
    ins = ' aria-current="page"' if page == "insights.html" else ""
    contact = ' aria-current="page"' if page == "contact.html" else ""
    capcur = " is-current" if page == "capabilities.html" else ""
    indcur = " is-current" if page == "industries.html" else ""

    h  = '<header class="site-header" data-nav-root>\n'
    h += '  <div class="container">\n'
    h += '    <nav class="nav" aria-label="Primary">\n'
    h += '      <a class="brand" href="index.html">\n' + BRAND_FULL + '      </a>\n\n'
    h += '      <ul class="nav__links">\n'
    h += '        <li><a class="nav__link" href="index.html"%s>Home</a></li>\n' % home
    h += ('        <li class="nav__item">\n'
          '          <button class="nav__link nav__trigger%s" type="button" data-menu-trigger="capabilities"\n'
          '                  aria-expanded="false" aria-controls="menu-capabilities">Capabilities %s</button>\n'
          '        </li>\n' % (capcur, CHEV))
    h += ('        <li class="nav__item">\n'
          '          <button class="nav__link nav__trigger%s" type="button" data-menu-trigger="industries"\n'
          '                  aria-expanded="false" aria-controls="menu-industries">Industries %s</button>\n'
          '        </li>\n' % (indcur, CHEV))
    h += '        <li><a class="nav__link" href="about.html"%s>About</a></li>\n' % about
    h += '        <li><a class="nav__link" href="insights.html"%s>Insights</a></li>\n' % ins
    h += '      </ul>\n\n'
    h += '      <div class="nav__actions">\n'
    h += ('        <button class="icon-btn theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to dark theme">\n'
          '          <svg class="icon-sun" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">\n'
          '            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>\n'
          '          </svg>\n'
          '          <svg class="icon-moon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n'
          '            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>\n'
          '          </svg>\n'
          '        </button>\n')
    h += '        <a class="btn btn--primary nav__cta" href="contact.html"%s>Start a conversation</a>\n' % contact
    h += ('        <button class="icon-btn nav__toggle" type="button" data-nav-open aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">\n'
          '          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>\n'
          '        </button>\n')
    h += '      </div>\n    </nav>\n  </div>\n\n'
    h += cap_panel + '\n' + ind_panel
    h += '</header>\n\n'

    # ------------------------------------------------------------- drawer
    d  = '<div class="mobile-nav" id="mobile-nav" aria-hidden="true">\n'
    d += '  <div class="mobile-nav__head">\n    <span class="brand">\n' + BRAND_SM + '    </span>\n'
    d += ('    <button class="icon-btn" type="button" data-nav-close aria-label="Close menu">\n'
          '      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>\n'
          '    </button>\n  </div>\n\n')
    d += '  <nav aria-label="Mobile">\n'
    d += '    <a class="mobile-nav__link" href="index.html"%s>Home</a>\n' % home

    d += '    <details class="mobile-nav__group"%s>\n' % (" open" if page == "capabilities.html" else "")
    d += '      <summary class="mobile-nav__link">Capabilities %s</summary>\n' % CHEV_M
    d += '      <ul class="mobile-nav__sub">\n'
    for href, icon, title, _ in CAPS + ENGAGE:
        d += '        <li><a href="%s">%s<span>%s</span></a></li>\n' % (href, I[icon], title)
    d += '      </ul>\n    </details>\n'

    d += '    <details class="mobile-nav__group"%s>\n' % (" open" if page == "industries.html" else "")
    d += '      <summary class="mobile-nav__link">Industries %s</summary>\n' % CHEV_M
    d += '      <ul class="mobile-nav__sub">\n'
    for _, rows in IND:
        for href, icon, sec, title, _d in rows:
            d += '        <li><a href="%s" style="--sector: var(%s)">%s<span>%s</span></a></li>\n' % (href, sec, I[icon], title)
    d += '      </ul>\n    </details>\n'

    d += '    <a class="mobile-nav__link" href="about.html"%s>About</a>\n' % about
    d += '    <a class="mobile-nav__link" href="insights.html"%s>Insights</a>\n' % ins
    d += '  </nav>\n\n'
    d += '  <a class="btn btn--primary btn--lg" href="contact.html">Start a conversation</a>\n'
    d += '  <p class="mobile-nav__meta">A senior engineer replies within two working days.</p>\n'
    d += '</div>\n\n'
    return h + d

pages = ["index.html", "capabilities.html", "industries.html",
         "about.html", "insights.html", "contact.html"]

pat = re.compile(r'<header class="site-header".*?(?=<main id="main">)', re.S)

for p in pages:
    path = os.path.join(ROOT, p)
    s = io.open(path, encoding="utf-8").read()
    if not pat.search(s):
        print("NO MATCH", p); continue
    s2 = pat.sub(lambda m: build(p), s, count=1)
    io.open(path, "w", encoding="utf-8").write(s2)
    print("ok", p, len(s), "->", len(s2))
