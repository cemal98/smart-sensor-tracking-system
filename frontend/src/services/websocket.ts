import { io, Socket } from 'socket.io-client';
import { Dispatch } from 'redux';
import { updateSensorData } from '../redux/slices/sensorSlice';

class WebSocketService {
    private socket: Socket | null = null;
    private dispatch: Dispatch | null = null;
    private initialized: boolean = false;

    init(dispatch: Dispatch) {
        if (this.initialized && this.socket) {
            return;
        }

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('token');

        this.socket = io(API_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.dispatch = dispatch;

        this.socket.on('connect', () => {
            console.log('WebSocket bağlantısı kuruldu');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket bağlantısı kesildi:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket bağlantı hatası:', error.message);
        });

        this.socket.on('sensorData', (data) => {
            console.log('Sensör verisi alındı:', data);
            if (this.dispatch) {
                this.dispatch(updateSensorData(data));
            }
        });

        this.socket.on('subscriptionSuccess', (data) => {
            console.log('Abonelik başarılı:', data);
        });

        this.socket.on('subscriptionError', (error) => {
            console.error('Abonelik hatası:', error);
        });

        this.initialized = true;
    }

    isInitialized(): boolean {
        return this.initialized && this.socket !== null;
    }

    subscribeSensor(sensorId: string) {
        if (!this.socket) {
            console.error('WebSocket bağlantısı kurulmadan sensör aboneliği yapılamaz');
            return;
        }

        const userId = this.getUserIdFromToken();

        this.socket.emit('subscribeSensor', { sensorId, userId });
        console.log(`Sensör aboneliği: ${sensorId}`);
    }

    unsubscribeSensor(sensorId: string) {
        if (!this.socket) {
            return;
        }

        this.socket.emit('unsubscribe', { room: `sensor_${sensorId}` });
        console.log(`Sensör aboneliği iptal: ${sensorId}`);
    }

    subscribeCompany(companyId: string) {
        if (!this.socket) {
            console.error('WebSocket bağlantısı kurulmadan şirket aboneliği yapılamaz');
            return;
        }

        const userId = this.getUserIdFromToken();

        this.socket.emit('subscribeCompany', { companyId, userId });
        console.log(`Şirket aboneliği: ${companyId}`);
    }

    close() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.initialized = false;
            console.log('WebSocket bağlantısı kapatıldı');
        }
    }

    private getUserIdFromToken(): string | undefined {
        const token = localStorage.getItem('token');
        if (!token) return undefined;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);
            return payload.sub;
        } catch (error) {
            console.error('Token ayrıştırma hatası:', error);
            return undefined;
        }
    }
}

export const wsService = new WebSocketService();
export default wsService;