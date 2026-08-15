from pathlib import Path
from PIL import Image

for source in [
    Path('public/images/reflex-gloves-b2b.jpg'),
    Path('public/images/ctseg-logo-transparent.png'),
    Path('public/brand/teyfik-gokdemir-primary.png'),
]:
    if not source.exists():
        continue
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        image.save(target, 'WEBP', quality=82, method=6)
    print(f'{source} -> {target} ({target.stat().st_size} bytes)')
