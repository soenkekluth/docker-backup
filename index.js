#!/usr/bin/env node

'use strict'

const program = require('commander');
const cmd = require('node-cmd');
const path = require('path');
const rekcod = require('rekcod');

const inspect = (container) =>
  new Promise((resolve, reject) =>
    cmd.get('docker inspect ' + container, data => resolve(JSON.parse(data)[0])));

const commit = (container, imageName) =>
  new Promise((resolve, reject) =>
    cmd.get('docker commit -p ' + container + ' ' + imageName, resolve));


const backupImage = (imageName, dest) =>
  new Promise((resolve, reject) =>
    cmd.get('docker save -o ' + dest + '/' + imageName + '.tar ' + imageName, resolve));


const backupRunCommand = (container, dest) => {
  rekcod(container, (err, run) => {
    if (err) {
      Promise.reject(err);
      return console.error(err);
    }
    var sript = '#!/bin/bash\n\n';
    sript += run[0].command;
    cmd.get('echo "' + sript + '" > ' + dest + '/' + container + '_run.sh', () => {
      cmd.run('chmod +x ' + dest + '/' + container + '_run.sh');
      console.log('\n\nwriting run script to ' + dest + '/' + container + '_run.sh');
      console.log('at the moment you need to edit the script as it was created rekcod from npm.\nplease make shure you change the --name, remove the -h option and change the image name to ' + container + '_image');
    });
    Promise.resolve(sript);
  });
};


const backupVolumes = (container, volumes, dest) => {
  if (!volumes) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    var command = 'docker run --rm --volumes-from ' + container + ' -v ' + dest + ':/backup alpine';

    volumes.forEach(function(volume) {
      if (volume.Source.indexOf('docker.sock') === -1) {
        const name = volume.Name || volume.Source.split('/').join('_');
        command += ' tar cvf /backup/' + container + '_volume_' + name + '.tar ' + volume.Destination;
      }
    });

    cmd.get(command, resolve);
  });
};


// program
//   .version('0.0.1');

// program
//   .command('container')
//   .description('run setup commands for all envs')
//   .option('-a, --all', 'show all')
//   .action(options => {
//     const opt = options.all ? ' -a' : '';
//     cmd.get('docker ps' + opt, console.log);
//   });


// program
//   .command('images')
//   .option('-a, --all', 'show all')
//   .action(options => {
//     const opt = options.all ? ' -a' : '';
//     cmd.get('docker images' + opt, console.log);
//   });

// program
//   .command('volumes')
//   .action(cmd.get('docker volume ls', console.log));

program
  .command('backup <container> [dest]')
  .action((container, dest) => {

    dest = dest || './';
    dest = path.resolve(dest);

    console.log('backup ' + container + ' to ' + dest);

    var containerConfig;
    var containerName;
    var imageName;

    inspect(container)
      .then(config => {
        containerConfig = config;
        containerName = String(containerConfig.Name).split('/').join('');
        imageName = containerName + '_image';

        cmd.run('echo "' + JSON.stringify(config, null, 2) + '" > ' + dest + '/' + containerName + '_config.json');

        commit(containerName, imageName)
          .then(backupImage(imageName, dest))
          .then(backupVolumes(containerName, containerConfig.Mounts, dest))
          .then(backupRunCommand(containerName, dest));
      });
  });


program
  .command('restore <src> [container]')
  .action((src, container) => {

    if (src.indexOf('_image.tar') > 0) {

      cmd.get('docker load -i ' + src, console.log);

    } else if (src.indexOf('_run.sh') > 0) {
      cmd.get('bash ' + src, console.log);
    } else if (src.indexOf('_volume_') > 0) {

      var dir = path.dirname(src);
      dir = path.resolve(dir);
      var baseName = path.basename(src);
      var containerName = container || baseName.substr(0, baseName.indexOf('_'));

      inspect(containerName)
        .then(config => {
          var image = config.Config.Image;
          cmd.get('docker run --rm --volumes-from ' + containerName + ' -v ' + dir + ':/backup ' + image + ' bash -c "cd / && tar xvf /backup/' + baseName + '"', console.log);
        });
    }
  });

program.parse(process.argv);
