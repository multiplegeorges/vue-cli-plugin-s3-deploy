class Asset {
  source: string | null = null
  destination: string | null = null
  type: string | null = null
  size = 0
  gzip = false
  acl = ''
  cacheControl = ''

  constructor (source: string, destination: string) {
    this.source = source
    this.destination = destination
  }
}

export default Asset
