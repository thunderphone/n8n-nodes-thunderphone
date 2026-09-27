# ThunderPhone n8n workflow templates

Four workflow templates for the n8n template library, built on the verified
`n8n-nodes-thunderphone` node. Each JSON file is a complete n8n workflow export: import it
from the editor (**Import from file**) or upload it in the Creator Portal. See
[`SUBMITTING.md`](SUBMITTING.md) for n8n's rules and the submission steps.

| File                                                                                                             | Title                                                                             |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`log-completed-calls-to-google-sheets.json`](log-completed-calls-to-google-sheets.json)                         | Log completed ThunderPhone calls to Google Sheets                                 |
| [`alert-slack-on-low-call-grades.json`](alert-slack-on-low-call-grades.json)                                     | Send Slack alerts for low-scoring ThunderPhone calls                              |
| [`call-new-leads-from-webhook.json`](call-new-leads-from-webhook.json)                                           | Call new leads from a webhook with a ThunderPhone AI voice agent                  |
| [`google-sheets-contacts-to-campaign-with-approval.json`](google-sheets-contacts-to-campaign-with-approval.json) | Add Google Sheets contacts to a ThunderPhone campaign and start it after approval |

The files carry no credentials, credential IDs, spreadsheet IDs, channel IDs or pinned data.
The user picks each of those after import.

By default no template copies call transcripts, summaries or grader notes into another app.
Template 1 writes call metadata and a dashboard link, template 2 posts the score, outcome,
agent and link, and template 4 sends only `phone_number`, `lead_id` and `first_name`.

The descriptions below follow the Creator Portal's structured form. Paste each section into
the field with the same name. The portal requires 10 to 50 words in **Quick overview** and at
least 50 words each in **How it works** and **Setup**; every description below meets those
limits. Each workflow's yellow overview sticky carries a shorter version of its description.

---

## 1. Log completed ThunderPhone calls to Google Sheets

**Title:** Log completed ThunderPhone calls to Google Sheets

### Quick overview

Keep a running log of every call your ThunderPhone AI voice agents handle. Each finished phone
or web call becomes one Google Sheets row with the caller, duration, end reason and a link to
the call. Transcripts and summaries are not written to the sheet.

### How it works

1. The ThunderPhone Trigger starts the workflow from ThunderPhone's signed call-completed webhook. It registers the webhook when you publish the workflow and removes it when you unpublish, and it rejects requests without a valid signature.
2. Get call details reads the stored call record.
3. Skip test calls drops calls made from the agent builder.
4. Format sheet row keeps only the call ID, start time, direction, From and To numbers, agent, duration, status, end reason and dashboard link, and the Google Sheets node appends the row.

### Setup

1. Install the verified ThunderPhone node (`n8n-nodes-thunderphone`) from the nodes panel. An instance owner or admin does this once.
2. In ThunderPhone, open Organization > Keys, create a server API key and save it in n8n as a ThunderPhone API credential. The key's user needs the admin or owner role so the trigger can register its webhook.
3. Create a spreadsheet with a tab named `Calls` and this header row: Call ID, Started at, Direction, From, To, Agent, Duration (s), Status, End reason, Call link.
4. Connect Google Sheets and pick the spreadsheet, then publish the workflow.

### Requirements

- A ThunderPhone account with a server API key whose user is an organization admin or owner
- An n8n instance that ThunderPhone can reach over public HTTPS
- A Google account with Google Sheets

### Customization

- Add or remove columns in Format sheet row.
- To add the transcript or summary, add a field in Format sheet row from the call record's `transcripts` or `summary` and a matching sheet column. A summary exists only when the agent has Generate a call summary turned on under Data to collect. Read Additional info first.
- Call grades and outcomes arrive after the call-completed event, so they are not in this row. Use the Call Graded trigger to record them separately.
- Replace Google Sheets with Airtable, Notion or your CRM.
- Recording links from ThunderPhone expire, so the sheet stores the dashboard link. Download the recording in the workflow if you need to keep it.

### Additional info

Uses the verified ThunderPhone community node. ThunderPhone sends the webhook with `POST` to
the trigger's Production URL, so the workflow must be published for rows to appear.

