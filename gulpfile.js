var fs = require('fs'),
	gulp = require('gulp'),
	size = require('gulp-sizereport'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	resolve = require('resolve'),
	rename = require('gulp-rename'),
	replace = require('gulp-replace'),
	merge = require('merge2'),
	shell = require('gulp-shell'),
	browserify = require('browserify'),
	resolve = require('resolve'),
	through2 = require('through2'),
	_ = require('lodash');

// ======================================== gulp lint

gulp.task('lint', function() {

	return gulp.src( './src/qwest.js' )
		.pipe( jshint() )
		.pipe( jshint.reporter('jshint-stylish') );

});

// ======================================== gulp build

gulp.task('build', ['lint'], function() {
	
	return gulp.src( './src/qwest.js' )
				.pipe( size() )
				.pipe( uglify() )
				.pipe( rename('qwest.min.js') )
				.pipe( gulp.dest('.') )
				.pipe( size({gzip:true}) )
				.pipe( through2.obj(function(file, enc, next) {
		
					var b = browserify('./src/qwest.js', {standalone: 'qwest'});
		
					(_.keys(require('./package.json').dependencies) || []).forEach(function(name) {
						b.add(resolve.sync(name, {moduleDirectory: './node_modules/'}), {expose: name});
					});
		
					b.bundle(function(err, res) {
						file.contents = res;
						next(null, file);
					});
		
				}) )
				.pipe( uglify() )
				.pipe( rename('qwest.standalone.min.js') )
				.pipe( gulp.dest('.') )
				.pipe( size({gzip:true}) );

});

// ======================================== gulp version

gulp.task('version', function() {

	var streams = merge(),
		version=fs.readFileSync('./src/qwest.js', {encoding: 'utf8'}).match(/^\/\*\! \w+ ([0-9.]+)/)[1];

	streams.add(
		gulp.src( './package.json' )
			.pipe( replace(/"version": "[0-9.]+",/, '"version": "'+version+'",') )
			.pipe( gulp.dest('.') )
	);

	streams.add(
		gulp.src( './README.md' )
			.pipe( replace(/^(\w+) [0-9.]+/, '$1 '+version) )
			.pipe( gulp.dest('.') )
	);

	return streams;

});

// ======================================== gulp publish

gulp.task('publish', function() {

	return gulp.src('.', {read: false})
				.pipe(shell([
					'npm publish',
					'jam publish'
				]));

});

// ======================================== gulp

gulp.task('default', ['build', 'version']);
