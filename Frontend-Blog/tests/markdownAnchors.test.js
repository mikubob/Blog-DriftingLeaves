import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  MarkdownHeadingIds,
  headingSlug,
  uniqueHeadingId,
  findFragmentTarget
} from '../src/utils/markdownAnchors.js'

test('Chinese technical headings match handwritten Markdown directories', () => {
  assert.equal(headingSlug('第2章 数据类型与表设计'), '第2章-数据类型与表设计')
  assert.equal(headingSlug('2.1 数值类型'), '21-数值类型')
  assert.equal(headingSlug('2.4 JSON 类型'), '24-json-类型')
  assert.equal(headingSlug('2.5 NULL 值的问题'), '25-null-值的问题')
})

test('duplicates, suffix collisions and rerenders have stable IDs', () => {
  const ids = new MarkdownHeadingIds()
  const headings = ['A', 'A', 'A-1', 'A', '中文_标题', '!!!']
  const render = () =>
    headings.map((text, index) => ids.getId({ text, index: index + 1 }))
  const expected = ['a', 'a-1', 'a-1-1', 'a-2', '中文_标题', 'section']
  assert.deepEqual(render(), expected)
  assert.deepEqual(render(), expected)
  assert.equal(uniqueHeadingId('A', new Set(['a', 'a-1'])), 'a-2')
})

test('fragment lookup decodes Chinese and rejects malformed encodings', () => {
  const heading = { id: '21-数值类型', getAttribute: () => null }
  const namedAnchor = { id: '', getAttribute: () => 'legacy' }
  const container = { querySelectorAll: () => [heading, namedAnchor] }
  assert.equal(
    findFragmentTarget(container, '#21-%E6%95%B0%E5%80%BC%E7%B1%BB%E5%9E%8B'),
    heading
  )
  assert.equal(findFragmentTarget(container, '#legacy'), namedAnchor)
  assert.equal(findFragmentTarget(container, '#missing'), undefined)
  assert.equal(findFragmentTarget(container, '#%invalid'), null)
  assert.equal(findFragmentTarget(container, '#'), null)
})

test('admin and blog use identical slug rules', async () => {
  const admin = await readFile(
    new URL(
      '../../Frontend-Admin/src/utils/markdownAnchors.js',
      import.meta.url
    ),
    'utf8'
  )
  const blog = await readFile(
    new URL('../src/utils/markdownAnchors.js', import.meta.url),
    'utf8'
  )
  const core = (source) =>
    source.slice(0, source.indexOf('export const findFragmentTarget'))
  assert.equal(core(admin), core(blog))
})
