module.exports = function (grunt) {
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),

    meta : {
      src : 'src/**/*.js',
      spec : 'test/*Spec.js',
      dev : 'dist/zector.js',
      prod : 'dist/zector.min.js'
    },

    concat : {
      options : {
        separator : ';'
      },
      main : {
        files : {
          '<%= meta.dev %>' : '<%= meta.src %>'
        }
      }
    },

    uglify : {
      options : {
        preserveComments : 'some'
      },
      main : {
        files : {
          '<%= meta.prod %>' : '<%= meta.dev %>'
        }
      }
    },

    watch : {
      src : {
        files : '<%= meta.src %>',
        tasks : ['concat']
      },
      test : {
        files : ['<%= meta.src %>', '<%= meta.spec %>'],
        tasks : ['jasmine']
      }
    },

    connect : {
      server : {
        options : {
          hostname : '*',
          port : 8887,
          base : '.'
        }
      }
    },

    jasmine : {
      main : {
        src : '<%= meta.src %>',
        options : {
          specs : '<%= meta.spec %>',
          keepRunner : true
        }
      }
    },

    jshint : {
      all : ['gruntfile.js', '<%= meta.src %>', '<%= meta.spec %>'],
      options : {
        jshintrc : '.jshintrc'
      }
    },

    clean : {
      options : {
        force : true
      },
      files : ['dist']
    },

    compress : {
      main : {
        options : {
          archive : "dist/zector.min.js.gz",
          mode : 'gzip',
          pretty : true
        },
        files : [
          {
            expand : true,
            src : ['dist/zector.min.js']
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  
  grunt.registerTask('default', ['dev']);
  grunt.registerTask('dev', ['connect', 'concat', 'watch:src']);
  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'jasmine', 'watch:test']);
}