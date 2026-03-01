export function convertObjectToKeyValueArray(obj: Record<string, unknown>): { Key: string, Value: string }[] {
  return Object.keys(obj).map(key => ({
    Key: key,
    Value: String(obj[key]),
  }))
}
