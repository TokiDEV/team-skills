// Building the page object and injecting it into template.html.
const crypto = require('crypto');

// Both pages keep the briefs: the evidence pane shows how each option gets done, which weighs on the choice.
function buildPage({ data, items, outcome, preset, channels, share: SHARE }) {
  const page = { kind: data.kind, title: data.title, date: data.date, source: data.source, summary: data.summary, outcome, figures: data.figures || [], items };
  if (SHARE) {
    Object.assign(page, { mode: 'share', lang: data.lang || 'en', preamble: data.preamble }, preset ? { preset } : {});
    delete page.source; // a path in the sharer's repo
  }
  // Content hash: saved browser state is keyed by it, so an edited gate starts with fresh decisions.
  page._rev = crypto.createHash('sha1').update(JSON.stringify(page)).digest('hex').slice(0, 12);
  if (channels) page.channels = channels; // after _rev: channel detection must not reset saved choices
  return page;
}

function renderHtml(page, template, { share: SHARE, artifact: ARTIFACT, title }) {
  // Escape "<" so "</script>" or "<!--" inside the data cannot break out of the script element.
  const json = JSON.stringify(page).replace(/</g, '\\u003c');
  let html = template.replace('<!--CEO_DATA-->', () => `<script type="application/json" id="ceo-data">${json}</script>`);
  if (SHARE) html = ARTIFACT ? artifactShape(html, title) : titled(html, title);
  return html;
}

// The share page names the gate in its <title>: the reader's tab, or the Artifact gallery, shows it.
function titled(html, title) {
  const esc = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc}</title>`);
}

// An Artifact wraps the page in its own document: drop ours.
function artifactShape(html, title) {
  return titled(html, title)
    .replace(/<!doctype html>\s*/i, '')
    .replace(/<meta [^>]*>\s*/gi, '')
    .replace(/<\/?(?:html|head|body)\b[^>]*>\s*/gi, '');
}

module.exports = { buildPage, renderHtml };
