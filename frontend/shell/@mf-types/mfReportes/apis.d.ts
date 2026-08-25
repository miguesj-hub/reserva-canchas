
    export type RemoteKeys = 'mfReportes/App';
    type PackageType<T> = T extends 'mfReportes/App' ? typeof import('mfReportes/App') :any;