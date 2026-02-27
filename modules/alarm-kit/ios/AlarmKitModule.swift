import ExpoModulesCore
import AlarmKit
import AppIntents
import SwiftUI
import AVFoundation

// MARK: - Metadata (required generic parameter for AlarmAttributes / AlarmConfiguration)

@available(iOS 26.0, *)
nonisolated struct WakeMetadata: AlarmMetadata {}

// MARK: - App Intent: launches the app when user taps "Stop" on the alarm

@available(iOS 26.0, *)
public struct StopAlarmIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Stop Alarm"
  public static var description = IntentDescription("Opens WAKE to dismiss the alarm")
  public static var openAppWhenRun = true

  @Parameter(title: "Alarm ID")
  public var alarmIdentifier: String

  public init(alarmIdentifier: String) {
    self.alarmIdentifier = alarmIdentifier
  }

  public init() {
    self.alarmIdentifier = ""
  }

  public func perform() async throws -> some IntentResult {
    // Write the alarm ID to UserDefaults so the RN layer can read it
    UserDefaults.standard.set(alarmIdentifier, forKey: "lastFiredAlarmId")
    return .result()
  }
}

// MARK: - App Intent: launches the app when user taps "Snooze" on the alarm
// Mirrors StopAlarmIntent so both lock screen buttons force the app open;
// this lets us gate dismissal behind the wake-up challenge every time

@available(iOS 26.0, *)
public struct SnoozeAlarmIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Snooze Alarm"
  public static var description = IntentDescription("Opens WAKE to snooze the alarm")
  public static var openAppWhenRun = true

  @Parameter(title: "Alarm ID")
  public var alarmIdentifier: String

  public init(alarmIdentifier: String) {
    self.alarmIdentifier = alarmIdentifier
  }

  public init() {
    self.alarmIdentifier = ""
  }

  public func perform() async throws -> some IntentResult {
    // Write the alarm ID to UserDefaults so the RN layer can read it
    UserDefaults.standard.set(alarmIdentifier, forKey: "lastFiredAlarmId")
    return .result()
  }
}

// MARK: - Helpers

@available(iOS 26.0, *)
private func makeAttributes(title: String, alarmId: String) -> AlarmAttributes<WakeMetadata> {
  let stopButton = AlarmButton(
    text: "Open WAKE",
    textColor: .white,
    systemImageName: "sun.max.fill"
  )

  let snoozeButton = AlarmButton(
    text: "Snooze",
    textColor: .white,
    systemImageName: "clock.arrow.trianglehead.2.counterclockwise.rotate.90"
  )

  let alert = AlarmPresentation.Alert(
    title: "\(title)",
    stopButton: stopButton,
    secondaryButton: snoozeButton,
    secondaryButtonBehavior: .custom // Bypasses system snooze so we can handle it in-app
  )

  return AlarmAttributes<WakeMetadata>(
    presentation: AlarmPresentation(alert: alert),
    tintColor: .red
  )
}

// MARK: - Expo Module

public class AlarmKitModule: Module {
  /// Track scheduled alarm UUIDs so we can cancel all
  private var scheduledAlarmIds: Set<UUID> = []

