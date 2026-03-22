import { describe, it, expect } from 'vitest'
import { detectContentType, RATE_CONFIG, DEFAULT_ROLE_MULTIPLIERS, DEFAULT_BALANCE, DAILY_LIMIT } from '../shared/config.js'

describe('config.js', () => {
  describe('detectContentType', () => {
    it('should return "default" for empty text', () => {
      expect(detectContentType('')).toBe('default')
      expect(detectContentType(null)).toBe('default')
    })

    it('should detect nonsense content', () => {
      expect(detectContentType('啊')).toBe('nonsense')
      expect(detectContentType('嗯')).toBe('nonsense')
      expect(detectContentType('这个')).toBe('nonsense')
      expect(detectContentType('然后那个')).toBe('nonsense')
    })

    it('should detect deep content', () => {
      expect(detectContentType('思考人生')).toBe('deep')
    })

    it('should detect emotional content', () => {
      expect(detectContentType('安慰一下')).toBe('emotional')
      expect(detectContentType('鼓励自己')).toBe('emotional')
      expect(detectContentType('很难过')).toBe('emotional')
      expect(detectContentType('加油')).toBe('emotional')
    })

    it('should return "default" for normal text', () => {
      expect(detectContentType('今天天气很好')).toBe('default')
      expect(detectContentType('hello world')).toBe('default')
    })
  })

  describe('RATE_CONFIG', () => {
    it('should have all required content types', () => {
      expect(RATE_CONFIG).toHaveProperty('default')
      expect(RATE_CONFIG).toHaveProperty('nonsense')
      expect(RATE_CONFIG).toHaveProperty('deep')
      expect(RATE_CONFIG).toHaveProperty('emotional')
      expect(RATE_CONFIG).toHaveProperty('boss')
    })

    it('should have correct rate values', () => {
      expect(RATE_CONFIG.default).toBe(0.01)
      expect(RATE_CONFIG.nonsense).toBe(0.001)
      expect(RATE_CONFIG.deep).toBe(0.1)
      expect(RATE_CONFIG.emotional).toBe(0.5)
      expect(RATE_CONFIG.boss).toBe(0)
    })
  })

  describe('DEFAULT_ROLE_MULTIPLIERS', () => {
    it('should have default role', () => {
      expect(DEFAULT_ROLE_MULTIPLIERS.default).toBe(1.0)
    })

    it('should have all roles defined', () => {
      expect(DEFAULT_ROLE_MULTIPLIERS.programmer).toBe(1.5)
      expect(DEFAULT_ROLE_MULTIPLIERS.sales).toBe(1.3)
      expect(DEFAULT_ROLE_MULTIPLIERS.pm).toBe(2.0)
      expect(DEFAULT_ROLE_MULTIPLIERS.boss).toBe(0)
    })
  })

  describe('constants', () => {
    it('should have correct DEFAULT_BALANCE', () => {
      expect(DEFAULT_BALANCE).toBe(100)
    })

    it('should have correct DAILY_LIMIT', () => {
      expect(DAILY_LIMIT).toBe(100)
    })
  })
})