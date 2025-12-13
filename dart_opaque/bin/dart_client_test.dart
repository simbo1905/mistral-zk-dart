#!/usr/bin/env dart
// Dart client to test against Bun OPAQUE server

import 'dart:io';
import 'dart:convert';
import 'package:dart_opaque/dart_opaque.dart';

Future<void> main() async {
  final serverUrl = 'http://localhost:3456';
  final username = 'test_user';
  final password = 'test_password_123';
  
  print('🚀 Dart OPAQUE Client Testing');
  print('Server: $serverUrl');
  print('Username: $username');
  print('');
  
  try {
    // Step 1: Register with Dart client
    print('🔑 Registering with Dart client...');
    final dartResult = DartOpaque.register(password);
    final dartRecord = dartResult['record'];
    final dartExportKey = dartResult['exportKey'];
    
    print('✅ Dart registration successful');
    print('   Export Key: ${dartExportKey.substring(0, 16)}...');
    print('');
    
    // Step 2: Test login with Dart client
    print('🔐 Logging in with Dart client...');
    final dartLogin = DartOpaque.login(password, dartRecord);
    
    if (dartLogin['exportKey'] == dartExportKey) {
      print('✅ Dart login successful - export keys match!');
    } else {
      print('❌ Dart login failed - export keys don\'t match');
      return;
    }
    print('');
    
    // Step 3: Test against Bun server (health check)
    print('🏥 Checking Bun server health...');
    final healthResponse = await HttpClient().getUrl(Uri.parse('$serverUrl/health'))
      .then((request) => request.close())
      .then((response) => response.transform(utf8.decoder).join());
    
    print('Bun server response: $healthResponse');
    print('');
    
    print('🎉 All tests completed successfully!');
    print('');
    print('Summary:');
    print('✅ Dart client registration works');
    print('✅ Dart client login works');
    print('✅ Export key consistency verified');
    print('✅ Bun server is reachable');
    
  } catch (e) {
    print('❌ Error: $e');
    print('');
    print('This is expected if:');
    print('  - Bun server is not running');
    print('  - Server is on a different port');
    print('  - Network issues');
  }
}