# n8n-nodes-thunderphone

An n8n community node package for ThunderPhone.

Source: this repository, `https://github.com/thunderphone/n8n-nodes-thunderphone`, is a mirror of the
`integrations/n8n` directory in ThunderPhone's monorepo, where the code is maintained. Issues and
pull requests are welcome here; accepted changes are applied in the monorepo and mirrored back, so
`main` is never committed to directly.

## Webhook URL requirement

> **Use the Production URL. ThunderPhone sends webhook requests with method `POST`.**
>
> Do not register n8n's Test URL in ThunderPhone. Test URLs are temporary and may not be
> listening after the manual test window closes. A Test URL configured for `GET` will return
> `404` because ThunderPhone delivers signed JSON with `POST`.

The ThunderPhone Trigger registers its own endpoint when an n8n workflow is activated. It uses
the node's Production URL, stores the signing secret in n8n workflow static data, verifies every
`X-ThunderPhone-Signature` HMAC against the raw request body, and deletes the endpoint when the
workflow is deactivated.

## Nodes

### ThunderPhone

- Place Outbound Call with a saved agent, from number, destination, and variables. The node
  requires an upstream-stable idempotency key, such as the CRM record/event ID that caused the
  run. It rejects a blank key and sends `n8n:<stable-node-id>:<mapped-key>`, so automatic retries
  and **Retry execution** reuse the same key while two call nodes do not collide. Do not map a
  timestamp, random value, n8n execution ID, or workflow ID; those values can place a second real
  call after a lost response.
- Get Call with the transcript and a short-lived recording URL when a recording exists.
- Add Contacts to Campaign and Start Campaign.
- Find Call by ID.
- List Agents and List Phone Numbers. The same endpoints populate the agent and outbound-number
  dropdowns.

Outbound calls and campaign starts place real calls and spend ThunderPhone credits. ThunderPhone
also requires the organization's one-time outbound calling compliance confirmation before either
operation can run.

### ThunderPhone Trigger

- Call Completed: subscribes to `telephony.complete` and `web.complete`.
- Call Graded: subscribes to `call.graded`.

Trigger output is the complete webhook envelope. Optional fields are not reshaped or discarded.

ThunderPhone does not currently publish a Campaign Finished webhook event, so this package does
not offer that trigger.

## Credentials

1. In ThunderPhone, open **Organization > Keys**.
2. Create a server API key and copy the `sk_live_...` value when it is shown.
3. In n8n, create a **ThunderPhone API** credential and paste the key.
4. Run the credential test.

The credential test calls `GET https://api.thunderphone.com/v1/calls?limit=1` so this package can
land before or after the planned identity endpoint without breaking existing credentials.

Creating and deleting webhook endpoints requires that the user associated with the API key have
an admin or owner role in the ThunderPhone organization.

## Installation

After the package is published, install `n8n-nodes-thunderphone` from **Settings > Community
Nodes** in n8n. Review community-node risks and your instance policy before installation.

## Local development

Node.js 22 or later is recommended.

```bash
npm install
npm test
npm run lint
npm run build
npm run dev
```

`npm run dev` starts a local n8n development instance with the package loaded. Use a tunnel or an
internet-reachable HTTPS n8n instance for end-to-end webhook testing. Activate the workflow and
let the trigger register its Production URL.

Unit tests run offline. HTTP calls are mocked.

## Listing description

Connect n8n to ThunderPhone's voice AI API. Place retry-safe outbound calls from stable upstream
record IDs, add contacts to campaigns, retrieve call records, and start workflows from signed call
webhooks.

Example automations:

- Add a CRM contact to a ThunderPhone campaign, then start the campaign after an approval step.
- Save a completed call's transcript and recording link to the matching customer record.
- Route low call grades to a review queue with the call ID and grade details.

## Icon

The node uses a package-sized copy of ThunderPhone's official thunderbolt-only brand asset. See
[`icons/README.md`](icons/README.md). Do not draw, trace, or use a generic bolt as a substitute.

## Publishing

See [`PUBLISHING.md`](PUBLISHING.md). Releases are published from this repository's GitHub
Actions with npm provenance; directory submission is a human step.

## License

MIT
