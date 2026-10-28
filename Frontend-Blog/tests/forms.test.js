import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isValidCaptcha,
  isValidEmailOrQq,
  isValidContent
} from '../src/utils/formValidate.js'

test('R31: challenge answer must be a whole signed integer, never a parsed prefix', () => {
  for (const answer of ['0', '-4', ' 12 '])
    assert.equal(isValidCaptcha(answer).valid, true)
  for (const answer of ['', '12abc', '1.5', 'NaN'])
    assert.equal(isValidCaptcha(answer).valid, false)
})
test('D01/D11: shared form accepts supported QQ length and enforces content bounds', () => {
  assert.equal(isValidEmailOrQq('123456789012').valid, true)
  assert.equal(isValidEmailOrQq('01234').valid, false)
  assert.equal(isValidContent('a'.repeat(2000)).valid, true)
  assert.equal(isValidContent('a'.repeat(2001)).valid, false)
})
