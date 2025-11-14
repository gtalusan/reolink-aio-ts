import {
  reolinkTimeToDate,
  datetimeToReolinkTime,
  toReolinkTimeId,
  stripModelStr,
  searchChannel
} from '../utils';
import type { SearchTime, ReolinkJson } from '../types';

describe('Utils', () => {
  describe('reolinkTimeToDate', () => {
    it('should convert SearchTime object to Date', () => {
      const searchTime: SearchTime = {
        year: 2023,
        mon: 11,
        day: 15,
        hour: 14,
        min: 30,
        sec: 25
      };
      const date = reolinkTimeToDate(searchTime);
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(10); // 0-indexed
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(14);
      expect(date.getUTCMinutes()).toBe(30);
      expect(date.getUTCSeconds()).toBe(25);
    });

    it('should convert time string to Date', () => {
      const timeStr = '20231115143025';
      const date = reolinkTimeToDate(timeStr);
      expect(date.getUTCFullYear()).toBe(2023);
      expect(date.getUTCMonth()).toBe(10);
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(14);
      expect(date.getUTCMinutes()).toBe(30);
      expect(date.getUTCSeconds()).toBe(25);
    });

    it('should handle timezone offset', () => {
      const searchTime: SearchTime = {
        year: 2023,
        mon: 11,
        day: 15,
        hour: 14,
        min: 30,
        sec: 25
      };
      
      const mockTzinfo = {
        utcoffset: () => 5 * 60 * 60 * 1000 // +5 hours
      };
      
      const date = reolinkTimeToDate(searchTime, mockTzinfo);
      expect(date.getUTCHours()).toBe(9); // 14 - 5 = 9
    });

    it('should throw error for invalid time string', () => {
      expect(() => reolinkTimeToDate('invalid')).toThrow('Invalid Reolink time string');
    });
  });

  describe('datetimeToReolinkTime', () => {
    it('should convert Date to Reolink time dictionary', () => {
      const date = new Date(Date.UTC(2023, 10, 15, 14, 30, 25));
      const reolinkTime = datetimeToReolinkTime(date);
      
      expect(reolinkTime.year).toBe(2023);
      expect(reolinkTime.mon).toBe(11); // 1-indexed
      expect(reolinkTime.day).toBe(15);
      expect(reolinkTime.hour).toBe(14);
      expect(reolinkTime.min).toBe(30);
      expect(reolinkTime.sec).toBe(25);
    });

    it('should convert time string to Reolink time dictionary', () => {
      const timeStr = '20231115143025';
      const reolinkTime = datetimeToReolinkTime(timeStr);
      
      expect(reolinkTime.year).toBe(2023);
      expect(reolinkTime.mon).toBe(11);
      expect(reolinkTime.day).toBe(15);
      expect(reolinkTime.hour).toBe(14);
      expect(reolinkTime.min).toBe(30);
      expect(reolinkTime.sec).toBe(25);
    });
  });

  describe('toReolinkTimeId', () => {
    it('should convert Date to time ID string', () => {
      const date = new Date(Date.UTC(2023, 10, 15, 14, 30, 25));
      const timeId = toReolinkTimeId(date);
      expect(timeId).toBe('20231115143025');
    });

    it('should convert SearchTime to time ID string', () => {
      const searchTime: SearchTime = {
        year: 2023,
        mon: 11,
        day: 15,
        hour: 14,
        min: 30,
        sec: 25
      };
      const timeId = toReolinkTimeId(searchTime);
      expect(timeId).toBe('20231115143025');
    });

    it('should pad single digit values with zeros', () => {
      const searchTime: SearchTime = {
        year: 2023,
        mon: 1,
        day: 5,
        hour: 9,
        min: 8,
        sec: 7
      };
      const timeId = toReolinkTimeId(searchTime);
      expect(timeId).toBe('20230105090807');
    });

    it('should convert time string to time ID', () => {
      const timeStr = '20231115143025';
      const timeId = toReolinkTimeId(timeStr);
      expect(timeId).toBe('20231115143025');
    });
  });

  describe('stripModelStr', () => {
    it('should remove text in regular parentheses', () => {
      expect(stripModelStr('RLC-810A (V2)')).toBe('RLC-810A');
    });

    it('should remove text in Chinese parentheses', () => {
      expect(stripModelStr('RLC-810A（V2）')).toBe('RLC-810A');
    });

    it('should remove all whitespace', () => {
      expect(stripModelStr('Model  Name  (Extra)')).toBe('ModelName');
    });

    it('should handle multiple parentheses', () => {
      expect(stripModelStr('Model (V1) (V2) Name')).toBe('ModelName');
    });

    it('should return empty string for only parentheses and spaces', () => {
      expect(stripModelStr('(Text) (More)   ')).toBe('');
    });

    it('should handle strings without parentheses', () => {
      expect(stripModelStr('SimpleModel')).toBe('SimpleModel');
    });
  });

  describe('searchChannel', () => {
    it('should find channel in param object', () => {
      const body: ReolinkJson = [
        {
          param: {
            channel: 0
          }
        }
      ];
      expect(searchChannel(body)).toBe(0);
    });

    it('should find channel in nested param object', () => {
      const body: ReolinkJson = [
        {
          param: {
            SomeData: {
              channel: 2
            }
          }
        }
      ];
      expect(searchChannel(body)).toBe(2);
    });

    it('should return null for empty array', () => {
      expect(searchChannel([])).toBeNull();
    });

    it('should return null for non-array input', () => {
      expect(searchChannel(null as any)).toBeNull();
    });

    it('should return null when channel not found', () => {
      const body: ReolinkJson = [
        {
          param: {
            otherField: 'value'
          }
        }
      ];
      expect(searchChannel(body)).toBeNull();
    });

    it('should return null when param is missing', () => {
      const body: ReolinkJson = [
        {
          otherKey: 'value'
        }
      ];
      expect(searchChannel(body)).toBeNull();
    });

    it('should handle NaN channel values', () => {
      const body: ReolinkJson = [
        {
          param: {
            channel: 'invalid'
          }
        }
      ];
      expect(searchChannel(body)).toBeNull();
    });
  });
});
