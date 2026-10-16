# Search (SEO) checklist

What the site already does, and the steps that need a Google login.

## Built into the site

- **Titles and descriptions:** every page has its own `title` and a `description` of at most about 155 characters, written around what parents search for (English-medium school, Adapur, Nandalur, admissions, LKG to Class X). Set them in each page's front matter. Notices use their title and first paragraph.
- **Structured data (schema.org):**
  - `School` on Home and Contact: official name (and the former name), address, map pin, phone, email, office hours, founding year, logo, social profiles, board (Andhra Pradesh State Board), co-educational, YSR Kadapa district, and the villages the buses serve (`areaServed`). Source: [_includes/frame/schema-school.html](../_includes/frame/schema-school.html), values from `_data/site.yml`.
  - `BreadcrumbList` on every inner page.
  - Notices are articles with their publish date (jekyll-seo-tag).
- **Sharing:** a 1200 × 630 share image (`assets/images/share/ssvn-share.jpg`) on every page, with a large Twitter/X card. A page can use its own image with `image:` in its front matter.
- **Indexing:** canonical URLs, `sitemap.xml` and `robots.txt` (jekyll-sitemap). The 404 page is `noindex`; the Pinterest verification file is left out of the sitemap.
- **Local content:** the Admissions page lists the villages and towns on the bus routes (`bus_villages` in `_data/site.yml`), so parents searching for a school near their village can find it.
- **Headings:** one `h1` per page. The home page's `h1` carries the school's name for search engines and screen readers alongside the visible Telugu motto.
- **Speed:** image sizes are declared (no layout shift), photos lazy-load, the hero image loads first, and fonts start downloading in parallel with the stylesheet.

## After launch (needs a Google login)

No Google Ads account is needed for any of this. Search Console, the Business Profile and the rich results test are free and only need a Google account. Use the school's own account, **ssvn.em.high.school@gmail.com**, so ownership stays with the school; others can be added as users later.

### 1. Google Search Console: verify the site

The domain's registrar is ERNET India, so the DNS method (a "Domain" property) is impractical. Use a **URL-prefix** property instead, which needs no DNS changes:

1. Open https://search.google.com/search-console, signed in as the school account.
2. **Add property** → choose the right-hand box, **URL prefix** → enter `https://srisaividyanikethan.edu.in/` → **Continue**.
3. Under **Other verification methods**, pick one:
   - **HTML tag** (recommended): Google shows `<meta name="google-site-verification" content="ABC123…" />`. Copy only the `content` value and put it in `_config.yml`:
     ```yaml
     webmaster_verifications:
       google: ABC123…
     ```
     jekyll-seo-tag then adds the tag to every page.
   - **HTML file**: download the `google….html` file and add it at the root of the repository, untouched, like `pinterest-6e078.html`.
4. Push, wait about a minute for GitHub Pages, then press **Verify**.
5. **Keep the tag (or file) forever.** Google re-checks it, and removing it un-verifies the site.

The verification only works once it is on the **live** site. The live site is still the old page on `main`, so either launch the redesign first, or use the HTML-file method straight away: the file can be added to `main` today without changing anything else.

Then **Sitemaps** → submit `sitemap.xml` (after launch; the old site has none), and **URL inspection** → **Request indexing** for the home page.

### 2. Check the structured data

Use https://search.google.com/test/rich-results with `https://srisaividyanikethan.edu.in/` and `/contact/`.

### 3. Google Business Profile (the Google Maps listing)

- Set the website to `https://srisaividyanikethan.edu.in`.
- The site now uses the listing's exact name, **Sri Sai Vidyanikethan E.M School, Adapur** (`name_full` in `_data/site.yml`). Keep the name, address and phone identical in both places.
- Add the office hours, the "School" category, and recent photos.

### 4. Bing

Bing Webmaster Tools (https://www.bing.com/webmasters) can import the site from Search Console in one step.

### 5. Share preview

Paste the site's link into WhatsApp and check the card shows the share image.

## Keep it healthy

- Post notices regularly. Fresh, dated pages about real school events help more than anything else here.
- Give every new page a clear title, a one-sentence description, and photos with descriptive alt text.
- If the address, phone or hours change, update `_data/site.yml` **and** the Google Business Profile on the same day.
