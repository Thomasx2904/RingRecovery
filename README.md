# Ring Recovery — website

**LIVE:** https://ringrecovery.b8nfpvrkms.workers.dev

Static site on Cloudflare Workers (free tier, static assets served at no charge).
No build step, no framework, no dependencies.

## Files
    index.html      the whole site (~35 KB)
    img/hero.jpg    recovered rings in hand  (hero background)
    img/beach.jpg   Adelaide beach           (service-area band)

## Redeploying after an edit

1. Edit `index.html`
2. Rebuild the zip **with forward slashes** (see the gotcha below)
3. dash.cloudflare.com -> Compute -> Workers & Pages -> `ringrecovery`
   -> **New deployment** -> drop the zip -> Deploy

### Gotcha: do NOT use `Compress-Archive`

Windows PowerShell's `Compress-Archive` writes **backslashes** into the zip, so
`img/hero.jpg` uploads as a file literally named `img\hero.jpg` and every image
404s. Use this instead:

```powershell
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$src='C:\Users\User\IncomeProject\ringrecovery-site'
$zip='C:\Users\User\IncomeProject\ringrecovery-site.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
$fs=[IO.File]::Open($zip,'CreateNew')
$a=New-Object IO.Compression.ZipArchive($fs,'Create')
foreach ($f in @(@{d='index.html';n='index.html'},
                 @{d='img\hero.jpg';n='img/hero.jpg'},
                 @{d='img\beach.jpg';n='img/beach.jpg'})) {
  $e=$a.CreateEntry($f.n,'Optimal'); $s=$e.Open()
  $b=[IO.File]::ReadAllBytes((Join-Path $src $f.d)); $s.Write($b,0,$b.Length); $s.Close()
}
$a.Dispose(); $fs.Close()
```

## Pointing ringrecovery.com.au at this

**Do not cancel the Wix plan until this is done and verified.**

1. Cloudflare -> `ringrecovery` worker -> **Domains** tab -> Connect a custom domain
2. Enter `ringrecovery.com.au`, follow the DNS instructions
3. The domain is registered through Wix, so the DNS records change there
   (or move the nameservers to Cloudflare)
4. Wait for it to resolve, check on a phone, **then** wind down Wix

### Three strings to update at switchover

In `index.html`, replace `https://ringrecovery.b8nfpvrkms.workers.dev` in:
- `<link rel="canonical" …>`
- `<meta property="og:url" …>`
- `<meta property="og:image" …>`

## What's already set up

- `<!doctype>`, `lang="en-AU"`, charset, **viewport** (without viewport the site
  renders at desktop width on a real phone — it was missing on the first deploy)
- Title + meta description tuned for "lost ring adelaide"
- LocalBusiness structured data, og/twitter cards, canonical
- One `<h1>`, 5 tap-to-call links, sticky mobile call bar
- Verified: no horizontal overflow at 360px / 390px / desktop

## Still to add

- Real reviews (no testimonials section yet — worth adding once you have 3)
- Recovery photos: the item in the sand, and back on the owner's hand
- Your ABN in the footer (placeholder text is there now)

## Reviews section

`index.html` contains a ready-built reviews section, shipped **commented out**
(search for `UNCOMMENT WHEN YOU HAVE`). Uncomment it and replace the three quote
blocks once you have real ones. It stays hidden rather than shipping empty.

## Contact email

Changed 2026-08-21 from `Thomas@ringrecovery.com.au` (Google Workspace) to
`thomas.scherrer1@outlook.com`. Appears in 5 places: the contact link and its
label, the footer link and its text, and the LocalBusiness JSON-LD.
