export interface SelectResourcesConfig {
  name: string
  loaderConfig?: LocalstorageSelectLoaderConfig
    | CustomSelectLoaderConfig
}

export interface LocalstorageSelectLoaderConfig {
  name: string
  key: string
}

export interface CustomSelectLoaderConfig {
  asyncFactory?: () => Promise<any>
}

export const resources: Record<string, SelectResourcesConfig> = {}
