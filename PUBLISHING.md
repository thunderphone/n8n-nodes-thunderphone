# Publishing `n8n-nodes-thunderphone`

No publishing or directory submission is performed by the package build.

## Where the source lives

The canonical source is `integrations/n8n` in ThunderPhone's private monorepo. Every merge that
touches that directory is mirrored as a snapshot commit to the public repository
`https://github.com/thunderphone/n8n-nodes-thunderphone` (branch `main`). Releases are published
from the public repository so that npm can attach a provenance attestation pointing at public
source, which n8n requires for verified community nodes.

Edit the monorepo copy. Changes pushed directly to the public repository are overwritten by the
next mirror run.

## Accounts and access

- A GitHub account that can push tags to `thunderphone/n8n-nodes-thunderphone`.
- An npm account with publish rights on `n8n-nodes-thunderphone`, used once to register the
  trusted publisher.
- An n8n Creator Portal account at `https://creators.n8n.io/nodes`.
- A ThunderPhone organization admin account and server API key for live install and webhook tests.

## One-time preparation

1. Confirm the package icon still matches the official thunderbolt-only source described in
   `icons/README.md`.
2. Register the public repository's workflow as the package's npm trusted publisher (the
   `npm trust` command needs npm 11.15.0 or newer; sign in as a package maintainer):

   ```bash
   npm trust github n8n-nodes-thunderphone \
     --repo thunderphone/n8n-nodes-thunderphone --file publish.yml --allow-publish
   ```

   `npm trust list n8n-nodes-thunderphone` shows the result. Do not create a long-lived npm
   token; the workflow authenticates with GitHub OIDC only.

## Release checks

From the package root:

```bash
npm ci
npm test
npm run lint
npm run build
npm pack --dry-run
```

Then install the packed tarball into a disposable n8n instance and verify:

1. The credential test succeeds with a real server API key.
2. Agent and outbound-number dropdowns load.
3. Place Outbound Call requires a mapped stable upstream record/event ID and sends
   `n8n:<stable-node-id>:<mapped-key>`. Confirm blank and whitespace-only mapped values fail before
   an HTTP request. In the exact n8n version being submitted, induce response loss after
   ThunderPhone accepts one consenting test call and prove both recovery paths independently:
   automatic node retry and **Retry execution** from the failed execution must send the identical
   key and return the original call ID with `idempotent_replay=true`. Then prove a later legitimate
   upstream event uses a different mapped key, a second input item uses its own upstream key, and
   a second ThunderPhone node fed the original record gets a different key because its stable node
   ID differs. Retain the redacted request keys, execution IDs, node IDs, call IDs, retry mode, and
   `idempotent_replay` results. Do not publish Place Outbound Call without both lost-response
   proofs. Also record whether the node ID (and therefore the request key for the same upstream
   record) survives rename, a parameter edit, save and reopen, and what duplicate, import and
   delete-and-recreate do. If any routine edit changes the node ID, replace the automatic prefix
   with a required fixed action prefix before publishing.
4. Get Call returns call details, `transcripts`, and a signed `recording_url` when available.
5. Add Contacts and Start Campaign work against a draft campaign.
6. Activating each trigger creates one ThunderPhone webhook endpoint with the n8n Production URL.
7. The endpoint method is `POST`, valid signatures run the workflow, and invalid signatures get
   `401`.
8. Deactivating the workflow deletes the ThunderPhone webhook endpoint.
9. Confirm outbound-number options prefer `outbound_eligible` when the field exists and otherwise
   include only active VoIP numbers whose verification status is `verified` or
   `carrier_accepted`. The server remains authoritative when the call is placed.

Follow-up: enable a Call Data Extracted trigger only after the event is in the production webhook
registry and a real payload has been captured and tested.

## Publish a release

1. Add a `CHANGELOG.md` entry and bump `package.json` (and `package-lock.json`) to the approved
   version in the monorepo. Merge; the mirror workflow pushes the snapshot to the public
   repository's `main`.
2. Confirm the public `main` head carries the new version, then create and push a tag in the form
   `v<package-version>` on that commit, for example `v0.1.1`. The **Publish to npm** workflow
   (`.github/workflows/publish.yml`) fails if the tag does not match `package.json`'s version.
3. Watch the workflow. It runs the tests, lint and build, then publishes with
   `npm publish --access public --provenance`.
4. Confirm the npm page shows the expected version, repository link, README, MIT license and the
   provenance statement ("Built and signed on GitHub Actions").
5. Run `npx @n8n/scan-community-package n8n-nodes-thunderphone` against the published version
   (the scanner needs Node 22). Do not submit it to the Creator Portal if the scanner fails.
6. Install the published version in a disposable n8n instance and repeat the credential and
   trigger smoke tests.

## Submit to the n8n directory

1. Sign in to the n8n Creator Portal at `https://creators.n8n.io/nodes`.
2. Start a node submission and enter `n8n-nodes-thunderphone` as the npm package.
3. Use the listing description and three examples from `README.md`.
4. Link the public GitHub source and ThunderPhone API documentation.
5. Confirm that the package has no runtime dependencies, is MIT licensed, and passes the n8n
   linter and package scanner. State plainly whether the version carries provenance.
6. Submit for verification and keep the npm package unchanged while n8n reviews that version.

Do not state that the node is verified or listed until the Creator Portal marks the submission
approved and it is discoverable in n8n.
