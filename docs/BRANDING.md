# Branding (logo/icon in Home Assistant + HACS)

If you don’t see a Sunflow logo/icon in **Home Assistant** (Devices & Services) or in **HACS**, that’s expected until the integration is added to the official Home Assistant **brands** repository.

Home Assistant (and HACS) load integration logos/icons from:
- https://brands.home-assistant.io/_/sunflow/icon.png
- https://brands.home-assistant.io/_/sunflow/logo.png

Those images are **not** taken from this repository’s `custom_components/sunflow/` folder.

## What you need to do

1. Fork https://github.com/home-assistant/brands
2. Add a new folder:
   - `custom_integrations/sunflow/`
3. Add the branding images there:
   - `icon.png` (256×256)
   - `icon@2x.png` (512×512)
   - `logo.png` (shortest side 128–256)
   - `logo@2x.png` (shortest side 256–512)

This repo already contains starting images:
- `icon.png` (256×256)
- `logo.png` (512×512) → this one matches the *size* requirements for a `logo@2x.png`, but you still need a smaller `logo.png`.

4. Open a PR to `home-assistant/brands`.

## Notes

- Brand images are cached (browser up to 7 days; CDN up to 24h). Even after a PR is merged, it can take a bit until everyone sees it.
- If you want immediate local testing, you can open the URLs above after the PR is merged to verify they serve correctly.