Call transcripts and summaries can contain personal or health information. Add them only if your organization is allowed to store that data in the connected app, and under a BAA where health information is involved. Rows you copy into Google Sheets stay there until you delete them. Set a retention rule that fits your data. n8n also saves each execution's input, which includes ThunderPhone's full webhook payload. Set how long n8n keeps execution data, or turn off saving successful executions in the workflow settings.

---

## 2. Send Slack alerts for low-scoring ThunderPhone calls

**Title:** Send Slack alerts for low-scoring ThunderPhone calls

### Quick overview

Catch bad calls the same day. When ThunderPhone grades a call below your threshold, this
workflow posts the score, outcome, agent and a link to the call in Slack so a teammate can
review it in ThunderPhone.

### How it works

1. The ThunderPhone Trigger starts the workflow from ThunderPhone's signed call-graded webhook. It registers the webhook when you publish the workflow and removes it when you unpublish.
2. Settings holds the score threshold, from 0 to 100.
3. Score below threshold? passes only calls that have a numeric score under the threshold.
4. Post alert to Slack sends a message with only the score, outcome label, agent, call ID and a link to the call in the ThunderPhone dashboard. It carries no transcript, summary, grader notes or caller details.

### Setup

1. Install the verified ThunderPhone node (`n8n-nodes-thunderphone`) from the nodes panel. An instance owner or admin does this once.
2. In ThunderPhone, open Organization > Keys, create a server API key and save it in n8n as a ThunderPhone API credential. The key's user needs the admin or owner role so the trigger can register its webhook.
3. Set `scoreThreshold` in Settings. The default is 70.
4. Connect Slack, pick the channel for alerts, and publish the workflow.

### Requirements

- A ThunderPhone account with a server API key whose user is an organization admin or owner
- An n8n instance that ThunderPhone can reach over public HTTPS
- A Slack workspace where you can add the n8n app to a channel

### Customization

- A call can be graded more than once: a fast first grade is often followed by a full grade. To alert only on the full grade, add a condition on `data.grade.grader_model`.
- Test and simulation calls are graded too, so they can alert. To skip them, add a ThunderPhone Get call step and filter on `is_test_call` and `is_simulation`.
- Alert on the outcome instead of the score, for example `data.grade.call_outcome` equals `failure`.
- The grade also carries a summary and detected issues. Add them to the message only after reading Additional info.
- Swap Slack for email, Microsoft Teams or a ticketing tool.

### Additional info

Uses the verified ThunderPhone community node. ThunderPhone grades a call after it ends.

Call transcripts and summaries can contain personal or health information. Add them only if your organization is allowed to store that data in the connected app, and under a BAA where health information is involved. Slack keeps messages under your workspace's retention settings. Outcome labels come from the list your team sets under Reporting in the agent builder, so keep health conditions out of them. n8n also saves each execution's input, which includes ThunderPhone's full webhook payload. Set how long n8n keeps execution data, or turn off saving successful executions in the workflow settings.

---

## 3. Call new leads from a webhook with a ThunderPhone AI voice agent

**Title:** Call new leads from a webhook with a ThunderPhone AI voice agent

### Quick overview

Call every new lead within seconds. When your form, CRM or landing page posts a lead to this
workflow, a ThunderPhone AI voice agent calls them. Leads without an ID, a phone number or
recorded consent are skipped.

### How it works

1. The Webhook node receives an authenticated POST such as `{"lead_id": "crm-10482", "phone": "+14155550199", "first_name": "Jamie", "consent_to_call": true}`.
2. Map lead fields picks the lead ID, phone number, first name and consent flag.
3. Ready to call? stops any lead that is missing an ID, a phone number or consent.
4. Place outbound call calls the lead with your saved ThunderPhone agent and passes the first name as an agent variable. The lead ID, combined with this node's ID, is the call's idempotency key, so an automatic retry, a re-run of a failed execution or a repeated webhook for the same lead returns the original call instead of dialing again.

### Setup

1. Install the verified ThunderPhone node (`n8n-nodes-thunderphone`) from the nodes panel. An instance owner or admin does this once.
2. In ThunderPhone, open Organization > Keys, create a server API key and save it in n8n as a ThunderPhone API credential.
3. In ThunderPhone, set up an agent and an outbound-enabled From Number, and have an organization admin complete the one-time outbound calling confirmation.
4. Pick the agent and From Number in Place outbound call.
5. Add a Header Auth credential to the Webhook node, send that header from your lead source to the Production URL, and publish the workflow.

