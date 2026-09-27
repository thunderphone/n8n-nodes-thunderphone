# Submitting ThunderPhone templates to the n8n template library

Research date: 2026-09-25. n8n's template rules live in public Notion pages linked from the
Creator hub, and the submission form is in the Creator Portal. The form details below come
from the portal's current front end, because the form itself is only visible after sign-in.

## Sources

- Creator hub: <https://creators.n8n.io/hub>, which redirects to
  <https://n8n.notion.site/n8n-Creator-hub-7bd2cbe0fce0449198ecb23ff4a2f76f>
- Template submission guidelines: <https://n8n.notion.site/9959894476734da3b402c90b124b1f77>
- Sticky note guidelines for templates: <https://n8n.notion.site/2aa5b6e0c94f8058b0aefddd02655887>
- Workflow description template: <https://n8n.notion.site/b4c008b47eb74846b48c37c652ec2650>
- Creator Portal: <https://creators.n8n.io/login> (sign up at <https://creators.n8n.io/register>)
- Creators page: <https://n8n.io/creators/>
- Verified community nodes: <https://docs.n8n.io/integrations/community-nodes/installation-and-management/install-verified-community-nodes>
  and <https://blog.n8n.io/community-nodes-available-on-n8n-cloud/>
- ThunderPhone's verified node listing: <https://n8n.io/integrations/thunderphone/>
- Published library templates built on a verified community node (`@apify/n8n-nodes-apify`):
  <https://n8n.io/workflows/10640>, <https://n8n.io/workflows/17698>
- A creator's report of a "needs changes" verdict with no reason given:
  <https://community.n8n.io/t/template-rejected-without-explanation/154316>

## What n8n requires

### Community nodes

Templates may use community nodes. The library already publishes templates built on verified
community nodes (see the Apify examples above). The submission guidelines ask a template that
uses a community node for two extra things:

- a disclaimer that it is self-hosted only, and
- a workflow image at the top of the description, because the canvas preview does not render
  community nodes.

The self-hosted rule predates verified nodes. Verified nodes install from the nodes panel on
n8n Cloud and self-hosted alike, and ThunderPhone's node is verified, so our descriptions say
"Uses the verified ThunderPhone community node" and explain the one-time install instead. Recent
Apify templates are split: some carry a self-hosted note and some do not. If a reviewer asks
for the disclaimer, add it to **Additional info**.

### Sticky notes (mandatory)

- Exactly one main overview sticky: yellow, top-left of the canvas, 100 to 300 words, with
  `### How it works` and `### Setup` headings; `### Customization` is optional. The general
  guidelines also say to put the full description in it.
- Section stickies are required for workflows with 4 or more nodes: white (or grey in dark
  mode), under 50 words, a short `##` heading plus one or two lines, stretched over several
  nodes.
- Warning stickies are optional: red, covering one node, used sparingly.
- An optional video sticky embeds YouTube with `@[youtube](<video id>)`.

All four templates follow these rules. The overview stickies are 286 to 294 words and every
section sticky is under 50 words.

### Workflow content

- Rename every node to describe its purpose.
- No hardcoded API keys or credentials (for example in an HTTP Request node). Use credentials.
- Remove personal identifiers: spreadsheet IDs, channel IDs, real email addresses, and so on.
- Group values the user must set in a Set node. Assume the user is new to n8n.
- Be original and practical; low-effort or copied templates are rejected, and reposting someone
  else's workflow gets the account banned.

Pinned data: the guidelines say nothing explicit. The templates ship with `pinData: {}` so no
sample or real data is embedded.

### Title and description

- Title format: action verb, thing, to/on/in/from where, in sentence case, naming the main
  nodes, for example "Sync contacts from Pipedrive to HubSpot". No emojis or hype; n8n rewrites
  titles that break this.
- Clear English, Markdown only (no HTML), around 200 words.
- Suggested sections: who it is for, how it works, how to set up, requirements, how to
  customize.

The portal now enforces a structured description with these fields: **Quick overview**,
**How it works** (numbered steps), **Setup** (numbered steps), **Requirements** (list),
**Customization** (list) and **Additional info**. The submit button stays disabled until
**Quick overview** has 10 to 50 words and **How it works** and **Setup** each have at least 50
words. `README.md` has every field for all four templates, within those limits.

### Review, limits and payment

- After upload, the portal runs an automated AI review that may return feedback and a suggested
  JSON. The feedback is advisory; the template then goes to human review.
