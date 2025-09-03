import { MultiDeviceManager, DeviceLinkRequest } from '../src/multidevice';

describe('MultiDeviceManager', () => {
  let manager: MultiDeviceManager;

  beforeEach(() => {
    manager = new MultiDeviceManager();
  });

  describe('Recovery Code', () => {
    it('should generate recovery code in correct format', () => {
      const code = manager.generateRecoveryCode();
      expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should validate correct recovery code', () => {
      const code = manager.generateRecoveryCode();
      expect(manager.validateRecoveryCode(code)).toBe(true);
    });

    it('should reject incorrect recovery code', () => {
      manager.generateRecoveryCode();
      expect(manager.validateRecoveryCode('XXXX-XXXX-XXXX-XXXX-XXXX-XXXX')).toBe(false);
    });

    it('should reject used recovery code', () => {
      const code = manager.generateRecoveryCode();
      const request: DeviceLinkRequest = {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      };

      // First use should succeed
      const device = manager.linkDevice(code, request);
      expect(device).not.toBeNull();

      // Second use should fail
      expect(manager.validateRecoveryCode(code)).toBe(false);
    });

    it('should reject expired recovery code', () => {
      const code = manager.generateRecoveryCode();
      
      // Mock time to 25 hours later
      const originalDate = Date.now;
      Date.now = jest.fn(() => originalDate() + 25 * 60 * 60 * 1000);

      expect(manager.validateRecoveryCode(code)).toBe(false);

      Date.now = originalDate;
    });
  });

  describe('Device Linking', () => {
    it('should link device with valid recovery code', () => {
      const code = manager.generateRecoveryCode();
      const request: DeviceLinkRequest = {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
        attestation: 'attest1',
      };

      const device = manager.linkDevice(code, request);
      expect(device).not.toBeNull();
      expect(device?.deviceId).toBe('device1');
      expect(device?.deviceName).toBe('iPhone 15');
      expect(device?.publicKey).toBe('pubkey1');
    });

    it('should reject device link with invalid code', () => {
      manager.generateRecoveryCode();
      const request: DeviceLinkRequest = {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      };

      const device = manager.linkDevice('INVALID-CODE', request);
      expect(device).toBeNull();
    });

    it('should list linked devices', () => {
      const code1 = manager.generateRecoveryCode();
      manager.linkDevice(code1, {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      });

      const code2 = manager.generateRecoveryCode();
      manager.linkDevice(code2, {
        deviceId: 'device2',
        deviceName: 'iPad Pro',
        publicKey: 'pubkey2',
      });

      const devices = manager.getLinkedDevices();
      expect(devices).toHaveLength(2);
      expect(devices.map(d => d.deviceId)).toContain('device1');
      expect(devices.map(d => d.deviceId)).toContain('device2');
    });

    it('should unlink device', () => {
      const code = manager.generateRecoveryCode();
      manager.linkDevice(code, {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      });

      expect(manager.getLinkedDevices()).toHaveLength(1);
      
      const result = manager.unlinkDevice('device1');
      expect(result).toBe(true);
      expect(manager.getLinkedDevices()).toHaveLength(0);
    });

    it('should update device activity', () => {
      const code = manager.generateRecoveryCode();
      const device = manager.linkDevice(code, {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      });

      expect(device?.lastSeen).toBeUndefined();

      manager.updateDeviceActivity('device1');
      const devices = manager.getLinkedDevices();
      expect(devices[0].lastSeen).toBeDefined();
    });
  });

  describe('Mailbox Management', () => {
    it('should set and get sync mailbox', () => {
      manager.setSyncMailbox('sync_mbox_123');
      expect(manager.getSyncMailbox()).toBe('sync_mbox_123');
    });

    it('should set and get device mailbox', () => {
      const code = manager.generateRecoveryCode();
      manager.linkDevice(code, {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      });

      manager.setDeviceMailbox('device1', 'device_mbox_456');
      expect(manager.getDeviceMailbox('device1')).toBe('device_mbox_456');
    });

    it('should return undefined for unknown device mailbox', () => {
      expect(manager.getDeviceMailbox('unknown')).toBeUndefined();
    });
  });

  describe('State Export/Import', () => {
    it('should export and import state', () => {
      const code = manager.generateRecoveryCode();
      manager.linkDevice(code, {
        deviceId: 'device1',
        deviceName: 'iPhone 15',
        publicKey: 'pubkey1',
      });
      manager.setSyncMailbox('sync_mbox_123');
      manager.setDeviceMailbox('device1', 'device_mbox_456');

      const state = manager.exportState();
      
      // Create new manager and import state
      const newManager = new MultiDeviceManager();
      newManager.importState(state);

      expect(newManager.getLinkedDevices()).toHaveLength(1);
      expect(newManager.getSyncMailbox()).toBe('sync_mbox_123');
      expect(newManager.getDeviceMailbox('device1')).toBe('device_mbox_456');
    });
  });
});
