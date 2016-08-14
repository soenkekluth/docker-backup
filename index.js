#!/usr/bin/env node

var program = require('commander');
var cmd = require('node-cmd');


program
  .version('0.0.1')
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
