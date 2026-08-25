
    export type RemoteKeys = 'mfReservas/App';
    type PackageType<T> = T extends 'mfReservas/App' ? typeof import('mfReservas/App') :any;