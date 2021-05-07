import { AbstractError } from '../../errors'

export class MqttConnectError extends AbstractError {
  public readonly type = 'MQTT_CONNECT_ERROR'
}

export class MqttPublishError extends AbstractError {
  public readonly type = 'MQTT_PUBLISH_ERROR'
}
