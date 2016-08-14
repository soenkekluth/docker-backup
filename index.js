#!/usr/bin/env node

var program = require('commander');
var cmd = require('node-cmd');


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
  })


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
  .command('backup <container> [out]')
  .action(function(container, out) {

    out = out || '$(pwd)';
    console.log('backup ' + container + ' to ' + out);

    var containerName = container + '_container';

    cmd.get(
      'docker commit -p ' + container + ' ' + containerName,
      function(data) {
        cmd.get('docker save -o ' + out + '/' + containerName + '.tar ' + containerName,
          function(data) {

            cmd.get(
              'docker inspect ' + container,
              function(data) {
                if (data) {
                  data = JSON.parse(data)[0];
                  if (data.Mounts && data.Mounts.length) {

                    var command = 'docker run --rm --volumes-from ' + container + ' -v ' + out + ':/backup alpine';

                    data.Mounts.forEach(function(volume) {
                      command += ' tar cvf /backup/' + container + '_volume_' + volume.Name + '.tar ' + volume.Destination;
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

program.parse(process.argv);
