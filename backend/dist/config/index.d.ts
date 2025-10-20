export declare const config: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
    zg: {
        chainRpcUrl: string;
        storageUrl: string;
        indexerUrl: string;
        chainId: number;
        privateKey: string;
    };
    contracts: {
        vectorRegistry: string;
        storageOracle: string;
    };
    vector: {
        dimension: number;
        hnsw: {
            m: number;
            efConstruction: number;
            efSearch: number;
        };
    };
    storage: {
        maxFileSize: string;
        uploadPath: string;
    };
    gemini: {
        apiKey: string;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map