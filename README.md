# Recording Activity Dashboard

Dashboard-only HTML extracted from the user-supplied Davidson County Register
of Deeds page. Portal navigation, search, language menus, and the site footer
are excluded.

## Status

This is a **preview, not a fully functioning data dashboard**. The source
repository and published source URL could not be accessed from the creation
session. Original chart scripts, data, and styles were not included with the
supplied HTML. A small standalone stylesheet is included instead.

The page explicitly identifies unavailable chart data and offers an email link
for data requests. No statistics have been invented. The original request form
markup is retained but hidden until its JavaScript can be restored.

## Preview

Open `index.html` in a browser. No build or package installation is required.

## Restore charts and downloads

Provide the original `js/` assets and any referenced datasets from `rod-portal`.
The original page loaded these scripts in this order:

```text
js/data/pages.js
js/data/search-index.js
js/data/settings.js
js/data/fact-finder-knowledge-base.js
js/data/dashboard-data.js
js/data/sales-data.js
js/data/glossary-terms.js
js/data-blocks.js
js/site-controller.js
js/fact-finder.js
js/exports-and-tables.js
js/resident-tools.js
js/dashboard-figures.js
js/request-data.js
```

Inspect their dependencies before restoring only the dashboard functionality.
The original `css/portal.css` is also needed to reproduce the original design.

## Publish

In repository **Settings > Pages**, choose **Deploy from a branch**, select
`main` and `/ (root)`, and save. Public publication of the preview was approved
by the user, but changing repository visibility and enabling Pages were denied
to this session's GitHub integration. If a public repository is required for your plan, change
visibility in **Settings > General > Danger Zone** first.

The preview notice and `noindex, nofollow` remain until release is approved.
