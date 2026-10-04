# Yunxi Jiang — Academic Portfolio

A dependency-free static academic website for Yunxi Jiang (蒋韫希), postdoctoral researcher in condensed matter physics at CNRS/IPCMS.

## Local preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Publishing to GitHub Pages

This repository is intentionally plain HTML/CSS/JavaScript, so GitHub Pages can serve it directly from the `main` branch without a build step.

## Included profile assets

- Downloadable two-page academic CV (`assets/Yunxi_Jiang_CV.pdf`)
- GitHub profile: [Yunxi-Jiang](https://github.com/Yunxi-Jiang)
- Google Scholar, ORCID, DOI, arXiv, and repository links

## Research output

The October 2026 publication update follows the supplied CV: six published articles, five manuscripts under review, and a separately retained doctoral thesis. All entries are visible by default. Optional filters distinguish publication status and announce changes to screen readers.

Public preprint links are included when verified. SO3UFormer links to arXiv v1, which matches the title in the supplied CV. Manuscripts without a verified public record have no placeholder links.

## Design provenance

The original visual direction adapted the free **3D Portfolio** prompt from [MotionSites](https://motionsites.ai/?prompt=3d-jack-portfolio-hero). The September 2026 revision develops that foundation into a restrained scientific portfolio: an in-flow two-column introduction, original canvas physics illustrations, and light-background reading sections. No proprietary template source code or third-party imagery is used.

## Animation and accessibility

- The Néel-skyrmion field is an analytic illustration with a downward core, radial domain wall, and upward background. Its breathing motion is schematic, not a time-resolved simulation.
- Research illustrations show a spin texture, wave propagation, and a Bloch-sphere state vector.
- Canvas animation is limited to 30 frames per second, stops off-screen or in hidden tabs, and respects `prefers-reduced-motion`. The homepage also offers a manual pause control.
- Main content and all research entries remain readable with JavaScript disabled. Publicly available papers link to their DOI, preprint, or repository records.
