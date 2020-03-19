import path from 'path'
import globby from 'globby'

export const globbyMatch = (config, pattern, key) => {
  

}

export const globbySync = (config, pattern, addPath) => {
  const options = Object.assign({ cwd: config.fullAssetPath }, config.fastGlobOptions)
  const matches = globby.sync(pattern, options)

  if (addPath) {
    return matches.map(file => path.join(config.fullAssetPath, file))
  }

  return matches
}

export const regex = {
  profileName: /^\[([0-9a-zA-Z-]*)]?/gm,
  bucketName: /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$)/g
}
