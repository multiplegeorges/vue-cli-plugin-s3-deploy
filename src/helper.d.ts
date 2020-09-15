export declare const regex: {
    profileName: RegExp;
    bucketName: RegExp;
    regionName: RegExp;
};
export declare const defaults: {
    assetPath: string;
    assetMatch: string[];
    s3Profile: string;
    s3Region: string;
    s3Endpoint: any;
    s3CacheControl: string;
    s3CacheControlPerFileEnable: boolean;
    s3CacheControlPerFilePattern: any[];
    s3BucketName: any;
    s3BucketACL: string;
    s3DeployPath: string;
    cloudFrontEnable: boolean;
    cloudFrontId: any;
    cloudFrontProfile: string;
    cloudFrontRegion: string;
    cloudFrontEndpoint: any;
    cloudFrontPattern: string[];
    pwaEnable: boolean;
    pwaFilePattern: string[];
    gzipEnable: boolean;
    gzipFilePattern: string[];
    concurrentUploads: number;
    fastGlobOptions: {
        dot: boolean;
        onlyFiles: boolean;
    };
    onComplete: (_error: unknown, _options: unknown) => any;
};
/**
 * Set global error messages
 */
export declare const errorMessages: {
    bucketName: string;
};
