const path = require('path');

let mode = 'production';
process.argv.forEach(val => {
    if (val == '--watch') {
        mode = 'development';
    }
});

module.exports = {
    mode: mode,
    devtool: 'inline-source-map',
    entry: {
        main: './src/main.js'
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'public'),
    }
};