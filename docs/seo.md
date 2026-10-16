# Search (SEO) checklist

What the site already does, and the steps that need a Google login.

## Built into the site

- **Titles and descriptions:** every page has its own `title` and a `description` of at most about 155 characters, written around what parents search for (English-medium school, Adapur, Nandalur, admissions, LKG to Class X). Set them in each page's front matter. Notices use their title and first paragraph.
- **Structured data (schema.org):**
  - `School` on Home and Contact: name, other names, address, map pin, phone, email, office hours, founding year, logo and social profiles. Source: [_includes/frame/schema-school.html](../_includes/frame/schema-school.html), values from `_data/site.yml`.
  - `BreadcrumbList` on every inner page.
  - Notices are articles with their publish date (jekyll-seo-tag).
- **Sharing:** a 1200 × 630 share image (`assets/images/share/ssvn-share.jpg`) on every page, with a large Twitter/X card. A page can use its own image with `image:` in its front matter.
- **Indexing:** canonical URLs, `sitemap.xml` and `robots.txt` (jekyll-sitemap). The 404 page is `noindex`; the Pinterest verification file is left out of the sitemap.
- **Headings:** one `h1` per page. The home page's `h1` carries the school's name for search engines and screen readers alongside the visible Telugu motto.
- **Speed:** image sizes are declared (no layout shift), photos lazy-load, the hero image loads first, and fonts start downloading in parallel with the stylesheet.

## After launch (needs a Google login)

1. **Google Search Console** (https://search.google.com/search-console):
   - add the property for the **domain** `srisaividyanikethan.edu.in`, verified with a DNS TXT record at the domain registrar. This covers http/https and www.
   - Alternatively, add a URL-prefix property and paste its HTML-tag code into `_config.yml` → `webmaster_verifications: google:`.
   - Then **Sitemaps → submit `sitemap.xml`**, and use **URL inspection → Request indexing** for the home page.
2. **Check the structured data** at https://search.google.com/test/rich-results with `https://srisaividyanikethan.edu.in/` and `/contact/`.
3. **Google Business Profile** (the school's Google Maps listing):
   - set the website to `https://srisaividyanikethan.edu.in`;
   - keep the **name, address and phone exactly the same** as on the site;
   - add the office hours, the "School" category, and recent photos.
   The listing currently reads "Sri Sai Vidyanikethan E.M School, Adapur"; the site uses "Sri Sai Vidyanikethan E.M. High School". Pick one and use it in both places.
4. **Bing Webmaster Tools** (https://www.bing.com/webmasters) can import the site from Search Console in one step.
5. **Share preview:** paste the site's link into WhatsApp to check the card shows the share image.

## Keep it healthy

- Post notices regularly. Fresh, dated pages about real school events help more than anything else here.
- Give every new page a clear title, a one-sentence description, and photos with descriptive alt text.
- If the address, phone or hours change, update `_data/site.yml` **and** the Google Business Profile on the same day.
