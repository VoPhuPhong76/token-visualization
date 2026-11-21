# Our Token

Interactive viewer for supplied audio–visual token-selection figures. Browse each video and select a frame, compare four layers in one composed image, inspect the OmniZip and Omni-Prune baselines, and download a labeled PNG comparison.

## Run locally

From this folder, run `python -m http.server 8000`, then open http://localhost:8000. A web server is required for reliable canvas export.

## Data

The supplied visualization collection includes three video IDs, layers 0–27, four exported frames per video, baseline figures, source videos and PDF summaries. `data.js` lists the available cases. Images are served from `assets/vis` with their original filenames and overlays.

Frame indices refer to the exported figures. Timestamp and overlay-color semantics were not included in the supplied metadata. The site does not compute token masks, clustering, accuracy or attention scores.

The initial comparison shows layers 0–3. Each slot can select any available layer. 

## Hosting

This is a static HTML/CSS/JavaScript site. GitHub Pages can publish the repository's `main` branch from the root directory.

