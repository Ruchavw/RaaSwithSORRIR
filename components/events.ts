export enum SensorEventTypes {
  DETECTION = "DETECTION",
  NOTHING = "NOTHING",
  FAULT = "FAULT",
}

export enum BarrierEventTypes {
  OPEN = "OPEN",
  CLOSE = "CLOSE",
}

export enum DSBEventTypes {
  ALERT = "ALERT",
  OK = "OK",
  SELECTION_MADE = "SELECTION_MADE", // ✅ add this
}

export enum UserEventTypes {
  REQUEST_ENTRY = "REQUEST_ENTRY",
  EXIT = "EXIT",
  ASK_SELECTION = "ASK_SELECTION", // ✅ add this
}
