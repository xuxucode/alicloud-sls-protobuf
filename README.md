# alicloud-sls-protobuf

TypeScript SDK for Alibaba Cloud Log Service (SLS), with protobuf log ingestion support.

## Install

```bash
bun add alicloud-sls-protobuf
# or
npm i alicloud-sls-protobuf
```

## Quick Start

### Initialize client (AK/SK)

```ts
import { Client } from 'alicloud-sls-protobuf'

const client = new Client({
  accessKeyId: process.env.ACCESS_KEY_ID!,
  accessKeySecret: process.env.ACCESS_KEY_SECRET!,
  region: 'cn-hangzhou',
})
```

### Initialize with endpoint

```ts
import { Client } from 'alicloud-sls-protobuf'

const client = new Client({
  accessKeyId: process.env.ACCESS_KEY_ID!,
  accessKeySecret: process.env.ACCESS_KEY_SECRET!,
  endpoint: 'cn-hangzhou.log.aliyuncs.com',
  // or endpoint: 'https://cn-hangzhou.log.aliyuncs.com'
})
```

### Initialize with Credentials Provider (recommended for STS)

`credentialsProvider` must expose an async `getCredentials()` method that returns:
- `accessKeyId`
- `accessKeySecret`
- optional `securityToken`

```ts
import { Client, type Credentials } from 'alicloud-sls-protobuf'

class MyCredentialsProvider {
  async getCredentials(): Promise<Credentials> {
    return {
      accessKeyId: 'your-access-key-id',
      accessKeySecret: 'your-access-key-secret',
      securityToken: 'your-security-token',
    }
  }
}

const client = new Client({
  region: 'cn-hangzhou',
  credentialsProvider: new MyCredentialsProvider(),
})
```

## Write Logs (protobuf)

Use `convertObjectToKeyValueArray` to build `Contents`/`LogTags` quickly.

```ts
import { Client, convertObjectToKeyValueArray } from 'alicloud-sls-protobuf'

const client = new Client({
  accessKeyId: process.env.ACCESS_KEY_ID!,
  accessKeySecret: process.env.ACCESS_KEY_SECRET!,
  region: process.env.REGION ?? 'cn-hangzhou',
})

await client.postLogStoreLogs('your-project', 'your-logstore', {
  Logs: [
    {
      Time: Math.floor(Date.now() / 1000),
      Contents: convertObjectToKeyValueArray({
        level: 'info',
        message: 'hello sls',
      }),
    },
  ],
  LogTags: convertObjectToKeyValueArray({
    env: 'test',
  }),
})
```

## Query Examples

```ts
const now = new Date()
const from = new Date(now.getTime() - 15 * 60 * 1000)

const logs = await client.getLogs('your-project', 'your-logstore', from, now, {
  query: '*',
  line: 100,
})

const histograms = await client.getHistograms('your-project', 'your-logstore', from, now, {
  query: '*',
})
```

## Main APIs

- Project: `getProject`, `getProjectLogs`, `createProject`, `deleteProject`
- Logstore: `listLogStore`, `createLogStore`, `updateLogStore`, `getLogStore`, `deleteLogStore`
- Index: `getIndexConfig`, `createIndex`, `updateIndex`, `deleteIndex`
- Query: `getLogs`, `getHistograms`
- Ingestion: `postLogStoreLogs`

## Integration Test

1. Copy env template:

```bash
cp .env.test.local.example .env.test.local
```

2. Fill values in `.env.test.local`:
- `TEST_PROJECT`
- `TEST_STORE` (logstore without index)
- `TEST_STORE2` (logstore with index)
- `ACCESS_KEY_ID`
- `ACCESS_KEY_SECRET`
- `REGION`

3. Run integration test:

```bash
RUN_INTEGRATION=1 bun test --env-file .env.test.local src/integration.test.ts
```
