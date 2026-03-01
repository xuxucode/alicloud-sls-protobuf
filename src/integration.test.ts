import { describe, expect, it } from 'bun:test'
import { Client } from './client'
import type { LogGroupJson } from './gen/sls/sls_pb'
import { convertObjectToKeyValueArray } from './utils'

// Usage:
// 1. Copy .env.test.local.example to .env.test.local
// 2. In the project root, run `RUN_INTEGRATION=1 bun test src/integration.test.ts`

const runIntegration = process.env.RUN_INTEGRATION === '1'

if (!runIntegration) {
  describe.skip('Integration test', () => {
    it('set RUN_INTEGRATION=1 to enable', () => {})
  })
} else {
  const testProject = process.env.TEST_PROJECT
  const testStore = process.env.TEST_STORE
  const testStore2 = process.env.TEST_STORE2
  const accessKeyId = process.env.ACCESS_KEY_ID
  const accessKeySecret = process.env.ACCESS_KEY_SECRET
  const region = process.env.REGION || 'cn-hangzhou'
  const PROJECT_DELAY = 1500

  expect(typeof testProject).toBe('string')
  expect(typeof testStore).toBe('string')
  expect(typeof testStore2).toBe('string')
  expect(typeof accessKeyId).toBe('string')
  expect(typeof accessKeySecret).toBe('string')

  const client = new Client({
    accessKeyId,
    accessKeySecret,
    region,
  })

  const httpsClient = new Client({
    accessKeyId,
    accessKeySecret,
    region,
    use_https: true,
  })

  const index = {
    ttl: 7,
    keys: {
      functionName: {
        alias: '',
        caseSensitive: false,
        token: ['\n', '\t', ';', ',', '=', ':'],
        chn: false,
        type: 'text',
      },
    },
  }

  const index2 = {
    ttl: 7,
    keys: {
      serviceName: {
        alias: '',
        caseSensitive: false,
        token: ['\n', '\t', ';', ',', '=', ':'],
        chn: false,
        type: 'text',
      },
    },
  }

  function sleep(timeout: number) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), timeout)
    })
  }

  describe('Integration test', () => {
    describe('log project CRUD', () => {
      const projectName = `test-project-${Date.now()}`

      it('createProject should ok', async () => {
        const res1 = await client.createProject(projectName, {
          description: 'test',
        })
        expect(res1).toBe('')
        await sleep(PROJECT_DELAY)
        const res2 = await client.getProject(projectName)
        expect((res2 as { projectName: string }).projectName).toBe(projectName)
        expect((res2 as { description: string }).description).toBe('test')
      })

      it('deleteProject should ok', async () => {
        const res = await client.deleteProject(projectName)
        expect(res).toBe('')
        try {
          await client.getProject(projectName)
        } catch (ex) {
          expect((ex as { code: string }).code).toBe('ProjectNotExist')
          return
        }

        throw new Error('The log project should have been deleted')
      })
    })

    describe('log store CRUD', () => {
      const logstoreName = `test-logs-${Date.now()}`

      it('createLogStore should ok', async () => {
        const res1 = await client.createLogStore(testProject as string, logstoreName, {
          ttl: 10,
          shardCount: 2,
        })
        expect(res1).toBe('')
        const res2 = await client.getLogStore(testProject as string, logstoreName)
        expect((res2 as { logstoreName: string }).logstoreName).toBe(logstoreName)
        expect((res2 as { ttl: number }).ttl).toBe(10)
      })

      it('listLogStore should ok', async () => {
        const res = await client.listLogStore(testProject as string)
        const typed = res as { count: number, total: number, logstores: string[] }
        expect(typeof typed.count).toBe('number')
        expect(typeof typed.total).toBe('number')
        expect(Array.isArray(typed.logstores)).toBe(true)
        expect(typed.logstores.length > 0).toBe(true)
      })

      it('updateLogStore should ok', async () => {
        const res1 = await client.updateLogStore(testProject as string, logstoreName, {
          ttl: 20,
          shardCount: 2,
        })
        expect(res1).toBe('')
        const res2 = await client.getLogStore(testProject as string, logstoreName)
        expect((res2 as { logstoreName: string }).logstoreName).toBe(logstoreName)
        expect((res2 as { ttl: number }).ttl).toBe(20)
      })

      it('deleteLogStore should ok', async () => {
        const res = await client.deleteLogStore(testProject as string, logstoreName)
        expect(res).toBe('')
        try {
          await client.getLogStore(testProject as string, logstoreName)
        } catch (ex) {
          expect((ex as { code: string }).code).toBe('LogStoreNotExist')
          return
        }

        throw new Error('The log store should have been deleted')
      })
    })

    describe('log index', () => {
      it('createIndex should ok', async () => {
        await client.createIndex(testProject as string, testStore as string, index)
        const res2 = await client.getIndexConfig(testProject as string, testStore as string)
        expect(typeof (res2 as { ttl: number }).ttl).toBe('number')
        expect((res2 as { keys: object }).keys).toEqual(index.keys)
      })

      it('updateIndex should ok', async () => {
        await client.updateIndex(testProject as string, testStore as string, index2)
        const res2 = await client.getIndexConfig(testProject as string, testStore as string)
        expect((res2 as { keys: object }).keys).toEqual(index2.keys)
      })

      it('deleteIndex should ok', async () => {
        const res1 = await client.deleteIndex(testProject as string, testStore as string)
        expect(res1).toBe('')
        try {
          await client.getIndexConfig(testProject as string, testStore as string)
        } catch (ex) {
          expect((ex as { code: string }).code).toBe('IndexConfigNotExist')
          return
        }

        throw new Error('The log index should have been deleted')
      })
    })

    describe('getProjectLogs', () => {
      const from = new Date()
      from.setDate(from.getDate() - 1)
      const to = new Date()

      it('getProjectLogs should ok', async () => {
        const res = await client.getProjectLogs(testProject as string, {
          query: `select count(*) as count  from ${testStore2} where __time__ > ${Math.floor(from.getTime() / 1000)} and __time__ < ${Math.floor(to.getTime() / 1000)} limit 0,20`,
        })
        expect(Array.isArray(res)).toBe(true)
      })
    })

    describe('getLogs', () => {
      const from = new Date()
      from.setDate(from.getDate() - 1)
      const to = new Date()

      it('getLogs should ok', async () => {
        const res = await client.getLogs(testProject as string, testStore2 as string, from, to)
        expect(Array.isArray(res)).toBe(true)
      })
    })

    describe('getHistograms', () => {
      const from = new Date()
      from.setDate(from.getDate() - 1)
      const to = new Date()

      it('getHistograms should ok', async () => {
        const res = await client.getHistograms(testProject as string, testStore2 as string, from, to)
        expect(Array.isArray(res)).toBe(true)
      })
    })

    describe('postLogStoreLogs', () => {
      const logGroup = {
        Logs: [
          {
            Time: Math.floor(Date.now() / 1000),
            Contents: convertObjectToKeyValueArray({
              level: 'debug',
              message: `test1-${Date.now()}`,
            }),
          },
          {
            Time: Math.floor(Date.now() / 1000),
            Contents: convertObjectToKeyValueArray({
              level: 'info',
              message: `test2-${Date.now()}`,
            }),
          },
        ],
        LogTags: convertObjectToKeyValueArray({ tag1: 'testTag' }),
      } satisfies LogGroupJson

      it('postLogStoreLogs should ok', async () => {
        const res = await client.postLogStoreLogs(testProject as string, testStore2 as string, logGroup)
        expect(res).toBe('')
      })
    })

    describe('postLogStoreLogsWithTopicSource', () => {
      const logGroup = {
        Logs: [
          { Contents: convertObjectToKeyValueArray({ level: 'debug', message: `test1-${Date.now()}` }), Time: Math.floor(Date.now() / 1000) },
          { Contents: convertObjectToKeyValueArray({ level: 'info', message: `test2-${Date.now()}` }), Time: Math.floor(Date.now() / 1000) },
        ],
        LogTags: convertObjectToKeyValueArray({ tag1: 'testTag' }),
        Topic: 'testTopic',
        Source: 'testSource',
      } satisfies LogGroupJson

      it('postLogStoreLogsWithTopicSource should ok', async () => {
        const res = await client.postLogStoreLogs(testProject as string, testStore2 as string, logGroup)
        expect(res).toBe('')
      })
    })

    describe('postLogStoreLogsWithTimeNs', () => {
      const logGroup = {
        Logs: [
          {
            Contents: convertObjectToKeyValueArray({ level: 'debug', message: `test1-${Date.now()}` }),
            Time: Math.floor(Date.now() / 1000),
            TimeNs: Math.floor(Date.now() * 1000 * 1000) % 1000000000,
          },
          {
            Contents: convertObjectToKeyValueArray({ level: 'info', message: `test2-${Date.now()}` }),
            Time: Math.floor(Date.now() / 1000),
            TimeNs: Math.floor(Date.now() * 1000 * 1000) % 1000000000,
          },
        ],
        LogTags: convertObjectToKeyValueArray({ tag1: 'testTag' }),
        Topic: 'ns',
        Source: 'ns',
      } satisfies LogGroupJson

      it('postLogStoreLogsWithTimeNs should ok', async () => {
        const res = await client.postLogStoreLogs(testProject as string, testStore2 as string, logGroup)
        expect(res).toBe('')
      })
    })

    describe('HTTPS protocol support', () => {
      it('listLogStore via HTTPS should ok', async () => {
        const res = await httpsClient.listLogStore(testProject as string)
        const typed = res as { count: number, total: number, logstores: string[] }
        expect(typeof typed.count).toBe('number')
        expect(typeof typed.total).toBe('number')
        expect(Array.isArray(typed.logstores)).toBe(true)
      })
    })

    describe('HTTPS protocol support with endpoint', () => {
      it('listLogStore via HTTPS with endpoint should ok', async () => {
        const clientWithEndpoint = new Client({
          accessKeyId,
          accessKeySecret,
          endpoint: `https://${region}.log.aliyuncs.com`,
        })
        const res = await clientWithEndpoint.listLogStore(testProject as string)
        const typed = res as { count: number, total: number, logstores: string[] }
        expect(typeof typed.count).toBe('number')
        expect(typeof typed.total).toBe('number')
        expect(Array.isArray(typed.logstores)).toBe(true)
      })
    })

    describe('HTTP protocol support with endpoint', () => {
      it('listLogStore via HTTP with endpoint should ok', async () => {
        const clientWithEndpoint = new Client({
          accessKeyId,
          accessKeySecret,
          endpoint: `http://${region}.log.aliyuncs.com`,
        })
        const res = await clientWithEndpoint.listLogStore(testProject as string)
        const typed = res as { count: number, total: number, logstores: string[] }
        expect(typeof typed.count).toBe('number')
        expect(typeof typed.total).toBe('number')
        expect(Array.isArray(typed.logstores)).toBe(true)
      })
    })
  })
}
