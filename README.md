# Recording Activity Dashboard

Standalone dashboard extracted from the Davidson County Register of Deeds
portal. It retains the original branded header, footer, dashboard styles,
figures, exports, a standalone data request page, and provided data. Portal navigation
and other pages are not included.

**Live dashboard:** [https://victorialovefranklin.github.io/rod-dashboard/](https://victorialovefranklin.github.io/rod-dashboard/)

Open `index.html` in a browser or serve the repository as a static site. The
data files are `js/data/dashboard-data.js` and `js/data/sales-data.js`.
The included source data was downloaded September 17, 2026; it is not
automatically updated.

The original preview notice and `noindex, nofollow` are retained because the
source identifies the site as awaiting leadership approval.

The data request form is a separate page, `request-data.html`. It opens the
user's email application; it does not send email directly. PDF exports use the
browser's print-to-PDF function.

**Live data request page:** [https://victorialovefranklin.github.io/rod-dashboard/request-data.html](https://victorialovefranklin.github.io/rod-dashboard/request-data.html)

The figure buttons below the hero link to each figure, and a back-to-top
button remains in the lower-left corner. Smooth scrolling and the header's
parallax effect are disabled when the visitor requests reduced motion.
