const path = require('path')

module.exports = {
  entry: './src/map.js', 
  output: {
    filename: 'mappy.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'Mappy'
  }
};