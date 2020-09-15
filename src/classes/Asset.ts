import zlib from 'zlib'
import mime from 'mime-types'
import fs from 'fs'

interface IParams {
  Key: string
  Body: Buffer
  ContentType: string
  CacheControl: string
  ContentEncoding?: string
}

class Asset {
  private source: string | null = null
  private destination: string | null = null
  private type: string | null = null
  private size = 0
  private cacheControl = 'max-age=86400'
  private content: Buffer | null = null
  private encoding: string | null = null

  constructor (source: string, destination: string) {
    this.source = source
    this.destination = destination

    this.type = mime.lookup(source) || 'application/octet-stream'
    this.size = fs.statSync(source).size
    this.content = fs.readFileSync(source)
  }

  public setCacheControl(cacheString: string): void {
    this.cacheControl = cacheString
  }

  public enableGzip(): void {
    this.content = zlib.gzipSync(this.content, { level: 9 })
    this.encoding = 'gzip'
  }

  public getSource(): string {
    return this.source
  }

  public getSize(): number {
    return this.size
  }

  public getUploadPamas(): IParams {
    const params: IParams = {
      Key: this.destination,
      Body: this.content,
      ContentType: this.type,
      CacheControl: this.cacheControl
    }

    if (this.encoding) {
      params.ContentEncoding = this.encoding
    }

    return params
  }
}

export default Asset
