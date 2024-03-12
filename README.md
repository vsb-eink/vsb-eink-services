# VŠB EInk - Services

Mono repository for all JavaScript based services of VŠB EInk.

## Apps

### @vsb-eink/dashboard-vue
Single page application written in vue acting as a frontend for the `@vsb-eink/facade` service.

## Services

### @vsb-eink/compressor
Microservice listening on mqtt topics and converting received images into a format suitable for e-ink displays.

### @vsb-eink/facade
REST API acting as a gateway/facade for all other services.

### @vsb-eink/grouper
Microservice listening on mqtt topics and retransmitting received commands to individual devices.

### @vsb-eink/hoster
Microservice for managing and hosting user provided files.

### @vsb-eink/renderer
Microservice listening on mqtt topics and rendering html to images.

### @vsb-eink/scheduler
Microservice for managing and scheduling tasks.
