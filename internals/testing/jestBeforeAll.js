/* eslint-disable import/no-extraneous-dependencies */
import 'regenerator-runtime/runtime'
import '@testing-library/jest-dom/extend-expect'
import { configure } from '@testing-library/react'

beforeAll(() => {
  configure({ testIdAttribute: 'data-test-id' })
})
