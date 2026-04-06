import re
import sys
from pathlib import Path   

T = sys.argv[1]
G = Path("grid1.htm")      
F = Path("flexbox2.htm")   
IDS = {
    "grid_document_basics",
    "grid_required_headings_and_text",
    "grid_layout_engine",
    "grid_section_distribution",
    "grid_footer_positioning_hint",
    "flex_document_basics",
    "flex_required_headings_and_text",
    "flex_layout_engine",
    "flex_two_column_content_pattern",
    "flex_bottom_info_pattern",
}


def fail(msg):
    print(f"[FAIL] {T}")
    print(msg)
    raise SystemExit(1)


def ok(msg):
    print(f"[PASS] {T}")
    print(msg)
    raise SystemExit(0)


def read(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        fail("document read error")


def norm(raw):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw, flags=re.S)).strip().lower()


def has_heading(raw, level, text):
    return re.search(rf"<h{level}[^>]*>\s*{re.escape(text)}\s*</h{level}>", raw, flags=re.I) is not None


def has_document_basics(raw):
    return (
        re.search(r"<!DOCTYPE\s+html>", raw, flags=re.I) is not None
        and re.search(r"<title\b", raw, flags=re.I) is not None
        and re.search(r"<meta\s+charset\s*=\s*[\"']?utf-8[\"']?", raw, flags=re.I) is not None
    )


def missing(raw, phrases):
    z = norm(raw)
    return [p for p in phrases if p.lower() not in z]


def css_props(raw):
    blocks = re.findall(r"<style[^>]*>(.*?)</style>", raw, flags=re.I | re.S)
    css = "\n".join(blocks)
    return css.lower()


def has_grid_engine(raw):
    css = css_props(raw)
    if "display:grid" not in css.replace(" ", ""):
        return False
    checks = 0
    for p in ["grid-template-columns", "grid-template-rows", "grid-template-areas", "gap", "row-gap", "column-gap"]:  
        if p in css:
            checks += 1
    return checks >= 2


def has_flex_engine(raw):
    css = css_props(raw)
    if "display:flex" not in css.replace(" ", ""):
        return False
    checks = 0
    for p in ["flex-direction", "justify-content", "align-items", "flex-wrap", "gap"]:
        if p in css:
            checks += 1
    return checks >= 2


def section_distribution_ok(raw):
    labels = ["Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth"]
    count = 0
    for v in labels:
        if re.search(rf"<(div|p|section|article|li|span)\b[^>]*>\s*{re.escape(v)}\s*</(div|p|section|article|li|span)>", raw, flags=re.I):
            count += 1
    return count >= 6


def footer_order_ok(raw, mids):
    z = norm(raw)
    return all(k.lower() in z for k in mids) and z.rfind(mids[-1].lower()) > z.find(mids[0].lower())


def flex_two_col_pattern(raw):
    container_pat = re.compile(r"<([a-z0-9]+)\b[^>]*>.*?<h2[^>]*>\s*Other\ things\s*</h2>.*?<h1[^>]*>\s*My\ article\s*</h1>.*?</\1>", flags=re.I | re.S)
    reverse_pat = re.compile(r"<([a-z0-9]+)\b[^>]*>.*?<h1[^>]*>\s*My\ article\s*</h1>.*?<h2[^>]*>\s*Other\ things\s*</h2>.*?</\1>", flags=re.I | re.S)
    return container_pat.search(raw) is not None or reverse_pat.search(raw) is not None


if T not in IDS:
    fail("invalid test id")

if T.startswith("grid_") and not G.exists():
    fail("document basics not satisfied")
if T.startswith("flex_") and not F.exists():
    fail("document basics not satisfied")

gr = read(G) if G.exists() else ""
fr = read(F) if F.exists() else ""

if T == "grid_document_basics":
    if not has_document_basics(gr):
        fail("document basics not satisfied")
    ok("document basics passed")

if T == "grid_required_headings_and_text":
    req = [
        "This is my lovely blog", "Main", "Second", "Third", "Fourth",
        "Fifth", "Sixth", "Seventh", "Eighth", "Contact me@mysite.com",
        "Supported by: iTest Team",
    ]
    if not has_heading(gr, 1, "Main") or not has_heading(gr, 2, "Second") or missing(gr, req):
        fail("required headings/content missing")
    ok("required headings/content passed")

if T == "grid_layout_engine":
    if not has_grid_engine(gr):
        fail("grid layout criteria not met")
    ok("grid layout criteria passed")

if T == "grid_section_distribution":
    if not section_distribution_ok(gr):
        fail("grid item distribution invalid")
    ok("grid item distribution passed")

if T == "grid_footer_positioning_hint":
    if not footer_order_ok(gr, ["Contact me@mysite.com", "Supported by: iTest Team"]):
        fail("footer/info ordering invalid")
    ok("footer/info ordering passed")

if T == "flex_document_basics":
    if not has_document_basics(fr):
        fail("document basics not satisfied")
    ok("document basics passed")

if T == "flex_required_headings_and_text":
    req = [
        "This is my lovely blog", "My article", "Other things",
        "Contact me@mysite.com", "ABC company.", "Supported by: iTest Team",
    ]
    if not has_heading(fr, 1, "My article") or not has_heading(fr, 2, "Other things") or missing(fr, req):
        fail("required headings/content missing")
    ok("required headings/content passed")

if T == "flex_layout_engine":
    if not has_flex_engine(fr):
        fail("flex layout criteria not met")
    ok("flex layout criteria passed")

if T == "flex_two_column_content_pattern":
    if not flex_two_col_pattern(fr):
        fail("two-column content pattern not found")
    ok("two-column content pattern passed")

if T == "flex_bottom_info_pattern":
    z = norm(fr)
    if not ("contact me@mysite.com" in z and "abc company." in z and "supported by: itest team" in z):
        fail("bottom info structure invalid")
    if not (z.rfind("supported by: itest team") > z.find("contact me@mysite.com") and z.rfind("supported by: itest team") > z.find("abc company.")):
        fail("bottom info structure invalid")
    ok("bottom info structure passed")