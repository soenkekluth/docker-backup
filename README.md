# docker-backup

[![Greenkeeper badge](https://badges.greenkeeper.io/soenkekluth/docker-backup.svg)](https://greenkeeper.io/)

backup a docker container including its volumes

## Install
`npm i -g docker-backup`

## Usage

### Backup
`docker-backup <container> [dest] [--name newname]`

### Restore Image
`docker-backup restore <path-to-image.tar>`

### Restore Container
`docker-backup restore <path-to_create.sh>`

### Restore Volume
`docker-backup restore <path-to-volume.tar> [container name]`


## Example

``docker run --name some-ghost -p 8080:2368 -d ghost``

``docker-backup some-ghost /backups --name ghost-backup``

``docker-backup restore /backups/ghost-backup_image.tar``

``docker-backup restore /backups/ghost-backup_create.sh``

``docker-backup restore /backups/ghost-backup_volume_xx.tar ghost-backup``

``docker start ghost-backup``
