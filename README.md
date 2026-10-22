# Lust to PDF

A free static website starter for PDF utilities.

## Files
- `index.html` — homepage
- `style.css` — shared purple theme and layout
- `tool.js` — shared browser-side PDF tools
- `merge-pdf.html` — merge multiple PDFs
- `compress-pdf.html` — basic PDF re-save/size check (not guaranteed to compress)
- `image-to-pdf.html` — convert JPG/PNG images into a PDF
- `split-pdf.html` — extract pages using page numbers/ranges

## Run locally
Keep all files in one folder and open `index.html` in a browser. An internet connection is required to load `pdf-lib` from the CDN.

## Deploy to Cloudflare Pages
Upload all files to the root of your GitHub repository. In Cloudflare Pages, connect the repository, select no framework preset, use build command `exit 0` and output directory `.`.
