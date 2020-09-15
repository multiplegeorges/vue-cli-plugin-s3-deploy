interface ICacheMatch {
    pattern: string[];
    cache: string;
}
interface IOpt {
    globbyOptions: any;
    localAssetMatch: string[];
    localAssetPath: string;
    bucketPath: string;
    pwaMatch: string[];
    gzipMatch: string[];
    cacheMatch?: ICacheMatch[];
}
declare class Deployer {
    opt: IOpt;
    queue: [];
    uploadCount: number;
    uploadTotal: number;
    constructor(config: string[]);
    getBucketPath(): string;
    getSourcePath(): string;
    getFileBucketPath(fileSource: any): string;
    populateQueue(): any;
    getCacheControl(file: any): any;
    processQueue(): Promise<void>;
    /**
     *
     * @returns {Promise<ManagedUpload.SendData>|null}
     */
    uploadNextFile(): any;
    /**
     *
     * @returns {Promise<void>}
     */
    run(): Promise<void>;
}
export default Deployer;
