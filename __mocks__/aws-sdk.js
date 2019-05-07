/* eslint-disable */
'use strict'

function S3() {
  this.result = null
  this.bucket = null
  this.key = {
    path: null,
    data: null
  }
}

S3.prototype = {

  promise: function() {
    return this.result
  },

  getObject: function(params) {
    this.result = new Promise((resolve, reject) => {
      if (params.Key !== this.key.path) reject({ code: 'NoSuchKey' })
      else resolve({ Body: this.key.data })
    })
    
    return this
  },

	putObject: function(params) {
    this.result = new Promise((resolve, reject) => {
      this.key.path = params.Key
      this.key.data = params.Body
      resolve()
    })
    
    return this
  }
}

module.exports = S3