### Requirements

- A ThunderPhone account with a saved agent, an outbound-enabled From Number and credits
- A lead source that can send a webhook with a stable lead ID
- Consent to call each lead

### Customization

- Match Map lead fields to your source's field names. Map `lead_id` to a stable record ID from the lead source, never a timestamp, random value or n8n execution ID.
- A lead ID is reserved for the life of its call record, so each lead is called once per Place outbound call node. A duplicated or re-imported copy of the workflow can get new node IDs and then calls the same lead again. To call a lead again on purpose for a new event, map an event ID instead.
- Pass more agent variables, such as the product the lead asked about.

### Additional info

Uses the verified ThunderPhone community node. The call is real and spends ThunderPhone
credits. Your organization is responsible for having consent to call each number and for
following the calling laws that apply.

Call transcripts and summaries can contain personal or health information. Add them only if your organization is allowed to store that data in the connected app, and under a BAA where health information is involved.

---

## 4. Add Google Sheets contacts to a ThunderPhone campaign and start it after approval

**Title:** Add Google Sheets contacts to a ThunderPhone campaign and start it after approval

### Quick overview

Load a call list from Google Sheets into an empty draft ThunderPhone campaign, check how many
contacts were accepted, and start the campaign only after someone approves it in a form.

### How it works

1. Settings holds the ID of a draft campaign you created in ThunderPhone. Get campaign reads it, and Empty draft? stops the run with an error unless the campaign is a draft with no contacts. ThunderPhone keeps every contact you add, so this check keeps a re-run from adding the list twice.
2. Read contact rows loads the sheet, and Keep rows with consent keeps only rows with a phone number and `yes` in `consent_to_call`.
3. Map contact fields sends only `phone_number`, `lead_id` and `first_name`; other sheet columns never leave n8n. `lead_id` and `first_name` become call variables for the agent. Remove duplicate numbers drops repeated phone numbers, and Build contact list makes one list.
4. Add contacts to draft campaign uploads the list and reports how many contacts ThunderPhone accepted and rejected.
5. Approve campaign start shows those counts in a form and waits up to 24 hours for a decision. Start campaign runs only when the approver chooses to start.

### Setup

1. Install the verified ThunderPhone node (`n8n-nodes-thunderphone`) from the nodes panel. An instance owner or admin does this once.
2. In ThunderPhone, open Organization > Keys, create a server API key and save it in n8n as a ThunderPhone API credential. The key's user needs the admin or owner role to add contacts and start campaigns. Select the same credential in Get campaign.
3. In ThunderPhone, create a campaign with an agent and an outbound-enabled From Number, leave it in Draft with no contacts, and paste its ID into Settings. An organization admin must have completed the one-time outbound calling confirmation.
4. Create a tab named `Contacts` with columns `lead_id`, `phone_number` in E.164 format, `first_name` and `consent_to_call`, then connect Google Sheets and pick the spreadsheet.
5. Read the confirmation in Start campaign and turn it on. It is off in the template so nobody starts a campaign by accident.

### Requirements

- A ThunderPhone account with a saved agent, an outbound-enabled From Number, an empty draft campaign and credits
- A server API key whose user is an organization admin or owner
- A Google account with Google Sheets
- Consent to call each contact

### Customization

- Add columns to Map contact fields to pass more call variables to the agent.
- ThunderPhone accepts at most 5,000 contacts per request. Split larger lists across several draft campaigns.
- Send the approval link (`$execution.resumeFormUrl`) to an approver by email or Slack, or replace the form with Slack's or Gmail's "send and wait for approval" operation.

### Additional info

Uses the verified ThunderPhone community node. If Start campaign fails after the contacts were
added, or the approver chooses not to start, start the campaign from the ThunderPhone dashboard
when ready. Re-running the workflow stops at the draft check instead of adding the contacts
again. Your organization is responsible for having consent to call each number and for following
the calling laws that apply.

Call transcripts and summaries can contain personal or health information. Add them only if your organization is allowed to store that data in the connected app, and under a BAA where health information is involved. Rows you copy into Google Sheets stay there until you delete them. Set a retention rule that fits your data.
