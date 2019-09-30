export default {
    regex: {
        profileName: /^\[([0-9a-zA-Z-]*)]?/gm,
        bucketName: /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])$)/g
    }
}
