const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        background: './background.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'production',
    resolve: {
        extensions: ['.js']
    },
    plugins: [
        new Dotenv()
    ]
};
