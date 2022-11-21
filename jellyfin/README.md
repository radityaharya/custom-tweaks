
# Jellyfin Tweaks

Custom theme and script for jellyfin

## Theme
Based on [Ultrachromic](https://github.com/CTalvio/Ultrachromic)


**How to:**
- import stylesheet from the Dashboard
```css
@import url('https://cdn.jsdelivr.net/gh/radityaharya/custom-tweaks@main/jellyfin/theme.css');
```

## Scripts
Adds features such as:
- ctrl+f hotkey
- jellyfinApi calls
- per page function calls

**How to:**
- Add script to ```/usr/share/jellyfin/web/```
- Add ```<script defer="defer" src="custom.js"></script>``` to the index.html header


