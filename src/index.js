'use strict';
var Linter = require('tslint');
var fs = require('fs');
var glob = require('glob');
var rx = require('rx');
var _ = require('lodash');
var configuration = {
    rules: {
        "variable-name": true,
        "quotemark": [true, "double"]
    }
};
var options = {
    formatter: "json",
    configuration: configuration,
    rulesDirectory: "customRules/",
    formattersDirectory: "customFormatters/"
};
function isFileWithMatchingExtension(file, extensions) {
    var stats = fs.lstatSync(file);
    var extension = "." + file.split(".").pop();
    return (stats.isFile() &&
        !stats.isSymbolicLink()
        && extensions.indexOf(extension) >= 0);
}
function prunePathsWithinSymlinks(paths) {
    // Extracts symlinked paths and filters them out, including any child paths
    var symlinks = paths.filter(function (path) { return fs.lstatSync(path).isSymbolicLink(); });
    return paths.filter(function (path) { return symlinks.every(function (symlink) { return path.indexOf(symlink) != 0; }); });
}
function exclusionBasedFileListBuilder(excludePaths) {
    // Uses glob to traverse code directory and find files to analyze,
    // excluding files passed in with by CLI config, and including only
    // files in the list of desired extensions.
    //
    // Deprecated style of file expansion, supported for users of the old CLI.
    return function (extensions) {
        var allFiles = glob.sync("/code/**/**", {});
        return prunePathsWithinSymlinks(allFiles)
            .filter(function (file) { return excludePaths.indexOf(file.split("/code/")[1]) < 0; })
            .filter(function (file) { return fs.lstatSync(file).isFile(); })
            .filter(function (file) { return isFileWithMatchingExtension(file, extensions); });
    };
}
function inclusionBasedFileListBuilder(includePaths) {
    // Uses glob to expand the files and directories in includePaths, filtering
    // down to match the list of desired extensions.
    return function (extensions) {
        var _a = _.partition(includePaths, /\/$/.test), directories = _a[0], files = _a[1];
        var filesFromDirectories = _.flatten(_.chain(directories)
            .map(function (directory) { return glob.sync("/code/" + directory + "/**/**"); })
            .map(prunePathsWithinSymlinks)
            .value())
            .filter(function (file) { return isFileWithMatchingExtension(file, extensions); });
        var filesFromFiles = _.chain(files)
            .map(function (file) { return ("/code/" + file); })
            .filter(function (file) { return isFileWithMatchingExtension(file, extensions); })
            .value();
        return filesFromDirectories.concat(filesFromFiles);
    };
}
function loadConfig(configFileName) {
    return rx.Observable
        .fromNodeCallback(fs.readFile)(configFileName)
        .catch(function (err) { return rx.Observable.return(null); })
        .map(function (buffer) { return !!buffer ? JSON.parse(buffer.toString("utf-8")) : {}; })
        .map(function (engineConfig) {
        return engineConfig.include_paths ?
            inclusionBasedFileListBuilder(engineConfig.include_paths) :
            exclusionBasedFileListBuilder(engineConfig.exclude_paths || []);
    });
}
function processFile(fileName) {
    console.error("process: " + fileName);
    var contents = fs.readFileSync(fileName, "utf8");
    var linter = new Linter(fileName, contents, options);
    var result = linter.lint();
    console.log(result);
}
loadConfig("/config.json")
    .flatMap(function (builder) { return builder(['.ts']); })
    .subscribe(processFile);
