#!/usr/bin/env node

var program = require('commander');
var cmd = require('node-cmd');
var path = require('path');

program
  .version('0.0.1');

program
  .command('container')
  .description('run setup commands for all envs')
  // .option("-s, --setup_mode [mode]", "Which setup mode to use")
  .action(function() {
    cmd.get(
      'docker ps -a',
      function(data) {
        console.log(data);
      }
    );
  });

program
  .command('images')
  .action(function() {
    cmd.get(
      'docker images',
      function(images) {
        console.log(images);
      }
    );
  });

program
  .command('volumes')
  .action(function() {
    cmd.get(
      'docker volume ls',
      function(data) {
        console.log(data);
      }
    );
  });

program
  .command('backup <container> [dest]')
  .action(function(container, dest) {

    dest = dest || '$(pwd)';
    console.log('backup ' + container + ' to ' + dest);

    var containerName = container + '_image';

    cmd.get(
      'docker commit -p ' + container + ' ' + containerName,
      function(data) {
        cmd.get('docker save -o ' + dest + '/' + containerName + '.tar ' + containerName,
          function(data) {

            cmd.get(
              'docker inspect ' + container,
              function(data) {
                if (data) {
                  data = JSON.parse(data)[0];
                  if (data.Mounts && data.Mounts.length) {

                    var command = 'docker run --rm --volumes-from ' + container + ' -v ' + dest + ':/backup alpine';

                    data.Mounts.forEach(function(volume) {
                      command += ' tar cvf /backup/' + container + '_volume' + /*'_' + volume.Name + */ '.tar ' + volume.Destination;
                    });

                    cmd.run(command);
                  }
                }
              }
            );
          }
        );
      }
    );
  });

program
  .command('restore <src> [container]')
  .action(function(src, container) {


    if (src.indexOf('_image.tar') > 0) {

      cmd.get(
        'docker load < ' + src,
        function(data) {
          console.log(data);
        });

    } else if (src.indexOf('_volume.tar') > 0) {

      var dir = path.dirname(src);
      var baseName = path.basename(src);
      var containerName = container || baseName.substr(0, baseName.indexOf('_'));
      console.log('containerName', containerName);
      console.log('docker run --rm --volumes-from ' + containerName + ' -v ' + dir + ':/backup some-ghost_image bash -c "cd / && tar xvf /backup/' + baseName + '"');

      cmd.get(
        'docker inspect ' + containerName,
        function(data) {
          if (data) {
            data = JSON.parse(data)[0];
            var image = data.Config.Image;

            cmd.get(
              'docker run --rm --volumes-from ' + containerName + ' -v ' + dir + ':/backup ' + image + ' bash -c "cd / && tar xvf /backup/' + baseName + '"',
              function(data) {
                console.log('data', data);
              });

          }
        }
      );

    }

  });

program.parse(process.argv);
