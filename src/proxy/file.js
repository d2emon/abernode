'use strict'
const fs = require('fs')

module.exports = {
  stat: filename => new Promise ((resolve, reject) => {
    console.log('STAT(' + filename + ')')
    fs.stat(__dirname, (err, stats) => {
      if (err) reject(err)
      else resolve(stats)
    })
  }),
  open: function (filename, mode) {
    if (filename == 'NOLOGIN') return 0
    console.log('FOPEN(' + filename + ', ' + mode + ')')
    return 1
  },
  openlock: function (filename, mode) {
    console.log('OPENLOCK(' + filename + ', ' + mode + ')')
    return this.open(filename, mode)
  },
  scanf: function (file) {
    console.log('FSCANF(' + file + ')')
    return file
  },
  close: function (file) { console.log('FCLOSE(' + file +')') },
  gets: function (file) { console.log('FGETS(' + file +')') }

}
