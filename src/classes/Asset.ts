class Asset {
  source: string | null = null
  destination: string | null = null
  type: string | null = null
  size: number = 0
  gzip: boolean = false
  acl: string = ''
  cacheControl: string = ''

  constructor (source, destination) {
    this.source = source
    this.destination = destination
  }
}

export default Asset
