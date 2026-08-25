
    export type RemoteKeys = 'mfAdministracion/App';
    type PackageType<T> = T extends 'mfAdministracion/App' ? typeof import('mfAdministracion/App') :any;