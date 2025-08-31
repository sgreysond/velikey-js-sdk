# VeliKey Aegis JavaScript/TypeScript SDK

[![npm version](https://badge.fury.io/js/%40velikey%2Fsdk.svg)](https://badge.fury.io/js/%40velikey%2Fsdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Quantum-safe crypto policy management for JavaScript and TypeScript applications**

## 🚀 Installation

```bash
npm install @velikey/sdk
# or
yarn add @velikey/sdk
# or
pnpm add @velikey/sdk
```

## ⚡ Quick Start

### TypeScript/ES6+

```typescript
import { VeliKeySDK } from '@velikey/sdk';

const client = new VeliKeySDK({
  apiKey: process.env.VELIKEY_API_KEY!,
});

// Quick setup
const setup = await client.quickSetup({
  complianceFramework: 'soc2',
  enforcementMode: 'observe',
  postQuantum: true,
});

console.log(`✅ Policy created: ${setup.policyName}`);

// Monitor security status
const status = await client.getSecurityStatus();
console.log(`🛡️ Health Score: ${status.healthScore}/100`);
```

### Node.js (CommonJS)

```javascript
const { VeliKeySDK } = require('@velikey/sdk');

const client = new VeliKeySDK({
  apiKey: process.env.VELIKEY_API_KEY,
});

// Async/await usage
(async () => {
  const agents = await client.agents.list();
  console.log(`Found ${agents.length} agents`);
})();
```

## ⚛️ React Integration

### Using React Hooks

```tsx
import React from 'react';
import { useVeliKey } from '@velikey/sdk';

function SecurityDashboard() {
  const { client, loading, error, execute } = useVeliKey(
    process.env.REACT_APP_VELIKEY_API_KEY!
  );
  
  const [securityStatus, setSecurityStatus] = React.useState(null);
  
  React.useEffect(() => {
    execute(async () => {
      const status = await client.getSecurityStatus();
      setSecurityStatus(status);
      return status;
    });
  }, [client, execute]);
  
  if (loading) return <div>Loading security status...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>Security Status</h2>
      <p>Health Score: {securityStatus?.healthScore}/100</p>
      <p>Agents Online: {securityStatus?.agentsOnline}</p>
      <p>Critical Alerts: {securityStatus?.criticalAlerts}</p>
    </div>
  );
}
```

### Real-time Updates

```tsx
import React from 'react';
import { VeliKeySDK } from '@velikey/sdk';

function RealTimeAlerts() {
  const [alerts, setAlerts] = React.useState([]);
  const client = React.useRef(new VeliKeySDK({ apiKey: 'your-key' }));
  
  React.useEffect(() => {
    // Subscribe to real-time alerts
    client.current.subscribeToEvents(['alert', 'agent.status']);
    
    client.current.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });
    
    client.current.on('alert:critical', (alert) => {
      // Handle critical alerts immediately
      notifySecurityTeam(alert);
    });
    
    return () => {
      client.current.unsubscribe();
    };
  }, []);
  
  return (
    <div>
      <h3>Security Alerts</h3>
      {alerts.map(alert => (
        <div key={alert.id} className={`alert ${alert.severity}`}>
          <strong>{alert.title}</strong>
          <p>{alert.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Node.js Automation

### CI/CD Integration

```javascript
// deploy-security-policies.js
const { VeliKeySDK } = require('@velikey/sdk');

async function deploySecurityPolicies() {
  const client = new VeliKeySDK({
    apiKey: process.env.VELIKEY_API_KEY,
  });

  try {
    // Validate current security posture
    const status = await client.getSecurityStatus();
    if (status.healthScore < 80) {
      throw new Error(`Health score too low: ${status.healthScore}/100`);
    }

    // Deploy updated policies
    const policyBuilder = client.createPolicyBuilder()
      .complianceStandard('SOC2 Type II')
      .postQuantumReady()
      .enforcementMode('enforce');

    const policy = await policyBuilder.create(
      'Production Security Policy',
      'Automated deployment via CI/CD'
    );

    await client.policies.deploy(policy.id);
    
    console.log('✅ Security policies deployed successfully');
    
    // Verify deployment
    const agents = await client.agents.list();
    const onlineAgents = agents.filter(a => a.status === 'online');
    
    if (onlineAgents.length < agents.length) {
      console.warn(`⚠️ ${agents.length - onlineAgents.length} agents offline`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deploySecurityPolicies();
```

### Express.js Middleware

```javascript
const express = require('express');
const { VeliKeySDK } = require('@velikey/sdk');

const app = express();
const velikey = new VeliKeySDK({ apiKey: process.env.VELIKEY_API_KEY });

// Security middleware
app.use(async (req, res, next) => {
  try {
    const status = await velikey.getSecurityStatus();
    
    // Add security headers
    res.set('X-Security-Score', status.healthScore.toString());
    res.set('X-Agents-Online', status.agentsOnline);
    
    // Block requests if critical security issues
    if (status.criticalAlerts > 0) {
      return res.status(503).json({
        error: 'Security maintenance in progress',
        healthScore: status.healthScore
      });
    }
    
    next();
  } catch (error) {
    // Fail open - don't block traffic on API errors
    next();
  }
});

app.get('/api/security/status', async (req, res) => {
  try {
    const status = await velikey.getSecurityStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎨 Advanced Usage

### Policy Builder Pattern

```typescript
import { VeliKeySDK, PolicyMode } from '@velikey/sdk';

const client = new VeliKeySDK({ apiKey: 'your-key' });

// Fluent policy building
const policy = await client.createPolicyBuilder()
  .complianceStandard('Custom Enterprise Policy')
  .aegisConfig({
    pq_ready: ['TLS_KYBER768_P256_SHA256'],
    preferred: ['TLS_AES_256_GCM_SHA384'],
    prohibited: ['TLS 1.0', 'TLS 1.1']
  })
  .somnusConfig({
    preferred: ['XChaCha20-Poly1305', 'AES-GCM-SIV-256'],
    prohibited: ['AES-ECB', 'DES', '3DES']
  })
  .enforcementMode(PolicyMode.ENFORCE)
  .create('Enterprise Security Policy');

console.log(`Created policy: ${policy.name}`);
```

### Bulk Operations

```typescript
// Bulk policy updates
const updates = [
  { policyId: 'policy-1', changes: { enforcement_mode: 'enforce' } },
  { policyId: 'policy-2', changes: { enforcement_mode: 'enforce' } },
];

const result = await client.bulkPolicyUpdate(updates);
console.log(`Updated ${result.successful} policies`);
```

### Event Streaming

```typescript
// Subscribe to real-time events
client.subscribeToEvents(['agent.*', 'policy.*', 'alert.*']);

client.on('agent.online', (event) => {
  console.log(`Agent ${event.agentId} came online`);
});

client.on('policy.deployed', (event) => {
  console.log(`Policy ${event.policyId} deployed`);
});

client.on('alert:critical', (alert) => {
  // Immediate critical alert handling
  notifyOpsTeam(alert);
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testNamePattern="Policy"
npm test -- --testNamePattern="Agent"
```

## 📖 API Reference

### Core Classes

- **`VeliKeySDK`** - Main client class
- **`AgentsResource`** - Agent management operations
- **`PoliciesResource`** - Policy management operations  
- **`MonitoringResource`** - Metrics and alerting
- **`ComplianceResource`** - Compliance validation
- **`DiagnosticsResource`** - System diagnostics

### React Hooks

- **`useVeliKey(apiKey, options)`** - Main React hook
- **`useSecurityStatus()`** - Security status monitoring
- **`useAgents()`** - Agent list management
- **`usePolicies()`** - Policy management

### Vue.js Composables

- **`useVeliKeyComposable(apiKey, options)`** - Main Vue composable
- **`useSecurityMonitoring()`** - Reactive security monitoring

## 🔗 Framework Integrations

| Framework | Integration | Documentation |
|-----------|-------------|---------------|
| **React** | Hooks + Context | [React Guide](docs/react.md) |
| **Vue.js** | Composables | [Vue Guide](docs/vue.md) |
| **Angular** | Services + RxJS | [Angular Guide](docs/angular.md) |
| **Next.js** | API Routes + SSR | [Next.js Guide](docs/nextjs.md) |
| **Express** | Middleware | [Express Guide](docs/express.md) |
| **NestJS** | Modules + Guards | [NestJS Guide](docs/nestjs.md) |

## 🛟 Support

- **Documentation**: [docs.velikey.com/sdk/javascript](https://docs.velikey.com/sdk/javascript)
- **GitHub Issues**: [github.com/velikey/velikey-js-sdk/issues](https://github.com/velikey/velikey-js-sdk/issues)
- **Discord**: [discord.gg/velikey](https://discord.gg/velikey)
- **Email**: [sdk-support@velikey.com](mailto:sdk-support@velikey.com)
