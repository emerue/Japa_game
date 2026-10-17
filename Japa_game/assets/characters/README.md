Characters: Quaternius Ultimate Modular Men (Feb 2022) and Women (Apr 2022), CC0 1.0.

The game loads the packed `.glb` files (only the animations it uses, binary, ~200 KB each gzipped).
Rebuild them from the raw pack glTFs (git-ignored) with:

    python3 -I tools/pack_characters.py assets/characters assets/characters
