"""Pack Quaternius character glTFs into small GLBs for the game.

Keeps only the animations the game uses, drops unused buffer data and
writes binary GLB (no base64). Standard library only, because npm is
blocked on the dev machine.

Usage: python3 -I tools/pack_characters.py SRC_DIR OUT_DIR
"""
import base64
import json
import struct
import sys
from pathlib import Path

KEEP_ANIMATIONS = {"Idle", "Walk", "Wave", "Interact", "Idle_Neutral"}


def load(path):
    gltf = json.loads(path.read_text())
    blobs = []
    for buf in gltf["buffers"]:
        uri = buf["uri"]
        if uri.startswith("data:"):
            blobs.append(base64.b64decode(uri.split(",", 1)[1]))
        else:
            blobs.append((path.parent / uri).read_bytes())
    return gltf, blobs


def pack(gltf, blobs):
    gltf["animations"] = [a for a in gltf.get("animations", []) if a["name"] in KEEP_ANIMATIONS]

    # Which accessors are still referenced?
    used = set()
    for mesh in gltf.get("meshes", []):
        for prim in mesh["primitives"]:
            used.update(prim["attributes"].values())
            if "indices" in prim:
                used.add(prim["indices"])
            for target in prim.get("targets", []):
                used.update(target.values())
    for skin in gltf.get("skins", []):
        if "inverseBindMatrices" in skin:
            used.add(skin["inverseBindMatrices"])
    for anim in gltf["animations"]:
        for sampler in anim["samplers"]:
            used.update((sampler["input"], sampler["output"]))

    # Rebuild one buffer holding only the bufferViews those accessors need.
    accessors = gltf["accessors"]
    view_map, out, views = {}, bytearray(), []
    acc_map, new_accessors = {}, []
    for i in sorted(used):
        acc = dict(accessors[i])
        v = acc["bufferView"]
        if v not in view_map:
            view = dict(gltf["bufferViews"][v])
            data = blobs[view.get("buffer", 0)][view.get("byteOffset", 0): view.get("byteOffset", 0) + view["byteLength"]]
            while len(out) % 4:
                out.append(0)
            view["buffer"] = 0
            view["byteOffset"] = len(out)
            out.extend(data)
            view_map[v] = len(views)
            views.append(view)
        acc["bufferView"] = view_map[v]
        acc_map[i] = len(new_accessors)
        new_accessors.append(acc)

    remap = lambda i: acc_map[i]
    for mesh in gltf.get("meshes", []):
        for prim in mesh["primitives"]:
            prim["attributes"] = {k: remap(v) for k, v in prim["attributes"].items()}
            if "indices" in prim:
                prim["indices"] = remap(prim["indices"])
            prim["targets"] = [{k: remap(v) for k, v in t.items()} for t in prim.get("targets", [])] or None
            if prim["targets"] is None:
                del prim["targets"]
    for skin in gltf.get("skins", []):
        if "inverseBindMatrices" in skin:
            skin["inverseBindMatrices"] = remap(skin["inverseBindMatrices"])
    for anim in gltf["animations"]:
        for sampler in anim["samplers"]:
            sampler["input"], sampler["output"] = remap(sampler["input"]), remap(sampler["output"])

    gltf["accessors"] = new_accessors
    gltf["bufferViews"] = views
    gltf["buffers"] = [{"byteLength": len(out)}]
    return gltf, bytes(out)


def write_glb(path, gltf, binary):
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    binary += b"\0" * (-len(binary) % 4)
    total = 12 + 8 + len(js) + 8 + len(binary)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(binary), 0x004E4942) + binary)


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    dst.mkdir(parents=True, exist_ok=True)
    for path in sorted(src.glob("*.gltf")):
        gltf, blobs = load(path)
        gltf, binary = pack(gltf, blobs)
        out = dst / (path.stem + ".glb")
        write_glb(out, gltf, binary)
        kept = [a["name"] for a in gltf["animations"]]
        print(f"{path.name}: {path.stat().st_size // 1024} KB -> {out.name}: {out.stat().st_size // 1024} KB, animations {kept}")


if __name__ == "__main__":
    main()
