const regex = {
  profileName: /^\[([0-9a-zA-Z-]*)]?/,
  bucketName: /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$)/,
  regionName: /^[-0-9a-zA-Z]+$/
}

export { regex }
