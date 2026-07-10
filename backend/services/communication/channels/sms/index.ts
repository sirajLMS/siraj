export type {
  ISmsChannel,
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from "@/backend/services/communication/channels/sms/ISmsChannel";
export {
  getSmsChannel,
  resetSmsChannel,
  smsChannel,
} from "@/backend/services/communication/channels/sms/SmsChannelFactory";
