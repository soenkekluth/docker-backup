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
  .command('backup <container> [path]')
  .action(function(container, path) {

    path = path || '$(pwd)';
    console.log('backup ' + container + ' to ' + path);

    var containerName = container + '_image';

    cmd.get(
      'docker commit -p ' + container + ' ' + containerName,
      function(data) {
        cmd.get('docker save -o ' + path + '/' + containerName + '.tar ' + containerName,
          function(data) {

            cmd.get(
              'docker inspect ' + container,
              function(data) {
                if (data) {
                  data = JSON.parse(data)[0];
                  if (data.Mounts && data.Mounts.length) {

                    var command = 'docker run --rm --volumes-from ' + container + ' -v ' + path + ':/backup alpine';

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
  .command('restore <container> [path]')
  .action(function(container, path) {
    path = path || '$(pwd)';


    console.log('restore ' + container + ' from ' + path);

    //var command = 'docker run --rm --volumes-from ' + container + ' -v $(pwd):/backup ' + container + '_image' + ' bash -c "cd /';

    cmd.get(
      'docker load < ' + path + '/' + container + '_image.tar',
      // 'docker create < ' + path + '/' + container + '_image.tar',
      function(data) {
        cmd.get(
          // 'docker run --rm --volumes-from ' + container + ' -v ' + path + ':/backup ' + container + '_image' + ' bash -c "cd / && tar xvf /backup/' + container + '_volume.tar"',
          // 'docker run --rm -v ' + path + ':/backup --name ' + container + ' ' + container + '_image' + ' bash -c "cd / && tar xvf /backup/' + container + '_volume.tar"',
          'docker run  -v ' + path + ':/backup --name ' + container + ' ' + container + '_image' + ' bash -c "cd / && tar xvf /backup/' + container + '_volume.tar"',
          function(data) {
            console.log(data);
          });
      });




  });



program.parse(process.argv);
