import {
  decryptBaichuan,
  encryptBaichuan,
  md5StrModern,
  XML_KEY,
  AES_IV,
  HEADER_MAGIC,
  DEFAULT_BC_PORT,
  EncType,
  PortType
} from '../baichuan/util';
import { InvalidParameterError } from '../exceptions';

describe('Baichuan Utilities', () => {
  describe('Constants', () => {
    it('should have correct default port', () => {
      expect(DEFAULT_BC_PORT).toBe(9000);
    });

    it('should have correct header magic', () => {
      expect(HEADER_MAGIC).toBe('f0debc0a');
    });

    it('should have XML encryption key', () => {
      expect(XML_KEY).toEqual([0x1f, 0x2d, 0x3c, 0x4b, 0x5a, 0x69, 0x78, 0xff]);
    });

    it('should have AES IV', () => {
      expect(AES_IV.toString('utf8')).toBe('0123456789abcdef');
    });
  });

  describe('Enums', () => {
    it('should have encryption types', () => {
      expect(EncType.BC).toBe('bc');
      expect(EncType.AES).toBe('aes');
    });

    it('should have port types', () => {
      expect(PortType.http).toBe('http');
      expect(PortType.https).toBe('https');
      expect(PortType.rtmp).toBe('rtmp');
      expect(PortType.rtsp).toBe('rtsp');
      expect(PortType.onvif).toBe('onvif');
    });
  });

  describe('encryptBaichuan', () => {
    it('should encrypt simple string', () => {
      const input = 'test';
      const encrypted = encryptBaichuan(input, 0);
      
      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBe(input.length);
      
      // Each byte should be different from original after XOR
      const originalBuffer = Buffer.from(input, 'utf8');
      for (let i = 0; i < input.length; i++) {
        expect(encrypted[i]).not.toBe(originalBuffer[i]);
      }
    });

    it('should encrypt with different offset', () => {
      const input = 'test';
      const encrypted1 = encryptBaichuan(input, 0);
      const encrypted2 = encryptBaichuan(input, 10);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should throw error for offset > 255', () => {
      expect(() => encryptBaichuan('test', 256)).toThrow(InvalidParameterError);
      expect(() => encryptBaichuan('test', 1000)).toThrow(InvalidParameterError);
    });

    it('should handle empty string', () => {
      const encrypted = encryptBaichuan('', 0);
      expect(encrypted.length).toBe(0);
    });

    it('should handle special characters', () => {
      const input = '<?xml version="1.0"?>';
      const encrypted = encryptBaichuan(input, 0);
      expect(encrypted.length).toBe(input.length);
    });

    it('should be consistent for same input and offset', () => {
      const input = 'consistent test';
      const encrypted1 = encryptBaichuan(input, 42);
      const encrypted2 = encryptBaichuan(input, 42);
      expect(encrypted1).toEqual(encrypted2);
    });
  });

  describe('decryptBaichuan', () => {
    it('should decrypt encrypted buffer', () => {
      const original = 'test message';
      const encrypted = encryptBaichuan(original, 0);
      const decrypted = decryptBaichuan(encrypted, 0);
      
      expect(decrypted).toBe(original);
    });

    it('should decrypt with matching offset', () => {
      const original = 'test message';
      const offset = 42;
      const encrypted = encryptBaichuan(original, offset);
      const decrypted = decryptBaichuan(encrypted, offset);
      
      expect(decrypted).toBe(original);
    });

    it('should fail with mismatched offset', () => {
      const original = 'test message';
      const encrypted = encryptBaichuan(original, 10);
      const decrypted = decryptBaichuan(encrypted, 20); // Wrong offset
      
      expect(decrypted).not.toBe(original);
    });

    it('should handle empty buffer', () => {
      const decrypted = decryptBaichuan(Buffer.alloc(0), 0);
      expect(decrypted).toBe('');
    });

    it('should handle XML data', () => {
      const xml = '<?xml version="1.0"?><root><data>value</data></root>';
      const encrypted = encryptBaichuan(xml, 0);
      const decrypted = decryptBaichuan(encrypted, 0);
      expect(decrypted).toBe(xml);
    });

    it('should handle offset modulo 256', () => {
      const original = 'test';
      const encrypted = encryptBaichuan(original, 10);
      const decrypted = decryptBaichuan(encrypted, 266); // 266 % 256 = 10
      expect(decrypted).toBe(original);
    });

    it('should round-trip with various offsets', () => {
      const original = 'round trip test with special chars: !@#$%^&*()';
      const offsets = [0, 1, 42, 100, 200, 255];
      
      offsets.forEach(offset => {
        const encrypted = encryptBaichuan(original, offset);
        const decrypted = decryptBaichuan(encrypted, offset);
        expect(decrypted).toBe(original);
      });
    });
  });

  describe('md5StrModern', () => {
    it('should generate MD5 hash', () => {
      const hash = md5StrModern('test');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(31); // Truncated to 31 chars
    });

    it('should generate consistent hash for same input', () => {
      const input = 'password123';
      const hash1 = md5StrModern(input);
      const hash2 = md5StrModern(input);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different inputs', () => {
      const hash1 = md5StrModern('password1');
      const hash2 = md5StrModern('password2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return uppercase hash', () => {
      const hash = md5StrModern('test');
      expect(hash).toBe(hash.toUpperCase());
      expect(/^[A-F0-9]+$/.test(hash)).toBe(true);
    });

    it('should truncate to 31 characters', () => {
      const hash = md5StrModern('any string');
      expect(hash.length).toBe(31);
    });

    it('should handle empty string', () => {
      const hash = md5StrModern('');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(31);
    });

    it('should handle special characters', () => {
      const hash = md5StrModern('user:password!@#$%');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(31);
      expect(/^[A-F0-9]+$/.test(hash)).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const hash = md5StrModern('测试中文');
      expect(hash).toBeDefined();
      expect(hash.length).toBe(31);
    });

    it('should produce different hashes for case-sensitive inputs', () => {
      const hash1 = md5StrModern('Password');
      const hash2 = md5StrModern('password');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Encryption/Decryption Integration', () => {
    it('should encrypt and decrypt complex XML', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<body>
  <AudioAlarmPlay version="1.1">
    <channelId>0</channelId>
    <manual>0</manual>
  </AudioAlarmPlay>
</body>`;
      
      const offset = 123;
      const encrypted = encryptBaichuan(xml, offset);
      const decrypted = decryptBaichuan(encrypted, offset);
      
      expect(decrypted).toBe(xml);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const offset = 200;
      const encrypted = encryptBaichuan(longMessage, offset);
      const decrypted = decryptBaichuan(encrypted, offset);
      
      expect(decrypted).toBe(longMessage);
      expect(encrypted.length).toBe(longMessage.length);
    });

    it('should preserve exact byte length', () => {
      const inputs = ['a', 'test', '<?xml?>', 'long string with spaces and punctuation!'];
      
      inputs.forEach(input => {
        const encrypted = encryptBaichuan(input, 0);
        expect(encrypted.length).toBe(input.length);
      });
    });
  });
});
