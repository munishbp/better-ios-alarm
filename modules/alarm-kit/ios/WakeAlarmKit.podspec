Pod::Spec.new do |s|
  s.name           = 'WakeAlarmKit'
  s.version        = '0.1.0'
  s.summary        = 'Local Expo module wrapping iOS AlarmKit'
  s.description    = 'Bridge between React Native and iOS 26 AlarmKit for native alarm scheduling'
  s.homepage       = 'https://github.com/munishpersaud'
  s.license        = 'MIT'
  s.author         = 'Munish Persaud'
  s.platform       = :ios, '26.0'
  s.source         = { git: '' }
  s.source_files   = '**/*.swift'
  s.swift_version  = '5.0'

  s.frameworks     = 'AlarmKit', 'AppIntents'

  s.dependency 'ExpoModulesCore'
end
