
module.exports = exports;

var fs = require('fs')
  , path = require('path')
  , log = require('npmlog')
  , win = process.platform == 'win32'
  , existsSync = fs.existsSync || path.existsSync
  , cp = require('child_process')

// try to build up the complete path to node-gyp
/* priority:
  - node-gyp on NODE_PATH
  - node-gyp inside npm on NODE_PATH
  - node-gyp inside npm beside node exe
*/
function which_node_gyp() {
    try {
        var node_gyp_main = require.resolve('node-gyp');
        var node_gyp_bin = path.join(path.dirname(
                                     path.dirname(node_gyp_main))
                                     ,'bin/node-gyp.js');
        if (existsSync(node_gyp_bin)) {
            return node_gyp_bin;
        }
    } catch (err) { }
    try {
        var npm_main = require.resolve('npm');
        var node_gyp_bin = path.join(path.dirname(
                                     path.dirname(npm_main))
                                     ,'node_modules/node-gyp/bin/node-gyp.js');
        if (existsSync(node_gyp_bin)) {
            return node_gyp_bin;
        }
    } catch (err) { }
    var npm_base = path.join(path.dirname(
                             path.dirname(process.execPath))
                             ,'lib/node_modules/npm/')
    var node_gyp_bin = path.join(npm_base,'node_modules/node-gyp/bin/node-gyp.js');
    if (existsSync(node_gyp_bin)) {
        return node_gyp_bin;
    }
}

module.exports.run_gyp = function(args,opts,callback) {
    var shell_cmd = '';
    var cmd_args = [];
    if (opts.runtime && opts.runtime == 'node-webkit') {
        shell_cmd = 'nw-gyp';
        if (win) shell_cmd += '.cmd';
    } else {
        var node_gyp_path = which_node_gyp();
        if (node_gyp_path) {
            shell_cmd = process.execPath;
            cmd_args.push(node_gyp_path);
        } else {
            shell_cmd = 'node-gyp';
            if (win) shell_cmd += '.cmd';
        }
    }
    var final_args = cmd_args.concat(args);
    var cmd = cp.spawn(shell_cmd, final_args, {cwd: undefined, env: process.env, stdio: [ 0, 1, 2]});
    cmd.on('error', function (err) {
        if (err) {
            return callback(new Error("Failed to execute '" + shell_cmd + ' ' + final_args.join(' ') + "' (" + err + ")"));
        }
        callback(null,opts);
    });
    cmd.on('close', function (code, signal) {
        if (code && code !== 0) {
            return callback(new Error("Failed to execute '" + shell_cmd + ' ' + final_args.join(' ') + "' (" + code + ")"));
        }
        callback(null,opts);
    });
}
