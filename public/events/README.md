# Event asset folders

Create one folder per public event slug:

```text
public/events/<slug>/
  hero.webp
  decorations.svg
```

Only guest-safe artwork belongs here. Do not store share tokens, guest lists, private notes, source Illustrator/Figma files containing private data, or unapproved guest photos in `public/`.

Optimize final artwork before committing it, then set its root-relative path and intrinsic dimensions in the event configuration.
