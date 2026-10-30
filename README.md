# Ring Recovery

The website for Ring Recovery, a lost ring and jewellery metal detecting search service in Adelaide, South Australia: https://ringrecovery.com.au/

A static site served by GitHub Pages from the `main` branch. No build step: edit the files and push.

- `index.html`, `cinematic.css`, `cinematic.js`, `layout.css`, `layout.js`: the home page.
- `lost-ring-at-the-beach/`, `lost-ring-in-grass/`, `will-a-metal-detector-find-my-ring/`, `metal-detector-or-detectorist/`: guide pages, styled by `page.css` with the small `page.js`.
- `404.html`: shown for any missing address. `service-page/`, `payment-request-page.html` and `book-online.html` forward old Wix addresses to the home page.
- `sitemap.xml`: update `lastmod` whenever a page's content changes.

## Enquiry form

The form on the home page emails enquiries through [Web3Forms](https://web3forms.com/) once `FORM_KEY` near the top of the form code in `cinematic.js` holds the site's access key (the key is public by design). With no key, or if sending fails, it falls back to opening the visitor's own email or text app with the message filled in.
