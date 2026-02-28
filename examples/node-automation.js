const { VeliKeySDK } = require('@velikey/sdk');

async function main() {
  const sdk = new VeliKeySDK({
    baseUrl: process.env.AXIS_BASE_URL || 'https://axis.velikey.com',
    sessionCookie: process.env.AXIS_SESSION_COOKIE,
  });

  const health = await sdk.getHealth();
  console.log('health:', health.status || 'unknown');

  const policies = await sdk.policies.list({ isActive: true });
  console.log(`active policies: ${policies.length}`);
  if (policies.length === 0) {
    console.log('no active policy available for rollout planning');
    return;
  }

  const plan = await sdk.rollouts.plan({
    policyId: policies[0].id,
    canaryPercent: 5,
    stabilizationWindowS: 300,
    explain: true,
  });
  console.log('plan response:', plan);

  const planId = plan?.data?.plan_id;
  if (!planId) {
    console.log('plan_id missing; skipping apply');
    return;
  }

  const apply = await sdk.rollouts.apply({
    planId,
    dryRun: true,
  });
  console.log('apply response:', apply);

  const usageSummary = await sdk.getUsageSummary();
  console.log('usage summary totalUsd:', usageSummary?.costs?.totalUsd ?? 'n/a');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main };
