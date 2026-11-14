# A Happy Moment — ai-happy-01

A small child laughing while flying a handmade red-and-gold kite over a hill at
golden hour, a happy dog chasing after, birds overhead, butterflies and wild
flowers. One specific warm moment: the first time the kite actually stays up.

`main.ts` (Node 22, standard library only) draws the whole scene with a tiny
built-in PNG encoder (`node:zlib`) — no assets, no fonts, no network — and
writes it to `/output/entry.png` (or `$MAKEFUN_OUTPUT_DIR/entry.png`).

Fully deterministic: two runs write byte-identical files (800×600 PNG,
~12 KB, well under the 1 MiB / 1024×1024 limits).

Run it:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