  public func definition() -> ModuleDefinition {
    Name("AlarmKit")

    // Request user authorization for alarms
    AsyncFunction("requestAuthorization") { () -> String in
      guard #available(iOS 26.0, *) else { return "denied" }
      do {
        let state = try await AlarmManager.shared.requestAuthorization()
        switch state {
        case .authorized: return "authorized"
        case .denied: return "denied"
        case .notDetermined: return "notDetermined"
        @unknown default: return "denied"
        }
      } catch {
        return "denied"
      }
    }

    // Get current authorization status
    Function("getAuthorizationStatus") { () -> String in
      guard #available(iOS 26.0, *) else { return "denied" }
      switch AlarmManager.shared.authorizationState {
      case .authorized: return "authorized"
      case .denied: return "denied"
      case .notDetermined: return "notDetermined"
      @unknown default: return "denied"
      }
    }

    // Schedule a fixed-time alarm (one-shot, specific date)
    AsyncFunction("scheduleFixedAlarm") { (id: String, timestamp: Double, soundName: String, title: String) -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      guard let uuid = UUID(uuidString: id) else { return false }

      let date = Date(timeIntervalSince1970: timestamp / 1000.0)
      let schedule = Alarm.Schedule.fixed(date)
      let attributes = makeAttributes(title: title, alarmId: id)
      let stopIntent = StopAlarmIntent(alarmIdentifier: id)
      let snoozeIntent = SnoozeAlarmIntent(alarmIdentifier: id)

      let config = AlarmManager.AlarmConfiguration<WakeMetadata>.alarm(
        schedule: schedule,
        attributes: attributes,
        stopIntent: stopIntent,
        secondaryIntent: snoozeIntent,
        sound: .named(soundName)
      )

      do {
        try await AlarmManager.shared.schedule(id: uuid, configuration: config)
        self.scheduledAlarmIds.insert(uuid)
        return true
      } catch {
        print("[AlarmKit] Schedule error: \(error)")
        return false
      }
    }

    // Schedule a recurring weekly alarm
    AsyncFunction("scheduleRecurringAlarm") { (id: String, hour: Int, minute: Int, weekdays: [Int], soundName: String, title: String) -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      guard let uuid = UUID(uuidString: id) else { return false }

      let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)

      // Convert weekday ints to Locale.Weekday
      let days: [Locale.Weekday] = weekdays.compactMap { day in
        switch day {
        case 1: return .sunday
        case 2: return .monday
        case 3: return .tuesday
        case 4: return .wednesday
        case 5: return .thursday
        case 6: return .friday
        case 7: return .saturday
        default: return nil
        }
      }

      let recurrence = Alarm.Schedule.Relative.Recurrence.weekly(days)
      let relative = Alarm.Schedule.Relative(time: time, repeats: recurrence)
      let schedule = Alarm.Schedule.relative(relative)

      let attributes = makeAttributes(title: title, alarmId: id)
      let stopIntent = StopAlarmIntent(alarmIdentifier: id)
      let snoozeIntent = SnoozeAlarmIntent(alarmIdentifier: id)

      let config = AlarmManager.AlarmConfiguration<WakeMetadata>.alarm(
        schedule: schedule,
        attributes: attributes,
        stopIntent: stopIntent,
        secondaryIntent: snoozeIntent,
        sound: .named(soundName)
      )

      do {
        try await AlarmManager.shared.schedule(id: uuid, configuration: config)
        self.scheduledAlarmIds.insert(uuid)
        return true
      } catch {
        print("[AlarmKit] Schedule recurring error: \(error)")
        return false
      }
    }

    // Cancel a specific alarm
    AsyncFunction("cancelAlarm") { (id: String) -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      guard let uuid = UUID(uuidString: id) else { return false }
      do {
        try AlarmManager.shared.cancel(id: uuid)
        self.scheduledAlarmIds.remove(uuid)
        return true
      } catch {
        print("[AlarmKit] Cancel error: \(error)")
        return false
      }
    }

    // Cancel all alarms
    AsyncFunction("cancelAllAlarms") { () -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      var allSuccess = true
      for uuid in self.scheduledAlarmIds {
        do {
          try AlarmManager.shared.cancel(id: uuid)
        } catch {
          print("[AlarmKit] Cancel error for \(uuid): \(error)")
          allSuccess = false
        }
      }
      self.scheduledAlarmIds.removeAll()
      return allSuccess
    }

    // Reads the hardware output volume (0.0–1.0) via AVAudioSession so
    // the RN layer can warn users when volume is too low to hear the alarm
    Function("getSystemVolume") { () -> Float in
      return AVAudioSession.sharedInstance().outputVolume
    }

    // Get the alarm ID that launched the app (from UserDefaults written by StopAlarmIntent)
    Function("getLaunchAlarmId") { () -> String? in
      let alarmId = UserDefaults.standard.string(forKey: "lastFiredAlarmId")
      if alarmId != nil {
        UserDefaults.standard.removeObject(forKey: "lastFiredAlarmId")
      }
      return alarmId
    }
  }
}
