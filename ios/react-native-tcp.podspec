Pod::Spec.new do |s|
  s.name                = 'react-native-tcp'
  s.version             = '1.0.0'
  s.summary             = 'node\'s net API in React Native.'
  s.description         = <<-DESC
                            Enables accessing tcp sockets in React Native.
                         DESC
  s.homepage            = 'https://github.com/PeelTechnologies/react-native-tcp'
  s.license             = { :type => 'MIT' }
  s.authors             = { 'Andy Prock' => 'aprock@gmail.com' }
  s.source              = { :git => 'https://github.com/PeelTechnologies/react-native-tcp.git' }
  s.requires_arc        = true
  s.platform            = :ios, '7.0'
  s.prepare_command     = 'npm install --production'
  s.source_files        = '*.{c,h,m}', 'CocoaAsyncSocket/*.{h,m}'
  s.preserve_paths      = 'node_modules', '**/*.js', 'package.json'
  s.header_mappings_dir = '.'
end