- The portal says human review typically takes 3 to 5 business days. Approval and change
  requests arrive by email, but creators report "needs changes" verdicts with no explanation, so
  check the portal dashboard too.
- A new, unverified creator can have only one template in review at a time and submits the next
  after the previous one is approved. After 3 approved templates the creator becomes verified
  and can have up to 4 in review at once.
- Templates are free by default. Only verified creators can set a price (a USD price and a
  purchase URL), and the creator is responsible for delivering paid templates.

## How to submit

A person or a signed-in agent does this in a browser. Nothing here needs a ThunderPhone key.

1. Sign in at <https://creators.n8n.io/login> with ThunderPhone's Creator Portal account, the
   one that holds the `n8n-nodes-thunderphone` node submission, so templates show ThunderPhone as
   the author. Create a creator account at <https://creators.n8n.io/register> only if that
   account cannot be used.
2. The canvas images are in `images/<template slug>.png` and are public through the mirror at
   `https://raw.githubusercontent.com/thunderphone/n8n-nodes-thunderphone/main/templates/images/<template slug>.png`.
   Recapture one after changing its template: import the JSON into an n8n instance with the
   ThunderPhone node installed and capture the whole canvas.
3. On the dashboard, choose **Submit a template**. In **Workflow JSON**, upload the template file
   (for example `log-completed-calls-to-google-sheets.json`). Leave **Price (USD)** and
   **Purchase URL** empty.
4. Wait for the AI review. If it returns feedback, apply only changes that are correct, update the
   file in this directory, and use **Upload updated workflow JSON**.
5. On **Finalize your submission**, fill in the fields from `README.md`:
   - **Title**
   - **Quick overview**: start with the canvas screenshot as a Markdown image
     (`![Workflow canvas](<public image URL>)`) on its own line, then the overview text. The
     portal writes Quick overview first, so this puts the image at the top of the description as
     n8n asks for community-node templates. Host the image at a public HTTPS URL. Keep the
     overview text within 50 words including the image line's alt text.
   - **How it works**: one step per line item
   - **Setup**: one step per line item
   - **Requirements**: one item per line
   - **Customization**: one item per line
   - **Additional info**
6. Choose **Submit for human review**.
7. Submit the next template once the previous one is approved. Suggested order: 1, 2, 3, 4. The
   read-only templates come first; the two that place calls come after the account has an
   approval on record.
8. When a template is published, record its n8n.io URL next to its row in `README.md`.

Do not describe a template as published until it is live on <https://n8n.io/workflows/>.

## What actually happened (2026-09-26)

The live portal flow was shorter than the front-end code suggested. **Share new template**
opens a dialog with the Workflow JSON upload, Pricing (Free) and the terms checkbox. **Submit
for AI review** ran the AI check (about 15 minutes for template 1). The template then went
straight to **Under review** with no feedback shown and no step for the description fields.
The listing copy therefore comes from the workflow itself, so keep the overview sticky
complete. If the portal later asks for description fields, paste them from `README.md`.

Upload the JSON with a browser tool that can set file inputs directly. Codex's Chrome extension
needs "Allow access to file URLs" for this.

## Submission log

| Template                                                                          | Submitted  | Status                                                                                            |
| --------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| Log completed ThunderPhone calls to Google Sheets                                 | 2026-09-26 | Under review (3-5 business days). Submitted with the old field set; update or resubmit, see below |
| Send Slack alerts for low-scoring ThunderPhone calls                              |            | Waiting: one template in review at a time                                                         |
| Call new leads from a webhook with a ThunderPhone AI voice agent                  |            | Waiting                                                                                           |
| Add Google Sheets contacts to a ThunderPhone campaign and start it after approval |            | Waiting                                                                                           |

### Data minimization change (2026-09-27)

Compliance review changed the templates after template 1 was submitted. The defaults no longer
copy call transcripts, summaries or detected issues out of ThunderPhone:

- Template 1 dropped the Transcript and Summary columns and the "Generate a call summary" setup
  step. The copy under review in the portal still has them.
- Template 2's Slack message now carries only the score, outcome label, agent, call ID and link.
- Every overview sticky and `README.md` entry now carries the personal and health information
  note, and templates 1 and 4 carry the Google Sheets retention note.

The portal copy of template 1 must be replaced before it is published. If the portal lets you
upload an updated JSON while the template is under review, upload the current
`log-completed-calls-to-google-sheets.json` there. Otherwise withdraw it, or wait for the review
result and choose **Implement changes**, then upload the current file. Templates 2 to 4 have
not been submitted, so submit the current files. Use the regenerated images in `images/`.
