#!/usr/bin/env node

'use strict'

const program = require('commander');
const path = require('path');
const rekcod = require('rekcod');
const shell = require('shelljs');

const inspect = (container) => {
  return new Promise((resolve, reject) => {
    //docker inspect --format='{{json .Config}}'
    shell.exec('docker inspect ' + container, { silent: true }, (code, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
        return;
      }
      resolve(JSON.parse(stdout)[0]);
    });
  });
};

const pause = (container) => {
  return new Promise((resolve, reject) => {
    shell.exec('docker pause ' + container, (code, stdout, stderr) => {
      resolve();
    });
  });
};

const stop = (container) => {
  return new Promise((resolve, reject) => {
    shell.exec('docker stop ' + container, (code, stdout, stderr) => {
      resolve();
    });
  });
};

const start = (container) => {
  return new Promise((resolve, reject) => {
    shell.exec('docker start ' + container, (code, stdout, stderr) => {
      resolve();
    });
  });
};

const unpause = (container) => {

  return new Promise((resolve, reject) => {
    shell.exec('docker unpause ' + container, (code, stdout, stderr) => {

      resolve();

    });
  });
};

const commit = (container, imageName) => {
  return new Promise((resolve, reject) => {
    shell.exec('docker commit -p ' + container + ' ' + imageName, (code, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
};

const backupImage = (imageName, dest) => {
  return new Promise((resolve, reject) => {
    shell.exec('docker save -o ' + path.resolve(dest, imageName + '.tar') + ' ' + imageName, (code, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
        return;
      }
      shell.exec('docker rmi ' + imageName, (code, stdout, stderr) => {
        resolve(stdout);
      });
    });
  });
};

const backupRunCommand = (container, containerName, dest) => {
  rekcod(container, (err, run) => {
    if (err) {
      Promise.reject(err);
      return console.error(err);
    }

    // console.log(path.resolve(dest, containerName + '_run.sh'));
    var script = '#!/bin/bash\n\n';
    script += run[0].command;

    shell.touch(path.resolve(dest, containerName + '_run.sh'));
    shell.exec('echo "' + script + '" > ' + path.resolve(dest, containerName + '_run.sh'), { silent: true });
    shell.chmod('+x', path.resolve(dest, containerName + '_run.sh'));
    shell.echo('\n\nwriting run script to ' + dest + '/' + containerName + '_run.sh');
    shell.echo('at the moment you need to edit the script as it was created rekcod from npm.\nplease make shure you change the --name, remove the -h option and change the image name to ' + containerName + '_image');
    return true;
  });
};

const backupVolumes = (container, containerName, volumes, dest) => {

  return new Promise((resolve, reject) => {

    containerName = containerName || container;

    if (!volumes) {
      reject();
      return;
    }

    var command = 'docker run --rm --volumes-from ' + container + ' -v ' + dest + ':/backup alpine';

    volumes.forEach(function(volume) {
      if (volume.Source.indexOf('docker.sock') === -1) {
        var volumeName = volume.Name || volume.Destination.split('/').join('_');
        command += ' tar cvf /backup/' + containerName + '_volume_' + volumeName + '.tar ' + volume.Destination;
      }
    });

    shell.exec(command, (code, stdout, stderr) => {
      resolve();
    });
  });
};


// program
//   .version('0.0.1');



program
  .arguments('<container> [dest]')
  .description('run setup commands for all envs')
  .option('-n, --name [name]', 'name')
  .action((container, dest, options) => {

    dest = dest || './';
    dest = path.resolve(dest);

    shell.echo('backup ' + container + ' to ' + dest);
    shell.mkdir('-p', dest);

    var containerConfig;
    var containerName;
    var imageName;
    var volumes;

    inspect(container)
      .then(config => {
        containerConfig = config;
        container = containerConfig.Name ? String(containerConfig.Name).split('/').join('') : container;
        containerName = (typeof options.name === 'string') ? options.name : container;
        imageName = containerName + '_image';
        volumes = containerConfig.Mounts;

        shell.touch(path.resolve(dest, containerName + '_config.json'));
        shell.exec('echo "' + JSON.stringify(config, null, 2) + '" > ' + path.resolve(dest, containerName + '_config.json'), { silent: true });

        return containerConfig;
      })
      .then(() => commit(container, imageName))
      .then(() => backupImage(imageName, dest))
      .then(() => pause(container))
      .then(() => backupVolumes(container, containerName, volumes, dest))
      .then(() => unpause(container))
      .then(() => backupRunCommand(container, containerName, dest));
  });

program
  .command('restore <src> [container]')
  .action((src, container) => {

    var dir = path.dirname(src);
    dir = path.resolve(dir);
    var baseName = path.basename(src);
    var containerName = container || baseName.substr(0, baseName.indexOf('_'));

    if (src.indexOf('_image.tar') > 0) {
      shell.exec('docker load -i ' + src);
    } else if (src.indexOf('_run.sh') > 0) {
      // cmd.get('bash ' + src, console.log);
    } else if (src.indexOf('_volume_') > 0) {

      inspect(containerName)
        .then(config => {
          var image = config.Config.Image;
          shell.exec('docker run --rm --volumes-from ' + containerName + ' -v ' + dir + ':/backup ' + image + ' bash -c "cd / && tar xvf /backup/' + baseName + '"');
        });
    }
  });


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



program.parse(process.argv);
