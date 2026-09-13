from PIL import Image, ImageDraw

GOLD = (176, 141, 87, 255)
GOLD_DEEP = (138, 108, 63, 255)
WHITE = (255, 255, 255, 255)
MINT_SOFT = (232, 242, 238, 255)


def tooth_path(scale, ox, oy):
    # Coordenadas baseadas no icone "canino" do app (viewBox 0 0 34 64),
    # escaladas e deslocadas.
    def p(x, y):
        return (ox + x * scale, oy + y * scale)

    crown = [p(17, 0), p(26, 20), p(17, 24), p(8, 20)]
    root = [
        p(13.5, 22), p(20.5, 22), p(19, 44), p(18.5, 60),
        p(16, 62), p(15.5, 60), p(15, 44),
    ]
    return crown, root


def draw_icon(size, path, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        # Preenche o quadro inteiro (zona segura do sistema faz o recorte)
        draw.rectangle([0, 0, size, size], fill=WHITE)
        pad = size * 0.30
    else:
        radius = size * 0.22
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=WHITE)
        draw.ellipse(
            [size * 0.08, size * 0.08, size * 0.92, size * 0.92], fill=MINT_SOFT
        )
        pad = size * 0.26

    tooth_h = size - 2 * pad
    scale = tooth_h / 64
    tooth_w = 34 * scale
    ox = (size - tooth_w) / 2
    oy = pad

    crown, root = tooth_path(scale, ox, oy)
    draw.polygon(crown, fill=GOLD_DEEP)
    draw.polygon(root, fill=GOLD)

    img.save(path, "PNG")


draw_icon(192, "public/icons/icon-192.png")
draw_icon(512, "public/icons/icon-512.png")
draw_icon(512, "public/icons/icon-maskable-512.png", maskable=True)
print("done")
