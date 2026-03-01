# VeliKey JavaScript/TypeScript SDK

JavaScript SDK for Axis control-plane APIs used by Aegis operator workflows.

## Install

```bash
npm install @velikey/sdk

# Fallback (works immediately from public GitHub source)
npm install github:sgreysond/velikey-js-sdk#v0.2.1
```

## Authentication

Most tenant-scoped Axis endpoints require a session cookie. You can initialize with:

- `sessionCookie` (full cookie header value), or
- `sessionToken` (`next-auth.session-token` value),
- `apiKey`/`bearerToken` for API-key-compatible endpoints (not all endpoints).

```ts
import { VeliKeySDK } from '@velikey/sdk';

const sdk = new VeliKeySDK({
  baseUrl: 'https://axis.velikey.com',
  sessionToken: process.env.AXIS_SESSION_TOKEN,
});
```

## Core usage

```ts
const health = await sdk.getHealth();
const agents = await sdk.agents.list();
const policies = await sdk.policies.list({ isActive: true });
const usageSummary = await sdk.getUsageSummary();
```

## Rollout flow

```ts
const plan = await sdk.rollouts.plan({
  policyId: 'policy-id',
  canaryPercent: 5,
  stabilizationWindowS: 300,
  explain: true,
});

const planId = plan.data?.plan_id;
if (!planId) throw new Error('plan_id missing');

const apply = await sdk.rollouts.apply({
  planId,
  dryRun: true,
});

const rollbackToken = apply.data?.rollback_token;
if (rollbackToken) {
  await sdk.rollouts.rollback({ rollbackToken });
}
```

## API notes

- `rollouts.apply()` auto-populates `confirm=true` + `confirmation="APPLY"` for non-dry-run calls.
- `rollouts.rollback()` auto-populates `confirm=true` + `confirmation="ROLLBACK"`.
- Retry defaults: `maxRetries=2`, exponential backoff with jitter, and retry on `429/5xx` + transport failures.

## Development

```bash
npm ci
npm run build
npm test
```
