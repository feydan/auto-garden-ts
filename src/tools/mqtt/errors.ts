import { AbstractError } from '../../errors'

export class MqttConnectError extends AbstractError {
  public readonly type = 'MQTT_CONNECT_ERROR'
}
