const gulp = require('gulp'),
    pkg = require('./package.json'),
    BundleHelper = require('maptalks-build-helpers').BundleHelper,
    TestHelper = require('maptalks-build-helpers').TestHelper;
const bundleHelper = new BundleHelper(pkg);
const testHelper = new TestHelper();
const karmaConfig = require('./karma.config');

gulp.task('build', gulp.series(() => {
    return bundleHelper.bundle('index.js');
}));

gulp.task('minify', gulp.series(['build'], (cb) => {
    bundleHelper.minify();
    cb();
}));

gulp.task('watch', gulp.series(['build'], (cb) => {
    gulp.watch(['index.js', './gulpfile.js'],  gulp.series(['build']));
    cb();
}));

gulp.task('test', gulp.series(['build'], (cb) => {
    testHelper.test(karmaConfig);
    cb();
}));

gulp.task('tdd', gulp.series(['build'], (cb) => {
    karmaConfig.singleRun = false;
    gulp.watch(['index.js'], ['test']);
    testHelper.test(karmaConfig);
    cb();
}));

gulp.task('default', gulp.series(['watch']));

