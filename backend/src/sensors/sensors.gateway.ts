import { 
    WebSocketGateway, 
    WebSocketServer, 
    OnGatewayInit, 
    OnGatewayConnection, 
    OnGatewayDisconnect,
    SubscribeMessage 
  } from '@nestjs/websockets';
  import { Logger, Injectable } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  import { SensorsService } from './sensors.service';
  import { Inject, forwardRef } from '@nestjs/common';

  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  @Injectable()
  export class SensorsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger('SensorsGateway');
    
    constructor(
      @Inject(forwardRef(() => SensorsService))
      private sensorsService: SensorsService,
    ) {}  
    afterInit(server: Server) {
      this.logger.log('WebSocket Sunucusu başlatıldı');
    }
  
    handleConnection(client: Socket) {
      this.logger.log(`İstemci bağlandı: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`İstemci ayrıldı: ${client.id}`);
    }
  
    sendSensorDataToRoom(room: string, data: any) {
      this.server.to(room).emit('sensorData', data);
    }
  
    broadcastSensorData(data: any) {
      this.server.emit('sensorData', data);
    }
  
    sendCompanySensorData(companyId: string, data: any) {
      this.server.to(`company_${companyId}`).emit('sensorData', data);
    }
  
    sendSpecificSensorData(sensorId: string, data: any) {
      this.server.to(`sensor_${sensorId}`).emit('sensorData', data);
    }
  
    @SubscribeMessage('subscribeSensor')
    async handleSubscribeSensor(client: Socket, payload: { sensorId: string, userId?: string }) {
      const { sensorId, userId } = payload;
      
      let hasAccess = true;
      if (userId) {
        hasAccess = await this.sensorsService.userHasAccessToSensor(userId, sensorId);
      }
      
      if (hasAccess) {
        client.join(`sensor_${sensorId}`);
        client.emit('subscriptionSuccess', { sensorId });
        
        const latestData = await this.sensorsService.getLatestSensorData(sensorId);
        if (latestData) {
          client.emit('sensorData', latestData);
        }
      } else {
        client.emit('subscriptionError', { 
          message: 'Bu sensöre erişim yetkiniz yok',
          sensorId 
        });
      }
    }
  
    @SubscribeMessage('subscribeCompany')
    async handleSubscribeCompany(client: Socket, payload: { companyId: string, userId?: string }) {
      const { companyId, userId } = payload;
      
      client.join(`company_${companyId}`);
      client.emit('subscriptionSuccess', { companyId });
    }
  
    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(client: Socket, payload: { room: string }) {
      const { room } = payload;
      client.leave(room);
      client.emit('unsubscribeSuccess', { room });
    }
  }