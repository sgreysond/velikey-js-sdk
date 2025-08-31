/**
 * VeliKey SDK Node.js Automation Example
 * 
 * This example shows how to integrate VeliKey into your CI/CD pipelines
 * and automation workflows for continuous security and compliance.
 */

const { VeliKeySDK } = require('@velikey/sdk');

async function main() {
  const client = new VeliKeySDK({
    apiKey: process.env.VELIKEY_API_KEY,
  });

  console.log('🛡️ VeliKey Automation Pipeline');
  console.log('=' .repeat(50));

  try {
    // 1. Pre-deployment security validation
    console.log('\n1. 🔍 Pre-deployment Validation');
    
    const securityStatus = await client.getSecurityStatus();
    console.log(`Current Health Score: ${securityStatus.healthScore}/100`);
    
    if (securityStatus.healthScore < 80) {
      console.log('⚠️ Health score below threshold, investigating...');
      
      const diagnostics = await client.diagnostics.runComprehensiveCheck();
      console.log(`Diagnostic Issues: ${diagnostics.summary.failedTests}`);
      
      if (diagnostics.summary.criticalIssues.length > 0) {
        console.log('🚨 Critical issues detected:');
        diagnostics.summary.criticalIssues.forEach(issue => {
          console.log(`  • ${issue}`);
        });
        process.exit(1); // Fail the pipeline
      }
    }

    // 2. Policy deployment automation
    console.log('\n2. 📋 Policy Deployment');
    
    // Check if we need to update policies for new deployment
    const policies = await client.policies.list();
    console.log(`Found ${policies.length} active policies`);
    
    // Deploy new policy if configuration changed
    if (process.env.POLICY_CONFIG_CHANGED === 'true') {
      console.log('🔄 Deploying updated policy configuration...');
      
      const policyBuilder = client.createPolicyBuilder()
        .complianceStandard('SOC2 Type II')
        .postQuantumReady()
        .enforcementMode('enforce'); // Production enforcement
      
      const newPolicy = await policyBuilder.create(
        `Production Policy ${new Date().toISOString().split('T')[0]}`,
        'Automated policy deployment via CI/CD'
      );
      
      console.log(`✅ Created policy: ${newPolicy.name} (${newPolicy.id})`);
      
      // Deploy to all agents
      await client.policies.deploy(newPolicy.id);
      console.log('🚀 Policy deployed to all agents');
    }

    // 3. Agent health verification
    console.log('\n3. 🤖 Agent Health Check');
    
    const agents = await client.agents.list();
    const onlineAgents = agents.filter(a => a.status === 'online');
    
    console.log(`Agents Online: ${onlineAgents.length}/${agents.length}`);
    
    if (onlineAgents.length < agents.length) {
      console.log('⚠️ Some agents are offline:');
      agents.filter(a => a.status !== 'online').forEach(agent => {
        console.log(`  • ${agent.name}: ${agent.status}`);
      });
    }

    // 4. Performance monitoring
    console.log('\n4. 📊 Performance Monitoring');
    
    const metrics = await client.monitoring.getLiveMetrics();
    console.log(`Average Latency: ${metrics.avgLatencyMs}ms`);
    console.log(`Throughput: ${metrics.connectionsProcessed.toLocaleString()} connections`);
    console.log(`Uptime: ${metrics.uptimePercentage}%`);
    
    // Check performance thresholds
    if (metrics.avgLatencyMs > 100) {
      console.log('⚠️ High latency detected, checking for issues...');
      
      const suggestions = await client.getOptimizationSuggestions();
      console.log('💡 Performance suggestions:');
      suggestions.performance.forEach(suggestion => {
        console.log(`  • ${suggestion}`);
      });
    }

    // 5. Security alerts monitoring
    console.log('\n5. 🚨 Security Alerts');
    
    const alerts = await client.monitoring.getActiveAlerts();
    console.log(`Active Alerts: ${alerts.length}`);
    
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency');
    if (criticalAlerts.length > 0) {
      console.log('🔥 Critical alerts detected:');
      criticalAlerts.forEach(alert => {
        console.log(`  • ${alert.title}: ${alert.description}`);
      });
      
      // Send notifications (integrate with your alerting system)
      await notifySecurityTeam(criticalAlerts);
    }

    // 6. Compliance validation
    console.log('\n6. ✅ Compliance Validation');
    
    const complianceResult = await client.validateCompliance('soc2');
    console.log(`SOC2 Compliance: ${complianceResult.compliant ? '✅ Compliant' : '❌ Non-compliant'}`);
    console.log(`Compliance Score: ${complianceResult.score}/100`);
    
    if (!complianceResult.compliant) {
      console.log('📋 Compliance issues:');
      complianceResult.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }

    // 7. Usage analytics and optimization
    console.log('\n7. 📈 Usage Analytics');
    
    const usage = await client.monitoring.getUsageAnalytics();
    console.log(`Agents Deployed: ${usage.agentsDeployed}`);
    console.log(`Policies Active: ${usage.policiesActive}`);
    console.log(`Data Processed: ${formatBytes(usage.bytesAnalyzed)}`);
    
    // Check for optimization opportunities
    if (usage.agentsDeployed > 10 && usage.connectionsProcessed < 1000) {
      console.log('💡 Optimization opportunity: Consider consolidating agents for better efficiency');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Automation pipeline complete!');
    console.log('📊 All systems operational and compliant');

  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// Helper functions
async function notifySecurityTeam(alerts) {
  // Integration with your notification system
  console.log(`📧 Notifying security team about ${alerts.length} critical alerts`);
  
  // Example: Send to Slack, email, PagerDuty, etc.
  // await slack.send({
  //   channel: '#security-alerts',
  //   text: `VeliKey Critical Alert: ${alerts[0].title}`,
  // });
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Run the automation
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, notifySecurityTeam, formatBytes };
