# Reading Netlify function logs

Use this when a deploy preview returns 502 with
`{"errorType":"Error","errorMessage":"An unknown error has occurred"}`. That body means the
function process died, so the log is the only place the real error appears.

The CLI needs a logged-in account and a linked site. If `npx netlify status` shows no user, ask
Jimmy to run `! npx netlify login`, since it opens a browser. The site ID is
`1fb9ad3c-9c4b-4783-9ef8-7af1eb3daf8d`, and `npx netlify link --id <site-id>` links a checkout.

`--url` accepts a deploy permalink, not the `deploy-preview-N` subdomain:

```sh
# 1. The ready deploy for your branch
npx netlify api listSiteDeploys \
  --data '{"site_id":"1fb9ad3c-9c4b-4783-9ef8-7af1eb3daf8d","per_page":5}'

# 2. Trigger the failing request, then read the log for that deploy
npx netlify logs --url https://<deploy-id>--jimmyvanveencom.netlify.app \
  --source functions --since 10m
```

Minified dependencies print whole bundles into the log. Grep for `Error`, `ENOENT`, `Aborted`,
or `RuntimeError` instead of reading it end to end.

`netlify build`, `netlify serve`, and a local `zip-it-and-ship-it` run can't reproduce the
function here: all three crash in `@typescript-eslint/typescript-estree` against TypeScript 7.
The log is the reliable view of the runtime.
