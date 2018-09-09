const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    devtool: 'cheap-module-eval-source-map', //inline-source-map',
    devServer: {
        host: "decinnov.com",
        contentBase: './public',
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    
});