# docker-backup

backup a docker container including its volumes

## Install
`npm i -g docker-backup`

## Usage

### Backup
`docker-backup backup <container> [path]`

### Restore Image
`docker-backup restore <path-to-image.tar>`

### Restore Volume
`docker-backup restore <path-to-volume.tar> [container]`


## Example
```docker run --name some-ghost -p 8080:2368 -d ghost```

```docker stop some-ghost```

``docker-backup backup some-ghost``

``docker rm some-ghost``

``docker-backup restore $(pwd)/some-ghost_image.tar``


``docker run --name some-ghost -p 8080:2368 -d some-ghost_image``

``docker-backup restore $(pwd)/some-ghost_volume.tar some-ghost``
