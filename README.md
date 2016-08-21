# docker-backup

backup a docker container including its volumes

## Install
`npm i -g docker-backup`

## Usage

### Backup
`docker-backup <container> [dest] [--name newname]`

### Restore Image
`docker-backup restore <path-to-image.tar>`

### Restore Volume
`docker-backup restore <path-to-volume.tar> [container name]`


## Example

``docker run --name some-ghost -p 8080:2368 -d ghost``

``docker-backup some-ghost /backups --name ghost-backup``

``docker-backup restore /backups/ghost-backup_image.tar``

``docker create --name new-ghost -p 8080:2368 ghost-backup_image``

``docker-backup restore /backups/ghost-backup_volume_xx.tar new-ghost``

``docker start new-ghost``
