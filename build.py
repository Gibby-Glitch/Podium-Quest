"""Builds index.html (for GitHub/Vercel) and preview.html (single self-contained file) from src/page.html."""
import re, pathlib
root = pathlib.Path(__file__).parent
page = (root / "src/page.html").read_text()
head_end = page.index('<div class="app">')
head, body = page[:head_end], page[head_end:]
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + '</head>\n<body>\n' + body + '</body>\n</html>\n')
(root / "index.html").write_text(full)
css = (root / "css/app.css").read_text()
data = (root / "js/data.js").read_text()
app = (root / "js/app.js").read_text()
game = (root / "js/game.js").read_text()
turns = (root / "js/turns.js").read_text()
prev = re.sub(r"<!-- PWA:START -->.*?<!-- PWA:END -->\n", "", page, flags=re.S)
prev = prev.replace('<link rel="stylesheet" href="css/app.css">', "<style>\n" + css + "\n</style>")
prev = prev.replace('<script src="js/data.js"></script>', "<script>\n" + data + "\n</script>")
prev = prev.replace('<script src="js/app.js"></script>', "<script>\n" + app + "\n</script>")
prev = prev.replace('<script src="js/game.js"></script>', "<script>\n" + game + "\n</script>")
prev = prev.replace('<script src="js/turns.js"></script>', "<script>\n" + turns + "\n</script>")
(root / "preview.html").write_text(prev)
print("built index.html", len(full), "preview.html", len(prev))
