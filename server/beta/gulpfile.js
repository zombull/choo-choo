// npm install --save-dev del gulp gulp-jshint gulp-concat gulp-inject gulp-rename gulp-replace gulp-uglify gulp-ng-annotate gulp-minify-css gulp-minify-html gulp-nodemon gulp-livereload

var del = require('del'),
    crypto = require('crypto'),
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    inject = require('gulp-inject'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    uglify = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    minifyCss = require('gulp-minify-css'),
    minifyHTML = require('gulp-minify-html'),
    nodemon = require('gulp-nodemon'),
    livereload = require('gulp-livereload');

var source = {
    js: 'public/js/**/*.js',
    css: 'public/css/**/*.css',
    html: 'public/partials/**/*.html',
    index: 'public/index.html',
    statics: ['app.js', 'config/**/*.js', 'controllers/**/*.js', 'public/img/**/*'],
    fonts: ['public/css/v5_bloques/*.*', '!public/css/v5_bloques/*.css'],
    redis: '../redis/*.*',
    nginx: '../nginx/*.*',
    docker: '../docker/**/*'
};

var destination = {
    node: '../release/node',
    redis: '../release/redis',
    nginx: '../release/nginx',
    docker: '../release'
}

gulp.task('clean', function() {
    return del('../release', {force: true});
});

// Run JS through jshint to find issues
gulp.task('jshint', function() {
    var jsHintOptions = {
        eqnull: true,
        "-W041": false
    };
    return gulp.src(source.js)
        .pipe(jshint(jsHintOptions))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

// Write the checksums into database.js so that we don't have to make a REST request at runtime.
gulp.task('checksums', function() {
    var localdb = require('./utils/localdb');
    return gulp.src('public/js/services/database.js')
        .pipe(replace(/var\schecksums\s=.*;/, 'var checksums = ' + JSON.stringify(localdb.checksums).replace(/\"/g, "'") + ';'))
        .pipe(gulp.dest('public/js/services'));
});

// This is a rather large task, but it makes sense because we're injecting CSS and JS into index.html.
// The overall amount of code is relatively small so it's not like it's taking a huge amount of time.
// The alternative would be to duplicate generation of the CSS and JS paths
gulp.task('client', ['checksums'], function() {
    var checksum = function(filepath, file) {
        filepath = filepath + '?version=' + crypto.createHash('md5').update(file.contents.toString('utf8')).digest('hex');
        return inject.transform.apply(inject.transform, arguments);
    }

    var client = destination.node + '/app/public';

    var html = gulp.src(source.html)
        .pipe(minifyHTML({empty: true}))                         // Minify HTML.  The empty option tells minifyHTML to keep empty attributes.
        .pipe(gulp.dest(client + '/partials'));

    var css = gulp.src(source.css)
        .pipe(concat('beta.css'))                               // Concatenate everything into a single JS file.
        .pipe(gulp.dest(client + '/css'))                       // Save concatenated file before minification.
        .pipe(minifyCss())
        .pipe(rename({extname: ".min.css"}))                    // Rename the stream
        .pipe(gulp.dest(client + '/css'));

    var js = gulp.src(source.js)
        .pipe(concat('beta.js'))                                // Concatenate everything into a single JS file.
        .pipe(replace('xyz:3000', 'xyz'))                       // Strip port off any subdomain reference
        .pipe(ngAnnotate({add: true, single_quotes: true}))     // Annotate angular code
        .pipe(gulp.dest(client + '/js'))                        // Save concatenated and annotated file before minification.
        .pipe(rename({extname: ".min.js"}))                     // Rename the stream
        .pipe(uglify())
        .pipe(gulp.dest(client + '/js'));

    gulp.src('public/substorage.html')
        .pipe(replace('xyz:3000', 'xyz'))                       // Strip port off any subdomain reference
        .pipe(minifyHTML())                                     // Minify HTML.  The empty option tells minifyHTML to keep empty attributes.
        .pipe(gulp.dest(client));

    return gulp.src(source.index)
        .pipe(gulp.dest(client))                                // Necessary to set the path so injection works correctly.
        .pipe(replace(/<base href=.*>/, '<base href="http://beta.zombull.xyz/">'))
        .pipe(replace('xyz:3000', 'xyz'))                       // Strip port off any subdomain reference
        .pipe(replace('ng-app', 'ng-strict-di ng-app'))
        .pipe(inject(css, {relative: true, addPrefix: 'static', transform: checksum}))
        .pipe(inject(js, {relative: true, addPrefix: 'static', transform: checksum}))
        .pipe(minifyHTML({empty: true}))                        // Minify HTML.  The empty option tells minifyHTML to keep empty attributes.
        .pipe(gulp.dest(client));
});

// Copy Node's statics to the release.
gulp.task('node', function() {
    // package.json needs to be one level above the app itself so that we can install node modules in the docker
    // image and still attach the app source code as a volume.  Copy everything except package.json to 'app'.
    gulp.src(source.statics,  { base: './' })
        .pipe(gulp.dest(destination.node + '/app'));

    // Fonts also need a slight directory change since they need to be in the same directory as the minified CSS.
    gulp.src(source.fonts)
        .pipe(gulp.dest(destination.node + '/app/public/css'));

    return gulp.src('package.json')
        .pipe(gulp.dest(destination.node));
});

// Copy NGINX to the release.
gulp.task('nginx', function() {
    return gulp.src(source.nginx)
        .pipe(gulp.dest(destination.nginx));
});

// Copy Redis to the release.
gulp.task('redis', function() {
    return gulp.src(source.redis)
        .pipe(gulp.dest(destination.redis));
});

// Copy Docker to the release.
gulp.task('docker', function() {
    return gulp.src(source.docker)
        .pipe(gulp.dest(destination.docker));
});

gulp.task('release', ['jshint', 'client', 'node', 'nginx', 'redis', 'docker']);



gulp.task('inject', function () {
    return gulp.src('public/index.html')
        .pipe(replace(/<base href=.*>/, '<base href="http://beta.zombull.xyz:3000/">'))
        .pipe(inject(gulp.src(source.css, {read: false}), {relative: true, addPrefix: 'static'}))
        .pipe(inject(gulp.src(source.js, {read: false}), {relative: true, addPrefix: 'static'}))
        .pipe(gulp.dest('public'));
});


gulp.task('develop', ['jshint', 'inject', 'checksums'], function () {
    livereload.listen();

    nodemon({
        script: 'app.js',
        ext: 'js',
        stdout: false
    }).on('readable', function () {
        this.stdout.on('data', function (chunk) {
            if(/^Express server listening on port/.test(chunk)) {
                livereload.changed(__dirname);
            }
        });

        this.stdout.pipe(process.stdout);
        this.stderr.pipe(process.stderr);
    });
});

gulp.task('default', [
  'develop'
]);
